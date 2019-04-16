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

import PhaserInput from '../libs/phaser-input'
import PhaserJuicy from '../libs/juicy'
import config from '../config'
import WebFont from 'webfontloader'

const centerGameObjects = (objects) => {
  objects.forEach(function (object) {
    object.anchor.setTo(0.5)
  })
}

export default class extends Phaser.State {
  init () {

  }

  preload () {
    var phaserJSON = game.gameModule
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBar')
    centerGameObjects([this.loaderBar])
    this.load.setPreloadSprite(this.loaderBar)

    this.load.onLoadStart.add(this.loadStart, this)
    this.load.onFileComplete.add(this.fileComplete, this)
    this.load.onLoadComplete.add(this.loadComplete, this)

    this.add.plugin(PhaserInput.Plugin)
    this.add.plugin(PhaserJuicy)
    this.game.juicy = this.add.plugin(new PhaserJuicy(this))

    if (config.webfonts.length) {
      WebFont.load({
        google: {
          families: config.webfonts
        },
        active: this.fontsLoaded
      })
    }

    console.log('left character:' + phaserJSON.Setup.LeftCharacter.trim())
    this.load.atlas('leftCharacter', 'assets/images/res/' + phaserJSON.Setup.LeftCharacter.trim() + '/anim.png', 'assets/images/res/' + phaserJSON.Setup.LeftCharacter.trim() + '/anim.json')
    this.load.xml('leftCharacterAnimations', 'assets/images/res/' + phaserJSON.Setup.LeftCharacter.trim() + '/anim.scml')

    console.log('right character:' + phaserJSON.Setup.RightCharacter.trim())
    this.load.atlas('rightCharacter', 'assets/images/res/' + phaserJSON.Setup.RightCharacter.trim() + '/anim.png', 'assets/images/res/' + phaserJSON.Setup.RightCharacter.trim() + '/anim.json')
    this.load.xml('rightCharacterAnimations', 'assets/images/res/' + phaserJSON.Setup.RightCharacter.trim() + '/anim.scml')

    // load bar for patience
    this.load.spritesheet('patienceBar5', 'assets/images/res/lopelope.png', 95, 84)
    this.load.spritesheet('patienceBar4', 'assets/images/res/lopelope.png', 95, 84)
    this.load.spritesheet('patienceBar3', 'assets/images/res/lopelope.png', 95, 84)
    this.load.spritesheet('patienceBar2', 'assets/images/res/lopelope.png', 95, 84)
    this.load.spritesheet('patienceBar1', 'assets/images/res/lopelope.png', 95, 84)

    this.load.image('iconAttack', 'assets/images/res/icon-attack.png')
    this.load.image('iconHome', 'assets/images/icon-home.png')
    this.load.image('iconPlay', 'assets/images/res/button-start.png')
    this.load.image('scoreBar', 'assets/images/res/score-board.png')
    this.load.image('iconDelete', 'assets/images/res/icon-back.png')
    this.load.image('iconRepeat', 'assets/images/res/icon-repeat.png')
    this.load.image('iconHint', 'assets/images/res/icon-hint.png')

    // Backgrounds
    for (let i = 0; i < phaserJSON.Setup.Backgrounds.length; i++) {
      let background = phaserJSON.Setup.Backgrounds[i]
      this.load.image('bg' + (i + 1), 'assets/images/res/backgrounds/' + background + '.png')
    }
    this.load.image('bg1', 'assets/images/res/' + phaserJSON.Setup.StartingBackground)
    this.load.image('bg_title', 'assets/images/res/title.png')
    this.load.image('bg_depan', 'assets/images/res/bar-mini-depan.png')
    this.load.image('footer', 'assets/images/res/l7_ground.png')
    this.load.image('gameover', 'assets/images/res/endgame.png')
    this.load.image('speechBubble', 'assets/images/res/callout.png')

    // audio
    this.load.audio('click', 'assets/audio/Click.wav')

    // side menu
    this.load.spritesheet('sidebg', 'assets/images/res/sidebg.png', 115, 117)
  }

  loadStart () {
    console.log('loadStart')
    this.loadingText = this.add.text(this.game.world.centerX - 140, this.game.world.centerY - 140, 'Loading...', {
      font: '20px Berkshire Swash',
      fill: '#ffffff'
    })
  }

  fileComplete (progress, cacheKey, success, totalLoaded, totalFiles) {
    console.log('Loading: ' + progress + '% - ' + totalLoaded + ' out of ' + totalFiles)
    this.loadingText.setText('Loading: ' + progress + '% - ' + totalLoaded + ' out of ' + totalFiles)
  }

  loadComplete () {
    this.time.advancedTiming = true
    let videoDuration = 5
    console.log('loadComplete')
    this.time.events.add(Phaser.Timer.SECOND * videoDuration, () => {
      document.querySelector('#intro').style.display = 'none'
      document.querySelector('#content').style.display = 'block'
      this.state.start('Menu')
    }, this)
  }

  create () {

  }

  fontsLoaded () {
    this.fontsReady = true
  }
}
