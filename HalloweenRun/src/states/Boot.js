import Phaser from 'phaser'
import WebFont from 'webfontloader'
import config from '../config';

export default class extends Phaser.State {
    init() {
        this.stage.backgroundColor = '#EDEEC9'
        this.fontsReady = false
        this.fontsLoaded = this.fontsLoaded.bind(this)
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.windowConstraints.bottom = 'visual';
        this.game.scale.setResizeCallback(()=> {
            this.scale.setMaximum();
        });
        if (!this.game.device.desktop) {
            this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.scale.minWidth = 300;
            this.scale.minHeight = 100;
            this.scale.maxWidth = window.innerWidth * 2;
            this.scale.maxHeight = window.innerHeight * 2;
        }

        this.scale.pageAlignHorizontally = false;
        this.scale.pageAlignVertically = true;

        this.scale.forceOrientation(true, false);
        this.scale.refresh(true);
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

        let text = this.add.text(this.world.centerX, this.world.centerY, 'loading fonts', { font: '16px Arial', fill: '#dddddd', align: 'center' })
        text.anchor.setTo(0.5, 0.5)

        this.load.image('loaderBg', './assets/images/loader-bg.png')
        this.load.image('loaderBar', './assets/images/loader-bar.png')
    }

    render() {
        if (config.webfonts.length && this.fontsReady) {
            this.state.start('Splash')
        }
        if (!config.webfonts.length) {
            this.state.start('Splash')
        }
    }

    fontsLoaded() {
        this.fontsReady = true
    }
}
