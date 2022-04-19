import Enemy from "./enemy";
import GameScene from "../scenes/game-scene";
import Snowball from "./snowball";

export default class Snowman extends Enemy {
    attacking = false;
    snowball: Snowball;
    snowballGroup: Phaser.Physics.Arcade.Group;
    shootSnowballFrame = -1;
    idleFrame = -1;
    resetAttackFrame = -1;

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, group, "snowman");
        // initialize snowball group for snowman
        this.snowballGroup = this.scene.physics.add.group({
            allowGravity: false,
            immovable: true,
        });
        this.play("snowman-idle", true);
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
                // do any attacking/snowball updates
                const frame = this.scene.game.getFrame();
                if (frame === this.shootSnowballFrame) {
                    this.snowball = new Snowball(
                        this.scene,
                        this.x,
                        this.y,
                        this.flip,
                        this.snowballGroup
                    );
                } else if (frame === this.idleFrame) {
                    this.play("snowman-idle", true);
                } else if (frame === this.resetAttackFrame) {
                    this.attacking = false;
                }
            }
        }
    }

    shootSnowball() {
        this.play("snowman-attack", true);
        const frame = this.scene.game.getFrame();
        this.shootSnowballFrame = frame + 1.6 * 60;
        this.idleFrame = frame + 2.6 * 60;
        this.resetAttackFrame = frame + 6.6 * 60;
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
