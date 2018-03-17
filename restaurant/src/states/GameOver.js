import Phaser from 'phaser'
import {centerGameObjects} from '../utils'
import PhaserInput from '../libs/phaser-input'
import PhaserJuicy from '../libs/juicy'
import {flags, languages} from '../sprites/Flags'
import config from '../config';
import WebFont from 'webfontloader'

// https://phaser.io/docs/2.4.4/Phaser.State.html
export default class extends Phaser.State {
    init() {
        console.log('INIT');
        this.gameOverText = this.add.text(20, this.world.height - 32, '', {
            font: '20px Berkshire Swash',
            fill: '#ffffff'
        });

        let stateDurationSecs = 5;
        this.time.events.add(Phaser.Timer.SECOND * stateDurationSecs, () => {
            this.state.start('Game')
        }, this);

        this.setText('Game Over!');
    } 

    shutdown() {
        game.world.remove(this.loadingText);
    }

    setText(text) {
        this.gameOverText.setText(text);
    }
}
