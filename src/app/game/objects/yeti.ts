import GameScene from "../scenes/game-scene";

export default class Yeti extends Phaser.Physics.Arcade.Sprite {
    body: Phaser.Physics.Arcade.Body;
    flip = true;
    scene: GameScene;
    attacking = false;
    dead = false;
    colliders: Array<Phaser.Physics.Arcade.Collider> = [];

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, "yeti");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        group.add(this);
        this.play("yeti-idle", true);
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
                // attack if girl is in striking distance
                const withinStrikingDistance =
                    Math.abs(this.x - this.scene.player.x) <= 100;
                if (!this.attacking && withinStrikingDistance) {
                    this.attacking = true;
                    this.play("yeti-smash", true);
                    setTimeout(() => {
                        this.attacking = false;
                    }, 2000);
                } else if (this.attacking && !withinStrikingDistance) {
                    this.play("yeti-idle", true);
                }
            }
        }
    }

    resize() {
        // first, resize the yeti
        this.body.setSize(this.displayWidth - 10, this.displayHeight - 10);
        // then, reset position of yeti to be touching the ground
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

    die() {
        this.dead = true;
        for (const collider of this.colliders) {
            collider.destroy();
        }
        this.play("yeti-death", true);
        setTimeout(() => {
            this.destroy();
        }, 2000);
    }
}
