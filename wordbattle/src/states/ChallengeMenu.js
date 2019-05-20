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
    this.previousCategories = []
    this.categoryNames = []
    this.makeButtons(ChallengeList)

    this.backButton = this.add.sprite(game.world.centerX, game.world.height - 150, 'shortButton')
    this.backButton.anchor.set(0.5)
    this.backButton.inputEnabled = true
    this.backButton.input.useHandCursor = true
    this.backButton.events.onInputDown.add(() => {
      this.goBack()
    })

    this.backText = this.add.text(game.world.centerX, game.world.height - 150, 'Go Back')
    this.backText.anchor.set(0.5)
  }

  makeButtons (buttons, startingIndex) {
    startingIndex = startingIndex || 0

    // Load progress data
    let challengeData = window.localStorage.getItem('challengeData')
    if (challengeData) challengeData = JSON.parse(challengeData)
    else challengeData = {}

    // Clear old buttons
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      if (this.buttons[i].checkmark) this.buttons[i].checkmark.destroy()
      if (this.buttons[i].icon) this.buttons[i].icon.destroy()
      this.buttons[i].text.destroy()
      this.buttons[i].destroy()
    }
    if (this.backArrow) {
      this.backArrow.destroy()
    }
    if (this.forwardArrow) {
      this.forwardArrow.destroy()
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

    // Back arrow
    if (startingIndex > 0) {
      this.backArrow = this.add.image(game.world.centerX - 250, game.world.height - 150, 'arrow')
      this.backArrow.anchor.set(0.5, 0.5)
      this.backArrow.scale.set(-1, 1)
      this.backArrow.inputEnabled = true
      this.backArrow.input.useHandCursor = true
      this.backArrow.events.onInputDown.add(() => {
        this.makeButtons(buttons, startingIndex - buttonsPerRow * rowsPerPage)
      })
    }
    // Forward arrow
    if (buttons.length - startingIndex > buttonsPerRow * rowsPerPage) {
      this.forwardArrow = this.add.image(game.world.centerX + 250, game.world.height - 150, 'arrow')
      this.forwardArrow.anchor.set(0.5, 0.5)
      this.forwardArrow.inputEnabled = true
      this.forwardArrow.input.useHandCursor = true
      this.forwardArrow.events.onInputDown.add(() => {
        this.makeButtons(buttons, buttonsPerRow * rowsPerPage)
      })
    }

    for (let y = 0; y < rowsPerPage; y++) {
      for (let x = 0; x < buttonsPerRow; x++) {
        let option = buttons[(y * buttonsPerRow) + x + startingIndex]
        if (option) {
          let newButton = this.add.image(x * (buttonWidth + buttonSpacing) + buttonStartX, y * (buttonHeight + buttonSpacing) + buttonStartY, 'button')
          this.buttons.push(newButton)
          newButton.text = this.add.text(x * (buttonWidth + buttonSpacing) + buttonStartX + buttonWidth / 2, y * (buttonHeight + buttonSpacing) + buttonStartY + buttonHeight - 25, option.name)
          newButton.text.anchor.set(0.5)
          newButton.inputEnabled = true
          newButton.input.useHandCursor = true
          newButton.events.onInputOver.add(() => {
            newButton.loadTexture('button_selected')
          })
          newButton.events.onInputOut.add(() => {
            newButton.loadTexture('button')
          })
          newButton.events.onInputDown.add(() => {
            if (option.subCategories) {
              this.categoryNames.push(option.name)
              this.makeButtons(option.subCategories)
              this.previousCategories.push(buttons)
            } else {
              dtml.recordGameEvent('wordsbattle', 'ChallengeSelected', option.name)
              this.state.start('Game', true, false, 'challenge', this.categoryNames[this.categoryNames.length - 1], option.name)
            }
          })
          // Button Icon
          if (this.cache.checkImageKey('icon_' + option.name.toLowerCase())) {
            newButton.icon = this.add.image(x * (buttonWidth + buttonSpacing) + buttonStartX + buttonWidth / 2, y * (buttonHeight + buttonSpacing) + buttonStartY + buttonHeight / 2, 'icon_' + option.name.toLowerCase())
            newButton.icon.anchor.set(0.5)
          } else {
            newButton.icon = this.add.image(x * (buttonWidth + buttonSpacing) + buttonStartX + buttonWidth / 2, y * (buttonHeight + buttonSpacing) + buttonStartY + buttonHeight / 2, 'icon_default')
            newButton.icon.anchor.set(0.5)
          }

          // Checkmark
          if (this.isCategoryCompleted(option, challengeData)) {
            newButton.checkmark = this.add.sprite(x * (buttonWidth + buttonSpacing) + buttonStartX + buttonWidth - 25, y * (buttonHeight + buttonSpacing) + buttonStartY + 25, 'checkmark')
            newButton.checkmark.anchor.set(0.5)
          }
        }
      }
    }

    // Bring button checkmarks to top of draw order
    for (let i = 0; i < this.buttons.length; i++) {
      if (this.buttons[i].checkmark) this.buttons[i].checkmark.bringToTop()
    }
  }

  goBack () {
    if (this.previousCategories.length > 0) {
      this.categoryNames.pop()
      this.makeButtons(this.previousCategories[this.previousCategories.length - 1])
      this.previousCategories.pop()
    } else {
      this.state.start('Menu')
    }
  }

  isCategoryCompleted (category, challengeData) {
    if (category.subCategories) {
      if (challengeData[category.name]) {
        for (let i = 0; i < category.subCategories.length; i++) {
          let subCategory = category.subCategories[i]
          if (!this.isCategoryCompleted(subCategory, challengeData)) {
            return false
          }
        }
        return true
      }
    } else {
      for (let topLevelCategory in challengeData) {
        if (challengeData[topLevelCategory][category.name] === true) {
          return true
        }
      }
    }
  }

  allChallengedCompleted () {
    // Load progress data
    let challengeData = window.localStorage.getItem('challengeData')
    if (challengeData) challengeData = JSON.parse(challengeData)
    else return false

    for (let i = 0; i < ChallengeList.length; i++) {
      if (!this.isCategoryCompleted(ChallengeList[i], challengeData)) {
        return false
      }
    }
    return true
  }
}
