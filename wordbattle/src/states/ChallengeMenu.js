import ChallengeList from '../challengeList.json'

export default class Menu extends Phaser.State {
  create () {
    this.add.sprite(game.world.centerX, game.world.centerY, 'bg1').anchor.set(0.5)

    this.background = this.add.graphics()
    this.drawBackground()
    this.scale.onSizeChange.add(this.drawBackground)

    let topText = this.add.text(game.world.centerX, 100 * game.scaleRatio, 'Select your Challenge', { font: '45px Berkshire Swash' })
    topText.anchor.set(0.5)
    topText.scale.setTo(game.scaleRatio)

    this.buttons = []
    this.previousCategories = []
    this.categoryNames = []
    this.makeButtons(ChallengeList)

    this.backButton = this.add.sprite(game.world.centerX, game.world.height - 80 * game.scaleRatio, 'shortButton')
    this.backButton.anchor.set(0.5)
    this.backButton.scale.set(0.5, 0.5)
    this.backButton.inputEnabled = true
    this.backButton.input.useHandCursor = true
    this.backButton.events.onInputDown.add(() => {
      this.goBack()
    })
    this.backButton.events.onInputOver.add(() => {
      this.backButton.loadTexture('shortButton_selected')
    })
    this.backButton.events.onInputOut.add(() => {
      this.backButton.loadTexture('shortButton')
    })

    this.backText = this.add.text(game.world.centerX, game.world.height - 80 * game.scaleRatio, 'Go Back')
    this.backText.anchor.set(0.5)
    this.backText.scale.setTo(game.scaleRatio)
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

    let buttonWidth = 250 * game.scaleRatio
    let buttonHeight = 220 * game.scaleRatio
    let buttonSpacing = 25 * game.scaleRatio
    let buttonAreaWidth = game.world.width - (buttonSpacing * 2)
    let buttonAreaHeight = game.world.height - 300 - (buttonSpacing * 2)
    let buttonsPerRow = 4
    let rowsPerPage = 2
    let buttonStartX = (game.world.width - buttonAreaWidth) / 2 + (buttonAreaWidth - (buttonWidth * buttonsPerRow) - (buttonSpacing * (buttonsPerRow - 1))) / 2
    let buttonStartY = 200 * game.scaleRatio + buttonSpacing

    // Back arrow
    if (startingIndex > 0) {
      this.backArrow = this.add.image(game.world.centerX - 250 * game.scaleRatio, game.world.height - 80 * game.scaleRatio, 'arrow')
      this.backArrow.anchor.set(0.5, 0.5)
      this.backArrow.scale.set(-1 * game.scaleRatio, game.scaleRatio)
      this.backArrow.inputEnabled = true
      this.backArrow.input.useHandCursor = true
      this.backArrow.events.onInputDown.add(() => {
        this.makeButtons(buttons, startingIndex - buttonsPerRow * rowsPerPage)
      })
      this.backArrow.events.onInputOver.add(() => {
        this.backArrow.loadTexture('arrow_selected')
      })
      this.backArrow.events.onInputOut.add(() => {
        this.backArrow.loadTexture('arrow')
      })
    }
    // Forward arrow
    if (buttons.length - startingIndex > buttonsPerRow * rowsPerPage) {
      this.forwardArrow = this.add.image(game.world.centerX + 250 * game.scaleRatio, game.world.height - 80 * game.scaleRatio, 'arrow')
      this.forwardArrow.anchor.set(0.5, 0.5)
      this.forwardArrow.scale.set(game.scaleRatio)
      this.forwardArrow.inputEnabled = true
      this.forwardArrow.input.useHandCursor = true
      this.forwardArrow.events.onInputDown.add(() => {
        this.makeButtons(buttons, buttonsPerRow * rowsPerPage)
      })
      this.forwardArrow.events.onInputOver.add(() => {
        this.forwardArrow.loadTexture('arrow_selected')
      })
      this.forwardArrow.events.onInputOut.add(() => {
        this.forwardArrow.loadTexture('arrow')
      })
    }

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
          newButton.scale.set(game.scaleRatio)
          this.buttons.push(newButton)
          newButton.text = this.add.text(x * (buttonWidth + buttonSpacing) + buttonStartX + buttonWidth / 2, y * (buttonHeight + buttonSpacing) + buttonStartY + buttonHeight - 25 * game.scaleRatio, option.name)
          newButton.text.anchor.set(0.5)
          newButton.text.scale.setTo(game.scaleRatio)
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
            newButton.icon.scale.set(game.scaleRatio)
          } else {
            newButton.icon = this.add.image(x * (buttonWidth + buttonSpacing) + buttonStartX + buttonWidth / 2, y * (buttonHeight + buttonSpacing) + buttonStartY + buttonHeight / 2, 'icon_default')
            newButton.icon.anchor.set(0.5)
            newButton.icon.scale.set(game.scaleRatio)
          }

          // Checkmark
          if (this.isCategoryCompleted(option, challengeData)) {
            newButton.checkmark = this.add.sprite(x * (buttonWidth + buttonSpacing) + buttonStartX + buttonWidth - 25, y * (buttonHeight + buttonSpacing) + buttonStartY + 25, 'checkmark')
            newButton.checkmark.anchor.set(0.5)
            newButton.checkmark.scale.set(game.scaleRatio)
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

  allChallengesCompleted () {
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

  drawBackground () {
    this.background.clear()
    this.background.beginFill(0xC5D763)
    this.background.drawRect(0, 200 * game.scaleRatio, game.world.width, game.world.height - 200 * game.scaleRatio)
    this.background.endFill()
  }
}
