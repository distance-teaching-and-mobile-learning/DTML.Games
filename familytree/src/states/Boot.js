

import Phaser from 'phaser'
import WebFont from 'webfontloader'
import StateTransition from '../libs/phaser-state-transition-plugin'
import config from '../config';


export default class extends Phaser.State {
    init() {
        if (!this.game.device.desktop) {
            this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.game.scale.minWidth = 300;
            this.game.scale.minHeight = 100;
            this.game.scale.maxWidth = window.innerWidth * 2;
            this.game.scale.maxHeight = window.innerHeight * 2;
        }

        this.scale.pageAlignHorizontally = false;
        this.scale.pageAlignVertically = true;

        this.scale.forceOrientation(true, false);
        this.scale.refresh(true);

        this.fontsReady = false;
        this.fontsLoaded = this.fontsLoaded.bind(this);
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

        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.maxHeight = window.innerHeight;
        this.game.scale.maxWidth = window.innerHeight * (this.game.world.width/ this.game.world.height);

        let scale_ratio;
        let canvas_height_max = 900;
        let canvas_width_max = 1140;
        let width = this.game.world.width;//window.screen.availWidth * window.devicePixelRatio
        let height = this.game.world.height;//window.screen.availHeight * window.devicePixelRatio
        game.aspectRatio = 1//width / height;
        game.scaleRatio = game.width / canvas_width_max;

        console.log('game dimension: ', game.width, 'x', game.height, 'height * scaleRatio', game.height * game.scaleRatio)
        if (game.aspectRatio < 1) {
            game.scale.setGameSize(game.width, game.height * game.scaleRatio)
        } else {
            game.scale.setGameSize(game.width, game.height)
        }

        game.canvas.oncontextmenu = function (e) {
            e.preventDefault();
        }

    	this.load.image('logo', 'assets/logo.png');
        this.load.image('preloaderBar', 'assets/loading-bar.png');
        this.load.image('preloaderBar2', 'assets/loading-bar2.png');
    }

    create() {
        this.game.stateTransition = this.game.plugins.add(Phaser.Plugin.StateTransition);
        this.game.stateTransition.configure({
            duration: Phaser.Timer.SECOND * 1.5,
            ease: Phaser.Easing.Exponential.Out,
            properties: {
                alpha: 0
            }
        });
    }

    render() {
        if (config.webfonts.length && this.fontsReady) {
          this.state.start('Preloader')
        }
        if (!config.webfonts.length) {
          this.state.start('Preloader')
        }
        this.state.start('Preloader')
    }

    fontsLoaded() {
        this.fontsReady = true
    }
}