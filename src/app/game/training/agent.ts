import * as tf from "@tensorflow/tfjs";
import Network from "./network";
import Buffer from "./buffer";

export default class Agent {
    actor: Network;
    critic: Network;
    buffer: Buffer;
    numEpochs: number;
    epsilon: number;
    gamma: number;
    lambda: number;

    constructor(
        // first level of customWeights: actor or critic weights? (size = 2)
        // second level: which layer of network? (size = 6)
        // third level: flattened representation of layer weights
        customWeights: number[][][] = [],
        stateDim: number,
        actionDim: number,
        numEpochs: number = 1,
        numMiniBatches: number = 4,
        learningRate: number = 1e-5,
        clipEpsilon: number = 0.2,
        gamma: number = 0.99,
        lambda: number = 1.0
    ) {
        let actorWeights: number[][] = [];
        let criticWeights: number[][] = [];
        if (customWeights.length > 0) {
            actorWeights = customWeights[0];
            criticWeights = customWeights[1];
        }
        // actor needs 6 softmax outputs indicating probability per action
        this.actor = new Network(
            [stateDim, 256, 256, actionDim],
            actorWeights,
            learningRate
        );
        // critic only needs one output indicating the value of the state
        this.critic = new Network(
            [stateDim, 256, 256, 1],
            criticWeights,
            learningRate
        );
        // epsilon refers to PPO clipping parameter
        this.epsilon = clipEpsilon;
        // gamma is the usual discount factor
        this.gamma = gamma;
        // lambda is a necessary GAE parameter
        this.lambda = lambda;
        this.numEpochs = numEpochs;
        this.buffer = new Buffer(numMiniBatches);
    }

    // sample an action from the softmax probability distribution
    sampleAction(probs: Float32Array | Int32Array | Uint8Array): number {
        // probs is a softmax layer of probabilities, so we have to sample from them.
        // Unfortunately, TensorFlow.js doesn't have automatic Categorical sampling
        // capabilities :(, so we'll have to write our own!
        const rand = Math.random();
        let sum = 0;
        for (let i = 0; i < probs.length; i++) {
            sum += probs[i];
            if (rand < sum) {
                return i;
            }
        }
        // Assuming probs is an actual softmax, we might get this far if, due to
        // round-off error, the sum of probabilities in probs add up to less than 1. In
        // that case, we should choose the last action.
        return probs.length - 1;
    }

    // get the most-likely action from the softmax probability distribution
    mostLikelyAction(probs: Float32Array | Int32Array | Uint8Array): number {
        let maxProb = probs[0];
        let maxIndex = 0;
        for (let i = 1; i < probs.length; i++) {
            if (probs[i] > maxProb) {
                maxIndex = i;
                maxProb = probs[i];
            }
        }
        return maxIndex;
    }

    // preprocesses data to produce advantage estimates
    computeAdvantageEstimates(rewards: number[], values: number[]): number[][] {
        const returns = this.computeReturns(rewards);
        // compute the advantage estimates using GAE
        let advantages = Array(rewards.length).fill(0);
        for (let i = 0; i < rewards.length; i++) {
            let discountFactor = 1;
            let advantageEstimate = 0;
            // do a monte-carlo-like traversal until the end
            for (let j = i; j < rewards.length; j++) {
                const valueNext = j < rewards.length - 1 ? values[j + 1] : 0;
                const delta = rewards[j] + this.gamma * valueNext - values[j];
                advantageEstimate += discountFactor * delta;
                discountFactor *= this.gamma * this.lambda;
            }
            advantages[i] = advantageEstimate;
        }
        // now, do advantage normalization (take the advantage estimate sample
        // distribution and map it to ~N(0, 1))
        const [mean, std] = this.getMeanAndStd(advantages);
        // disallow divide-by-zero and large numerical fluctuations
        const adjustedStd = Math.max(std, 1e-8);
        advantages = advantages.map(
            (advantage) => (advantage - mean) / adjustedStd
        );
        return [returns, advantages];
    }

    computeReturns(rewards: number[]): number[] {
        const returns = Array(rewards.length).fill(0);
        let valueNext = 0;
        for (let i = rewards.length - 1; i >= 0; i--) {
            // bootstrap the return based on the next state's value
            returns[i] = rewards[i] + this.gamma * valueNext;
            // backtrack the value of the next state
            valueNext = returns[i];
        }
        return returns;
    }

    // return the mean and standard deviation of an array (useful for advantage
    // normalization)
    getMeanAndStd(arr: number[]): number[] {
        // first, calculate the mean
        const mean =
            arr.reduce((runningSum, elem) => runningSum + elem, 0) / arr.length;
        // now, use the mean to calculate the standard deviation
        const standardDeviation =
            arr.reduce(
                (runningSum, elem) => runningSum + Math.pow(elem - mean, 2),
                0
            ) /
            (arr.length - 1);
        return [mean, standardDeviation];
    }

    computeActorLoss(
        states: tf.Tensor,
        actions: tf.Tensor,
        oldProbs: tf.Tensor,
        advantages: tf.Tensor
    ): tf.Scalar {
        return tf.tidy(() => {
            // compute the new probability of each action that was taken previously
            const probLayers = this.actor.tensorForward(states);
            const probActions = tf.sum(tf.mul(probLayers, actions), 1, false);
            // compute the clipped surrogate objective terms (from PPO paper)
            const ratios = tf.div(probActions, oldProbs);
            const firstTerm = tf.mul(ratios, advantages);
            const secondTerm = tf.mul(
                tf.clipByValue(ratios, 1 - this.epsilon, 1 + this.epsilon),
                advantages
            );
            const clipObjective = tf.mean(tf.minimum(firstTerm, secondTerm));
            // compute an entropy bonus to encourage exploration
            const entropy = tf.mean(
                tf.neg(tf.mul(probActions, tf.log(probActions)))
            );
            const totalObjective = tf.add(clipObjective, tf.mul(0.0, entropy));
            // we want to minimize a "loss", so we'll just take the negative of the
            // surrogate objective we're trying to maximize...
            const loss = tf.neg(totalObjective);
            return loss.asScalar();
        });
    }

    computeCriticLoss(states: tf.Tensor, returns: tf.Tensor): tf.Scalar {
        return tf.tidy(() => {
            const values = tf.squeeze(this.critic.tensorForward(states));
            const squaredErrors = tf.squaredDifference(returns, values);
            const meanSquareError = squaredErrors.mean().asScalar();
            values.dispose();
            squaredErrors.dispose();
            return meanSquareError;
        });
    }

    train() {
        this.playUpdateSound();
        console.log(
            "=============================\n" +
                "=============================\n" +
                "=============================\n" +
                "===== UPDATING NETWORKS =====\n" +
                "=============================\n" +
                "=============================\n" +
                "=============================\n"
        );
        tf.tidy(() => {
            for (let i = 0; i < this.numEpochs; i++) {
                // create shuffled copies of the data
                this.buffer.shuffle();
                // prepare data for training by creating mini-batches
                this.buffer.createMiniBatches();
                const [
                    stateTensors,
                    actionTensors,
                    probTensors,
                    advantageTensors,
                    returnTensors,
                ] = this.buffer.getMiniBatches();
                // train the actor/critic parameters via gradients with respect to
                // actor/critic "losses"
                for (let j = 0; j < stateTensors.length; j++) {
                    // grab this batch
                    const stateTensor = stateTensors[j];
                    const actionTensor = actionTensors[j];
                    const probTensor = probTensors[j];
                    const advantageTensor = advantageTensors[j];
                    const returnTensor = returnTensors[j];
                    this.actor.optimizer.minimize(
                        () =>
                            this.computeActorLoss(
                                stateTensor,
                                actionTensor,
                                probTensor,
                                advantageTensor
                            ),
                        true,
                        this.actor.trainables
                    );
                    this.critic.optimizer.minimize(
                        () => this.computeCriticLoss(stateTensor, returnTensor),
                        true,
                        this.critic.trainables
                    );
                }
            }
            this.buffer.reset();
        });
    }

    playUpdateSound() {
        const audio = new Audio();
        audio.src = "../assets/update-sound.mp3";
        audio.load();
        audio.play();
    }

    dispose() {
        this.actor.dispose();
        this.critic.dispose();
    }
}
