/* The Distance Teaching and Mobile learning licenses this file
to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

import { ListView } from 'phaser-list-view'
import FreeText from '../sprites/FreeText'
import Spriter from '../libs/spriter'
import Background from '../sprites/background'
import StateMachine from '../StateMachine'

export default class extends Phaser.State {
  init () {
    this.stateMachine = new StateMachine(game.gameModule)
  }

  create () {
    this.cursors = game.input.keyboard.createCursorKeys()
    this.phaserJSON = game.gameModule

    dtml.initVoices()
    this.leftCharacterVoice = this.getVoiceFromGender(
      this.phaserJSON.Setup.LeftVoice
    )
    this.rightCharacterVoice = this.getVoiceFromGender(
      this.phaserJSON.Setup.RightVoice
    )
    console.log(this.leftCharacterVoice)
    console.log(this.rightCharacterVoice)

    this.language = this.game.state.states['Game']._language
    this.langCode = this.game.state.states['Game']._langCode

    let startingBackground = this.stateMachine.getOnEnterBg() || 1
    this.bg = new Background({ game: this.game }, startingBackground)

    let music = game.add.audio('gameMusic')
    music.onDecoded.add(() => {
      music.fadeIn(4000)
      this.time.events.add(25000, () => {
        music.fadeOut(4000)
      }, this)
    }, this)

    this.music = music
    this.steps = game.add.audio('steps')

    this.awardNoPoints = false

    this.createSprites()
    let inputW = 650
    let inputH = 50
    this.textBox = this.add.inputField(
      this.world.centerX - (inputW / 2) * game.scaleRatio,
      this.game.height - 115 - inputH * 2 * game.scaleRatio + 17,
      {
        font: '40px Arial',
        fill: '#212121',
        fontWeight: 'bold',
        width: inputW,
        padding: 8,
        visible: false,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 6,
        placeHolder: 'Your answer:',
        focusOutOnEnter: true,
        disabled: true
      }
    )
    this.enterButton = null
    this.deleteButton = null
    this.repeatButton = null
    this.hintButton = null
    this.textBox.scale.set(0, 1 * game.scaleRatio)
    this.textBox.disabled = true
    this.textBox.visible = false

    game.add
      .tween(this.textBox.scale)
      .to({ x: 1 * game.scaleRatio }, 500, Phaser.Easing.Cubic.Out, true, 2500)
      .onComplete.add(() => {
        // Submit answer button
        let enterSpriteButton = game.add.sprite(0, 0, 'iconAttack')
        enterSpriteButton.anchor.set(0.5)
        enterSpriteButton.x =
          this.textBox.x + this.textBox.width * game.scaleRatio
        enterSpriteButton.y = this.textBox.y + this.textBox.height / 2
        enterSpriteButton.inputEnabled = true
        enterSpriteButton.input.priorityID = 0
        enterSpriteButton.input.useHandCursor = true
        enterSpriteButton.events.onInputDown.add(this.submitSolution, this)
        this.enterButton = enterSpriteButton
        this.enterButton.visible = false
        this.textBox.visible = false
        // Clear text box button
        let deleteSpriteButton = game.add.sprite(0, 0, 'iconDelete')
        deleteSpriteButton.anchor.set(0.5)
        deleteSpriteButton.x =
          this.textBox.x +
          this.textBox.width * game.scaleRatio +
          enterSpriteButton.width +
          5
        deleteSpriteButton.y = this.textBox.y + this.textBox.height / 2
        deleteSpriteButton.inputEnabled = true
        deleteSpriteButton.input.priorityID = 0
        deleteSpriteButton.input.useHandCursor = true
        deleteSpriteButton.events.onInputDown.add(this.deleteBox, this)
        this.deleteButton = deleteSpriteButton
        this.deleteButton.visible = false
        // Repeat prompt button
        let repeatButton = game.add.sprite(0, 0, 'iconRepeat')
        repeatButton.x = game.stage.width - repeatButton.width - 10
        repeatButton.y = game.stage.height - repeatButton.height - 150
        repeatButton.inputEnabled = true
        repeatButton.input.priorityID = 0
        repeatButton.input.useHandCursor = true
        repeatButton.events.onInputDown.add(this.repeatQuestion, this)
        this.repeatButton = repeatButton
        this.repeatButton.visible = false
        // Hint button
        let hintButton = game.add.sprite(0, 0, 'iconHint')
        hintButton.x = repeatButton.x - hintButton.width - 20
        hintButton.y = repeatButton.y
        hintButton.inputEnabled = true
        hintButton.input.useHandCursor = true
        hintButton.events.onInputDown.add(this.showHint, this)
        this.hintButton = hintButton
        this.hintButton.visible = false
      })
  }

  update () {
    if (this.onSelection) {
      if (this.game.input.keyboard.justPressed(Phaser.KeyCode.RIGHT)) {
        this.listView.items[this.selection].frame = 0

        this.selection += 1
        if (this.selection > this.ansLength - 1) {
          this.selection = 0
        }

        this.listView.items[this.selection].frame = 1
      }

      if (this.game.input.keyboard.justPressed(Phaser.KeyCode.LEFT)) {
        this.listView.items[this.selection].frame = 0

        this.selection -= 1
        if (this.selection < 0) {
          this.selection = this.ansLength - 1
        }

        this.listView.items[this.selection].frame = 1
      }

      if (
        this.game.input.keyboard.justPressed(Phaser.KeyCode.UP) ||
        this.game.input.keyboard.justPressed(Phaser.KeyCode.SPACEBAR)
      ) {
        this.addCharToNode(this.listView.items[this.selection])
      }

      if (
        this.game.input.keyboard.justPressed(Phaser.KeyCode.DOWN) ||
        this.game.input.keyboard.justPressed(Phaser.KeyCode.BACKSPACE)
      ) {
        this.deleteBox()
      }

      if (this.game.input.keyboard.justPressed(Phaser.KeyCode.ENTER)) {
        if (this.enterButton.visible === true) {
          this.submitSolution()
        }
      }
    }

    this.leftCharacter.updateAnimation()
    this.rightCharacter.updateAnimation()
    this.textBox.endFocus()
    // Keep the score up to date
    if (this.stateMachine && this.scoreText) {
      this.scoreText.text = this.stateMachine.getScore()
    }
  }

  createSprites () {
    this.errorText = new FreeText({
      game: this.game,
      x: this.world.width * 0.5,
      y: this.game.world.centerY,
      text: 'Error connecting. Retrying...',
      cloudEnabled: true
    })

    this.correctText = new FreeText({
      game: this.game,
      x: this.world.width * 0.25,
      y: this.game.world.centerY * 0.7,
      text: '0',
      cloudEnabled: true
    })

    this.addScoreText = new FreeText({
      game: this.game,
      x: this.world.width * 0.75,
      y: this.game.world.centerY * 0.7,
      text: '0',
      cloudEnabled: true
    })

    var enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER)
    enterKey.onDown.add(this.submitSolution, this)

    this.spritesGroup = this.add.group()
    this.leftCharacter = this.loadSpriter('leftCharacter')
    this.leftCharacter.x = -200 * game.scaleRatio
    this.leftCharacter.y =
      this.world.height - 470 + parseInt(this.phaserJSON.Setup.LeftAddY)
    this.spritesGroup.add(this.leftCharacter)

    this.rightCharacter = this.loadSpriter('rightCharacter')
    this.rightCharacter.scale.x *= -1
    this.rightCharacter.children.forEach(sprite => {
      sprite.anchor.set(0, 1)
    })
    this.rightCharacter.x = game.width + 180 * game.scaleRatio
    this.rightCharacter.startx = this.world.width * 0.75 * game.scaleRatio
    this.rightCharacter.y =
      this.world.height - 460 + parseInt(this.phaserJSON.Setup.RightAddY)
    this.rightCharacter.setAnimationSpeedPercent(100)
    this.rightCharacter.playAnimationByName('_IDLE')
    this.spritesGroup.add(this.rightCharacter)

    this.patienceRemaining = 5
    // intro sequence
    this.leftCharacter.setAnimationSpeedPercent(100)
    this.leftCharacter.playAnimationByName('_RUN')
    game.add
      .tween(this.leftCharacter)
      .to(
        { x: this.world.width * 0.4 * game.scaleRatio },
        1500,
        Phaser.Easing.Linear.None,
        true,
        1500
      )
      .onComplete.add(() => {
        this.leftCharacter.setAnimationSpeedPercent(100)
        this.leftCharacter.playAnimationByName('_IDLE')
        let numberOfPatienceBars = 5
        this.patienceBarsGroup = this.add.group()
        this.patienceBars = new Array(numberOfPatienceBars)

        // Populate bar with hearts which indicate number of lives
        for (let j = 1; j < numberOfPatienceBars + 1; j++) {
          var heart = game.make.sprite(90 * (j - 1), 0, 'patienceBar' + j)
          this.patienceBarsGroup.add(heart)
          this.patienceBars[numberOfPatienceBars - j] = heart
        }

        this.patienceBarsGroup.x = this.world.width * 0.1
        this.patienceBarsGroup.y = this.game.world.centerY * 0.1 - 15

        this.ConversationStart()
      })
    this.rightCharacter.setAnimationSpeedPercent(100)
    this.rightCharacter.playAnimationByName('_RUN')

    game.add
      .tween(this.rightCharacter)
      .to(
        { x: this.world.width * 0.7 * game.scaleRatio },
        1500,
        Phaser.Easing.Linear.None,
        true,
        1500
      )
      .onComplete.add(() => {
        this.rightCharacter.setAnimationSpeedPercent(100)
        this.rightCharacter.playAnimationByName('_IDLE')
        var image = game.add.image(
          this.world.width * 0.78,
          this.game.world.centerY * 0.02,
          'scoreBar'
        )
        this.scoreText = game.add.text(
          this.world.width * 0.89,
          this.game.world.centerY * 0.16,
          '0',
          {
            font: '60px Berkshire Swash',
            fill: 'black'
          }
        )
        this.scoreText.anchor.setTo(0.5, 0.5)
      })
  }

  ConversationStart () {
    this.nextQuestion()
  }

  submitSolution () {
    if (this.textBox.value.length > 0) {
      this.deleteButton.visible = false
      this.enterButton.visible = false
      this.textBox.visible = false
      this.repeatButton.visible = false
      this.hintButton.visible = false

      this.onSelection = false
      this.destroySideMenu()

      var submittedText = this.textBox.value
      this.textBox.setText('')

      if (this.isLeftCharacterSpeaking()) {
        this.leftCharacterStopSpeaking()
      }
      this.rightCharacterSpeak(submittedText)

      this.time.events.add(2500, () => {
        let animationTimer = this.playExitAnimations()

        // Resolve the player's answer
        this.time.events.add(animationTimer, () => {
          // Get a reference to this scene to get around scoping issues
          let _this = this
          let normalizedSolution = this.stateMachine.normalizeSolution(submittedText)
          let matchingSolution = this.stateMachine.matchSolution(normalizedSolution)
          if (matchingSolution) {
            // Correct answer
            if (matchingSolution !== 'default' && !this.stateMachine.getUserContext().hasSolutionBeenUsed(this.stateMachine.getCurrentStateName(), matchingSolution)) {
              if (!this.awardNoPoints) {
                this.stateMachine.scoreSolution(normalizedSolution, true, 'conversation_' + this.phaserJSON.Setup.Name).then(function (result) {
                  _this.stateMachine.applyScore(result)
                }).catch(function (error) {
                  console.log(error)
                })
              }
              // Mark the solution so it can't be used again for points
              this.stateMachine.markSolution(this.stateMachine.getCurrentStateName(), matchingSolution)
            }
            this.stateMachine.goToNextState(matchingSolution)
            this.nextQuestion()
          } else {
            // Wrong answer
            // Lose points
            this.stateMachine.applyScore(-10)

            // Subtract life
            if (this.patienceRemaining > 1) {
              this.patienceBars[this.patienceRemaining - 1].kill()
              this.patienceRemaining -= 1
            } else {
              dtml.recordGameEvent(
                'conversation_' + this.phaserJSON.Setup.Name,
                'LivesEnded',
                this.scoreText.text
              )
              this.state.start('GameOver', true, false, this.scoreText.text)
              return
            }

            // Phrase suggestion is first deteremined by the state's settings, then by the global setting
            let suggestPhrase = this.stateMachine.currentState.SuggestPhrase
            if (suggestPhrase === undefined) { suggestPhrase = this.phaserJSON.Setup.PhraseCorrection }
            // Check for suggested phrase
            if (window.navigator.onLine && suggestPhrase) {
              this.showThoughtDots()
              this.getSuggestedPath().then(function (response) {
                if (response !== '') {
                  _this.stateMachine.setCurrentState('Suggestion', response)
                  _this.nextQuestion()
                } else {
                  this.repeatCurrentQuestion()
                }
              }).catch(function (error) {
                console.log(error)
                _this.repeatCurrentQuestion()
              })
            } else {
              // Suggestion phrases turned off
              this.repeatCurrentQuestion()
            }
          }
        }, this)
      }, this)
    }
  }

  getSuggestedPath (submittedAnswer) {
    let _this = this
    return new Promise(function (resolve, reject) {
      let solutions = _this.removeScoresFromSolutions(
        _this.stateMachine.currentState.Solutions
      )
      dtml.getSuggestedPath(
        _this.phaserJSON.Setup.Name,
        _this.stateMachine.getCurrentStateName(),
        submittedAnswer,
        solutions,
        function (response) { _this.interpretSuggestedState(response, resolve, reject) }
      )
    })
  }

  interpretSuggestedState (response, resolve, reject) {
    // Offer a suggestion to the player
    if (response.status === 200) {
      if (response.data) {
        let name = response.data
        let currentState = this.stateMachine.getCurrentStateName()
        let shortestSolution = this.stateMachine.getShortestSolution()
        let formattedSolution = this.stateMachine.formatSolution(
          shortestSolution
        )
        let question = 'Did you mean: "' + formattedSolution + '"?'
        let answerWords = ['Yes', 'No'].concat(
          formattedSolution.split(' ')
        )
        let solutions = {
          yes: { Next: name },
          default: { Next: currentState }
        }
        solutions[shortestSolution] = { Next: name }
        solutions['yes ' + shortestSolution] = { Next: name }
        let suggestionState = this.stateMachine.createState(
          question,
          answerWords,
          solutions,
          false,
          false
        )
        resolve(suggestionState)
      } else {
        resolve('')
      }
    } else {
      reject(new Error('No suggested state - Got bad response from server'))
    }
  }

  rightCharacterSpeak (text) {
    this.rightCharacter.setAnimationSpeedPercent(100)
    this.rightCharacter.playAnimationByName('_SAY')
    dtml.textToSpeech(
      text,
      this.rightCharacterVoice,
      this.phaserJSON.Setup.RightPitch
    )
    let label = this.game.add.text(
      this.rightCharacter.x + parseInt(this.phaserJSON.Setup.CallOutRightX),
      this.rightCharacter.y - parseInt(this.phaserJSON.Setup.CallOutRightY),
      text,
      {
        font: '30px Berkshire Swash',
        fill: '#000',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 300
      }
    )
    label.anchor.setTo(0.5)
    this.time.events.add(2500, function () {
      label.kill()
    }, this)
  }

  deleteBox () {
    this.textBox.setText('')
  }

  nextQuestion () {
    // End the game
    if (this.stateMachine.currentStateName === 'End') {
      dtml.recordGameEnd(
        'conversation_' + this.phaserJSON.Setup.Name,
        this.scoreText.text,
        'End'
      )
      this.state.start('GameOver', true, false, this.scoreText.text)
    }

    let animationTimer = this.playEntranceAnimations()

    this.time.events.add(animationTimer, () => {
      this.leftCharacterSpeak(this.stateMachine.getQuestion())

      // Hack to move left character back to the right place
      this.time.events.add(this.timeToSpeak(this.stateMachine.getQuestion()), () => {
        this.leftCharacter.setAnimationSpeedPercent(100)
        this.leftCharacter.playAnimationByName('_IDLE')
        this.createSideMenu()
        this.deleteButton.visible = true
        this.enterButton.visible = true
        this.textBox.visible = true
        this.repeatButton.visible = true
        this.hintButton.visible = true
      }, this)
    }, this)
  }

  repeatCurrentQuestion () {
    var submitFailureText = "I'm sorry, I didn't understand you..."
    this.leftCharacterSpeak(submitFailureText)
    this.time.events.add(5000, () => {
      this.rightCharacter.setAnimationSpeedPercent(100)
      this.rightCharacter.playAnimationByName('_IDLE')
      this.nextQuestion()
    })
  }

  leftCharacterSpeak (text) {
    // If the left character is already talking then stop them
    if (this.isLeftCharacterSpeaking()) {
      this.leftCharacterStopSpeaking()
    }

    this.leftCharacter.setAnimationSpeedPercent(100)
    this.leftCharacter.playAnimationByName('_SAY')
    dtml.textToSpeech(
      text,
      this.leftCharacterVoice,
      this.phaserJSON.Setup.LeftPitch
    )
    this.leftCharacterLabel = this.game.add.text(
      this.leftCharacter.x - parseInt(this.phaserJSON.Setup.CallOutLeftX),
      this.leftCharacter.y - parseInt(this.phaserJSON.Setup.CallOutLeftY),
      text,
      {
        font: '30px Berkshire Swash',
        fill: '#000',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 300
      }
    )

    let timer = this.timeToSpeak(text)
    this.leftCharacterLabel.anchor.setTo(0.5)

    this.leftCharacterSpeechTimer = this.time.events.add(timer, () => {
      this.leftCharacter.playAnimationByName('_IDLE')
      this.leftCharacterLabel.kill()
      this.leftCharacterLabel = null
    }, this)
  }

  // Show dots over the left character's head
  showThoughtDots () {
    let callOutX =
      this.leftCharacter.x - parseInt(this.phaserJSON.Setup.CallOutLeftX)
    let callOutY =
      this.leftCharacter.y - parseInt(this.phaserJSON.Setup.CallOutLeftY)

    this.leftCharacterLabel = this.game.add.sprite(
      this.leftCharacter.x,
      callOutY,
      'loadingAnimation'
    )
    this.leftCharacterLabel.animations.add('spin', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 60, true)
    this.leftCharacterLabel.animations.play('spin')
    this.leftCharacterLabel.anchor.setTo(0.5, 0.5)
  }

  clearThoughtDots () {
    this.leftCharacterLabel.destroy()
    this.leftCharacterLabel = null
  }

  timeToSpeak (text) {
    /*
      An auctioneer speaks at 250 words per minute.
      Henry Kissinger, in public interviews, speaks at a rate of 90 words per minute.
      An ideal rate for a face-to-face pitch or conversation is 190 words per minute.
      Assuming 2 words per second with minimun of 4 seconds.
    */

    let speedOfSpeach = 2 // 2 words per second
    let minLenght = 4 // 4 seconds

    let words = text.split(' ').length
    let timetospeak = words / speedOfSpeach
    timetospeak = timetospeak > minLenght ? timetospeak : minLenght
    return timetospeak * 1000
  }

  leftCharacterStopSpeaking () {
    this.leftCharacterLabel.kill()
    this.time.events.remove(this.leftCharacterSpeechTimer)
    this.leftCharacter.playAnimationByName('_IDLE')
  }

  isLeftCharacterSpeaking () {
    if (this.leftCharacterLabel) {
      return true
    }
  }

  repeatQuestion (sprite) {
    dtml.recordGameEvent(
      'conversation_' + this.phaserJSON.Setup.Name,
      'repeat',
      this.stateMachine.getCurrentStateName()
    )
    this.leftCharacterSpeak(this.stateMachine.getQuestion())
  }

  showHint () {
    // Get the shortest possible solution with a positive score
    let shortestSolution = this.stateMachine.getShortestSolution()

    if (shortestSolution && shortestSolution.length > 0) {
      console.log(shortestSolution)
      dtml.recordGameEvent(
        'conversation_' + this.phaserJSON.Setup.Name,
        'hint',
        this.stateMachine.getCurrentStateName()
      )
      // Remove words that aren't in the shortest solution
      for (let i = this.listView.items.length - 1; i >= 0; i--) {
        let parentGroup = this.listView.items[i]
        for (let j = 0; j < parentGroup.length; j++) {
          if (
            parentGroup.getChildAt(j).text &&
            !shortestSolution
              .split(' ')
              .includes(parentGroup.getChildAt(j).text.toLowerCase())
          ) {
            this.listView.remove(parentGroup)
            parentGroup.destroy(true)
          }
        }
      }

      // Flag that we used a hint so we get no score
      this.awardNoPoints = true
    }
  }

  showMenu () {
    this.errorText.hide()
    this.correctText.text.destroy()
    this.addScoreText.text.destroy()
    this.correctText.destroy()
    this.addScoreText.destroy()
    this.music.destroy()
    this.state.start('Menu')
  }

  addCharToNode (sprite) {
    var iii = 0
    var xxx = 0
    this.listView.items.forEach(function (itemnya) {
      itemnya.frame = 0
      if (itemnya.text === sprite.text) {
        sprite.frame = 1
        iii = xxx
      }
      xxx++
    })

    this.selection = iii

    this.textBox.setText(this.textBox.value + ' ' + sprite.text)
  }

  createSideMenu () {
    this.onSelection = true

    if (
      this.stateMachine.currentState.awardPoints === true ||
      this.stateMachine.currentState.awardPoints === undefined
    ) {
      this.awardNoPoints = false
    } else {
      this.awardNoPoints = true
    }

    this.sidemenu = this.game.add.sprite(
      this.game.width,
      this.game.height,
      'sidemenu'
    )
    this.sidemenu.height = this.game.height
    this.sidemenu.width = this.game.width

    var options = {
      direction: 'x',
      overflow: 100,
      padding: 10,
      swipeEnabled: true,
      offsetThreshold: 100,
      searchForClicks: true
    }

    this.listView = new ListView(
      this.game,
      this.game.world,
      new Phaser.Rectangle(
        50,
        this.sidemenu.height - 128,
        this.sidemenu.width,
        this.sidemenu.height - 10
      ),
      options
    )

    var i = 0
    var rect

    this.selection = 0
    this.ansLength = 0

    let wordList = []
    this.stateMachine.getAnswerWords().forEach(word => {
      this.ansLength += 1

      // We make a parent group so we can scale the sprite without affecting the text
      var parentGroup = this.game.add.group()

      var item = this.game.add.sprite(0, 0, 'sidebg')
      item.text = word

      var character = this.game.add.text(0, 0, word)
      var scaledWidth = Math.max(character.width + 50, item.width)
      item.width = scaledWidth
      rect = new Phaser.Rectangle(item.x, item.y, item.width, item.height)
      character.alignIn(rect, Phaser.CENTER)
      item.frame = 0

      parentGroup.addChild(item)
      parentGroup.addChild(character)

      character.inputEnabled = true
      character.input.priorityID = 0
      character.input.useHandCursor = true
      character.events.onInputDown.add(this.addCharToNode, this)
      item.inputEnabled = true
      item.input.priorityID = 0
      item.input.useHandCursor = true
      item.events.onInputDown.add(this.addCharToNode, this)
      wordList.push(parentGroup)
    })

    while (wordList.length > 0) {
      let random = this.rnd.between(0, wordList.length - 1)
      this.listView.add(wordList[random])
      wordList.splice(random, 1)
    }

    this.listView.items[this.selection].frame = 1
  }

  destroySideMenu () {
    this.sidemenu.kill()
    this.listView.grp.visible = false
  }

  loadSpriter (key) {
    console.log(key)
    if (!this.spriterLoader) this.spriterLoader = new Spriter.Loader()

    let spriterFile = new Spriter.SpriterXml(
      game.cache.getXML(key + 'Animations')
    )

    // process loaded xml/json and create internal Spriter objects - these data can be used repeatly for many instances of the same animation
    let spriter = this.spriterLoader.load(spriterFile)
    let entity = spriter._entities['_items'][0].name

    return new Spriter.SpriterGroup(game, spriter, key, entity)
  }

  // Removes the score property from a table of solutions
  removeScoresFromSolutions (solutions) {
    let shearedSolutions = {}
    for (let entry in solutions) {
      shearedSolutions[entry] = solutions[entry]['Next']
    }
    return shearedSolutions
  }

  getVoiceFromGender (gender) {
    if (gender === 'male') {
      for (let i = 0; i < dtml.listOfVoices.length; i++) {
        if (dtml.listOfVoices[i].name.search('David') !== -1) { return dtml.listOfVoices[i].name }
      }
    } else {
      for (let i = 0; i < dtml.listOfVoices.length; i++) {
        if (dtml.listOfVoices[i].name.search('Zira') !== -1) { return dtml.listOfVoices[i].name }
      }
    }
  }

  playEntranceAnimations () {
    let animationTimer = 0

    let leftAnimation = this.stateMachine.getOnEnterLeft() || ''
    let rightAnimation = this.stateMachine.getOnEnterRight() || ''
    let background = this.stateMachine.getOnEnterBg() || ''
    let leftDirection = this.stateMachine.getOnEnterLeftDo() || ''
    let rightDirection = this.stateMachine.getOnEnterRightDo() || ''

    if (leftDirection !== '') {
      if (leftDirection === 'in') {
        this.walkTo(this.leftCharacter, 'right', -300 * game.scaleRatio, this.world.width * 0.4 * game.scaleRatio, 1500)
      }

      if (leftDirection === 'out') {
        this.walkTo(this.leftCharacter, 'left', this.world.width * 0.4 * game.scaleRatio, -300 * game.scaleRatio, 1500)
      }
    }

    if (rightDirection !== '') {
      if (rightDirection === 'in') {
        this.walkTo(this.rightCharacter, 'left', rightDirection, game.width + 180 * game.scaleRatio, this.world.width * 0.7 * game.scaleRatio, 1500)
      }

      if (rightDirection === 'out') {
        this.walkTo(this.rightCharacter, 'right', rightDirection, this.world.width * 0.7 * game.scaleRatio, game.width + 180 * game.scaleRatio, 1500)
      }
    }

    if (leftAnimation !== '') {
      this.leftCharacter.playAnimationByName(leftAnimation)
      animationTimer = 2000
    }

    if (rightAnimation !== '') {
      console.log(rightAnimation)
      if (rightAnimation === 'BringFood') {
        this.rightCharacter.scale.x *= -1
        this.rightCharacter.playAnimationByName('_WALK')
        game.add
          .tween(this.rightCharacter)
          .to(
            { x: this.world.width * 0.7 * game.scaleRatio },
            1500,
            Phaser.Easing.Linear.None,
            true,
            0
          )
          .onComplete.add(() => {
            // this.rightCharacter.scale.x *= -1;
            this.rightCharacter.setAnimationSpeedPercent(100)
            this.rightCharacter.playAnimationByName('_IDLE')
          })

        animationTimer = 2000
      } else {
        this.rightCharacter.playAnimationByName(rightAnimation)
        animationTimer = 2000
      }
    }

    if (background !== '') {
      this.bg.gameBackground.loadTexture('bg' + background)
    }
    return animationTimer
  }

  playExitAnimations () {
    let lastState = this.stateMachine.currentStateName
    let leftAnimation = this.stateMachine.getOnExitLeft() || ''
    let rightAnimation = this.stateMachine.getOnExitRight() || ''
    let background = this.stateMachine.getOnExitBg() || ''
    let leftDirection = this.stateMachine.getOnExitLeftDo() || ''
    let rightDirection = this.stateMachine.getOnExitRightDo() || ''
    let animationTimer = 0

    if (lastState !== this.stateMachine.currentStateName) {
      if (leftDirection !== '') {
        if (leftDirection === 'in') {
          this.walkTo(this.leftCharacter, 'right', leftDirection, -300 * game.scaleRatio, this.world.width * 0.4 * game.scaleRatio, 1500)
        }

        if (leftDirection === 'out') {
          this.walkTo(this.leftCharacter, 'left', this.world.width * 0.4 * game.scaleRatio, -300 * game.scaleRatio, 1500)
        }
      }

      if (rightDirection !== '') {
        if (rightDirection === 'in') {
          this.walkTo(this.rightCharacter, 'left', game.width + 180 * game.scaleRatio, this.world.width * 0.7 * game.scaleRatio, 1500)
        }

        if (rightDirection === 'out') {
          this.walkTo(this.rightCharacter, 'right', this.world.width * 0.7 * game.scaleRatio, game.width + 180 * game.scaleRatio, 1500)
        }
      }

      if (leftAnimation !== '') {
        this.leftCharacter.playAnimationByName(leftAnimation)
        animationTimer = 2000
      }

      if (rightAnimation !== '') {
        this.rightCharacter.playAnimationByName(rightAnimation)
        animationTimer = 2000
      }

      if (background !== '') {
        this.bg.gameBackground.loadTexture('bg' + background)
      }
    }

    this.rightCharacter.setAnimationSpeedPercent(100)
    this.rightCharacter.playAnimationByName('_IDLE')
    return animationTimer
  }

  walkTo (character, direction, startX, endX, time) {
    if (direction === 'right') {
      character.scale.x = Math.abs(character.scale.x)
    } else {
      character.scale.x = -Math.abs(character.scale.x)
    }
    character.x = startX
    game.add
      .tween(character)
      .to(
        { x: endX },
        time,
        Phaser.Easing.Linear.None,
        true,
        0
      )
      .onComplete.add(() => {
        character.setAnimationSpeedPercent(100)
        character.playAnimationByName('_IDLE')
      })
  }
}
