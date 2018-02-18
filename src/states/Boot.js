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

    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    // / this.scale.startFullScreen(false);

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
