/* globals __DEV__ */
import Phaser from 'phaser'
import lang from '../lang'
import { dtml } from '../dtml-sdk'
import PhaserInput from '../libs/phaser-input'
import utils from '../utils'
import Player from '../sprites/Player'
import Pumpkin from '../sprites/Pumpkin'

export default class extends Phaser.State {
  init () {}

  preload () {
    this.add.plugin(PhaserInput.Plugin)

    // Load levels
    this.levels = [ 'level1', 'level2' ]
    for (let i = 0; i < this.levels.length; i++) {
      this.game.load.tilemap(
        this.levels[i],
        'assets/levels/' + this.levels[i] + '.json',
        null,
        Phaser.Tilemap.TILED_JSON
      )
    }

    this.game.load.image('tiles-1', 'assets/images/tiles-1.png')
    this.game.load.spritesheet('dude', 'assets/images/dude.png', 32, 48)
    this.game.load.spritesheet('pumpkin', 'assets/images/pumpkin.png', 32, 48)
    this.game.load.spritesheet('droid', 'assets/images/droid.png', 32, 32)
    this.game.load.image('starSmall', 'assets/images/star.png')
    this.game.load.image('starBig', 'assets/images/star2.png')
    this.game.load.image('background', 'assets/images/background2.png')
    this.game.load.image('heart', 'assets/images/heart.png')
    this.game.load.spritesheet('bat', 'assets/images/bat.png', 150, 150)
    this.load.spritesheet('letter', 'assets/images/letters.png', 75, 85)
    this.game.load.image('redBorder', 'assets/images/redBorder.png')

    // audio
    this.load.audio(
      'gameMusic',
      'assets/audio/music/music_david_gwyn_jones_teddy_comes_too_instrumental.mp3'
    )
    this.load.audio('click', 'assets/audio/Click.wav')
    this.load.audio('explosion', 'assets/audio/Explosion.wav')
    this.load.audio(
      'blaster',
      'assets/audio/Blastwave_FX_FireballWhoosh_S08FI.42.mp3'
    )
    this.load.audio('hover', 'assets/audio/ButtonHover.wav')
    this.load.audio('steps', 'assets/audio/LandingFootsteps.wav')
    this.load.audio('woosh', 'assets/audio/Whoosh.wav')
  }

  create () {
    let _this = this

    this.batCount = 0
    this.score = 0
    this.game.physics.startSystem(Phaser.Physics.ARCADE)

    this.wordsCompleted = 0
    this.wordsToNextLevel = 5
    this.answerStreak = 0
    this.level = 1

    this.game.stage.backgroundColor = '#000000'
    this.bg = this.game.add.tileSprite(
      0,
      0,
      this.game.width,
      this.game.height,
      'background'
    )
    this.bg.fixedToCamera = true

    let music = game.add.audio('gameMusic')
    music.onDecoded.add(() => {
      music.fadeIn(4000, true)
      this.time.events.add(60000, () => {
        music.fadeOut(1000)
      })
    }, this)

    this.music = music
    this.explosion = game.add.audio('explosion')
    this.blaster = game.add.audio('blaster', 0.5)
    this.woosh = game.add.audio('woosh')
    this.steps = game.add.audio('steps')

    this.loadLevel(this.level - 1)

    this.game.physics.arcade.gravity.y = 1200

    this.player = new Player(game, this, 32, 32, 'dude')
    game.add.existing(this.player)
    this.pumpkins = []
    this.letters = []
    this.bat = {}
    this.maxPumpkins = 10
    this.getChallengeWords(this.level, this.wordsToNextLevel).then(function (result) {
      _this.challengeWords = result
      _this.getNewWord()
    })

    this.hearts = []
    for (let i = 0; i < this.player.hp; i++) {
      this.hearts.push(this.add.image(25 + i * 55, 25, 'heart'))
    }

    this.game.camera.follow(this.player)

    this.cursors = this.game.input.keyboard.createCursorKeys()
    this.jumpButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    this.jumpButton1 = this.game.input.keyboard.addKey(Phaser.Keyboard.E)
    this.leftButton = this.game.input.keyboard.addKey(Phaser.Keyboard.S)
    this.rightButton = this.game.input.keyboard.addKey(Phaser.Keyboard.F)
    this.scoreText = this.game.add.text(780, 30, 'Score: 0', {
      fontSize: '30px',
      fill: '#fff'
    })
    this.scoreText.fixedToCamera = true

    this.addScoreText = new utils({
      game: this.game,
      x: this.world.width * 0.85,
      y: this.game.world.centerY * 0.7,
      text: '0',
      cloudEnabled: true
    })
    this.addScoreText.text.fill = '#ff0000'

    this.currentWordText = new utils({
      game: this.game,
      x: this.world.width * 0.82,
      y: this.game.world.centerY * 0.7,
      text: '0',
      cloudEnabled: true
    })
    this.currentWordText.text.fill = '#ff0000'

    this.redBorder = this.add.image(0, 0, 'redBorder')
    this.redBorder.alpha = 0
  }

  update () {
    if (this.player && this.player.canCollide) {
      this.game.physics.arcade.collide(this.player, this.layer, this.player.collideWithWorld)
      for (let i = this.pumpkins.length - 1; i >= 0; i--) {
        this.game.physics.arcade.collide(
          this.player,
          this.pumpkins[i],
          this.hitPumpkin,
          null,
          this
        )
      }
      for (var j = 0; j < this.batCount; j++) {
        this.game.physics.arcade.collide(
          this.bat[j],
          this.player,
          this.hitBat,
          null,
          this
        )
      }
    }
    for (let i = 0; i < this.batCount; i++) {
      if (this.bat[i].body.blocked.left || this.bat[i].body.blocked.right) {
        this.bat[i].scale.x *= -1
      }
    }
  }

  hitPumpkin (player, pumpkin) {
    // Correct Pumpkin
    if (pumpkin.letter === this.currentWord[this.currentWord.length - 1]) {
      pumpkin.kill()
      this.pumpkins.splice(this.pumpkins.indexOf(pumpkin), 1)

      this.wordsCompleted++
      if (this.wordsCompleted >= this.wordsToNextLevel) {
        this.level++
        this.getChallengeWords(this.level, this.wordsToNextLevel).then((result) => {
          let levelIndex = (this.level - 1) % this.levels.length
          this.loadLevel(levelIndex)
          this.wordsCompleted = 0
          this.challengeWords = result
          this.getNewWord()
        })
      } else {
        this.getNewWord()
      }
    } else { // Incorrect Pumpkin
      pumpkin.kill()
      this.pumpkins.splice(this.pumpkins.indexOf(pumpkin), 1)
      // Spawn bat
      this.addBats()
    }
  }

  hitBat () {
    if (!this.player.invulnerable) {
      this.player.hp -= 1
      if (this.player.hp < 1) {
        this.player.destroy()
        this.player = null
        this.time.events.add(1000, () => {
          this.endGame()
        })
      } else {
        this.player.invulnerable = true
        this.player.alpha = 0.25
        this.time.events.add(1000, () => {
          this.player.invulnerable = false
          this.player.alpha = 1
        })
      }
      this.redBorder.alpha = 1
      this.add.tween(this.redBorder).to({alpha: 0}, 250, 'Linear', true)
      if (this.hearts.length > 0) {
        this.hearts[this.hearts.length - 1].destroy()
        this.hearts = this.hearts.slice(0, -1)
      }
    }
  }

  enterletter (a) {}

  clearTextBoxs () {
    for (var i = 0; i < this.currentWord.length; i++) {
      this.textBox[i].resetText()
      this.textBox[i].hide()
    }
  }

  makePumpkins (numberOfPumpkins, challengeWord) {
    challengeWord = challengeWord || this.currentWord
    let letters = [challengeWord[challengeWord.length - 1]]
    let letterSet = 'abcdefghijklmnopqrstuvwxyz'

    // Choose letters
    for (let i = 0; i < numberOfPumpkins - 1; i++) {
      let newLetter
      do {
        newLetter = letterSet.charAt(Math.floor(Math.random() * letterSet.length))
      } while (letters.indexOf(newLetter) !== -1)
      letters.push(newLetter)
    }

    // Make pumpkins
    this.pumpkins = []
    let spawnLocations = this.pumpkinSpawnLocations.slice()
    for (var i = 0; i < numberOfPumpkins; i++) {
      let random = game.rnd.integerInRange(0, spawnLocations.length - 1)
      let spawnLocation = spawnLocations[random]
      spawnLocations.splice(random, 1)

      let newPumpkin = new Pumpkin(spawnLocation.x, spawnLocation.y, letters[i])
      newPumpkin.anchor.set(0.5, 0.5)

      newPumpkin.alpha = 0
      newPumpkin.letterSprite.alpha = 0
      game.add.tween(newPumpkin).to({ alpha: 1 }, 500, 'Linear', true)
      game.add.tween(newPumpkin.letterSprite).to({ alpha: 1 }, 500, 'Linear', true)

      game.time.events.add(500, function () {
        this.game.physics.enable(
          newPumpkin,
          Phaser.Physics.ARCADE
        )
        newPumpkin.body.allowGravity = false
        this.pumpkins.push(newPumpkin)
      }, this)
    }
  }

  clearPumpkins () {
    for (let i = 0; i < this.pumpkins.length; i++) {
      this.pumpkins[i].kill()
    }
    this.pumpkins = []
  }

  addBats () {
    this.bat[this.batCount] = this.game.add.sprite(800, 160, 'bat')
    this.bat[this.batCount].animations.add(
      'bat',
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      10,
      true
    )
    this.bat[this.batCount].animations.play('bat')
    this.bat[this.batCount].scale.setTo(0.5, 0.5)
    this.game.physics.enable(this.bat[this.batCount], Phaser.Physics.ARCADE)
    this.bat[this.batCount].body.setSize(30, 30, 60, 60)
    this.bat[this.batCount].body.allowGravity = false
    this.bat[this.batCount].body.velocity.x = -Math.floor(Math.random() * 400)
    this.bat[this.batCount].body.velocity.y = Math.floor(Math.random() * 100)
    this.bat[this.batCount].body.collideWorldBounds = true
    this.bat[this.batCount].anchor.setTo(0.5, 0.5)
    this.bat[this.batCount].body.bounce.setTo(1, 1)
    this.batCount++
  }

  getNewWord () {
    this.currentWord = this.challengeWords[this.wordsCompleted]
    this.clearPumpkins()
    this.makePumpkins(5)
    this.renderWords(this.currentWord)
  }

  getChallengeWords (complexity, numberOfWords) {
    return new Promise(function (resolve, reject) {
      dtml.getWords(complexity, (data, sender) => {
        if (data) {
          let words = data.words.slice(0, numberOfWords)
          resolve(words)
        } else {
          reject(new Error('Could not fetch words from server'))
        }
      })
    })
  }

  removeObsoleteUI () {
    if (this.letterBoxes) {
      for (let i = 0; i < this.letterBoxes.length; i++) {
        this.letterBoxes[i].kill()
      }
    }
    if (this.letters) {
      for (let i = 0; i < this.letters.length; i++) {
        this.letters[i].kill()
      }
    }
  }

  // data is the input word that will display
  // letter is the buttons
  renderWords (newWord) {
    this.removeObsoleteUI(this)
    this.letterBoxes = []
    this.letters = []

    for (var i = 0; i < newWord.length; i++) {
      let buttonX = game.world.centerX + (i - ((newWord.length - 1) / 2)) * 80
      this.letterBoxes[i] = this.game.add.button(
        buttonX,
        60,
        'letter',
        this.enterletter,
        this
      )
      this.letterBoxes[i].fixedToCamera = true
      this.letterBoxes[i].anchor.set(0.5, 0.5)

      if (i < newWord.length - 1) {
        this.letters[i] = this.add.text(buttonX, 60, this.currentWord[i], {
          font: '40px Arial',
          fontWeight: 'bold',
          width: 40,
          padding: 8,
          fill: '#fff',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#000',
          borderRadius: 6,
          placeHolder: '',
          focusOutOnEnter: false,
          textAlign: 'center',
          max: 1
        })
        this.letters[i].fixedToCamera = true
        this.letters[i].anchor.set(0.5, 0.5)
      }
    }
  }

  getSpawnLocations (objectLayer) {
    let locations = []
    for (let i = 0; i < objectLayer.length; i++) {
      locations.push({x: objectLayer[i].x, y: objectLayer[i].y})
    }
    return locations
  }

  loadLevel (index) {
    if (this.layer && this.map) {
      this.layer.destroy()
      this.map.destroy()
    }

    this.map = this.game.add.tilemap(this.levels[index])

    this.map.addTilesetImage('tiles-1')

    this.map.setCollisionByExclusion([13, 14, 15, 16, 46, 47, 48, 49, 50, 51])
    this.layer = this.map.createLayer('Tile Layer 1')

    this.pumpkinSpawnLocations = this.getSpawnLocations(this.map.objects['SpawnLocations'])

    this.layer.resizeWorld()

    // Move player to a random spawn location
    if (this.player) {
      let _this = this
      let random = game.rnd.integerInRange(0, this.pumpkinSpawnLocations.length - 1)
      let spawn = this.pumpkinSpawnLocations[random]
      let star = this.add.sprite(this.player.x, this.player.y, 'starBig')
      star.anchor.set(0.5, 0.5)
      let starEmitter = this.add.emitter(star.x, star.y)
      starEmitter.makeParticles('starSmall')
      starEmitter.start(false, 2000, 20)

      this.player.alpha = 0
      this.player.canMove = false
      this.player.canCollide = false
      this.player.body.allowGravity = false
      this.player.body.x = spawn.x
      this.player.body.y = spawn.y - 20
      this.player.x = spawn.x
      this.player.y = spawn.y - 20
      this.player.body.velocity.x = 0
      this.player.body.velocity.y = 0
      this.add.tween(star).to({ x: this.player.body.x, y: this.player.body.y }, 500, Phaser.Easing.Quadratic.InOut, true).onComplete.add(() => {
        _this.player.canMove = true
        _this.player.canCollide = true
        _this.player.body.velocity.x = 0
        _this.player.body.velocity.y = 0
        _this.player.body.allowGravity = true
        _this.player.alpha = 1
        star.destroy()
      })
      this.add.tween(starEmitter).to({ x: this.player.body.x, y: this.player.body.y }, 500, Phaser.Easing.Quadratic.InOut, true).onComplete.add(() => {
        starEmitter.on = false
        _this.time.events.add(2000, () => {
          starEmitter.destroy()
        })
      })
    }
  }

  render () {}

  endGame () {
    this.currentWord = ''
    this.music.destroy()
    this.currentWordText.hide()
    this.game.state.start('GameOver', true, false, this.score)
  }

  autoFocusIn () {
    this.inputIndex = arguments[0] + 1
    this.game.input.keyboard.addCallbacks(
      this,
      null,
      null,
      this.keyPressFocusIn
    )
  }

  autoFocusOut () {
    this.inputIndex = arguments[0] + 1
    this.game.input.keyboard.addCallbacks(
      this,
      null,
      null,
      this.keyPressFocusOut
    )
  }

  keyPressFocusIn () {
    if (this.inputIndex < this.currentWord.length) {
      this.textBox[this.inputIndex].startFocus()
    }
  }

  keyPressFocusOut () {
    if (this.inputIndex < this.currentWord.length) {
      this.textBox[this.inputIndex].endFocus()
    }
  }
}
