import Enemy from "./enemy";
import GameScene from "../scenes/game-scene";

export default class Crow extends Enemy {
    moving = false;

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, group, "crow");
        this.setScale(0.9);
        this.play("crow-confident", true);
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
