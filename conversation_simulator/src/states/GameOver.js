/* The Distance Teaching and Mobile learning licenses this file
to you under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

import Phaser from 'phaser'
import {centerGameObjects} from '../utils'
import PhaserInput from '../libs/phaser-input'
import PhaserJuicy from '../libs/juicy'
import {flags, languages} from '../sprites/Flags'
import config from '../config';
import WebFont from 'webfontloader'

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
