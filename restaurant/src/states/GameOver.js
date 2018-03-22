import Phaser from 'phaser'
import {centerGameObjects} from '../utils'
import PhaserInput from '../libs/phaser-input'
import PhaserJuicy from '../libs/juicy'
import {flags, languages} from '../sprites/Flags'
import config from '../config';
import WebFont from 'webfontloader'

// https://phaser.io/docs/2.4.4/Phaser.State.html
export default class extends Phaser.State {
    init(customParam) {
        		
		this.game.stage.backgroundColor = "#00B3C1";
	    let gameover = game.add.sprite(game.world.centerX, game.world.centerY, 'gameover');
        gameover.anchor.set(0.5);
		
        this.setText('Your Score:' + customParam);
    }

    shutdown() {
        game.world.remove(this.loadingText);
    }

    setText(text) {
        let label = this.game.add.text(game.world.centerX, game.world.centerY - 240, text, {
            font: "60px Berkshire Swash",
            fill: "#000",
            align: "center",
			wordWrap: true, 
			wordWrapWidth: 500
			});
			
			label.anchor.setTo(0.5);
    }

    update() {
        if (game.input.activePointer.isDown)
        {
            this.nextState();
        }
    }

    nextState() {
        this.state.start('Game');
    }
}
