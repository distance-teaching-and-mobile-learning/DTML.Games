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
        this.gameOverText = this.add.text(this.world.width / 2, this.world.height / 2, '', {
            font: '20px Berkshire Swash',
            fill: '#ffffff'
        });

        /*
        const stateDurationSecs = 10;
        this.time.events.add(Phaser.Timer.SECOND * stateDurationSecs, () => {
            this.nextState();
        }, this);*/

        this.setText(`Example Results Screen (temp - click or tap to continue) - ${customParam}`);
    } 

    shutdown() {
        game.world.remove(this.loadingText);
    }

    setText(text) {
        this.gameOverText.setText(text);
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
