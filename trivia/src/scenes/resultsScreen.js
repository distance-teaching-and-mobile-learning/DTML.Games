export default class ResultsScreen extends Phaser.Scene {

  constructor (parentScene, score, gameWon) {

    super({key: 'ResultsScreen'})

    this.parentScene = parentScene
    this.score = score
    this.gameWon = gameWon

  }

  create () {

    let centerX = this.cameras.main.width / 2
    let centerY = this.cameras.main.height / 2

    this.add.image(centerX, centerY, 'resultsBackground').setOrigin(0.5, 0.5)
 
    let topText
    if (this.gameWon) {
      topText = 'Victory'
    } else {
      topText = 'Game Over'
    }
    this.titleText = this.add.text(centerX, centerY - 150, topText, {fontFamily: 'Acme', fontSize: 64, color: '0x000000'}).setOrigin(0.5, 0.5)

    this.animatedScoreValue = 0
    this.tweens.add({
      targets: this,
      animatedScoreValue: this.score,
      duration: 1000,
      ease: 'linear'
    })
    this.scoreText = this.add.text(centerX, centerY, 'Score: ' + this.animatedScoreValue, {fontFamily: 'Acme', fontSize: 48, color: '0x000000'}).setOrigin(0.5, 0.5)

    this.backButton = this.add.image(centerX, centerY + 100, 'answerButton').setOrigin(0.5, 0.5)
    this.backText = this.add.text(centerX, centerY + 100, 'Back', {fontFamily: 'Acme', fontSize: 24, color: '0x000000'}).setOrigin(0.5, 0.5)
    this.backButton.setInteractive()
    this.backButton.on('pointerdown', function () {
      this.parentScene.backToMenu()
    }, this)

    // Slide in from the bottom
    this.cameras.main.y = this.cameras.main.height
    this.tweens.add({
      targets: this.cameras.main,
      y: '-=' + this.cameras.main.height,
      duration: 1000,
      ease: 'Power2'
    })

  }

  update () {
    
    this.scoreText.setText('Score: ' + Math.floor(this.animatedScoreValue))

  }

}