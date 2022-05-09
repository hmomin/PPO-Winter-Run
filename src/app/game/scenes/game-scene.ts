// import training-related stuff
import {
    episode,
    weights,
} from "../../../assets/training-data/agent-episode-0.json";
import { bestWeights } from "../../../assets/training-data/best-agent.json";
import Agent from "../training/agent";

import WinterGirl from "../objects/winter-girl";
import Meteor from "../objects/meteor";
import Snowman from "../objects/snowman";
import Yeti from "../objects/yeti";
import Crow from "../objects/crow";
import {
    snowmanPositions,
    yetiPositions,
    crowPositions,
} from "../../../assets/tilemap/level-enemies.json";
import Snowball from "../objects/snowball";
import GameText from "./game-text";
import Fireball from "../objects/fireball";

export default class GameScene extends Phaser.Scene {
    stateDim = 81; // dimensionality of state on each step (feature vector)
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
    numSolves = 0;
    numTrainingEpisodes = 0;
    startingFrame: number;

    dropOffLocations: Array<[number, number]> = [];
    nextLedgeLocations: Array<[number, number]> = [];

    backgroundBack: Phaser.GameObjects.TileSprite;
    backgroundFront: Phaser.GameObjects.TileSprite;
    graphics: Phaser.Tilemaps.TilemapLayer;
    map: Phaser.Tilemaps.Tilemap;
    tileset: Phaser.Tilemaps.Tileset;

    apples: Phaser.Physics.Arcade.Group;
    bonusBlocks: Phaser.Physics.Arcade.Group;
    coins: Phaser.Physics.Arcade.Group;
    diamonds: Phaser.Physics.Arcade.Group;
    ground: Phaser.Physics.Arcade.Group;
    hearts: Phaser.Physics.Arcade.Group;
    spikes: Phaser.Physics.Arcade.Group;
    star: Phaser.Physics.Arcade.Group;
    silverChests: Phaser.Physics.Arcade.Group;
    silverKeys: Phaser.Physics.Arcade.Group;

    cam: Phaser.Cameras.Scene2D.Camera;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    fireballsText: GameText;
    gameOverText: GameText;
    wonGameText: GameText;
    livesText: GameText;
    malletText: GameText;
    timerText: GameText;
    episodeText: GameText;
    texts: Array<GameText>;

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
    crows: Phaser.Physics.Arcade.Group;
    yetis: Phaser.Physics.Arcade.Group;
    snowmen: Phaser.Physics.Arcade.Group;
    snowmenObjs: Snowman[] = [];

    snowmanPositions: number[];
    yetiPositions: number[];
    crowPositions: number[][];
    girlYSpeed = 320;

    constructor() {
        super("game");
    }

    create() {
        this.setTrainingParameters();
        // retrieve weight and bias data if training
        if (this.train) {
            // ensure first weights synchronized between localStorage and context
            this.synchronizeTrainingData();
            if (this.episodeNum > 0) {
                const weightsStr: string = localStorage.getItem("weights");
                const currentWeights: number[][][] = JSON.parse(weightsStr);
                this.createAgent(currentWeights);
            } else {
                this.createAgent(weights);
            }
        } else if (this.autoplay) {
            // pretrained actor and critic weights loaded from hardcoded JSON file
            this.createAgent(bestWeights);
        }
        this.restorePreviousBuffer();

        this.setEnemyPositions();
        this.cam = this.cameras.cameras[0];
        this.addBackgrounds();
        this.createMap();
        this.computeDropOffLedgeLocations();

        // grab background signs and objects
        this.ground = this.instantiateObjectLayer("ground");

        // instantiate relevant parts of the level
        this.instantiatePlayer();
        this.instantiateTexts();
        this.instantiateHearts();
        this.instantiateApples();
        this.instantiateCoins();
        this.instantiateDiamonds();
        this.createPhysicsGroups();
        this.instantiateSilver();
        this.instantiateStar();
        this.instantiateSpikes();
        this.instantiateBonusBlocks();
        this.instantiateEnemies();

        this.setUpCursors();

        this.cam.startFollow(
            this.player,
            false,
            0.1,
            0,
            this.player.x - 150,
            this.player.y - 240
        );

        this.setWorldBounds();
        this.setMeteorCollisions();
    }

    setTrainingParameters() {
        this.autoplay = JSON.parse(localStorage.getItem("autoplay"));
        this.train = JSON.parse(localStorage.getItem("train"));
        const episodeNum = localStorage.getItem("episode");
        // the episode can be imported from a hardcoded JSON file containing weights
        this.episodeNum = episodeNum ? JSON.parse(episodeNum) : episode;
        this.startingFrame = this.game.getFrame();
    }

    synchronizeTrainingData() {
        // set all weights to localStorage if they don't exist
        if (!localStorage.getItem("weights")) {
            // starting weights are imported from a JSON file
            localStorage.setItem("weights", JSON.stringify(weights));
        }
        localStorage.setItem("episode", JSON.stringify(this.episodeNum));
    }

    createAgent(someWeights: number[][][]) {
        this.agent = new Agent(
            someWeights,
            this.stateDim,
            this.actionDim,
            this.numEpochs,
            this.numMiniBatches,
            this.learningRate
        );
    }

    restorePreviousBuffer() {
        const oldBuffer = this.registry.get("buffer");
        if (this.agent && oldBuffer) {
            this.agent.buffer = oldBuffer;
        }
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
        this.map = this.make.tilemap({ key: "game-map" });
        this.tileset = this.map.addTilesetImage(
            "winter-tileset",
            "tilesheet",
            32,
            32,
            0,
            0
        );
        this.graphics = this.map.createLayer("graphics", this.tileset, 0, 0);
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

    instantiatePlayer() {
        this.player = new WinterGirl(this, 50, 420);
        this.distanceCheckpoint = this.player.x;
        // when debugging the player, she makes high jumps
        if (this.player.debug) {
            this.girlYSpeed = 625;
        }
        this.physics.add.collider(this.player, this.graphics);
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
        this.timerText = new GameText(
            this,
            10,
            10,
            `Time Remaining: ${this.timeRemaining}s`
        );
        this.livesText = new GameText(
            this,
            10,
            35,
            "Lives Remaining: " + this.player.numLives
        );
        this.malletText = new GameText(
            this,
            10,
            60,
            "Mallet Hits [G]: " + this.player.numMallets
        );
        this.fireballsText = new GameText(
            this,
            10,
            85,
            "Fireballs [H]: " + this.player.numFireballs
        );
        this.gameOverText = new GameText(
            this,
            this.cam.width / 2,
            this.cam.height / 2,
            "GAME OVER",
            "#990000",
            60
        );
        this.gameOverText.makeInvisible();
        this.gameOverText.centerAll();
        this.wonGameText = new GameText(
            this,
            this.cam.width / 2,
            this.cam.height / 2,
            "YOU WIN!",
            "#009900",
            60
        );
        this.wonGameText.makeInvisible();
        this.wonGameText.centerAll();
        this.texts = [
            this.livesText,
            this.malletText,
            this.fireballsText,
            this.timerText,
            this.gameOverText,
            this.wonGameText,
        ];
        if (this.train) {
            this.episodeText = new GameText(
                this,
                this.cam.width / 2,
                10,
                `Episode ${this.episodeNum}`
            );
            this.episodeText.centerHorizontally();
            this.texts.push(this.episodeText);
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
                    const x = chest.body.x;
                    const y = chest.body.y;
                    chest.destroy();
                    const fireballOffsets = [];
                    for (let i = 1; i <= 3; i++) {
                        fireballOffsets.push(32 * i);
                    }
                    for (const offset of fireballOffsets) {
                        new Fireball(this, x + offset, y, this.fireballs);
                    }
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
                this.replaceBonusBlock(obj);
                this.shootMeteors();
            });
        }
    }

    replaceBonusBlock(block: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
        const x = Math.floor(block["x"] / 32);
        const y = Math.floor(block["y"] / 32);
        block.destroy();
        // copy the next tile over into where the bonus block used to be
        this.map.copy(x + 1, y, 1, 1, x, y);
    }

    shootMeteors() {
        const enemyPositions = [
            ...this.snowmanPositions,
            ...this.yetiPositions,
        ];
        const [left, right] = this.getCameraBounds();
        for (const enemyPosition of enemyPositions) {
            if (left - 500 <= enemyPosition && enemyPosition <= right + 500) {
                new Meteor(
                    this,
                    enemyPosition,
                    Phaser.Math.Between(-96, -16),
                    this.meteors
                );
            }
        }
    }

    getCameraBounds(): number[] {
        const left = Math.round(this.cam.midPoint.x) - this.cam.width / 2;
        const right = left + this.cam.width;
        return [left, right];
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
        if (this.gameIsOver()) {
            return;
        }

        this.updateBackgroundImages();

        if (this.train || this.autoplay) {
            const currentFrame = this.game.getFrame() - this.startingFrame;
            // if using a training agent, ask it what to do every k=4 frames
            if (currentFrame % 4 === 0) {
                this.state = this.getGameState();
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

    gameIsOver(): boolean {
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
            return true;
        }
        return false;
    }

    trainAgent() {
        this.numTrainingEpisodes += 1;
        if (this.wonGame) {
            this.numSolves += 1;
        }
        this.adjustRewardsByOneStep();
        this.agent.buffer.storeRewards(this.episodeRewards);
        const [returns, advantages] = this.agent.computeAdvantageEstimates(
            this.episodeRewards,
            this.episodeValues
        );
        this.agent.buffer.storeReturnData(returns, advantages);
        this.handleEpisodicData();
        if (this.steps >= this.batchSize) {
            this.agent.train();
            this.saveNewWeights();
        }
    }

    adjustRewardsByOneStep() {
        this.episodeRewards.shift();
        this.episodeRewards.push(0);
    }

    handleEpisodicData() {
        this.episodeRewards = [];
        this.episodeValues = [];
        this.totalRewards[this.episodeIndex] = this.totalReward;
        this.episodeIndex = (this.episodeIndex + 1) % this.totalRewards.length;
        const runningAverageReward = this.computeMean(this.totalRewards);
        this.maxReward = Math.max(this.maxReward, this.totalReward);
        this.maxAverage = Math.max(this.maxAverage, runningAverageReward);
        console.log(
            `\nepisode ${this.episodeNum}\n` +
                `reward: ${this.totalReward.toFixed(2)}\n` +
                `max reward: ${this.maxReward.toFixed(2)}\n` +
                `100 period avg: ${runningAverageReward.toFixed(2)}\n` +
                `max avg: ${this.maxAverage.toFixed(2)}`
        );
        this.totalReward = 0;
        this.distanceCheckpoint = -1;
        this.episodeNum++;
        localStorage.setItem("episode", JSON.stringify(this.episodeNum));
    }

    saveNewWeights() {
        this.agent.actor.saveWeights();
        this.agent.critic.saveWeights();
        const fullWeights = [];
        fullWeights.push(this.agent.actor.weightData);
        fullWeights.push(this.agent.critic.weightData);
        localStorage.setItem("weights", JSON.stringify(fullWeights));
        this.steps = this.numTrainingEpisodes = this.numSolves = 0;
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
        this.hideTexts();
        this.agent.dispose();
        // save the buffer to attach to the new agent
        this.registry.set("buffer", this.agent.buffer);
        this.scene.restart();
    }

    hideTexts() {
        for (const t of this.texts) {
            t.makeInvisible();
        }
    }

    handleLevelOver() {
        this.physics.pause();
        if (this.wonGame) {
            this.wonGameText.makeVisible();
        } else {
            this.gameOverText.makeVisible();
        }
        setTimeout(() => {
            this.hideTexts();
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
            ...this.getNearestInverseDistance(this.hearts.children.entries),
            ...this.getNearestInverseDistance(
                this.silverChests.children.entries
            ),
            ...this.getNearestInverseDistance(this.silverKeys.children.entries),
            ...this.getNearestInverseDistance(this.spikes.children.entries),
            ...this.getNearestInverseDistance(this.star.children.entries),
            ...this.getNearestInverseDistance(this.star.children.entries),
            ...this.getNearestInverseDistance(
                this.fireballs.children.entries,
                true
            ),
            ...this.getNearestInverseDistance(this.meteors.children.entries),
            ...this.getNearestInverseDistance(this.crows.children.entries),
            ...this.getNearestInverseDistance(this.yetis.children.entries),
            ...this.getNearestInverseDistance(this.snowmen.children.entries),
            ...this.getNearestInverseDistance(this.getSnowballs(), true),
            ...this.getPlayerParameters(),
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
            if (this.player.x - dropOff[1] > 0) {
                continue;
            }
            const dist =
                this.player.x - dropOff[0] > 0 ? 0 : dropOff[0] - this.player.x;
            return this.getInverse(dist);
        }
        return 0;
    }

    getNextLedge(): number[] {
        let nextDist = Math.sqrt(
            (this.cam.width / 2) ** 2 + (this.cam.height / 2) ** 2
        );
        let negativeXDist = Number.MAX_VALUE;
        let negativeYDist = Number.MAX_VALUE;
        let positiveXDist = Number.MAX_VALUE;
        let positiveYDist = Number.MAX_VALUE;
        for (const obj of this.nextLedgeLocations) {
            const x = obj[0];
            const y = obj[1];
            const xDist = x - this.player.x;
            const yDist = y - this.player.y;
            const objectDist = Math.sqrt(xDist ** 2 + yDist ** 2);
            if (objectDist < nextDist && x - this.player.x > 0) {
                negativeXDist = this.getSignedDist(xDist, false);
                negativeYDist = this.getSignedDist(yDist, false);
                positiveXDist = this.getSignedDist(xDist, true);
                positiveYDist = this.getSignedDist(yDist, true);
                nextDist = Math.sqrt(xDist ** 2 + yDist ** 2);
            }
        }
        return this.getInverseArray([
            negativeXDist,
            negativeYDist,
            positiveXDist,
            positiveYDist,
        ]);
    }

    getNearestInverseDistance(
        objArray: Phaser.GameObjects.GameObject[],
        includeVelocity: boolean = false
    ): number[] {
        let nearestDist = Math.sqrt(
            (this.cam.width / 2) ** 2 + (this.cam.height / 2) ** 2
        );
        let negativeXDist = Number.MAX_VALUE;
        let negativeYDist = Number.MAX_VALUE;
        let positiveXDist = Number.MAX_VALUE;
        let positiveYDist = Number.MAX_VALUE;
        let nearestObj = null;
        for (const obj of objArray) {
            const x = obj.body && !obj["dead"] ? obj.body["x"] : 1e6;
            const y = obj.body && !obj["dead"] ? obj.body["y"] : 1e6;
            const xDist = x - this.player.x;
            const yDist = y - this.player.y;
            const objectDist = Math.sqrt(xDist ** 2 + yDist ** 2);
            if (objectDist < nearestDist) {
                negativeXDist = this.getSignedDist(xDist, false);
                negativeYDist = this.getSignedDist(yDist, false);
                positiveXDist = this.getSignedDist(xDist, true);
                positiveYDist = this.getSignedDist(yDist, true);
                nearestObj = obj;
                nearestDist = Math.sqrt(xDist ** 2 + yDist ** 2);
            }
        }
        const distArray = this.getInverseArray([
            negativeXDist,
            negativeYDist,
            positiveXDist,
            positiveYDist,
        ]);
        if (includeVelocity) {
            let velocity = 0;
            if (nearestObj) {
                velocity = nearestObj["movingRight"] ? +1 : -1;
            }
            distArray.push(velocity);
        }
        return distArray;
    }

    getSignedDist(dist: number, positive: boolean) {
        const signChecksOut = positive ? dist >= 0 : dist <= 0;
        return signChecksOut ? dist : Number.MAX_VALUE;
    }

    getInverse(num: number): number {
        if (Math.abs(num) < 1) {
            return 1;
        } else if (Math.abs(num) < 1e-300) {
            return 0;
        } else {
            const inverseDist = Math.abs(1 / num);
            return inverseDist < 1e-300 ? 0 : inverseDist;
        }
    }

    getInverseArray(nums: number[]): number[] {
        const newNums = [];
        for (const num of nums) {
            newNums.push(this.getInverse(num));
        }
        return newNums;
    }

    getPlayerParameters(): number[] {
        return [
            this.player.body.velocity.x / this.girlYSpeed,
            this.player.body.velocity.y / this.girlYSpeed,
            this.player.numLives,
            this.player.numMallets > 0 ? 1 : 0,
            this.player.numFireballs > 0 ? 1 : 0,
            this.player.numSilverKeys > 0 ? 1 : 0,
            this.player.running ? 1 : 0,
            this.player.offensive ? 1 : 0,
            this.player.invulnerable ? 1 : 0,
            this.player.body.blocked.none ? 1 : 0,
        ];
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
        this.storePreviousReward();
        const oneHotActionVector = new Array(this.actionDim).fill(0);
        oneHotActionVector[action] = 1;
        const currentStateValue = this.agent.critic.arrayForward(this.state)[0];
        this.episodeValues.push(currentStateValue);
        const currentActionProbability = probabilities[action];
        this.agent.buffer.store(
            [...this.state],
            currentStateValue,
            oneHotActionVector,
            currentActionProbability
        );
        this.steps++;
    }

    storePreviousReward() {
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
            this.timerText.setColor("#990000");
        }
    }

    updateExternalMovers() {
        // update fireballs, meteors, enemies
        for (const group of [
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
