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
import config from '../config';
import WebFont from 'webfontloader'
import Spriter from '../libs/spriter'
import {dtml} from '../dtml-sdk'

export default class extends Phaser.State {
    init(customParam) {
        this.game.stage.backgroundColor = "#00B3C1";
        this.gameover = this.game.add.sprite(0, 0, 'gameover');
        this.gameover.width = this.game.width;
        this.gameover.height = this.game.height;
        this.setText(customParam);
    }

    shutdown() {
        game.world.remove(this.loadingText);
    }

    setText(text) {
        console.log(text);
        dtml.recordGameEnd("halloween",text);
        let label = this.game.add.text(this.game.width*0.5, this.game.height*0.58, text, {
            font: "100px Berkshire Swash",
            fill: "#000",
            align: "center",
			wordWrap: true, 
			wordWrapWidth: 800
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
        this.state.start('Splash', true, false);
    }
}