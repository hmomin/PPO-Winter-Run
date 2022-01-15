import * as tf from "@tensorflow/tfjs";

export default class Buffer {
    container: object;
    numMiniBatches: number;
    miniBatchSize: number;
    miniBatchKeys: string[];

    constructor(numMiniBatches: number = 4) {
        this.numMiniBatches = numMiniBatches;
        // create container with all the necessary properties to allow for easy iteration
        this.container = {
            states: [],
            actions: [],
            probabilities: [],
            rewards: [],
            values: [],
            advantages: [],
            returns: [],
        };
        // only need to create minibatches for states, actions, probs, advantages, and
        // returns
        this.miniBatchKeys = [
            "states",
            "actions",
            "probabilities",
            "advantages",
            "returns",
        ];
    }

    shuffle() {
        tf.tidy(() => {
            const N = this.container["states"].length;
            // create a list of shuffled indices
            const indices = tf.util.createShuffledIndices(N);
            // reorder each of the arrays in memory using the same set of shuffled
            // indices to maintain consistency between values
            for (const [key, arr] of Object.entries(this.container)) {
                if (!(key.includes("minibatch") || key.includes("shuffled"))) {
                    const shuffled = [];
                    for (const index of indices) {
                        shuffled.push(arr[index]);
                    }
                    // store references to the newly created shuffled arrays
                    this.container["_shuffled_" + key] = shuffled;
                }
            }
        });
    }

    store(
        state: number[],
        value: number,
        action: number[],
        probability: number
    ) {
        this.container["states"].push(state);
        this.container["values"].push(value);
        this.container["actions"].push(action);
        this.container["probabilities"].push(probability);
    }

    pushToArray(sourceArr: number[], destArr: number[]) {
        for (const num of sourceArr) {
            destArr.push(num);
        }
    }

    storeRewards(rewards: number[]) {
        this.pushToArray(rewards, this.container["rewards"]);
    }

    storeReturnData(returns: number[], advantages: number[]) {
        this.pushToArray(advantages, this.container["advantages"]);
        this.pushToArray(returns, this.container["returns"]);
    }

    createMiniBatches() {
        // compute a minibatch size
        const batchSize = this.container["states"].length;
        this.miniBatchSize = Math.floor(batchSize / this.numMiniBatches);
        for (const key of this.miniBatchKeys) {
            // find the shuffled chunk of data
            const data = this.container["_shuffled_" + key];
            // create minibatch tensors out of this data
            const miniBatchData: Array<tf.Tensor> = [];
            for (
                let i = 0;
                i <= data.length - this.miniBatchSize;
                i += this.miniBatchSize
            ) {
                miniBatchData.push(
                    tf.tensor(data.slice(i, i + this.miniBatchSize))
                );
            }
            // store the minibatch data
            this.container["_minibatch_" + key] = miniBatchData;
        }
    }

    getMiniBatches(): tf.Tensor[][] {
        return this.miniBatchKeys.map(
            (key) => this.container["_minibatch_" + key]
        );
    }

    reset() {
        for (const key of Object.keys(this.container)) {
            // have to properly dispose of all the tensors in the minibatch data
            if (key.includes("minibatch")) {
                const minibatches: tf.Tensor[] = this.container[key];
                for (const tensor of minibatches) {
                    tensor.dispose();
                }
            }
            this.container[key] = [];
        }
    }
}
