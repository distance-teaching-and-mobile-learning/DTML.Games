export default class extends Phaser.Sprite {
    constructor({game, x, y, asset}) {
        super(game, x, y, asset);
        this.anchor.setTo(0.5);
        this.alpha = 0;
    }

    highlightFlag(flag){
        this.alpha = 1;
        this.x = flag.parent.x + flag.x;
        this.y = flag.parent.y + flag.y;
        this.width = flag.width * 1.3;
        this.height = flag.height * 1.25;
    }

    removeHighlight(){
        this.alpha = 0;
    }

    update() {
    }
}
