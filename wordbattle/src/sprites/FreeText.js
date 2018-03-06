/**
 * Created by Jabito on 27/02/2018.
 */
import Phaser from 'phaser'

export default class extends Phaser.Sprite {
    constructor({game, x, y, text, cloudEnabled}) {
        super(game, x, y, 'cloud');
        this.game = game;
        this.x = x;
        this.y = y;
        this.origX = x;
        this.origY = y;
        this.alpha = 0;
        this.text = game.add.text(x,y, text, {font: "45px Berkshire Swash", fill: "#ff0044", align: "center"});
        this.text.anchor.setTo(0.5);
        this.text.alpha = 0;
        // this.addChild(this.text);
        this.anchor.setTo(0.5);
        this.game.stage.addChild(this);
        this.game.stage.addChild(this.text);
    }

    update(){
        this.text.y = this.y;
        this.width = this.text.width * 1.8;
    }

    display() {
        this.alpha = 1;
        this.text.alpha = 1;
    }

    hide() {
        this.alpha = 0;
        this.text.alpha = 0;
    }

    changeText(word) {
        this.text.text = this.properCase(word);
    }

    showTick() {
        this.display();
        var tween = game.add.tween(this).to({
            y: this.origY - 200
        }, 1500, Phaser.Easing.Linear.Out, true);
        tween.onComplete.add(() => {
            this.hide();
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