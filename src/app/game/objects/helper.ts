import GameScene from "../scenes/game-scene";

export default class Helper extends Phaser.Physics.Arcade.Sprite {
    body: Phaser.Physics.Arcade.Body;
    scene: GameScene;
    nameStr: string;
    hitFloor = false;
    dead = false;

    constructor(
        scene: GameScene,
        nameStr: string,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, nameStr);
        this.scene = scene;
        this.nameStr = nameStr;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        group.add(this);
        this.enableCollisions();
    }

    enableCollisions() {
        // collision with ground
        this.scene.physics.add.collider(this, this.scene.graphics);
    }

    update() {
        // move forward once we touch land
        if (!this.hitFloor) {
            if (!this.body.onFloor()) {
                this.play(this.nameStr + "-idle", true);
            } else {
                this.hitFloor = true;
                this.setVelocityX(200);
                this.play(this.nameStr + "-walk", true);
            }
        }
        if (this.body) {
            this.body.setSize(this.displayWidth, (9 / 10) * this.displayHeight);
            // the helper should die if it falls
            if (this.body.y > 500) {
                this.die();
            }
        }
    }

    die() {
        this.dead = true;
        this.setVelocityX(0);
        this.play(this.nameStr + "-death", true);
        setTimeout(() => {
            this.destroy();
        }, 2000);
    }
}
