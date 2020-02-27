import {dtml} from 'dtml.sdk'

export default class MenuScene extends Phaser.Scene {

  constructor () {
    super({key: 'menu'})
  }

  create () {

    let centerX = this.cameras.main.width / 2
    let centerY = this.cameras.main.height / 2

    this.add.image(centerX, centerY, 'menuBackground')
    this.buildingsBack = this.add.tileSprite(centerX, centerY, 1000, 700, 'menuBuildingsBack')
    this.buildingsFront = this.add.tileSprite(centerX, centerY, 1000, 700, 'menuBuildingsFront')
    this.sign = this.add.image(centerX, centerY, 'menuSign')

    this.titleText = this.add.text(centerX, 60, this.game.localizedText.title, {fontFamily: 'Acme', fontSize: 64, color: '#FFFFFF'}).setOrigin(0.5, 0.5)

    this.startButton = this.add.image(centerX, centerY + 280, 'startButton').setOrigin(0.5, 0.5)
    this.startButton.setInteractive({ useHandCursor: true })
    this.startButton.on('pointerdown', function () {
      this.panUp()
      this.input.disable(this.startButton)
    }, this)
    this.startButton.setScale(0.8, 0.8)

    this.startText = this.add.text(centerX, centerY + 280, this.game.localizedText.start, {fontFamily: 'Acme', fontSize: 32, color: '#FFFFFF'}).setOrigin(0.5, 0.5)

  }

  update () {

    this.buildingsBack.tilePositionX += 0.5
    this.buildingsFront.tilePositionX += 1.5

  }

  panUp () {
    
    let _this = this
    this.tweens.add({
      targets: [this.buildingsBack, this.buildingsFront, this.sign, this.titleText, this.startButton, this.startText],
      y: '+=800',
      ease: 'Quad.easeIn',
      duration: 500,
      onComplete: function () { _this.openCategories() }
    })

  }

  openCategories () {

    dtml.recordGameStart('eslquiz')
    this.scene.start('categories')

  }

}