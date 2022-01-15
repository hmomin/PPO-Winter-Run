import GameScene from "../scenes/game-scene";

export default class Crow extends Phaser.Physics.Arcade.Sprite {
    body: Phaser.Physics.Arcade.Body;
    scene: GameScene;
    dead = false;
    moving = false;
    colliders: Array<Phaser.Physics.Arcade.Collider> = [];

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, "crow");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        group.add(this);
        this.setScale(0.9);
        this.play("crow-confident", true);
        this.setFlipX(true);
        this.enableCollisions();
    }

    enableCollisions() {
        // collision with ground
        this.colliders.push(
            this.scene.physics.add.collider(this, this.scene.graphics)
        );
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
            // resize
            this.body.setSize(this.displayWidth - 10, this.displayHeight - 10);
            if (!this.dead) {
                // start moving if bird enters camera view
                const enteredCameraView =
                    this.x - this.scene.player.x < this.scene.cam.width;
                if (enteredCameraView && !this.moving) {
                    this.moving = true;
                    this.setVelocityX(-200);
                }
            }
        }
        if (this.x < 0) {
            this.destroy();
        }
    }

    die() {
        this.dead = true;
        for (const collider of this.colliders) {
            collider.destroy();
        }
        this.play("crow-hit", true);
        this.setVelocityX(0);
        this.setVelocityY(200);
        setTimeout(() => {
            this.destroy();
        }, 2000);
    }
}
