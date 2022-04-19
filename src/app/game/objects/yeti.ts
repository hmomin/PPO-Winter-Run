import Enemy from "./enemy";
import GameScene from "../scenes/game-scene";

export default class Yeti extends Enemy {
    attacking = false;
    resetAttackFrame = -1;

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, group, "yeti");
        this.play("yeti-idle", true);
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
                    this.resetAttackFrame = this.scene.game.getFrame() + 2 * 60;
                } else if (this.attacking && !withinStrikingDistance) {
                    this.play("yeti-idle", true);
                }
                if (this.scene.game.getFrame() === this.resetAttackFrame) {
                    this.attacking = false;
                }
            }
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
