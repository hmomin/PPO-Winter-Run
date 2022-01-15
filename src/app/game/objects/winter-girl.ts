import Fireball from "./fireball";
import GameScene from "../scenes/game-scene";

export default class WinterGirl extends Phaser.Physics.Arcade.Sprite {
    debug = false;
    body: Phaser.Physics.Arcade.Body;
    scene: GameScene;
    numLives: integer = 0;
    numMallets: integer = 0;
    numFireballs: integer = 0;
    numSilverKeys: integer = 0;
    numGoldKeys: integer = 0;
    // player is walking by default until they get an apple
    running = false;
    // true if player is on the offensive (she's got a mallet swinging)
    offensive = false;
    malletFinished = true;
    // true if player just shot a fireball
    justShotFireball = false;
    // player is invulnerable right after getting hit
    invulnerable = false;

    constructor(scene: GameScene, x: number, y: number) {
        super(scene, x, y, "player");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        this.body.setCollideWorldBounds(true, 0, 0);
        this.body.onWorldBounds = true;
    }

    update() {
        this.updateMalletStatus();
        this.updateFireballStatus();
        this.updateArrowKeyStatus();
        this.orientAndResize();
    }

    updateMalletStatus() {
        if (
            this.numMallets > 0 &&
            this.scene.malletKey.isDown &&
            !this.offensive
        ) {
            this.offensive = true;
            this.malletFinished = false;
            this.numMallets--;
            setTimeout(() => {
                this.offensive = false;
            }, 1000);
            this.play("girl-mallet", true);
        } else if (this.offensive) {
            this.play("girl-mallet", true);
        } else if (!this.offensive && !this.malletFinished) {
            this.play("girl-idle", true);
            this.malletFinished = true;
        }
    }

    updateFireballStatus() {
        if (
            this.numFireballs > 0 &&
            this.scene.fireballKey.isDown &&
            !this.justShotFireball
        ) {
            this.justShotFireball = true;
            this.numFireballs--;
            // shoot the fireball
            new Fireball(this.scene, this.scene.fireballs);
            setTimeout(() => {
                this.justShotFireball = false;
            }, 1000);
            this.play("girl-throw", true);
        } else if (this.justShotFireball) {
            this.play("girl-throw", true);
        }
    }

    updateArrowKeyStatus() {
        // left / right movements
        if (this.scene.cursors.left.isDown || this.scene.cursors.right.isDown) {
            const multiplier = this.scene.cursors.right.isDown ? 1 : -1;
            if (this.running) {
                const fastSpeed = this.debug ? 750 : 400;
                this.setVelocityX(multiplier * fastSpeed);
                if (this.body.onFloor() && this.isPassive()) {
                    this.play("girl-roll", true);
                }
            } else {
                const slowSpeed = this.debug ? 750 : 250;
                this.setVelocityX(multiplier * slowSpeed);
                if (this.body.onFloor() && this.isPassive()) {
                    this.play("girl-walk", true);
                }
            }
        } else {
            // if no keys are pressed, the player keeps still
            this.setVelocityX(0);
            // only show the idle animation if the player is footed
            // if this is not included, the player would look idle while jumping
            if (this.body.onFloor() && this.isPassive()) {
                this.play("girl-idle", true);
            }
        }

        // jump while pressing the space bar or the 'UP' arrow
        if (
            (this.scene.cursors.space.isDown || this.scene.cursors.up.isDown) &&
            this.body.onFloor()
        ) {
            this.jump();
        }
    }

    orientAndResize() {
        // orient
        if (this.body.velocity.x > 0) {
            this.setFlipX(false);
        } else if (this.body.velocity.x < 0) {
            this.setFlipX(true);
        }
        // resize
        this.body.setSize(this.displayWidth, this.displayHeight);
    }

    loseLife() {
        if (this.numLives > 0 && !this.invulnerable) {
            this.invulnerable = true;
            this.play("girl-hit", true);
            this.numLives--;
            this.running = false;
            this.blink();
            setTimeout(() => {
                this.invulnerable = false;
            }, 2000);
        } else if (!this.invulnerable) {
            if (this.debug) {
                console.log("Game Over disabled (debug mode)");
            } else {
                this.scene.gameOver = true;
            }
        }
    }

    blink() {
        this.setAlpha(0);
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 200,
            ease: "Linear",
            repeat: 10,
        });
    }

    isPassive(): boolean {
        return !this.offensive && !this.justShotFireball;
    }

    withinLevelBounds(): boolean {
        return this.x > 64 && this.x < 8608 - 64 && this.y > 64;
    }

    jump() {
        this.setVelocityY(-this.scene.girlYSpeed);
        this.running
            ? this.play("girl-spin", true)
            : this.play("girl-jump", true);
    }
}
