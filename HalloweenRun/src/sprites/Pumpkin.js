export default class Pumpkin extends Phaser.Sprite {
  constructor (x, y, letter) {
    super(game, x, y, 'pumpkin')
    game.add.existing(this)
    this.anchor.setTo(0.5, 0.5)
    this.letter = letter
    this.letterSprite = game.add.text(x, y, letter)
    this.letterSprite.anchor.setTo(0.5, 0.5)
  }

  update () {
    this.letterSprite.x = this.x
    this.letterSprite.y = this.y
  }

  kill () {
    super.kill()
    if (this.letterSprite) {
      this.letterSprite.kill()
    }
  }
}
