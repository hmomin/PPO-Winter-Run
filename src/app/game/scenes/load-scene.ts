export default class LoadScene extends Phaser.Scene {
    routerUrl: string;
    loadingBar: Phaser.GameObjects.Graphics;
    loadingText: Phaser.GameObjects.Text;
    assetText: Phaser.GameObjects.Text;

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
        this.loadFriends();
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
        this.load.audio(
            "music",
            "https://d1w49crlcpe45.cloudfront.net/audio/winter-run-music.mp3"
        );
    }

    loadBackgroundImages() {
        this.load.image(
            "background_1",
            "https://d1w49crlcpe45.cloudfront.net/background-images/background_1.png"
        );
        this.load.image(
            "background_2",
            "https://d1w49crlcpe45.cloudfront.net/background-images/background_2.png"
        );
    }

    loadTextImages() {
        this.load.image(
            "logo",
            "https://d1w49crlcpe45.cloudfront.net/title-images/winter-run-logo.png"
        );
        this.load.image(
            "play",
            "https://d1w49crlcpe45.cloudfront.net/title-images/play.png"
        );
        this.load.image(
            "autoplay",
            "https://d1w49crlcpe45.cloudfront.net/title-images/autoplay.png"
        );
        this.load.image(
            "music-on",
            "https://d1w49crlcpe45.cloudfront.net/title-images/music-on.png"
        );
        this.load.image(
            "music-off",
            "https://d1w49crlcpe45.cloudfront.net/title-images/music-off.png"
        );
    }

    loadTiles() {
        // load tilesheet
        this.load.image(
            "tilesheet",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/tilesheet.png"
        );
        // load tilemap
        this.load.tilemapTiledJSON(
            "map1",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/level1.json"
        );
        this.loadTilemapImages();
    }

    loadTilemapImages() {
        this.load.image(
            "apple",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/apple.png"
        );
        this.load.image(
            "bonus-block",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/bonus-block.png"
        );
        this.load.image(
            "bush",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/bush.png"
        );
        this.load.image(
            "coin",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/coin.png"
        );
        this.load.image(
            "death-sign",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/death-sign.png"
        );
        this.load.image(
            "diamond",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/diamond.png"
        );
        this.load.image(
            "exclam-sign",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/exclam-sign.png"
        );
        this.load.image(
            "fence",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/fence.png"
        );
        this.load.image(
            "gold-chest",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/gold-chest.png"
        );
        this.load.image(
            "gold-key",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/gold-key.png"
        );
        this.load.image(
            "heart",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/heart.png"
        );
        this.load.image(
            "question-sign",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/question-sign.png"
        );
        this.load.image(
            "right-sign",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/right-sign.png"
        );
        this.load.image(
            "shrub",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/shrub.png"
        );
        this.load.image(
            "silver-chest",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/silver-chest.png"
        );
        this.load.image(
            "silver-key",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/silver-key.png"
        );
        this.load.image(
            "spike",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/spike.png"
        );
        this.load.image(
            "star",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/star.png"
        );
        this.load.image(
            "top-right-sign",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/top-right-sign.png"
        );
        this.load.image(
            "snowman-top-left",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/snowman-top-left.png"
        );
        this.load.image(
            "snowman-bottom-left",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/snowman-bottom-left.png"
        );
        this.load.image(
            "snowman-top-right",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/snowman-top-right.png"
        );
        this.load.image(
            "snowman-bottom-right",
            "https://d1w49crlcpe45.cloudfront.net/tilemap/images/snowman-bottom-right.png"
        );
    }

    loadWinterGirl() {
        this.load.atlas(
            "player",
            "https://d1w49crlcpe45.cloudfront.net/sprites/winter-girl-spritesheet.png",
            "https://d1w49crlcpe45.cloudfront.net/sprites/winter-girl-atlas.json"
        );
        // load attack winter girl
        this.load.atlas(
            "player-attack",
            "https://d1w49crlcpe45.cloudfront.net/sprites/winter-girl-attack-spritesheet.png",
            "https://d1w49crlcpe45.cloudfront.net/sprites/winter-girl-attack-atlas.json"
        );
    }

    loadExplosions() {
        this.load.atlas(
            "explosion",
            "https://d1w49crlcpe45.cloudfront.net/sprites/explosion-spritesheet.png",
            "https://d1w49crlcpe45.cloudfront.net/sprites/explosion-atlas.json"
        );
    }

    loadFriends() {
        // load santa
        this.load.atlas(
            "santa",
            "https://d1w49crlcpe45.cloudfront.net/sprites/santa-spritesheet.png",
            "https://d1w49crlcpe45.cloudfront.net/sprites/santa-atlas.json"
        );
        // load ice-mage
        this.load.atlas(
            "ice-mage",
            "https://d1w49crlcpe45.cloudfront.net/sprites/ice-mage-spritesheet.png",
            "https://d1w49crlcpe45.cloudfront.net/sprites/ice-mage-atlas.json"
        );
    }

    loadEnemies() {
        // load yeti
        this.load.atlas(
            "yeti",
            "https://d1w49crlcpe45.cloudfront.net/sprites/yeti-spritesheet.png",
            "https://d1w49crlcpe45.cloudfront.net/sprites/yeti-atlas.json"
        );
        // load snowman
        this.load.atlas(
            "snowman",
            "https://d1w49crlcpe45.cloudfront.net/sprites/snowman-spritesheet.png",
            "https://d1w49crlcpe45.cloudfront.net/sprites/snowman-atlas.json"
        );

        // load crow
        this.load.atlas(
            "crow",
            "https://d1w49crlcpe45.cloudfront.net/sprites/crow-spritesheet.png",
            "https://d1w49crlcpe45.cloudfront.net/sprites/crow-atlas.json"
        );
    }

    loadAnimations() {
        this.loadGirlAnimations();
        this.loadFireAnimations();
        this.loadSantaAnimations();
        this.loadIceMageAnimations();
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
        // fireball animations
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
        // meteor animations
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

    loadSantaAnimations() {
        this.anims.create({
            key: "santa-idle",
            frames: this.anims.generateFrameNames("santa", {
                prefix: "idle_",
                start: 1,
                end: 5,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "santa-walk",
            frames: this.anims.generateFrameNames("santa", {
                prefix: "walk_",
                start: 1,
                end: 9,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "santa-death",
            frames: this.anims.generateFrameNames("santa", {
                prefix: "death_",
                start: 1,
                end: 8,
            }),
            frameRate: 10,
        });
        this.anims.create({
            key: "santa-brace",
            frames: this.anims.generateFrameNames("santa", {
                prefix: "brace_",
                start: 1,
                end: 3,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "santa-skip",
            frames: this.anims.generateFrameNames("santa", {
                prefix: "skip_",
                start: 1,
                end: 7,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "santa-jump",
            frames: this.anims.generateFrameNames("santa", {
                prefix: "jump_",
                start: 1,
                end: 5,
            }),
            frameRate: 5,
            repeat: -1,
        });
    }

    loadIceMageAnimations() {
        this.anims.create({
            key: "ice-mage-idle",
            frames: this.anims.generateFrameNames("ice-mage", {
                prefix: "idle_",
                start: 1,
                end: 6,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "ice-mage-death",
            frames: this.anims.generateFrameNames("ice-mage", {
                prefix: "death_",
                start: 1,
                end: 5,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "ice-mage-strike",
            frames: this.anims.generateFrameNames("ice-mage", {
                prefix: "strike_",
                start: 1,
                end: 7,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "ice-mage-shoot",
            frames: this.anims.generateFrameNames("ice-mage", {
                prefix: "shoot_",
                start: 1,
                end: 4,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "crystal",
            frames: this.anims.generateFrameNames("ice-mage", {
                prefix: "crystal_",
                start: 1,
                end: 5,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "ice-mage-walk",
            frames: this.anims.generateFrameNames("ice-mage", {
                prefix: "walk_",
                start: 1,
                end: 6,
            }),
            frameRate: 5,
            repeat: -1,
        });
        this.anims.create({
            key: "ice-mage-run",
            frames: this.anims.generateFrameNames("ice-mage", {
                prefix: "run_",
                start: 1,
                end: 11,
            }),
            frameRate: 10,
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
        // train or don't train?
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
