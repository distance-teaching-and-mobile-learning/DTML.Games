import Phaser from 'phaser'

export default class Person extends Phaser.Button{
    constructor(game,x,y, func, text,btnScale, txtScale){
        super(game,x,y, 'sharebtn', func);
        this.anchor.setTo(0.5);
        console.log(game.aspectRatio);
        this.scale.setTo(btnScale * game.aspectRatio);
        this.game = game;
        this.text = text;

        var font = this.game.add.text(0, 0, text, {
            font: "12px sans-serif", fill: "#ffffff", stroke: "#000000", strokeThickness: "6"
        });
        font.scale.setTo(txtScale);
        font.anchor.setTo(0.5);

        this.addChild(font);

        this.game.add.existing(this);
        return this;
    }
}