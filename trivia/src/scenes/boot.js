import Config from '../config.json'

export default class BootScene extends Phaser.Scene {

  constructor () {
    super({key: 'boot'})
  }

  preload () {

    // Set background to black
    this.cameras.main.setBackgroundColor('0x000000')

    // Google webfont
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // DTMl Intro Video
    // let introVideo = require('../assets/video/intro.webm')
    // this.load.video('intro', introVideo)

    // DTML Logo
    let dtmlLogo = require('../assets/images/logobackground.png')
    this.load.image('dtmlLogo', dtmlLogo)

  }

  create () {

    let centerX = this.cameras.main.width / 2
    let centerY = this.cameras.main.height / 2

    // Set the user language
    this.game.userLanguage = window.navigator.userLanguage || window.navigator.language || 'en-US'
    this.game.configFile = Config
    this.game.localizedText = Config.languages[this.game.userLanguage]

    // Wait for fonts to load
    let _this = this
    WebFont.load({
      google: {
        families: ['Acme']
      },
      active: function () {
        // Start loading scene
        _this.fontsLoaded = true
      }
    })

    // Play DTML video
    // let introVideo = this.add.video(centerX, centerY, 'intro')
    // introVideo.setMute(true)
    // introVideo.play(false)
    // introVideo.on('complete', function () {
    //   this.videoDone = true
    // }, this)

  }

  update () {

    if (this.fontsLoaded) {
      this.scene.start('load')
    }

  }

}