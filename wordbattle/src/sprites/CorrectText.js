/**
 * Created by Jabito on 27/02/2018.
 */
import Phaser from 'phaser'

export default class extends Phaser.Text {
    constructor({game, x, y, text}) {
        super(game, x, y, text, {font: "45px Arial", fill: "#ff0044", align: "center"});
        this.game = game;
        this.x = x;
        this.y = y;
        this.origX = x;
        this.origY = y;
        this.alpha = 0;
        this.anchor.setTo(0.5);
        this.game.stage.addChild(this);
    }

    changeText(word){
        this.text = word;
    }

    showTick() {
        this.alpha = 1;
        var tween = game.add.tween(this).to({
            y: this.origY - 200
        }, 1650, Phaser.Easing.Linear.Out, true);
        tween.onComplete.add(() => {
            this.alpha = 0;
            this.y = this.origY;
        });
    }
}