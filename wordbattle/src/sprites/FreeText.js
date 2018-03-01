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

    display() {
        this.alpha = 1;
    }

    hide() {
        this.alpha = 0;
    }

    changeText(word) {
        this.text = this.properCase(word);
    }

    showTick() {
        this.alpha = 1;
        var tween = game.add.tween(this).to({
            y: this.origY - 200
        }, 1500, Phaser.Easing.Linear.Out, true);
        tween.onComplete.add(() => {
            this.alpha = 0;
            this.y = this.origY;
        });
    }

    properCase(word) {
        let arrayOfWords = word.split(' ');
        var returnProperCase = '';

        for (var x = 0; x < arrayOfWords.length; x++) {
            returnProperCase += arrayOfWords[x].charAt(0).toUpperCase() + arrayOfWords[x].slice(1) + ' ';
        }

        return returnProperCase;
    }
}