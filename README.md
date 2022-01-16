<p align="center">
    <img src="https://dr3ngl797z54v.cloudfront.net/winter-run-logo.png" width="100%" alt="ppo-winter-run-logo">
</p>

Winter Run is a game written in TypeScript and Angular. You can play the game live [here](https://winter-run.com)! A deep reinforcement learning agent written in TensorFlow.js can learn to beat the game by training with [Proximal Policy Optimization](https://arxiv.org/abs/1707.06347) (PPO) and [Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) (GAE). After training for roughly 50,000 episodes over the span of two weeks, the agent successfully beat the game. After roughly 10,000 more episodes, the agent could consistently beat the game.

Because the actor/critic network parameters are stored directly within the browser's local storage, anyone with internet access can pop open a browser and immediately begin training their own PPO agent to beat the game. To my knowledge, something like this has never been created before.

# Training Implementation

For full training implementation details, the reader is directed to the following files within the source code:

```
/src/app/game/training/agent.ts
/src/app/game/training/buffer.ts
/src/app/game/training/network.ts
/src/app/game/scenes/game-scene.ts (from the update() function and below)
```

Both the actor and critic networks are multilayer perceptrons that have two hidden layers with 256 units each. The input to each of the networks is a 42-dimensional vector with hand-engineered features extracted from the current game-state. The actor network outputs a softmax probability distribution over the 6 possible actions the agent can take. Thus, the `shape` of the actor network is `[42, 256, 256, 6]`. Of course, since the critic network merely outputs the perceived value of the input state, the `shape` of the critic network is `[42, 256, 256, 1]`. This results in 155,399 total trainable parameters.

In previous instances of deep reinforcement learning applied to gameplay (such as in [the original DQN paper](https://arxiv.org/abs/1312.5602)), it has been common to make use of a "frame-skipping technique." Rather than the agent choosing an action on every single frame, the agent instead chooses an action every <b>k</b> frames and applies that same action to the next <b>(k - 1)</b> frames until the next choice must be made. This allows training run more quickly, since feeding input vectors through the actor network often enough (say, 60 times per second) becomes quite a computationally expensive process. In the PPO implementation presented here, <b>k = 4</b>.

After each episode, a check is made to see if the agent has taken at least 8,192 steps (where a step consists of <b>k</b> frames). If so, all of the data for each of the current {state, action, reward} steps are used to train the actor on the [PPO surrogate objective](https://arxiv.org/abs/1707.06347) with gradient ascent and to train the critic on the mean-squared value error with gradient descent. More specifically, a training step consists of 10 epochs, during each of which 32 shuffled mini-batches are formed from the current data. A single gradient step with a learning rate of 3E-4 is performed on the actor and critic for each mini-batch. The current {state, action, reward} step data are then discarded, now that the policy has changed.

# Local Installation

In order to run the project locally, you will need to make sure you have Node.js and Angular CLI installed. To check if you have Node, open a command prompt and type `node -v` and hit enter. If the prompt doesn't tell you the version of Node that you have, you don't have it installed. Here is a [link](https://nodejs.org/en/download/) to download it: I highly recommend installing the LTS (long-term support) version. Once the installer has finished, try `node -v` again and you should see your version of Node show up.

<p align="center">
  <img src="https://dr3ngl797z54v.cloudfront.net/node_version.PNG" width="100%" alt="Node Version">
</p>

From there, using the command prompt, navigate into the directory where you would like to install the Github repository. Then, perform the following five commands:

```
git clone https://github.com/hmomin/ppo-winter-run
cd ppo-winter-run
npm install -g @angular/cli
npm install
npm start
```

The first command clones the repository into your desired location - you can also download it manually off of Github if you don't have Git installed on your machine. The next commands move into the newly created `ppo-winter-run` directory, install Angular CLI globally, install all Node modules and dependencies, and then open the compiled Angular project in your browser.

# References

- [Proximal Policy Optimization Algorithms - Schulman et al.](https://arxiv.org/abs/1707.06347)
- [High-Dimensional Continuous Control Using Generalized Advantage Estimation - Schulman et al.](https://arxiv.org/abs/1506.02438)
- [Playing Atari with Deep Reinforcement Learning - Mnih et al.](https://arxiv.org/abs/1312.5602)

# License

All files in the repository are under the MIT license.
