import GameScene from "../scenes/game-scene";

export default class Meteor extends Phaser.Physics.Arcade.Sprite {
    scene: GameScene;

    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, x, y, "meteor");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        // have to rotate the meteor, so that it points downwards while falling from the
        // sky
        this.rotation = Math.PI / 2;
        group.add(this);
        this.play("meteor", true);
        this.body.setSize(this.displayHeight, this.displayWidth);
        this.setScale(0.25, 0.25);
        this.setVelocityY(200);
    }

    update() {
        const offScreen = this.y > 500;
        const collided = this.body && this.body.velocity.y === 0;
        if (offScreen || collided) {
            this.destroy();
        }
    }
}
