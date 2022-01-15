import GameScene from "../scenes/game-scene";

export default class Snowball extends Phaser.Physics.Arcade.Sprite {
    scene: GameScene;
    movingRight: boolean;
    multiplier: integer;
    maxX: number;
    ogX: number;

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        flip: boolean,
        physicsGroup: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, "snowball");
        this.ogX = x;
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        physicsGroup.add(this);
        this.body.setCircle(17);
        this.movingRight = !flip;
        this.multiplier = this.movingRight ? 1 : -1;
        this.body.velocity.x = this.multiplier * 300;
        if (this.movingRight) {
            this.play("snowball", true);
            this.maxX = this.ogX + this.scene.cam.width;
        } else {
            this.play("snowball-reverse", true);
            this.maxX = this.ogX - this.scene.cam.width;
        }
        this.enableCollision();
    }

    enableCollision() {
        // collision with player
        this.scene.physics.add.overlap(
            this,
            this.scene.player,
            () => {
                this.scene.player.loseLife();
            },
            null,
            this.scene
        );
    }

    update() {
        const goneTooFar =
            (this.movingRight && this.x > this.maxX) ||
            (!this.movingRight && this.x < this.maxX);
        if (goneTooFar) {
            this.destroy();
        }
    }
}
