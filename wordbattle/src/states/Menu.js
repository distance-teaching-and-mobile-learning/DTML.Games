import FreeText from '../sprites/FreeText'

export default class Menu extends Phaser.State {
  create () {
    let bg1 = game.add.sprite(game.world.centerX, game.world.centerY, 'bg1').anchor.set(0.5)

    let languageText = new FreeText({
      game: game,
      x: game.world.centerX,
      y: this.game.world.centerY * 0.2,
      text: game.currentLanguage,
      cloudEnabled: false
    })
    languageText.display()

    let graphics = game.add.graphics()
    graphics.beginFill(0x000000)
    graphics.drawRect(100, 400, 300, 300)
    graphics.drawRect(game.world.width - 400, 400, 300, 300)
    graphics.endFill()
  }
}
