import GameScene from "../scenes/game-scene";
import Helper from "./helper";

export default class IceMage extends Helper {
    constructor(
        scene: GameScene,
        x: number,
        y: number,
        group: Phaser.Physics.Arcade.Group
    ) {
        super(scene, "ice-mage", x, y, group);
    }
}
