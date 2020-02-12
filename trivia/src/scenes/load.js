export default class LoadScene extends Phaser.Scene {

  constructor () {
    super({key: 'load'})
  }

  preload () {

    // Go to the menu when done loading assets
    this.load.on('complete', function () {
      this.scene.start('menu')
    }, this)

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

    this.add.text(100, 100, 'Loading...', {fontFamily: 'Acme'})

  }

}