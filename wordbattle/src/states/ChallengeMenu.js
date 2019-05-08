import ChallengeList from '../challengeList.json'

export default class Menu extends Phaser.State {
  create () {
    this.add.sprite(game.world.centerX, game.world.centerY, 'bg1').anchor.set(0.5)

    let graphics = this.add.graphics()
    graphics.beginFill(0xC5D763)
    graphics.drawRect(0, 200, game.world.width, game.world.height - 200)
    graphics.endFill()

    this.add.text(game.world.centerX, 100, 'Select your Challenge', { font: '45px Berkshire Swash' }).anchor.set(0.5)

    this.buttons = []
    this.makeButtons(ChallengeList)

    this.backButton = this.add.sprite(game.world.centerX, game.world.height - 150, 'shortButton')
    this.backButton.anchor.set(0.5)
    this.backButton.inputEnabled = true
    this.backButton.useHandCursor = true
    this.backButton.events.onInputDown.add(() => {
      this.goBack()
    })

    this.backText = this.add.text(game.world.centerX, game.world.height - 150, 'Go Back')
    this.backText.anchor.set(0.5)

    this.previousCategories = []
  }

  makeButtons (buttons) {
    // Clear old buttons
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      this.buttons[i].text.destroy()
      this.buttons[i].destroy()
    }

    let buttonWidth = 250
    let buttonHeight = 220
    let buttonSpacing = 25
    let buttonAreaWidth = game.world.width - (buttonSpacing * 2)
    let buttonAreaHeight = game.world.height - 300 - (buttonSpacing * 2)
    let buttonsPerRow = Math.floor(buttonAreaWidth / (buttonWidth + buttonSpacing))
    let rowsPerPage = Math.floor(buttonAreaHeight / (buttonHeight + buttonSpacing))
    let buttonStartX = (game.world.width - buttonAreaWidth) / 2 + (buttonAreaWidth - (buttonWidth * buttonsPerRow) - (buttonSpacing * (buttonsPerRow - 1))) / 2
    let buttonStartY = 200 + buttonSpacing

    for (let y = 0; y < rowsPerPage; y++) {
      for (let x = 0; x < buttonsPerRow; x++) {
        let option = buttons[(y * buttonsPerRow) + x]
        if (option) {
          let newButton = this.add.image(x * (buttonWidth + buttonSpacing) + buttonStartX, y * (buttonHeight + buttonSpacing) + buttonStartY, 'button')
          this.buttons.push(newButton)
          newButton.text = this.add.text(x * (buttonWidth + buttonSpacing) + buttonStartX + buttonWidth / 2, y * (buttonHeight + buttonSpacing) + buttonStartY + buttonHeight / 2, option.name)
          newButton.text.anchor.set(0.5)
          newButton.inputEnabled = true
          newButton.input.useHandCursor = true
          newButton.events.onInputDown.add(() => {
            if (option.subCategories) {
              this.category = option.name
              this.makeButtons(option.subCategories)
              this.previousCategories.push(buttons)
            } else {
              this.state.start('Game', true, false, 'challenge', this.category, option.name)
            }
          })
        }
      }
    }
  }

  goBack () {
    if (this.previousCategories.length > 0) {
      this.makeButtons(this.previousCategories[this.previousCategories.length - 1])
      this.previousCategories.pop()
    } else {
      this.state.start('Menu')
    }
  }
}
