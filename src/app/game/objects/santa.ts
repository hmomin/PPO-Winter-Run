import GameScene from "../scenes/game-scene";
import Helper from "./helper";

export default class Santa extends Helper {
    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, "santa", x, y, 10, group);
    }
}
