// import training-related stuff
import {
    episode,
    weights,
} from "../../../assets/training-data/agent-episode-0.json";
import { bestWeights } from "../../../assets/training-data/best-agent.json";
import Agent from "../training/agent";

import WinterGirl from "../objects/winter-girl";
import Santa from "../objects/santa";
import IceMage from "../objects/ice-mage";
import Meteor from "../objects/meteor";
import Snowman from "../objects/snowman";
import Yeti from "../objects/yeti";
import Crow from "../objects/crow";
import {
    snowmanPositions,
    yetiPositions,
    crowPositions,
} from "../../../assets/tilemap/level1_enemies.json";
import Snowball from "../objects/snowball";

export default class GameScene extends Phaser.Scene {
    stateDim = 42; // dimensionality of state on each step (feature vector)
    actionDim = 6; // amount of discrete actions we can choose from on each step
    batchSize = 8192; // how many steps per batch (minimum)
    numMiniBatches = 32; // how many minibatches to make out of each batch
    numEpochs = 10; // how many epochs to train for per batch?
    learningRate = 3e-4; // learning rate of actor and critic networks

    gameOver = false;
    gameEnded = false;
    wonGame = false;
    beginTime = 60;
    timeRemaining = this.beginTime;

    agent: Agent;
    train: boolean;
    autoplay: boolean;
    maxReward = Number.MIN_VALUE;
    maxAverage = Number.MIN_VALUE;
    episodeNum = 0;
    steps = 0;
    episodeRewards = [];
    episodeValues = [];
    totalReward = 0;
    totalRewards = new Array(100).fill(0);
    episodeIndex = 0;
    state = [];
    distanceCheckpoint = -1;

    dropOffLocations: Array<[number, number]> = [];
    nextLedgeLocations: Array<[number, number]> = [];

    backgroundBack: Phaser.GameObjects.TileSprite;
    backgroundFront: Phaser.GameObjects.TileSprite;
    graphics: Phaser.Tilemaps.DynamicTilemapLayer;
    map: Phaser.Tilemaps.Tilemap;
    tileset: Phaser.Tilemaps.Tileset;

    apples: Phaser.Physics.Arcade.Group;
    bonusBlocks: Phaser.Physics.Arcade.Group;
    coins: Phaser.Physics.Arcade.Group;
    diamonds: Phaser.Physics.Arcade.Group;
    goldChests: Phaser.Physics.Arcade.Group;
    goldKeys: Phaser.Physics.Arcade.Group;
    ground: Phaser.Physics.Arcade.Group;
    hearts: Phaser.Physics.Arcade.Group;
    silverChests: Phaser.Physics.Arcade.Group;
    silverKeys: Phaser.Physics.Arcade.Group;
    spikes: Phaser.Physics.Arcade.Group;
    star: Phaser.Physics.Arcade.Group;

    cam: Phaser.Cameras.Scene2D.Camera;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    fireballsText: Phaser.GameObjects.Text;
    gameOverText: Phaser.GameObjects.Text;
    wonGameText: Phaser.GameObjects.Text;
    livesText: Phaser.GameObjects.Text;
    malletText: Phaser.GameObjects.Text;
    timerText: Phaser.GameObjects.Text;
    episodeText: Phaser.GameObjects.Text;
    texts: Array<Phaser.GameObjects.Text>;

    fireballKey: Phaser.Input.Keyboard.Key;
    malletKey: Phaser.Input.Keyboard.Key;
    mostRecentKey: Phaser.Input.Keyboard.Key;
    keyTrainingMap: Phaser.Input.Keyboard.Key[];
    keyReverseMap = {
        37: "LEFT",
        38: "UP",
        39: "RIGHT",
        40: "DOWN",
        71: "MALLET",
        72: "FIREBALL",
    };

    player: WinterGirl;
    fireballs: Phaser.Physics.Arcade.Group;
    meteors: Phaser.Physics.Arcade.Group;
    helpers: Phaser.Physics.Arcade.Group;
    crows: Phaser.Physics.Arcade.Group;
    yetis: Phaser.Physics.Arcade.Group;
    snowmen: Phaser.Physics.Arcade.Group;
    snowmenObjs: Snowman[] = [];
    snowballs: Snowball[] = [];

    snowmanPositions: number[];
    yetiPositions: number[];
    // move crows as soon as they enter the camera view
    crowPositions: number[][];
    girlYSpeed = 320;

    constructor() {
        super("game");
    }

    create() {
        // deal with training stuff
        this.autoplay = JSON.parse(localStorage.getItem("autoplay"));
        this.train = JSON.parse(localStorage.getItem("train"));
        const episodeNum = localStorage.getItem("episode");
        // the episode can be imported from a hardcoded JSON file containing weights
        this.episodeNum = episodeNum ? JSON.parse(episodeNum) : episode;
        // retrieve weight and bias data if training
        if (this.train) {
            // set all weights to localStorage if they don't exist
            if (!localStorage.getItem("weights")) {
                // starting weights are imported from a JSON file
                localStorage.setItem("weights", JSON.stringify(weights));
            }
            localStorage.setItem("episode", JSON.stringify(this.episodeNum));
            // ensure first weights synchronized between localStorage and context
            if (this.episodeNum > 0) {
                const weightsStr: string = localStorage.getItem("weights");
                const currentWeights: number[][][] = JSON.parse(weightsStr);
                this.agent = new Agent(
                    currentWeights,
                    this.stateDim,
                    this.actionDim,
                    this.numEpochs,
                    this.numMiniBatches,
                    this.learningRate
                );
            } else {
                this.agent = new Agent(
                    weights,
                    this.stateDim,
                    this.actionDim,
                    this.numEpochs,
                    this.numMiniBatches,
                    this.learningRate
                );
            }
        } else if (this.autoplay) {
            // pretrained actor and critic weights loaded from hardcoded JSON file
            this.agent = new Agent(
                bestWeights,
                this.stateDim,
                this.actionDim,
                this.numEpochs,
                this.numMiniBatches,
                this.learningRate
            );
        }
        // restore the previous buffer
        const oldBuffer = this.registry.get("buffer");
        if (this.agent && oldBuffer) {
            this.agent.buffer = oldBuffer;
        }

        this.setEnemyPositions();
        this.cam = this.cameras.cameras[0];
        this.addBackgrounds();
        this.createMap();
        this.computeDropOffLedgeLocations();

        // grab background signs and objects
        this.ground = this.instantiateObjectLayer("ground");

        // add player
        this.player = new WinterGirl(this, 50, 350);
        this.distanceCheckpoint = this.player.x;
        // when debugging the player, she makes high jumps
        if (this.player.debug) {
            this.girlYSpeed = 625;
        }
        this.physics.add.collider(this.player, this.graphics);

        // instantiate relevant objects for the level
        this.instantiateTexts();
        this.instantiateHearts();
        this.instantiateApples();
        this.instantiateCoins();
        this.instantiateDiamonds();
        this.createPhysicsGroups();
        this.instantiateSilver();
        this.instantiateGold();
        this.instantiateStar();
        this.instantiateSpikes();
        this.instantiateBonusBlocks();
        this.instantiateEnemies();

        this.setUpCursors();

        this.cam.startFollow(this.player, false, 0.1, 0, -100, 110);

        this.setWorldBounds();
        this.setMeteorCollisions();
    }

    setEnemyPositions() {
        this.snowmanPositions = snowmanPositions;
        this.yetiPositions = yetiPositions;
        this.crowPositions = crowPositions;
    }

    addBackgrounds() {
        this.backgroundBack = this.add.tileSprite(
            -this.game.scale.width / 2,
            this.game.scale.height / 2,
            this.game.scale.width * 3,
            this.game.scale.height,
            "background_1"
        );
        this.backgroundFront = this.add.tileSprite(
            -this.game.scale.width / 2,
            this.game.scale.height / 2,
            this.game.scale.width * 3,
            this.game.scale.height,
            "background_2"
        );
    }

    createMap() {
        this.map = this.make.tilemap({ key: "map1" });
        this.tileset = this.map.addTilesetImage(
            "winter-tileset",
            "tilesheet",
            32,
            32,
            0,
            0
        );
        this.graphics = this.map.createDynamicLayer(
            "graphics",
            this.tileset,
            0,
            0
        );
        this.graphics.setCollisionByExclusion([-1], true);
    }

    computeDropOffLedgeLocations() {
        const mapData = this.graphics.layer.data;
        /*
            mapData[0] === the entire top row from left to right
            mapData[1] === the entire second-from-top row from left to right
            ...
        */
        // figure out the drop off locations and the next ledge locations
        let dropOffBegins = -1;
        // j goes from left to right on the map
        for (let j = 0; j < mapData[0].length; j++) {
            let spaceFound = false;
            // i goes from top to bottom on the map
            for (let i = 0; i < mapData.length; i++) {
                if (mapData[i][j].index !== -1) {
                    spaceFound = true;
                    if (j > 0 && mapData[i][j - 1].index === -1) {
                        this.nextLedgeLocations.push([32 * j, 32 * i]);
                    }
                    break;
                }
            }
            if (!spaceFound && dropOffBegins === -1) {
                dropOffBegins = j;
            } else if (spaceFound && dropOffBegins !== -1) {
                this.dropOffLocations.push([32 * dropOffBegins, 32 * j]);
                dropOffBegins = -1;
            }
        }
    }

    instantiateObjectLayer(
        groupStr: string,
        xOffset = 16,
        yOffset = -16
    ): Phaser.Physics.Arcade.Group {
        const group = this.physics.add.group({
            allowGravity: false,
            immovable: true,
        });
        this.map.getObjectLayer(groupStr).objects.forEach((obj) => {
            group.create(obj.x + xOffset, obj.y + yOffset, obj.name);
        });
        return group;
    }

    instantiateTexts() {
        this.timerText = this.add.text(
            10,
            10,
            "Time Remaining: " + this.timeRemaining,
            {
                fontFamily: "Arial",
                fontSize: 20,
                color: "black",
            }
        );
        this.livesText = this.add.text(
            10,
            35,
            "Lives Remaining: " + this.player.numLives,
            {
                fontFamily: "Arial",
                fontSize: 20,
                color: "black",
            }
        );
        this.malletText = this.add.text(
            10,
            60,
            "Mallet Hits [G]: " + this.player.numMallets,
            {
                fontFamily: "Arial",
                fontSize: 20,
                color: "black",
            }
        );
        this.fireballsText = this.add.text(
            10,
            85,
            "Fireballs [H]: " + this.player.numFireballs,
            {
                fontFamily: "Arial",
                fontSize: 20,
                color: "black",
            }
        );
        this.gameOverText = this.add.text(
            this.cam.width / 2,
            (3 * this.cam.height) / 10,
            "GAME OVER",
            {
                fontFamily: "Arial",
                fontSize: 60,
                color: "#990000",
            }
        );
        this.gameOverText.setOrigin(0.5, 0.5);
        this.gameOverText.visible = false;
        this.wonGameText = this.add.text(
            this.cam.width / 2,
            (3 * this.cam.height) / 10,
            "YOU WIN!",
            {
                fontFamily: "Arial",
                fontSize: 60,
                color: "#009900",
            }
        );
        this.wonGameText.setOrigin(0.5, 0.5);
        this.wonGameText.visible = false;
        this.texts = [
            this.livesText,
            this.malletText,
            this.fireballsText,
            this.timerText,
            this.gameOverText,
            this.wonGameText,
        ];
        if (this.train) {
            this.episodeText = this.add.text(
                this.cam.width / 2,
                10,
                `Episode ${this.episodeNum}`,
                {
                    fontFamily: "Arial",
                    fontSize: 20,
                    color: "black",
                }
            );
            this.episodeText.setOrigin(0.5, 0);
            this.texts.push(this.episodeText);
        }
        // fix texts in place
        for (const t of this.texts) {
            t.setScrollFactor(0, 0);
        }
    }

    instantiateHearts() {
        // hearts for extra lives
        this.hearts = this.instantiateObjectLayer("hearts");
        // player grabs heart
        this.physics.add.overlap(
            this.player,
            this.hearts,
            (_, heart) => {
                heart.destroy();
                this.player.numLives++;
            },
            null,
            this
        );
    }

    instantiateApples() {
        // apples for speed
        this.apples = this.instantiateObjectLayer("apples");
        // player grabs apple
        this.physics.add.overlap(
            this.player,
            this.apples,
            (_, apple) => {
                apple.destroy();
                this.player.running = true;
            },
            null,
            this
        );
    }

    instantiateCoins() {
        // coins for mallet attacks
        this.coins = this.instantiateObjectLayer("coins");
        this.coins.children.iterate((c) => {
            (c as any).body.setCircle(16);
        });
        // player grabs coin
        this.physics.add.overlap(
            this.player,
            this.coins,
            (_, coin) => {
                coin.destroy();
                this.player.numMallets++;
            },
            null,
            this
        );
    }

    instantiateDiamonds() {
        // diamonds for fireballs
        this.diamonds = this.instantiateObjectLayer("diamonds");
        // player grabs diamond
        this.physics.add.overlap(
            this.player,
            this.diamonds,
            (_, diamond) => {
                diamond.destroy();
                this.player.numFireballs++;
            },
            null,
            this
        );
    }

    createPhysicsGroups() {
        // physics groups are necessary to handle collisions
        this.fireballs = this.physics.add.group({
            allowGravity: false,
        });
        this.meteors = this.physics.add.group({
            allowGravity: false,
        });
        this.helpers = this.physics.add.group({
            immovable: true,
        });
        this.snowmen = this.physics.add.group({
            allowGravity: false,
            immovable: true,
        });
        this.yetis = this.physics.add.group({
            allowGravity: false,
            immovable: true,
        });
        this.crows = this.physics.add.group({
            allowGravity: false,
            immovable: true,
        });
    }

    instantiateSilver() {
        // silver keys for silver chests
        this.silverKeys = this.instantiateObjectLayer("silver_key");
        // player grabs silver key
        this.physics.add.overlap(
            this.player,
            this.silverKeys,
            (_, key) => {
                key.destroy();
                this.player.numSilverKeys++;
            },
            null,
            this
        );

        // silver chests
        this.silverChests = this.instantiateObjectLayer("silver_chest");
        // player tries to open silver chest
        this.physics.add.overlap(
            this.player,
            this.silverChests,
            (_, chest) => {
                if (this.player.numSilverKeys > 0) {
                    this.player.numSilverKeys--;
                    chest.destroy();
                    // tslint:disable-next-line: no-unused-expression
                    new Santa(
                        this,
                        this.player.x,
                        this.player.y - 50,
                        this.helpers
                    );
                }
            },
            null,
            this
        );
    }

    instantiateGold() {
        // gold keys for gold chests
        this.goldKeys = this.instantiateObjectLayer("gold_key");
        // player grabs gold key
        this.physics.add.overlap(
            this.player,
            this.goldKeys,
            (_, key) => {
                key.destroy();
                this.player.numGoldKeys++;
            },
            null,
            this
        );

        // gold chests
        this.goldChests = this.instantiateObjectLayer("gold_chest");
        // player tries to open gold chest
        this.physics.add.overlap(
            this.player,
            this.goldChests,
            (_, chest) => {
                if (this.player.numGoldKeys > 0) {
                    this.player.numGoldKeys--;
                    chest.destroy();
                    // tslint:disable-next-line: no-unused-expression
                    new IceMage(
                        this,
                        this.player.x,
                        this.player.y - 50,
                        this.helpers
                    );
                }
            },
            null,
            this
        );
    }

    instantiateStar() {
        // star at end wins the game
        this.star = this.instantiateObjectLayer("star");
        this.star.children.iterate((s) => {
            (s as any).body.setCircle(16);
        });
        this.physics.add.overlap(
            this.player,
            this.star,
            () => {
                if (!this.train) {
                    this.physics.pause();
                    this.player.play("girl-idle", true);
                }
                this.wonGame = true;
                this.gameOver = true;
            },
            null,
            this
        );
    }

    instantiateSpikes() {
        // spikes hurt
        this.spikes = this.instantiateObjectLayer("spikes", 16, -24);
        for (const spike of this.spikes.children.entries) {
            this.physics.add.collider(this.player, spike, () => {
                this.player.setVelocityY(-this.girlYSpeed);
                this.player.loseLife();
            });
        }
    }

    instantiateBonusBlocks() {
        // bonus blocks shoot fireballs in random directions
        this.bonusBlocks = this.instantiateObjectLayer("bonus blocks", 16, -15);
        for (const block of this.bonusBlocks.children.entries) {
            this.physics.add.collider(this.player, block, (_, obj) => {
                const x = Math.floor(obj["x"] / 32);
                const y = Math.floor(obj["y"] / 32);
                obj.destroy();
                // copy the next tile over into where the bonus block used to be
                this.map.copy(x + 1, y, 1, 1, x, y);
                // figure out left-right camera bounds
                const left =
                    Math.round(this.cam.midPoint.x) - this.cam.width / 2;
                const right = left + this.cam.width;
                // shoot meteors from the sky.
                // we want some element of randomness, but without any overlapping.
                const positions: Array<number> = [];
                for (let i = 1; i <= 9; i++) {
                    let min = 0;
                    let xPosition = 0;
                    while (min < 32) {
                        xPosition = Phaser.Math.Between(left, right);
                        min = Math.min(
                            ...positions.map((value) => {
                                return Math.abs(value - xPosition);
                            })
                        );
                    }
                    positions.push(xPosition);
                    new Meteor(
                        this,
                        xPosition,
                        Phaser.Math.Between(-96, -16),
                        this.meteors
                    );
                }
            });
        }
    }

    instantiateEnemies() {
        // instantiate snowmen, yeti, and crows
        for (const pos of this.snowmanPositions) {
            this.snowmenObjs.push(new Snowman(this, pos, 0, this.snowmen));
        }
        for (const pos of this.yetiPositions) {
            new Yeti(this, pos, 0, this.yetis);
        }
        for (const pos of this.crowPositions) {
            new Crow(this, pos[0], pos[1], this.crows);
        }
    }

    setUpCursors() {
        this.malletKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.G
        );
        this.fireballKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.H
        );
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyTrainingMap = [
            this.cursors.left,
            this.cursors.up,
            this.cursors.right,
            this.malletKey,
            this.fireballKey,
            // down key corresponds to simply standing still
            this.cursors.down,
        ];
    }

    setWorldBounds() {
        this.physics.world.setBounds(0, 0, 8608, 480);
        this.physics.world.on("worldbounds", () => {
            if (this.player.withinLevelBounds()) {
                this.player.loseLife();
                this.player.jump();
            }
        });
    }

    setMeteorCollisions() {
        this.physics.add.overlap(
            this.player,
            this.meteors,
            () => {
                this.player.loseLife();
            },
            null,
            this
        );
    }

    update() {
        // check if game over
        if (this.gameOver && !this.gameEnded) {
            this.gameOver = false;
            this.gameEnded = true;
            // deal with training
            if (this.train) {
                this.trainAgent();
                this.restartScene();
            } else {
                this.handleLevelOver();
            }
        }

        this.updateBackgroundImages();

        if (this.train || this.autoplay) {
            // if using a training agent, ask it what to do every 4 frames
            if (
                (!this.mostRecentKey || this.game.getFrame() % 4 === 0) &&
                this.distanceCheckpoint !== -1
            ) {
                this.state = this.getGameState();
                // get the agent to choose an action given the input state
                const probabilities = this.agent.actor.arrayForward(this.state);
                const action = this.train
                    ? this.agent.sampleAction(probabilities)
                    : this.agent.mostLikelyAction(probabilities);
                this.pushKeyDown(this.keyTrainingMap[action]);
                if (this.train) {
                    this.recordStepInfo(probabilities, action);
                }
            } else {
                this.pushKeyDown(this.mostRecentKey);
            }
        }

        this.player.update();

        if (this.game.getFrame() % 60 === 0) {
            this.handleTimeRemaining();
        }

        this.updateExternalMovers();
        this.updateTexts();
    }

    trainAgent() {
        // adjust rewards (since they're off by one step) before storing them
        this.episodeRewards.shift();
        const finalBonus = this.wonGame ? this.timeRemaining * 100 : 0;
        this.totalReward += finalBonus;
        this.episodeRewards.push(finalBonus);
        this.agent.buffer.storeRewards(this.episodeRewards);
        // compute and store advantage estimates
        const [returns, advantages] = this.agent.computeAdvantageEstimates(
            this.episodeRewards,
            this.episodeValues
        );
        this.agent.buffer.storeReturnData(returns, advantages);
        // before training, reset episodic data
        this.episodeRewards = [];
        this.episodeValues = [];
        this.totalRewards[this.episodeIndex] = this.totalReward;
        this.episodeIndex = (this.episodeIndex + 1) % this.totalRewards.length;
        const runningAverageReward = this.computeMean(this.totalRewards);
        this.maxReward = Math.max(this.maxReward, this.totalReward);
        this.maxAverage = Math.max(this.maxAverage, runningAverageReward);
        console.log(
            `episode ${this.episodeNum}\n` +
                `reward: ${this.totalReward.toFixed(2)}\n` +
                `max reward: ${this.maxReward.toFixed(2)}\n` +
                `100 period avg: ${runningAverageReward.toFixed(2)}\n` +
                `max avg: ${this.maxAverage.toFixed(2)}`
        );
        this.totalReward = 0;
        this.distanceCheckpoint = -1;
        // learn if we've made the right number of steps - otherwise, create more
        // training data
        if (this.steps >= this.batchSize) {
            this.agent.train();
            this.steps = 0;
            // save the new weights to local storage
            this.agent.actor.saveWeights();
            this.agent.critic.saveWeights();
            const fullWeights = [];
            fullWeights.push(this.agent.actor.weightData);
            fullWeights.push(this.agent.critic.weightData);
            localStorage.setItem("weights", JSON.stringify(fullWeights));
        }
        // save the new episode number
        this.episodeNum++;
        localStorage.setItem("episode", JSON.stringify(this.episodeNum));
    }

    computeMean(arr: number[]): number {
        let total = 0;
        for (const num of arr) {
            total += num;
        }
        return total / arr.length;
    }

    restartScene() {
        // restart to the beginning state
        this.timeRemaining = this.beginTime;
        this.wonGame = false;
        this.gameOver = false;
        this.gameEnded = true;
        this.agent.dispose();
        // save the buffer to attach to the new agent
        this.registry.set("buffer", this.agent.buffer);
        this.scene.restart();
    }

    handleLevelOver() {
        this.physics.pause();
        if (this.wonGame) {
            this.wonGameText.visible = true;
        } else {
            this.gameOverText.visible = true;
        }
        setTimeout(() => {
            this.cam.fadeOut(1000);
            setTimeout(() => {
                this.timeRemaining = this.beginTime;
                this.scene.start("title");
                this.wonGame = false;
                this.gameEnded = false;
            }, 1000);
        }, 3000);
    }

    updateBackgroundImages() {
        for (const bg of [this.backgroundBack, this.backgroundFront]) {
            bg.tilePositionX += 0.1;
            bg.displayOriginX = -this.cam.scrollX + this.cam.centerX;
        }
    }

    getGameState(): number[] {
        // we need to know where the snowballs are before computing the state
        this.snowballs = this.getSnowballs();
        // define the state mostly from distances to various features of the scene
        return [
            this.getNextDropOff(),
            ...this.getNextLedge(),
            ...this.getNearestInverseDistance(this.apples.children.entries),
            ...this.getNearestInverseDistance(
                this.bonusBlocks.children.entries
            ),
            ...this.getNearestInverseDistance(this.coins.children.entries),
            ...this.getNearestInverseDistance(this.diamonds.children.entries),
            ...this.getNearestInverseDistance(this.goldChests.children.entries),
            ...this.getNearestInverseDistance(this.goldKeys.children.entries),
            ...this.getNearestInverseDistance(this.hearts.children.entries),
            ...this.getNearestInverseDistance(
                this.silverChests.children.entries
            ),
            ...this.getNearestInverseDistance(this.silverKeys.children.entries),
            ...this.getNearestInverseDistance(this.spikes.children.entries),
            ...this.getNearestInverseDistance(this.star.children.entries),
            ...this.getNearestInverseDistance(this.fireballs.children.entries),
            ...this.getNearestInverseDistance(this.meteors.children.entries),
            ...this.getNearestInverseDistance(this.helpers.children.entries),
            ...this.getNearestInverseDistance(this.crows.children.entries),
            ...this.getNearestInverseDistance(this.yetis.children.entries),
            ...this.getNearestInverseDistance(this.snowmen.children.entries),
            ...this.getNearestInverseDistance(this.snowballs),
            this.player.numLives,
            this.player.numMallets,
            this.player.numFireballs,
        ];
    }

    getSnowballs(): Snowball[] {
        const snowballs = [];
        for (const snowman of this.snowmenObjs) {
            if (snowman.snowball) {
                snowballs.push(snowman.snowball);
            }
        }
        return snowballs;
    }

    getNextDropOff(): number {
        for (const dropOff of this.dropOffLocations) {
            if (dropOff[0] - this.player.x < 0) {
                continue;
            } else {
                const dist = dropOff[0] - this.player.x;
                return this.getInverse(dist);
            }
        }
        return 0;
    }

    getNextLedge(): [number, number] {
        let nextDist = Math.sqrt(
            (this.cam.width / 2) ** 2 + (this.cam.height / 2) ** 2
        );
        let inverseXDist = 0;
        let inverseYDist = 0;
        for (const obj of this.nextLedgeLocations) {
            const x = obj[0];
            const y = obj[1];
            if (
                Math.sqrt((x - this.player.x) ** 2 + (y - this.player.y) ** 2) <
                    nextDist &&
                x - this.player.x > 0
            ) {
                inverseXDist = this.getInverse(x - this.player.x);
                inverseYDist = this.getInverse(y - this.player.y);
                nextDist = Math.sqrt(
                    (x - this.player.x) ** 2 + (y - this.player.y) ** 2
                );
            }
        }
        return [inverseXDist, inverseYDist];
    }

    getNearestInverseDistance(
        objArray: Phaser.GameObjects.GameObject[]
    ): number[] {
        let nearestDist = Math.sqrt(
            (this.cam.width / 2) ** 2 + (this.cam.height / 2) ** 2
        );
        let inverseXDist = 0;
        let inverseYDist = 0;
        for (const obj of objArray) {
            const x = obj.body ? obj.body["x"] : 1e6;
            const y = obj.body ? obj.body["y"] : 1e6;
            const objectDist = Math.sqrt(
                (x - this.player.x) ** 2 + (y - this.player.y) ** 2
            );
            if (objectDist < nearestDist && !obj["dead"]) {
                const xDist = x - this.player.x;
                const yDist = y - this.player.y;

                inverseXDist = this.getInverse(xDist);
                inverseYDist = this.getInverse(yDist);
                nearestDist = Math.sqrt(
                    (x - this.player.x) ** 2 + (y - this.player.y) ** 2
                );
            }
        }
        return [inverseXDist, inverseYDist];
    }

    getInverse(num: number): number {
        if (Math.abs(num) < 1) {
            return 1;
        } else {
            return Math.abs(1 / num);
        }
    }

    pushKeyDown(keyToPush: Phaser.Input.Keyboard.Key) {
        for (const key of this.keyTrainingMap) {
            key.isDown = false;
        }
        keyToPush.isDown = true;
        this.mostRecentKey = keyToPush;
    }

    recordStepInfo(
        probabilities: Float32Array | Int32Array | Uint8Array,
        action: number
    ) {
        // store the reward from taking the previous action
        this.getAndStorePreviousReward();
        // create a one-hot vector for the action chosen
        const actionOneHot = new Array(this.actionDim).fill(0);
        actionOneHot[action] = 1;
        // record the value of the current state
        const value = this.agent.critic.arrayForward(this.state)[0];
        this.episodeValues.push(value);
        // compute the probability of the action we're about to take
        const prob = probabilities[action];
        // store info related to this step in time
        this.agent.buffer.store([...this.state], value, actionOneHot, prob);
        this.steps++;
        if (this.game.getFrame() % 60 === 0) {
            console.log(this.keyReverseMap[this.mostRecentKey.keyCode]);
        }
    }

    getAndStorePreviousReward() {
        // compute the reward from taking the previous action
        const prevReward = this.player.x - this.distanceCheckpoint;
        this.distanceCheckpoint = this.player.x;
        this.totalReward += prevReward;
        this.episodeRewards.push(prevReward);
    }

    handleTimeRemaining() {
        // check time
        if (this.timeRemaining === 0 && !this.gameEnded) {
            this.gameOver = true;
        } else if (this.timeRemaining > 0 && !this.gameOver && !this.wonGame) {
            this.timeRemaining--;
            if (this.gameEnded) {
                this.gameEnded = false;
            }
        }
        // set warning color if time goes below 20 seconds
        if (this.timeRemaining === 20) {
            this.timerText.setFill("#aa0000");
        }
    }

    updateExternalMovers() {
        // update santas, ice mages, fireballs, meteors, snowmen
        for (const group of [
            this.helpers.children.entries,
            this.fireballs.children.entries,
            this.meteors.children.entries,
            this.snowmen.children.entries,
            this.yetis.children.entries,
            this.crows.children.entries,
        ]) {
            for (const obj of group) {
                obj.update();
            }
        }
    }

    updateTexts() {
        this.timerText.setText(`Time Remaining: ${this.timeRemaining}s`);
        this.livesText.setText(`Lives Remaining: ${this.player.numLives}`);
        this.malletText.setText(`Mallet Hits [G]: ${this.player.numMallets}`);
        this.fireballsText.setText(
            `Fireballs [H]: ${this.player.numFireballs}`
        );
    }
}
