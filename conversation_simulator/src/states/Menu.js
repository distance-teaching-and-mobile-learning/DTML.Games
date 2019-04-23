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

export default class extends Phaser.State {
  create () {
    this.phaserJSON = game.gameModule
    this.createBackground()
    let enterSpriteButton = game.add.sprite(0, 0, 'iconPlay')
    enterSpriteButton.anchor.set(0.5)
    enterSpriteButton.x = game.world.centerX
    enterSpriteButton.y = game.world.centerY + 200
    enterSpriteButton.inputEnabled = true
    enterSpriteButton.input.priorityID = 0
    enterSpriteButton.events.onInputDown.add(this.startGame, this)
    enterSpriteButton.alpha = 0
    enterSpriteButton.input.useHandCursor = true
    game.add.tween(enterSpriteButton).to({ x: game.world.centerX, alpha: 1 }, 500, Phaser.Easing.Cubic.In, true, 2000)

    var style = { font: 'bold 42px Arial', fill: '#fff', boundsAlignH: 'center', boundsAlignV: 'middle' }

    // The Text is positioned at 0, 100
    var text
    text = game.add.text(0, 0, this.phaserJSON.Setup.Title, style)
    text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2)

    // We'll set the bounds to be from x0, y100 and be 800px wide by 100px high
    text.setTextBounds(0, 0, game.world.width, game.world.height)
    text.alpha = 0
    game.add.tween(text).to({ alpha: 1 }, 500, Phaser.Easing.Cubic.In, true, 2500)
    dtml.recordGameStart('conversation_' + this.phaserJSON.Setup.Name)
  }

  createBackground () {
    this.background = this.add.sprite(game.world.centerX, game.world.height, 'bg_' + this.phaserJSON.Setup.StartingBackground)
    this.background.anchor.set(0.5, 1)
    this.gameTitle = this.add.sprite(game.world.centerX, game.world.height, 'bg_title')
    this.gameTitle.anchor.set(0.5, 1)
    this.gameTitle.alpha = 0
    this.nameBackground = this.add.sprite(game.world.centerX, game.world.height, 'bg_depan')
    this.nameBackground.anchor.set(0.5, 1)
    this.gameTitle.y = game.world.height / 2 - 75
    game.add
      .tween(this.gameTitle)
      .to(
        { x: game.world.centerX, alpha: 1 },
        500,
        Phaser.Easing.Cubic.In,
        true,
        500
      )
    this.nameBackground.y += 400
    game.add
      .tween(this.nameBackground)
      .to(
        { y: this.gameTitle.y + this.nameBackground.height + 30, alpha: 1 },
        2000,
        Phaser.Easing.Cubic.In,
        true,
        500
      )
  }

  startGame () {
    this.state.start('Game')
  }
}
