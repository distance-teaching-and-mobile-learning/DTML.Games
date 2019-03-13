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
    this.stateMachine = new StateMachine(this.game.cache.getJSON('gameData'))
  }

  create () {
    this.cursors = game.input.keyboard.createCursorKeys()
    this.phaserJSON = this.cache.getJSON('gameData')
  	
    this.listOfVoices = window.speechSynthesis.getVoices()
    if (typeof speechSynthesis !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
	  var that = this;
      window.speechSynthesis.onvoiceschanged = function () {
        that.listOfVoices = window.speechSynthesis.getVoices();
      }
    }

    this.leftCharacterVoice = this.phaserJSON.Setup.LeftVoice;
    this.rightCharacterVoice = this.phaserJSON.Setup.RightVoice;

    this.language = this.game.state.states['Game']._language
    this.langCode = this.game.state.states['Game']._langCode
    let startingBackground = this.stateMachine.getOnEnterBg() || 1
    this.bg = new Background({ game: this.game }, startingBackground)

    let music = game.add.audio('gameMusic')
    music.onDecoded.add(() => {
      music.fadeIn(4000)
      this.time.events.add(25000, () => {
        music.fadeOut(4000)
      })
    }, this)

    this.music = music
    this.steps = game.add.audio('steps')

    this.hintUsed = false

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
    this.leftCharacter.y = this.world.height - 470 + parseInt(this.phaserJSON.Setup.LeftAddY)
    this.spritesGroup.add(this.leftCharacter)

    this.rightCharacter = this.loadSpriter('rightCharacter')
    this.rightCharacter.scale.x *= -1
    this.rightCharacter.children.forEach(sprite => {
      sprite.anchor.set(0, 1)
    })
    this.rightCharacter.x = game.width + 180 * game.scaleRatio
    this.rightCharacter.startx = this.world.width * 0.75 * game.scaleRatio
    this.rightCharacter.y = this.world.height - 460 + parseInt(this.phaserJSON.Setup.RightAddY)
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

        var p = game.make.sprite(0, 0, 'patienceBar5')
        this.patienceBarsGroup.add(p)
        this.patienceBars[4] = p

        var p1 = game.make.sprite(0, 0, 'patienceBar4')
        this.patienceBarsGroup.add(p1)
        this.patienceBars[3] = p1
        var p2 = game.make.sprite(90, 0, 'patienceBar3')
        this.patienceBarsGroup.add(p2)
        this.patienceBars[2] = p2
        var p3 = game.make.sprite(180, 0, 'patienceBar2')
        this.patienceBarsGroup.add(p3)
        this.patienceBars[1] = p3
        var p4 = game.make.sprite(270, 0, 'patienceBar1')
        this.patienceBarsGroup.add(p4)
        this.patienceBars[0] = p4

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

  gameOver () {
    this.leftCharacter.kill()
    this.rightCharacter.kill()
    this.textBox.kill()

    var enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER)
    enterKey.onDown.add(() => {
      this.showMenu()
    }, this)

    dtml.recordGameEnd(this.phaserJSON.Setup.gameid, this.scoreText.text)
  }

  textToSpeach (text, voice, pitch) {
    try {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel()
        setTimeout(() => {
          this.textToSpeach(text, voice, pitch)
        }, 500)
      } else {
		console.log(this.listOfVoices);
        var voicename = this.listOfVoices.filter(a =>a.name.toLowerCase().includes(voice.toLowerCase()));     
        var msg = new SpeechSynthesisUtterance();
        msg.voice = voicename.length > 0 ? voicename[0] : this.listOfVoices[0];
		console.log(msg.voice);
        msg.default = false
        msg.voiceURI = 'native'
        msg.volume = 1
        msg.rate = 1
        msg.pitch = parseInt(pitch)
        msg.text = text
        msg.lang = 'en-US'
        speechSynthesis.speak(msg)
      }
    } catch (e) {
      console.log(e)
    }
  }

  ConversationStart () {
    this.nextQuestion(this.stateMachine.getQuestion(), true)
  }

  submitSolution () {
    this.lastState = this.stateMachine.currentStateName
    this.leftnya = this.stateMachine.getOnExitLeft() || ''
    this.rightnya = this.stateMachine.getOnExitRight() || ''
    this.bgnya = this.stateMachine.getOnExitBg() || ''
    this.leftdonya = this.stateMachine.getOnExitLeftDo() || ''
    this.rightdonya = this.stateMachine.getOnExitRightDo() || ''

    if (this.textBox.value.length > 0) {
      this.deleteButton.visible = false
      this.enterButton.visible = false
      this.textBox.visible = false
      this.repeatButton.visible = false
      this.hintButton.visible = false

      this.onSelection = false
      this.destroySideMenu()

      var text = this.textBox.value
      this.textBox.setText('')

      if (this.isLeftCharacterSpeaking()) {
        this.leftCharacterStopSpeaking()
      }
      this.rightCharacterSpeak(text)

      this.stateMachine.submitSolution(text, this.hintUsed)

      this.time.events.add(2500, () => {
        this.timernya = 0

        if (this.lastState !== this.stateMachine.currentStateName) {

          if (this.leftdonya !== '') {
            if (this.leftdonya === 'in') {
              this.leftCharacter.scale.x = Math.abs(this.leftCharacter.scale.x)
              this.leftCharacter.x = -300 * game.scaleRatio
              game.add
                .tween(this.leftCharacter)
                .to(
                  { x: this.world.width * 0.4 * game.scaleRatio },
                  1500,
                  Phaser.Easing.Linear.None,
                  true,
                  0
                )
                .onComplete.add(() => {
                  this.leftCharacter.setAnimationSpeedPercent(100)
                  this.leftCharacter.playAnimationByName('_IDLE')
                })
            }

            if (this.leftdonya === 'out') {
              this.leftCharacter.scale.x = -Math.abs(this.leftCharacter.scale.x)
              this.leftCharacter.x = this.world.width * 0.4 * game.scaleRatio
              game.add
                .tween(this.leftCharacter)
                .to(
                  { x: -300 * game.scaleRatio },
                  1500,
                  Phaser.Easing.Linear.None,
                  true,
                  0
                )
                .onComplete.add(() => {
                  this.leftCharacter.setAnimationSpeedPercent(100)
                  this.leftCharacter.playAnimationByName('_IDLE')
                })
            }
          }

          if (this.rightdonya !== '') {
            if (this.rightdonya === 'in') {
              this.rightCharacter.scale.x = -Math.abs(this.rightCharacter.scale.x)
              this.rightCharacter.x = game.width + 180 * game.scaleRatio
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
            }

            if (this.rightdonya === 'out') {
              this.rightCharacter.scale.x = Math.abs(this.rightCharacter.scale.x)
              this.rightCharacter.x = this.world.width * 0.7 * game.scaleRatio
              game.add
                .tween(this.rightCharacter)
                .to(
                  { x: game.width + 180 * game.scaleRatio },
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
            }
          }

          if (this.leftnya !== '') {
            this.leftCharacter.playAnimationByName(this.leftnya)
            this.timernya = 2000
          }

          if (this.rightnya !== '') {
            this.rightCharacter.playAnimationByName(this.rightnya)
            this.timernya = 2000
          }

          if (this.bgnya !== '') {
            this.bg.gameBackground.loadTexture('bg' + this.bgnya)
          }
        }

        this.rightCharacter.setAnimationSpeedPercent(100)
        this.rightCharacter.playAnimationByName('_IDLE')

        // Once the player has said something, the left character should respond
        if (this.stateMachine.currentStateName !== 'End') {
          this.time.events.add(this.timernya, () => {
            this.cekEnter = 0

            this.nextQuestion(
              this.stateMachine.getQuestion(),
              this.stateMachine.submitSolutionResult
            )
          })
        } else {
          this.state.start('GameOver', true, false, this.scoreText.text)
        }
      })
    }
  }

  rightCharacterSpeak (text) {
    this.rightCharacter.setAnimationSpeedPercent(100)
    this.rightCharacter.playAnimationByName('_SAY')
    this.textToSpeach(text, this.rightCharacterVoice, this.phaserJSON.Setup.RightPitch)
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
    })
  }

  deleteBox () {
    this.textBox.setText('')
  }

  nextQuestion (text, submitResult) {
    if (text === '') {
      this.state.start('GameOver', true, false, this.scoreText.text)
    }

    if (!submitResult) {
      this.cekEnter = 1
      if (this.patienceRemaining > 1) {
        this.patienceBars[this.patienceRemaining - 1].kill()
        this.patienceRemaining -= 1
      } else {
        this.state.start('GameOver', true, false, this.scoreText.text)
        return
      }
      var submitFailureText = "I'm sorry, I didn't understand you..."
      this.leftCharacterSpeak(submitFailureText)
      this.time.events.add(5000, () => {
        this.rightCharacter.setAnimationSpeedPercent(100)
        this.rightCharacter.playAnimationByName('_IDLE')

        this.nextQuestion(this.stateMachine.getQuestion(), true)
      })
      return
    }

    this.timernya = 0
    if (this.cekEnter === 0) {
      this.leftnya = this.stateMachine.getOnEnterLeft() || ''
      this.rightnya = this.stateMachine.getOnEnterRight() || ''
      this.bgnya = this.stateMachine.getOnEnterBg() || ''
      this.leftdonya = this.stateMachine.getOnEnterLeftDo() || ''
      this.rightdonya = this.stateMachine.getOnEnterRightDo() || ''

      if (this.leftdonya !== '') {
        if (this.leftdonya === 'in') {
          this.leftCharacter.scale.x = Math.abs(this.leftCharacter.scale.x)
          this.leftCharacter.x = -300 * game.scaleRatio
          game.add
            .tween(this.leftCharacter)
            .to(
              { x: this.world.width * 0.4 * game.scaleRatio },
              1500,
              Phaser.Easing.Linear.None,
              true,
              0
            )
            .onComplete.add(() => {
              this.leftCharacter.setAnimationSpeedPercent(100)
              this.leftCharacter.playAnimationByName('_IDLE')
            })
        }

        if (this.leftdonya === 'out') {
          this.leftCharacter.scale.x = -Math.abs(this.leftCharacter.scale.x)
          this.leftCharacter.x = this.world.width * 0.4 * game.scaleRatio
          game.add
            .tween(this.leftCharacter)
            .to(
              { x: -300 * game.scaleRatio },
              1500,
              Phaser.Easing.Linear.None,
              true,
              0
            )
            .onComplete.add(() => {
              this.leftCharacter.setAnimationSpeedPercent(100)
              this.leftCharacter.playAnimationByName('_IDLE')
            })
        }
      }

      if (this.rightdonya !== '') {
        if (this.rightdonya === 'in') {
          this.rightCharacter.scale.x = -Math.abs(this.rightCharacter.scale.x)
          this.rightCharacter.x = game.width + 180 * game.scaleRatio
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
        }

        if (this.rightdonya === 'out') {
          this.rightCharacter.scale.x = Math.abs(this.rightCharacter.scale.x)
          this.rightCharacter.x = this.world.width * 0.7 * game.scaleRatio
          game.add
            .tween(this.rightCharacter)
            .to(
              { x: game.width + 180 * game.scaleRatio },
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
        }
      }

      if (this.leftnya !== '') {
        this.leftCharacter.playAnimationByName(this.leftnya)
        this.timernya = 2000
      }

      if (this.rightnya !== '') {
        if (this.rightnya === 'BringFood') {
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

          this.timernya = 2000
        } else {
          this.rightCharacter.playAnimationByName(this.rightnya)
          this.timernya = 2000
        }
      }

      if (this.bgnya !== '') {
        this.bg.gameBackground.loadTexture('bg' + this.bgnya)
      }
    }
	
    this.time.events.add(this.timernya, () => {
      this.leftCharacterSpeak(text)

      if (submitResult) {
        // Hack to move left character back to the right place
        this.time.events.add(this.timeToSpeak(text), () => {
          this.leftCharacter.setAnimationSpeedPercent(100)
          this.leftCharacter.playAnimationByName('_IDLE')
          this.createSideMenu()
          this.deleteButton.visible = true
          this.enterButton.visible = true
          this.textBox.visible = true
          this.repeatButton.visible = true
          this.hintButton.visible = true
        })
      }
    })
  }

  leftCharacterSpeak (text) {
    // If the left character is already talking then stop them
    if (this.isLeftCharacterSpeaking()) {
      this.leftCharacterStopSpeaking()
    }

    this.leftCharacter.setAnimationSpeedPercent(100)
    this.leftCharacter.playAnimationByName('_SAY')
    this.textToSpeach(text, this.phaserJSON.Setup.LeftVoice, this.phaserJSON.Setup.LeftPitch)
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
	
	let timer = this.timeToSpeak(text);
    this.leftCharacterLabel.anchor.setTo(0.5);
	
    this.leftCharacterSpeechTimer = this.time.events.add(timer, () => {
      this.leftCharacter.playAnimationByName('_IDLE')
      this.leftCharacterLabel.kill()
      this.leftCharacterLabel = null
    })
  }
  
  timeToSpeak(text) {
	/*
	An auctioneer speaks at 250 words per minute. 
	Henry Kissinger, in public interviews, speaks at a rate of 90 words per minute. 
	An ideal rate for a face-to-face pitch or conversation is 190 words per minute.
	Assuming 2 words per second with minimun of 4 seconds.
	*/
	
	let speedOfSpeach = 2; // 2 words per second
	let minLenght = 4; // 4 seconds
	
	let words = text.split(' ').length;
	let timetospeak = words / speedOfSpeach;
	timetospeak = timetospeak > minLenght ? timetospeak : minLenght;
	return timetospeak * 1000;
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
	dtml.recordGameEvent(this.phaserJSON.Setup.Name, "repeat", this.stateMachine.getCurrentStateName());
    this.leftCharacterSpeak(
      this.stateMachine.getQuestion()
    )
  }

  showHint () {
    // Get the shortest possible solution with a positive score
    let shortestSolution = null
    for (var key in this.stateMachine.currentState.Solutions) {
        if (key !='default' && (!shortestSolution || key.split(' ').length < shortestSolution.split(' ').length)) {
          shortestSolution = key;
      }
    }

    if (shortestSolution && shortestSolution.length > 0) {	  
	   console.log(shortestSolution);
	   dtml.recordGameEvent(this.phaserJSON.Setup.Name, "hint", this.stateMachine.getCurrentStateName());
      // Remove words that aren't in the shortest solution
      for (let i = this.listView.items.length - 1; i >= 0; i--) {
        let parentGroup = this.listView.items[i]
        for (let j = 0; j < parentGroup.length; j++) {
          if (parentGroup.getChildAt(j).text && !shortestSolution.split(' ').includes(parentGroup.getChildAt(j).text.toLowerCase())) {
            this.listView.remove(parentGroup)
            parentGroup.destroy(true)
          }
        }
      }

      // Flag that we used a hint so we get no score
      this.hintUsed = true
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
    this.hintUsed = false

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
      this.listView.add(parentGroup)
    })

    this.listView.items[this.selection].frame = 1

     }

  destroySideMenu () {
    this.sidemenu.kill()
    this.listView.grp.visible = false
  }

  loadSpriter (key) {
	  console.log(key);
    if (!this.spriterLoader) this.spriterLoader = new Spriter.Loader()

    let spriterFile = new Spriter.SpriterXml(
      game.cache.getXML(key + 'Animations')
    )

    // process loaded xml/json and create internal Spriter objects - these data can be used repeatly for many instances of the same animation
    let spriter = this.spriterLoader.load(spriterFile)
	let entity = spriter._entities["_items"][0].name;
	
    return new Spriter.SpriterGroup(game, spriter, key, entity)
  }
}
