import Phaser from 'phaser'
import WebFont from 'webfontloader'
import config from '../config';

export default class extends Phaser.State {
  init() {
    console.log('starting')
    this.stage.backgroundColor = '#000000'
    this.fontsReady = false
    this.fontsLoaded = this.fontsLoaded.bind(this)
  }

  preload() {
    if (config.webfonts.length) {
      WebFont.load({
        google: {
          families: config.webfonts
        },
        active: this.fontsLoaded
      })
    }

    // let text = this.add.text(this.world.centerX, this.world.centerY, 'loading fonts', { font: '16px Arial', fill: '#dddddd', align: 'center' })
    // text.anchor.setTo(0.5, 0.5)
    console.log('starting')
    this.load.image('loaderBg', './assets/images/logobackground.png')
    this.load.image('loaderBar', './assets/images/loading-logo.png')

    // this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL               //Shows the entire game while maintaining proportions
    // this.scale.pageAlignVertically = true
    // this.scale.pageAlignHorizontally = true
    // this.scale.setShowAll()
    // this.scale.refresh()

    let scale_ratio;
    let canvas_height_max = 900;
    let canvas_width_max = 1140;
    let width = window.screen.availWidth * window.devicePixelRatio
    let height = window.screen.availHeight * window.devicePixelRatio
    let aspect_ratio = width / height
    if (aspect_ratio < 1) game.scaleRatio = game.height / canvas_height_max
    else game.scaleRatio = game.width / canvas_width_max

    if (!this.game.device.desktop)                                     //In mobile force the orientation
    {
        this.scale.forceOrientation(true, false);
        //this.scale.enterIncorrectOrientation.add(this.enterIncorrectOrientation, this);
        //this.scale.leaveIncorrectOrientation.add(this.leaveIncorrectOrientation, this);
    }

    this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
    // this.game.scale.setMaximum();
    //this.scale.setScreenSize(true);
    // this.scale.startFullScreen(false);
  }

  render() {
    if (config.webfonts.length && this.fontsReady) {
      this.state.start('Splash')
    }
    if (!config.webfonts.length) {
      this.state.start('Splash')
    }
    this.state.start('Splash')
  }

  fontsLoaded() {
    this.fontsReady = true
  }
}
