export default class LoadScene extends Phaser.Scene {
    routerUrl: string;
    loadingBar: Phaser.GameObjects.Graphics;
    assetText: Phaser.GameObjects.Text;
    assetUrl = "https://d1w49crlcpe45.cloudfront.net/";

    constructor() {
        super("load");
        this.routerUrl = window.location.pathname;
    }

    preload() {
        this.generateLoadingBar();
        this.loadMusic();
        this.loadBackgroundImages();
        this.loadTextImages();
        this.loadTiles();
        this.loadWinterGirl();
        this.loadExplosions();
        this.loadEnemies();

        this.load.on("complete", () => {
            this.loadAnimations();
            this.toggleTraining();
        });
    }

    generateLoadingBar() {
        this.loadingBar = this.add.graphics({
            fillStyle: {
                color: 0x00ff00,
            },
        });

        this.assetText = this.add.text(50, 50, "", { fontFamily: "Arial" });

        this.load.on("progress", (percentage) => {
            this.loadingBar.fillRect(
                50,
                this.game.scale.height / 2 - 25,
                (this.game.scale.width - 100) * percentage,
                50
            );
        });
        this.load.on("fileprogress", (file) => {
            this.assetText.setText("Loading " + file.key + "...");
        });
    }

    loadMusic() {
        this.load.audio("music", this.assetUrl + "audio/winter-run-music.mp3");
    }

    loadBackgroundImages() {
        this.load.image(
            "background_1",
            this.assetUrl + "background-images/background_1.png"
        );
        this.load.image(
            "background_2",
            this.assetUrl + "background-images/background_2.png"
        );
    }

    loadTextImages() {
        this.load.image(
            "logo",
            this.assetUrl + "title-images/winter-run-logo.png"
        );
        this.load.image("play", this.assetUrl + "title-images/play.png");
        this.load.image(
            "autoplay",
            this.assetUrl + "title-images/autoplay.png"
        );
        this.load.image(
            "music-on",
            this.assetUrl + "title-images/music-on.png"
        );
        this.load.image(
            "music-off",
            this.assetUrl + "title-images/music-off.png"
        );
    }

    loadTiles() {
        this.load.image("tilesheet", this.assetUrl + "tilemap/tilesheet.png");
        this.load.tilemapTiledJSON(
            "game-map",
            "../../../assets/tilemap/game-level.json"
        );
        this.loadTilemapImages();
    }

    loadTilemapImages() {
        this.load.image("apple", this.assetUrl + "tilemap/images/apple.png");
        this.load.image(
            "bonus-block",
            this.assetUrl + "tilemap/images/bonus-block.png"
        );
        this.load.image("bush", this.assetUrl + "tilemap/images/bush.png");
        this.load.image("coin", this.assetUrl + "tilemap/images/coin.png");
        this.load.image(
            "death-sign",
            this.assetUrl + "tilemap/images/death-sign.png"
        );
        this.load.image(
            "diamond",
            this.assetUrl + "tilemap/images/diamond.png"
        );
        this.load.image(
            "exclam-sign",
            this.assetUrl + "tilemap/images/exclam-sign.png"
        );
        this.load.image("fence", this.assetUrl + "tilemap/images/fence.png");
        this.load.image("heart", this.assetUrl + "tilemap/images/heart.png");
        this.load.image(
            "question-sign",
            this.assetUrl + "tilemap/images/question-sign.png"
        );
        this.load.image(
            "right-sign",
            this.assetUrl + "tilemap/images/right-sign.png"
        );
        this.load.image("shrub", this.assetUrl + "tilemap/images/shrub.png");
        this.load.image(
            "silver-chest",
            this.assetUrl + "tilemap/images/silver-chest.png"
        );
        this.load.image(
            "silver-key",
            this.assetUrl + "tilemap/images/silver-key.png"
        );
        this.load.image("spike", this.assetUrl + "tilemap/images/spike.png");
        this.load.image("star", this.assetUrl + "tilemap/images/star.png");
        this.load.image(
            "top-right-sign",
            this.assetUrl + "tilemap/images/top-right-sign.png"
        );
        this.load.image(
            "snowman-top-left",
            this.assetUrl + "tilemap/images/snowman-top-left.png"
        );
        this.load.image(
            "snowman-bottom-left",
            this.assetUrl + "tilemap/images/snowman-bottom-left.png"
        );
        this.load.image(
            "snowman-top-right",
            this.assetUrl + "tilemap/images/snowman-top-right.png"
        );
        this.load.image(
            "snowman-bottom-right",
            this.assetUrl + "tilemap/images/snowman-bottom-right.png"
        );
    }

    loadWinterGirl() {
        this.load.atlas(
            "player",
            this.assetUrl + "sprites/winter-girl-spritesheet.png",
            this.assetUrl + "sprites/winter-girl-atlas.json"
        );
        this.load.atlas(
            "player-attack",
            this.assetUrl + "sprites/winter-girl-attack-spritesheet.png",
            this.assetUrl + "sprites/winter-girl-attack-atlas.json"
        );
    }

    loadExplosions() {
        this.load.atlas(
            "explosion",
            this.assetUrl + "sprites/explosion-spritesheet.png",
            this.assetUrl + "sprites/explosion-atlas.json"
        );
    }

    loadEnemies() {
        this.load.atlas(
            "yeti",
            this.assetUrl + "sprites/yeti-spritesheet.png",
            this.assetUrl + "sprites/yeti-atlas.json"
        );
        this.load.atlas(
            "snowman",
            this.assetUrl + "sprites/snowman-spritesheet.png",
            this.assetUrl + "sprites/snowman-atlas.json"
        );
        this.load.atlas(
            "crow",
            this.assetUrl + "sprites/crow-spritesheet.png",
            this.assetUrl + "sprites/crow-atlas.json"
        );
    }

    loadAnimations() {
        this.loadGirlAnimations();
        this.loadFireAnimations();
        this.loadSnowmanAnimations();
        this.loadYetiAnimations();
        this.loadCrowAnimations();
    }

    loadGirlAnimations() {
        this.anims.create({
            key: "girl-idle",
            frames: this.anims.generateFrameNames("player", {
                prefix: "idle_",
                start: 1,
                end: 3,
            }),
            frameRate: 3,
            repeat: -1,
        });
        this.anims.create({
            key: "girl-roll",
            frames: this.anims.generateFrameNames("player", {
                prefix: "roll_",
                start: 1,
                end: 3,
            }),
            frameRate: 20,
            repeat: -1,
        });
        this.anims.create({
            key: "girl-walk",
            frames: this.anims.generateFrameNames("player", {
                prefix: "walk_",
                start: 1,
                end: 6,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "girl-jump",
            frames: this.anims.generateFrameNames("player", {
                prefix: "jump_",
                start: 1,
                end: 6,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "girl-throw",
            frames: this.anims.generateFrameNames("player-attack", {
                prefix: "throw_",
                start: 1,
                end: 3,
            }),
            frameRate: 3,
            repeat: -1,
        });
        this.anims.create({
            key: "girl-hit",
            frames: this.anims.generateFrameNames("player-attack", {
                prefix: "hit_",
                start: 1,
                end: 2,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "girl-mallet",
            frames: this.anims.generateFrameNames("player-attack", {
                prefix: "mallet_",
                start: 1,
                end: 5,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "girl-mallet-jump",
            frames: this.anims.generateFrameNames("player-attack", {
                prefix: "mallet_jump_",
                start: 1,
                end: 5,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "girl-spin",
            frames: this.anims.generateFrameNames("player-attack", {
                prefix: "spin_",
                start: 1,
                end: 3,
            }),
            frameRate: 20,
            repeat: -1,
        });
    }

    loadFireAnimations() {
        this.anims.create({
            key: "fireball",
            frames: this.anims.generateFrameNames("explosion", {
                prefix: "swirly_ball_",
                start: 1,
                end: 4,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "meteor",
            frames: this.anims.generateFrameNames("explosion", {
                prefix: "big_ball_",
                start: 1,
                end: 2,
            }),
            frameRate: 5,
            repeat: -1,
        });
    }

    loadSnowmanAnimations() {
        this.anims.create({
            key: "snowman-idle",
            frames: this.anims.generateFrameNames("snowman", {
                prefix: "idle_",
                start: 1,
                end: 6,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "snowman-death",
            frames: this.anims.generateFrameNames("snowman", {
                prefix: "death_",
                start: 1,
                end: 5,
            }),
            frameRate: 5,
        });
        this.anims.create({
            key: "snowman-attack",
            frames: this.anims.generateFrameNames("snowman", {
                prefix: "attack_",
                start: 1,
                end: 10,
            }),
            frameRate: 5,
        });
        this.loadSnowballAnimations();
    }

    loadSnowballAnimations() {
        this.anims.create({
            key: "snowball",
            frames: this.anims.generateFrameNames("snowman", {
                prefix: "snowball_",
                start: 1,
                end: 8,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "snowball-reverse",
            frames: this.anims.generateFrameNames("snowman", {
                prefix: "snowball_reverse_",
                start: 1,
                end: 8,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }

    loadYetiAnimations() {
        this.anims.create({
            key: "yeti-idle",
            frames: this.anims.generateFrameNames("yeti", {
                prefix: "idle_",
                start: 1,
                end: 6,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "yeti-death",
            frames: this.anims.generateFrameNames("yeti", {
                prefix: "death_",
                start: 1,
                end: 5,
            }),
            frameRate: 5,
        });
        this.anims.create({
            key: "yeti-smash",
            frames: this.anims.generateFrameNames("yeti", {
                prefix: "smash_",
                start: 1,
                end: 7,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "yeti-walk",
            frames: this.anims.generateFrameNames("yeti", {
                prefix: "walk_",
                start: 1,
                end: 11,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }

    loadCrowAnimations() {
        this.anims.create({
            key: "crow-fly",
            frames: this.anims.generateFrameNames("crow", {
                prefix: "fly_",
                start: 1,
                end: 8,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "crow-struggle",
            frames: this.anims.generateFrameNames("crow", {
                prefix: "struggle_",
                start: 1,
                end: 8,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "crow-confident",
            frames: this.anims.generateFrameNames("crow", {
                prefix: "confident_",
                start: 1,
                end: 8,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "crow-hit",
            frames: this.anims.generateFrameNames("crow", {
                prefix: "hit_",
                start: 1,
                end: 5,
            }),
            frameRate: 5,
        });
    }

    toggleTraining() {
        if (this.routerUrl === "/train") {
            localStorage.setItem("train", JSON.stringify(true));
            // move straight to game
            this.scene.transition({ target: "game", duration: 0 });
        } else {
            localStorage.setItem("train", JSON.stringify(false));
            this.scene.transition({ target: "title", duration: 0 });
        }
    }
}
