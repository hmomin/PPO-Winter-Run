import GameScene from "../scenes/game-scene";

export default abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
    body: Phaser.Physics.Arcade.Body;
    scene: GameScene;
    dead = false;
    flip = true;
    colliders: Array<Phaser.Physics.Arcade.Collider> = [];

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group,
        textureStr: string
    ) {
        super(scene, x, y, textureStr);
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        group.add(this);
        this.setFlipX(this.flip);
        this.enableCollisions();
    }

    enableCollisions() {
        this.enableGroundCollision();
        this.enablePlayerCollision();
        this.enableOtherCollisions();
    }

    enableGroundCollision() {
        this.scene.physics.add.collider(this, this.scene.graphics);
    }

    enablePlayerCollision() {
        this.colliders.push(
            this.scene.physics.add.collider(
                this,
                this.scene.player,
                () => {
                    if (
                        this.scene.player.offensive ||
                        this.scene.player.invulnerable
                    ) {
                        this.die();
                    } else {
                        this.scene.player.loseLife();
                    }
                },
                null,
                this.scene
            )
        );
    }

    enableOtherCollisions() {
        // collision with fireballs, meteors
        for (const g of [this.scene.fireballs, this.scene.meteors]) {
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

    resize() {
        // first, resize enemy
        this.body.setSize(this.displayWidth - 10, this.displayHeight - 10);
        // then, reset its position to be touching the ground
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
        // should be implemented in subclass
    }
}
