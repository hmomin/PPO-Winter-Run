import GameScene from "../scenes/game-scene";
import Snowball from "./snowball";

export default class Snowman extends Phaser.Physics.Arcade.Sprite {
    body: Phaser.Physics.Arcade.Body;
    flip = true;
    scene: GameScene;
    attacking = false;
    dead = false;
    colliders: Array<Phaser.Physics.Arcade.Collider> = [];
    snowball: Snowball;
    snowballGroup: Phaser.Physics.Arcade.Group;

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, "snowman");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        group.add(this);
        // initialize snowball group for snowman
        this.snowballGroup = this.scene.physics.add.group({
            allowGravity: false,
            immovable: true,
        });
        this.play("snowman-idle", true);
        this.setFlipX(this.flip);
        this.enableCollisions();
    }

    enableCollisions() {
        // collision with ground
        this.scene.physics.add.collider(this, this.scene.graphics);
        // collision with player
        this.colliders.push(
            this.scene.physics.add.collider(
                this,
                this.scene.player,
                () => {
                    if (this.scene.player.offensive) {
                        this.die();
                    } else {
                        this.scene.player.loseLife();
                    }
                },
                null,
                this.scene
            )
        );
        // collision with fireballs, meteors, ice mages, santas
        for (const g of [
            this.scene.fireballs,
            this.scene.meteors,
            this.scene.helpers,
        ]) {
            this.colliders.push(
                this.scene.physics.add.collider(
                    this,
                    g,
                    () => {
                        this.die();
                    },
                    null,
                    this.scene
                )
            );
        }
    }

    update() {
        if (this.body) {
            this.resize();
            this.toggleFlip();
            if (!this.dead) {
                // attack if girl is in hitting distance
                const withinHittingDistance =
                    Math.abs(this.x - this.scene.player.x) <= 500;
                if (!this.attacking && withinHittingDistance) {
                    this.attacking = true;
                    this.shootSnowball();
                }
                // update snowball if it exists
                if (this.snowball) {
                    this.snowball.update();
                }
            }
        }
    }

    resize() {
        // first, resize the snowman
        this.body.setSize(this.displayWidth - 10, this.displayHeight - 10);
        // then, reset position of the snowman to be touching the ground
        this.y = Math.floor(
            this.scene.cam.height -
                this.scene.tileset.tileHeight -
                (this.displayHeight - 10) / 2
        );
    }

    toggleFlip() {
        // flip based on whether or not the girl is in front or behind
        this.flip = this.x >= this.scene.player.x;
        if (this.flip !== this.flipX) {
            this.toggleFlipX();
        }
    }

    shootSnowball() {
        this.play("snowman-attack", true);
        setTimeout(() => {
            // need try-catch blocks, because sometimes the scene will restart while the
            // Snowman object is still active
            try {
                // first, create a snowball
                if (!this.dead) {
                    this.snowball = new Snowball(
                        this.scene,
                        this.x,
                        this.y,
                        this.flip,
                        this.snowballGroup
                    );
                }
            } catch (err) {}
            // after 1 second, bring the snowman back to normal
            setTimeout(() => {
                try {
                    if (!this.dead) {
                        this.play("snowman-idle", true);
                    }
                } catch (err) {}
            }, 1000);
            // after 5 seconds, get ready to attack again
            setTimeout(() => {
                try {
                    if (!this.dead) {
                        this.attacking = false;
                    }
                } catch (err) {}
            }, 5000);
        }, 1600);
    }

    die() {
        this.dead = true;
        // first, destroy the snowball and remove the collider
        if (this.snowball) {
            this.snowball.destroy();
        }
        for (const collider of this.colliders) {
            collider.destroy();
        }
        // animate snowman dying
        this.play("snowman-death", true);
        setTimeout(() => {
            this.destroy();
        }, 2000);
    }
}
