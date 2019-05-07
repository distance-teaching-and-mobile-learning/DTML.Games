export default class Menu extends Phaser.State {
  create () {
    this.add.sprite(game.world.centerX, game.world.centerY, 'bg1').anchor.set(0.5)

    let graphics = this.add.graphics()
    graphics.beginFill(0xC5D763)
    graphics.drawRect(0, 200, game.world.width, game.world.height - 200)
    graphics.endFill()

    this.add.text(game.world.centerX, 100, 'Select your Challenge', { font: '45px Berkshire Swash' }).anchor.set(0.5)

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
        this.add.image(x * (buttonWidth + buttonSpacing) + buttonStartX, y * (buttonHeight + buttonSpacing) + buttonStartY, 'button')
      }
    }

    // let challengeButton = this.add.image(game.world.centerX - 600, game.world.centerY - 200, 'challengeButton')
    // challengeButton.inputEnabled = true
    // challengeButton.input.useHandCursor = true
    // challengeButton.events.onInputDown.add(() => {
    //   this.state.start('Game', true)
    // })
    // let freePlayButton = this.add.image(game.world.centerX + 100, game.world.centerY - 200, 'freePlayButton')
    // freePlayButton.inputEnabled = true
    // freePlayButton.input.useHandCursor = true
    // freePlayButton.events.onInputDown.add(() => {
    //   this.state.start('Game', true)
    // })
  }
}
