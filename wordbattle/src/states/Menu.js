import FreeText from '../sprites/FreeText'

export default class Menu extends Phaser.State {
  create () {
    this.add.sprite(game.world.centerX, game.world.centerY, 'bg1').anchor.set(0.5)

    let languageText = new FreeText({
      game: game,
      x: game.world.centerX,
      y: this.game.world.centerY * 0.2,
      text: game.currentLanguage,
      cloudEnabled: false
    })
    languageText.display()

    let challengeButton = this.add.image(game.world.centerX - 300 * game.scaleRatio, game.world.centerY, 'challengeButton')
    challengeButton.anchor.set(0.5, 0.5)
    challengeButton.scale.set(game.scaleRatio, game.scaleRatio)
    challengeButton.inputEnabled = true
    challengeButton.input.useHandCursor = true
    challengeButton.events.onInputDown.add(() => {
      languageText.text.destroy()
      languageText.destroy()
      this.state.start('ChallengeMenu', true)
    })
    challengeButton.events.onInputOver.add(() => {
      challengeButton.loadTexture('challengeButton_selected')
    })
    challengeButton.events.onInputOut.add(() => {
      challengeButton.loadTexture('challengeButton')
    })

    let freePlayButton = this.add.image(game.world.centerX + 300 * game.scaleRatio, game.world.centerY, 'freePlayButton')
    freePlayButton.anchor.set(0.5, 0.5)
    freePlayButton.scale.set(game.scaleRatio, game.scaleRatio)
    freePlayButton.inputEnabled = true
    freePlayButton.input.useHandCursor = true
    freePlayButton.events.onInputDown.add(() => {
      languageText.text.destroy()
      languageText.destroy()
      this.state.start('Game', true)
    })
    freePlayButton.events.onInputOver.add(() => {
      freePlayButton.loadTexture('freePlayButton_selected')
    })
    freePlayButton.events.onInputOut.add(() => {
      freePlayButton.loadTexture('freePlayButton')
    })

    // Check if all challenges completed
    if (this.state.states['ChallengeMenu'].allChallengesCompleted()) {
      let checkmark = this.add.sprite(challengeButton.x + challengeButton.width, challengeButton.y, 'checkmark')
      checkmark.anchor.set(0.5)
    }
  }
}
