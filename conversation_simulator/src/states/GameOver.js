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
import jQuery from 'jquery'

export default class extends Phaser.State {
    init(customParam) {
         this.phaserJSON = this.cache.getJSON('gameSetup');	
	 this.game.stage.backgroundColor = "#00B3C1";
         let gameover = game.add.sprite(game.world.centerX, game.world.centerY, 'gameover');
         gameover.anchor.set(0.5);
         this.setText(customParam);
         jQuery.post("https://dtml.org/api/UserService/User", { activity: this.phaserJSON.gameid, time: "",  eventType: "GameCompleted", eventData: customParam } );
    }

    shutdown() {
        game.world.remove(this.loadingText);
    }

     create() {
        this.spritesGroup = this.add.group();
        this.cook = this.loadSpriter('wizard');
        this.cook.x = 240 * game.scaleRatio;
        this.cook.y = this.world.height - 470;
        this.spritesGroup.add(this.cook);
        this.cook.playAnimationByName('_IDLE');

        this.customer = this.loadSpriter('gnome');

        this.customer.scale.x *= -1;
        this.customer.children.forEach(sprite => {
            sprite.anchor.set(0, 1);
        });

        this.customer.x = game.width - 260 * game.scaleRatio;
        this.customer.startx = this.world.width * 0.75 * game.scaleRatio;
        this.customer.y = this.world.height - 460;
        this.customer.setAnimationSpeedPercent(100);
        this.customer.playAnimationByName('_IDLE');
        this.spritesGroup.add(this.customer);
     }


    loadSpriter(key) {
        if (!this.spriterLoader) this.spriterLoader = new Spriter.Loader();

        let spriterFile = new Spriter.SpriterXml(game.cache.getXML(key + 'Animations'));

        // process loaded xml/json and create internal Spriter objects - these data can be used repeatly for many instances of the same animation
        let spriter = this.spriterLoader.load(spriterFile);

        return new Spriter.SpriterGroup(game, spriter, key, key);
    }

    setText(text) {
        let label = this.game.add.text(game.world.centerX, game.world.centerY + 80, text, {
            font: "100px Berkshire Swash",
            fill: "#000",
            align: "center",
			wordWrap: true, 
			wordWrapWidth: 800
			});
			
			label.anchor.setTo(0.5);
    }

    update() {
        this.cook.updateAnimation();
        this.customer.updateAnimation();
        if (game.input.activePointer.isDown)
        {
            this.nextState();
        }
    }

    nextState() {
        this.state.start('Game');
    }
}
