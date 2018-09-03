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
import { centerGameObjects } from '../utils'
import PhaserInput from '../libs/phaser-input'
import PhaserJuicy from '../libs/juicy'
import config from '../config';
import WebFont from 'webfontloader'

export default class extends Phaser.State {
    init() {

    }

    preload() {
        //this.load.json('gameSetup', 'assets/data/gameSetup.json');
            //this.stateMachine = new StateMachine(this.game.cache.getJSON('gameSetup'));
           // this.stateMachine.printDebugInfo();
        var phaserJSON = this.cache.getJSON('gameSetup');
        //console.log(phaserJSON.name);

        //this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBg')
        this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBar')
        centerGameObjects([this.loaderBar])

        this.load.setPreloadSprite(this.loaderBar)

        this.load.onLoadStart.add(this.loadStart, this);
        this.load.onFileComplete.add(this.fileComplete, this);
        this.load.onLoadComplete.add(this.loadComplete, this);

        this.add.plugin(PhaserInput.Plugin);
        this.add.plugin(PhaserJuicy);
        this.game.juicy = this.add.plugin(new PhaserJuicy(this))
        //
        // load your assets
        if (config.webfonts.length) {
            WebFont.load({
                google: {
                    families: config.webfonts
                },
                active: this.fontsLoaded
            })
        }
        

        this.load.atlas('wizard', 'assets/images/res/'+phaserJSON.leftperson+'/anim.png', 'assets/images/res/'+phaserJSON.leftperson+'/anim.json')
        this.load.xml('wizardAnimations', 'assets/images/res/'+phaserJSON.leftperson+'/anim.scml')

        // load bar for patience
        this.load.spritesheet('patienceBar5', 'assets/images/res/lopelope.png', 89, 75);
        this.load.spritesheet('patienceBar4', 'assets/images/res/lopelope.png', 89, 75);
        this.load.spritesheet('patienceBar3', 'assets/images/res/lopelope.png', 89, 75);
        this.load.spritesheet('patienceBar2', 'assets/images/res/lopelope.png', 89, 75);
        this.load.spritesheet('patienceBar1', 'assets/images/res/lopelope.png', 89, 75);

        this.load.atlas('gnome', 'assets/images/res/'+phaserJSON.rightperson+'/anim.png', 'assets/images/res/'+phaserJSON.rightperson+'/anim.json')
        this.load.xml('gnomeAnimations', 'assets/images/res/'+phaserJSON.rightperson+'/anim.scml')

     
        this.load.image('iconAttack', 'assets/images/res/icon-attack.png');
        this.load.image('iconHome', 'assets/images/icon-home.png');
        this.load.image('iconPlay', 'assets/images/res/button-start.png');

        // bg
        
       // this.load.image('bg1', 'assets/images/layers/l1_background.png')
        this.load.image('bg1', 'assets/images/res/'+phaserJSON.background)
        this.load.image('bg2', 'assets/images/res/title.png');
        this.load.image('bg3', 'assets/images/res/bar-mini-depan.png')
        this.load.image('bg4', 'assets/images/res/l7_ground.png')
        this.load.image('gameover', 'assets/images/res/endgame.png');
        

        // audio
        this.load.audio('click', 'assets/audio/Click.wav')
       
        //this.load.atlas('flags', 'assets/images/flags/flags.png', 'assets/images/flags/flags.json')
        this.load.spritesheet('heart', 'assets/images/ss-heart.png', 48, 48, 6)

        //side menu
        this.load.spritesheet('sidebg', 'assets/images/res/sidebg.png', 115, 117);

        // game state data
        this.load.json('stateData', 'assets/data/'+phaserJSON.datafile);
    }

    loadStart() {
        this.loadingText = this.add.text(20, this.world.height - 32, 'Loading...', {
            font: '20px Berkshire Swash',
            fill: '#ffffff'
        });
    }

    fileComplete(progress, cacheKey, success, totalLoaded, totalFiles) {
        this.loadingText.setText('File Complete: ' + progress + '% - ' + totalLoaded + ' out of ' + totalFiles);
        // console.log('totalLoaded', totalLoaded)
    }

    loadComplete() {
        game.world.remove(this.loadingText);

        this.time.advancedTiming = true;

        // let video = this.add.video('intro');
        // video.play(false);
        // //  x, y, anchor x, anchor y, scale x, scale y
        // video.addToWorld(game.world.centerX, game.world.centerY, 0.5, 0.5, 0.5, 0.5);
        let videoDuration = 6
        this.time.events.add(Phaser.Timer.SECOND * videoDuration, () => {
            document.querySelector('#intro').style.display = 'none'
            document.querySelector('#content').style.display = 'block'
            //this.state.start('GameOver', false, false, '4234')
            this.state.start('Menubefore');
              

        }, this)
    }

    create() {

    }

    fontsLoaded() {
        this.fontsReady = true
    }
}
