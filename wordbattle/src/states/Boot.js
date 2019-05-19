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
import WebFont from 'webfontloader'
import config from '../config';

export default class extends Phaser.State {
    init() {
        if (!this.game.device.desktop) {
            this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.game.scale.minWidth = 300;
            this.game.scale.minHeight = 100;
            this.game.scale.maxWidth = window.innerWidth * 2;
            this.game.scale.maxHeight = window.innerHeight * 2;
        }

        this.scale.pageAlignHorizontally = false;
        this.scale.pageAlignVertically = true;

        this.scale.forceOrientation(true, false);
        this.scale.refresh(true);
    }

    preload() {
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.maxHeight = window.innerHeight;
        this.game.scale.maxWidth = window.innerHeight * (this.game.world.width/ this.game.world.height);
        // let text = this.add.text(this.world.centerX, this.world.centerY, 'loading fonts', { font: '16px Arial', fill: '#dddddd', align: 'center' })
        // text.anchor.setTo(0.5, 0.5)
        console.log('starting')
        this.load.image('loaderBg', './assets/images/logobackground.png')
        this.load.image('loaderBar', './assets/images/loading-logo.png')

        let scale_ratio;
        let canvas_height_max = 900;
        let canvas_width_max = 1140;
        let width = game.width;//window.screen.availWidth * window.devicePixelRatio
        let height = game.height;//window.screen.availHeight * window.devicePixelRatio
        game.aspectRatio = width / height;
        game.scaleRatio = game.width / canvas_width_max;

        console.log('game dimension: ', game.width, 'x', game.height, 'height * scaleRatio', game.height * game.scaleRatio)
        if (game.aspectRatio < 1) {
            game.scale.setGameSize(game.width, game.height * game.scaleRatio)
        } else {
            game.scale.setGameSize(game.width, game.height)
        }

        game.canvas.oncontextmenu = function (e) {
            e.preventDefault();
        }
    }

    render() {
        this.state.start('Splash')
    }
}
