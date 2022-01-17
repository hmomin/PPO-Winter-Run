import * as tf from "@tensorflow/tfjs";

export default class Network {
    shape: number[];
    optimizer: tf.AdamOptimizer;
    trainables: tf.Variable[] = [];
    weights: tf.Variable[] = [];
    biases: tf.Variable[] = [];
    activations: Function[] = [];
    weightData: number[][] = [];
    isValueFunction: boolean;

    constructor(
        fullShape: number[],
        layerWeights: number[][] = [],
        learningRate: number = 1e-5
    ) {
        this.shape = fullShape;
        this.optimizer = tf.train.adam(learningRate);
        this.weights = [];
        this.biases = [];
        this.activations = [];
        // initialize the weights with layerWeights if possible
        this.generateWeights(fullShape, layerWeights);
    }

    // generates multilayer perceptron weights and biases
    generateWeights(fullShape: number[], layerWeights: number[][] = []) {
        tf.tidy(() => {
            // first, determine if this is a value function network or not
            const outputDim = fullShape[fullShape.length - 1];
            this.isValueFunction = outputDim === 1;
            let layerCount = 0;
            const layersExist = layerWeights.length > 0;
            for (let i = 0; i < fullShape.length - 1; i++) {
                const dim = fullShape[i];
                const nextDim = fullShape[i + 1];
                // construct weight layer (2d)
                const weightShape = [dim, nextDim];
                const newWeights = layersExist
                    ? tf.tensor(layerWeights[layerCount++], weightShape)
                    : tf.randomNormal(weightShape, 0, Math.sqrt(2 / dim));
                const weightLayer = tf.keep(tf.variable(newWeights));
                // construct bias layer (1d)
                const biasShape = [nextDim];
                const newBiases = layersExist
                    ? tf.tensor(layerWeights[layerCount++], biasShape)
                    : tf.randomNormal(biasShape, 0, Math.sqrt(2 / dim));
                const biasLayer = tf.keep(tf.variable(newBiases));
                this.weights.push(weightLayer);
                this.biases.push(biasLayer);
                this.trainables.push(weightLayer, biasLayer);
                if (i < fullShape.length - 2) {
                    this.activations.push(tf.relu);
                }
            }
            // use a softmax for the last activation if this is not a value function
            if (!this.isValueFunction) {
                this.activations.push(tf.softmax);
            }
        });
    }

    saveWeights() {
        tf.tidy(() => {
            // empty the weight data if there are currently weights stored
            this.weightData = [];
            for (const trainable of this.trainables) {
                const weights = trainable.dataSync();
                const genericWeights: number[] = [];
                for (const weight of weights) {
                    genericWeights.push(weight);
                }
                this.weightData.push(genericWeights);
            }
        });
    }

    // given the input layer, computes the output layer of the network using tensors
    tensorForward(inputs: tf.Tensor): tf.Tensor {
        return tf.tidy(() => {
            let computation = inputs;
            for (let i = 0; i < this.weights.length; i++) {
                computation = computation
                    .matMul(this.weights[i])
                    .add(this.biases[i]);
                if (i < this.activations.length) {
                    const func = this.activations[i];
                    computation = func(computation);
                }
            }
            return computation;
        });
    }

    // given the input layer (as an array), computes the output layer as an array
    arrayForward(inputLayer: number[]): Float32Array | Int32Array | Uint8Array {
        return tf.tidy(() => {
            const inputs = tf.tensor2d([inputLayer]);
            return this.tensorForward(inputs).dataSync();
        });
    }

    // needed when we're ready to restart a scene
    dispose() {
        for (const trainable of this.trainables) {
            trainable.dispose();
        }
        this.optimizer.dispose();
    }
}
