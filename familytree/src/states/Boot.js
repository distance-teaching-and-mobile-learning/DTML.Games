

import Phaser from 'phaser'
import WebFont from 'webfontloader'
import StateTransition from '../libs/phaser-state-transition-plugin'
import config from '../config';


export default class extends Phaser.State {
    init() {
        this.firstRunLandscape = game.scale.isLandscape ;
        this.game.camera.roundPx = false;
        this.input.maxPointers = 1;
        this.game.input.addPointer();
 	               this.game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;

        if (!this.game.device.desktop){
            this.game.scale.forceOrientation(true, false);
            //this.game.scale.enterIncorrectOrientation.add(this.handleIncorrect,this);
            //this.game.scale.leaveIncorrectOrientation.add(this.handleCorrect,this);
            this.game.scale.setScreenSize = true;
            this.game.stage.scale.pageAlignHorizontally = true;
            this.game.stage.scale.pageAlignVeritcally = true;
        }

        this.fontsReady = false
        this.fontsLoaded = this.fontsLoaded.bind(this);
    }

     handleIncorrect() {
        if (!game.device.desktop) {
            this.game.world.visible = false;
            alert("Please use Landscape");
            game.paused = true;
        }
    }
     
    handleCorrect() {
        if (!game.device.desktop) {
            this.game.world.visible = true;
            game.paused = false;
            if (!this.game.device.desktop){ 
                 this.game.scale.setShowAll();
                 this.game.scale.refresh();
                 this.game.scale.setMaximum();
                 this.scale.setScreenSize(true);
                 this.game.scale.startFullScreen(false);
            }
        }
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