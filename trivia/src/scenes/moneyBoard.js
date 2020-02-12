// Shows the player's progress up the money board
export default class Questions extends Phaser.Scene {

  constructor (parentScene) {

    super({key: 'MoneyBoard'})

    this.parentScene = parentScene

  }

  create () {

    let x = 725
    let y = 240

    this.scoreValues = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000]

    // Background
    this.background = this.add.image(x, y, 'moneyBoard').setOrigin(0, 0)

    // Question marker
    this.questionMarker = this.add.rectangle(x + 10, y + 18 + (14 * 25), 200, 28, '0x608FDB').setOrigin(0, 0)

    // Dollar amounts
    let scoreStrings = ['$1,000,000', '$500,000', '$250,000', '$125,000', '$64,000', '$32,000',
      '$16,000', '$8,000', '$4,000', '$2,000', '$1,000', '$500', '$300', '$200', '$100']
    for (let i = 0; i < scoreStrings.length; i++) {
      let textY = y + 32 + (i * 25)
      // Index text
      this.add.text(x + 30, textY, (scoreStrings.length - i), {fontFamily: 'Acme', fontSize: 28, color: '0x000000'}).setOrigin(0.5, 0.5)

      // -
      this.add.text(x + 53, textY, '-', {fontFamily: 'Acme', fontSize: 28, color: '0x000000'}).setOrigin(0.5, 0.5)

      // Dollar value
      this.add.text(x + 65, textY, scoreStrings[i], {fontFamily: 'Acme', fontSize: 28, color: '0x000000'}).setOrigin(0, 0.5)
    }

  }

  advanceMoneyBoard () {

    this.tweens.add({
      targets: this.questionMarker,
      y: '-= 25',
      duration: 250,
      ease: 'Power2'
    })

  }

}