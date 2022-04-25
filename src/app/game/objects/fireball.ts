import GameScene from "../scenes/game-scene";

export default class Fireball extends Phaser.Physics.Arcade.Sprite {
    scene: GameScene;
    movingRight: boolean;
    initialVelocity: number;
    multiplier: integer;
    maxX: number;

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        physicsGroup: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, "fireball");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        physicsGroup.add(this);
        this.play("fireball", true);
        this.movingRight = !scene.player.flipX;
        this.multiplier = this.movingRight ? 1 : -1;
        this.initialVelocity = this.multiplier * 350;
        this.body.velocity.x = this.initialVelocity;
        this.maxX = this.movingRight
            ? this.scene.player.x + 700
            : this.scene.player.x - 700;
        this.setScale(0.25, 0.25);
        this.body.setCircle(40);
    }

    update() {
        const outOfBounds =
            (this.movingRight && this.x > this.maxX) ||
            (!this.movingRight && this.x < this.maxX);
        const collided =
            this.body && this.body.velocity.x !== this.initialVelocity;
        if (outOfBounds || collided) {
            this.destroy();
        }
    }
}
