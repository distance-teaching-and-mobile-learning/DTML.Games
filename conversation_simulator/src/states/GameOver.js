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

import Spriter from '../libs/spriter'

export default class extends Phaser.State {
  init (score) {
    this.phaserJSON = game.gameModule
    this.game.stage.backgroundColor = '#00B3C1'
    let gameover = game.add.sprite(
      game.world.centerX,
      game.world.centerY,
      'gameover'
    )
    gameover.anchor.set(0.5)
    this.setText(score)
  }

  shutdown () {
    game.world.remove(this.loadingText)
  }

  create () {
    this.spritesGroup = this.add.group()
    this.leftCharacter = this.loadSpriter('leftCharacter')
    this.leftCharacter.x = 240 * game.scaleRatio
    this.leftCharacter.y = this.world.height - 470
    this.spritesGroup.add(this.leftCharacter)
    this.leftCharacter.playAnimationByName('_IDLE')

    this.rightCharacter = this.loadSpriter('rightCharacter')
    this.rightCharacter.scale.x *= -1
    this.rightCharacter.children.forEach(sprite => {
      sprite.anchor.set(0, 1)
    })

    this.rightCharacter.x = game.width - 260 * game.scaleRatio
    this.rightCharacter.startx = this.world.width * 0.75 * game.scaleRatio
    this.rightCharacter.y = this.world.height - 460
    this.rightCharacter.setAnimationSpeedPercent(100)
    this.rightCharacter.playAnimationByName('_IDLE')
    this.spritesGroup.add(this.rightCharacter)
  }

  loadSpriter (key) {
    if (!this.spriterLoader) this.spriterLoader = new Spriter.Loader()

    let spriterFile = new Spriter.SpriterXml(
      game.cache.getXML(key + 'Animations')
    )

    // process loaded xml/json and create internal Spriter objects - these data can be used repeatly for many instances of the same animation
    let spriter = this.spriterLoader.load(spriterFile)
    let entity = spriter._entities['_items'][0].name

    return new Spriter.SpriterGroup(game, spriter, key, entity)
  }

  setText (text) {
    let label = this.game.add.text(
      game.world.centerX,
      game.world.centerY + 80,
      text,
      {
        font: '100px Berkshire Swash',
        fill: '#000',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 800
      }
    )

    label.anchor.setTo(0.5)
  }

  update () {
    this.leftCharacter.updateAnimation()
    this.rightCharacter.updateAnimation()
    if (game.input.activePointer.isDown) {
      this.nextState()
    }
  }

  nextState () {
    this.state.start('Game')
  }
}
