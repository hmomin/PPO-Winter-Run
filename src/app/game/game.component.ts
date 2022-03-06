import { Component, OnInit, OnDestroy } from "@angular/core";
import TitleScene from "./scenes/title-scene";
import LoadScene from "./scenes/load-scene";
import GameScene from "./scenes/game-scene";
import Phaser from "phaser";

@Component({
    selector: "app-game",
    template: "",
})
export class GameComponent implements OnInit, OnDestroy {
    game: Phaser.Game;
    config: Phaser.Types.Core.GameConfig;
    constructor() {
        this.config = {
            dom: {
                createContainer: true,
            },
            type: Phaser.CANVAS,
            width: 800,
            height: 480,
            scale: {
                autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
            },
            parent: "winter-run-game",
            physics: {
                default: "arcade",
                arcade: {
                    gravity: { y: 500 },
                    debug: false,
                },
            },
        };
    }

    ngOnInit() {
        this.game = new Phaser.Game(this.config);
        this.game.scene.add("load", LoadScene);
        this.game.scene.add("title", TitleScene);
        this.game.scene.add("game", GameScene);
        // start loading game
        this.game.scene.start("load");
    }

    ngOnDestroy() {
        // destroy game
        this.game.destroy(true, false);
    }
}
