export default class GameText {
    textElement: HTMLElement;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        text: string,
        color: string = "black",
        fontSize: number = 20
    ) {
        this.textElement = document.createElement("div");
        this.textElement.style.fontFamily = "arial";
        this.setParent(scene);
        this.setPosition(x, y);
        this.setText(text);
        this.setColor(color);
        this.setFontSize(fontSize);
        this.makeVisible();
    }

    setParent(scene: Phaser.Scene) {
        const gameDiv = scene.game.domContainer;
        gameDiv.appendChild(this.textElement);
    }

    setPosition(x: number, y: number) {
        this.textElement.style.position = "absolute";
        this.textElement.style.left = x + "px";
        this.textElement.style.top = y + "px";
    }

    setText(text: string) {
        this.textElement.innerHTML = text;
    }

    setColor(colorStr: string) {
        this.textElement.style.color = colorStr;
    }

    makeVisible() {
        this.textElement.style.display = "block";
    }

    makeInvisible() {
        this.textElement.style.display = "none";
    }

    centerHorizontally() {
        this.textElement.style.left = "50%";
        this.textElement.style.transform = "translateX(-50%)";
    }

    centerVertically() {
        this.textElement.style.top = "50%";
        this.textElement.style.transform = "translateY(-50%)";
    }

    centerAll() {
        this.textElement.style.top = "50%";
        this.textElement.style.left = "50%";
        this.textElement.style.transform = "translate(-50%, -50%)";
    }

    setFontSize(size: number) {
        this.textElement.style.fontSize = size + "px";
    }
}
