export default class LoadScene extends Phaser.Scene {

  constructor () {
    super({key: 'load'})
  }

  preload () {

    let startButton = require('../assets/images/startButton.png')
    this.load.image('startButton', startButton)

    let categoryButton = require('../assets/images/categoryButton.png')
    this.load.image('categoryButton', categoryButton)

    let answerButton = require('../assets/images/answerButton.png')
    this.load.spritesheet('answerButton', answerButton, { frameWidth: 300, frameHeight: 80 })

    let questionBox = require('../assets/images/questionBox.png')
    this.load.image('questionBox', questionBox)

    let moneyBoard = require('../assets/images/moneyBoard.png')
    this.load.image('moneyBoard', moneyBoard)

    let resultsBackground = require('../assets/images/resultsBackground.png')
    this.load.image('resultsBackground', resultsBackground)

    // Menu elements
    let menuBackground = require('../assets/images/splash_background.png')
    this.load.image('menuBackground', menuBackground)
    let menuSign = require('../assets/images/splash_sign.png')
    this.load.image('menuSign', menuSign)
    let menuBuildingsFront = require('../assets/images/splash_buildings_front.png')
    this.load.image('menuBuildingsFront', menuBuildingsFront)
    let menuBuildingsBack = require('../assets/images/splash_buildings_back.png')
    this.load.image('menuBuildingsBack', menuBuildingsBack)

    let gameBackground = require('../assets/images/game-background.png')
    this.load.image('gameBackground', gameBackground)

    // Quiz UI
    let speechBubble = require('../assets/images/speechBubble.png')
    this.load.image('speechBubble', speechBubble)
    let yesButton = require('../assets/images/yesButton.png')
    this.load.image('yesButton', yesButton)
    let noButton = require('../assets/images/noButton.png')
    this.load.image('noButton', noButton)

  }

  create () {

    let centerX = this.cameras.main.width / 2
    let centerY = this.cameras.main.height / 2

    this.introLogo = this.add.image(centerX, centerY, 'dtmlLogo')
    this.introLogo.alpha = 0
    this.tweens.add({
      targets: this.introLogo,
      alpha: 1,
      duration: 500
    })

    // Start the menu after a timer
    this.time.delayedCall(2000, function () {
      this.openMenu()
    }, [], this)

    // Click to skip
    this.input.on('pointerdown', function () {
      // If loading is complete
      if (this.load.progress === 1 && this.introLogo.alpha === 1) {
        this.openMenu()
      }
    }, this)

  }

  openMenu () {

    let _this = this
    this.tweens.add({
      targets: this.introLogo,
      alpha: 0,
      duration: 500,
      onComplete: function () {
        _this.scene.start('menu')
      }
    })

  }

}