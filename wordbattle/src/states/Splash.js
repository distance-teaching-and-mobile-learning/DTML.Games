import Phaser from 'phaser'
import {centerGameObjects} from '../utils'
import PhaserInput from '../libs/phaser-input'
import PhaserJuicy from '../libs/juicy'
import {flags, languages} from '../sprites/Flags'

export default class extends Phaser.State {
    init() {
    }

    preload() {
        //this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBg')
        this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBar')
        centerGameObjects([this.loaderBar])

        this.load.setPreloadSprite(this.loaderBar)

        this.load.onLoadStart.add(this.loadStart, this);
        this.load.onFileComplete.add(this.fileComplete, this);
        this.load.onLoadComplete.add(this.loadComplete, this);

        this.add.plugin(PhaserInput.Plugin);
        this.add.plugin(PhaserJuicy);
        this.game.juicy = this.add.plugin(new PhaserJuicy(this))
        //
        // load your assets
        //
        // this.load.video('intro', 'assets/videos/intro.webm');
        this.load.image('mushroom', 'assets/images/mushroom2.png')
        // this.load.image('bg', 'assets/images/forest01_preview-01.png')
        this.load.atlas('wizard', 'assets/images/wizard/atlas.png', 'assets/images/wizard/atlas.json')
        this.load.xml('wizardAnimations', 'assets/images/wizard/animations.scml')

        this.load.atlas('gnome', 'assets/images/gnome2/atlas.png', 'assets/images/gnome2/atlas.json')
        this.load.xml('gnomeAnimations', 'assets/images/gnome2/animations.scml')

        this.load.atlas('fireball', 'assets/images/fire/atlas.png', 'assets/images/fire/atlas.json');
        this.load.image('iconAttack', 'assets/images/icon-attack.png');
        this.load.image('iconHome', 'assets/images/icon-home.png');

        // bg
        this.load.image('bg1', 'assets/images/layers/l1_background.png')
        this.load.image('bg2', 'assets/images/layers/l2_trees01.png')
        this.load.image('bg3', 'assets/images/layers/l3_bush01.png')
        this.load.image('bg4', 'assets/images/layers/l4_trees02.png')
        this.load.image('bg5', 'assets/images/layers/l5_trees03.png')
        this.load.image('bg6', 'assets/images/layers/l6_bush02.png')
        this.load.image('bg7', 'assets/images/layers/l7_ground.png')
        this.load.image('horsey', 'assets/images/alex-bisleys_horsy_512x512.png')

        // audio
        this.load.audio('gameMusic', 'assets/audio/music/music_david_gwyn_jones_teddy_comes_too_instrumental.mp3')
        this.load.audio('click', 'assets/audio/Click.wav')
        this.load.audio('explosion', 'assets/audio/Explosion.wav')
        this.load.audio('blaster', 'assets/audio/Blastwave_FX_FireballWhoosh_S08FI.42.mp3')
        this.load.audio('hover', 'assets/audio/ButtonHover.wav')
        this.load.audio('steps', 'assets/audio/LandingFootsteps.wav')
        this.load.audio('woosh', 'assets/audio/Whoosh.wav')

        Object.keys(flags).forEach((name, idx)=>{
            this.load.image(name, 'assets/images/flags/' + flags[name] + '.png');
        });

        // this.load.atlas('flags', 'assets/images/flags.png', 'assets/images/flags.json')

        this.load.spritesheet('heart', 'assets/images/ss-heart.png', 48, 48, 6)
    }

    loadStart() {
        this.loadingText = this.add.text(20, this.world.height - 32, 'Loading...', {
            font: '20px Arial',
            fill: '#ffffff'
        });
    }

    fileComplete(progress, cacheKey, success, totalLoaded, totalFiles) {
        this.loadingText.setText('File Complete: ' + progress + '% - ' + totalLoaded + ' out of ' + totalFiles);
        // console.log('totalLoaded', totalLoaded)
    }

    loadComplete() {
        game.world.remove(this.loadingText);

        this.time.advancedTiming = true;

        // let video = this.add.video('intro');
        // video.play(false);
        // //  x, y, anchor x, anchor y, scale x, scale y
        // video.addToWorld(game.world.centerX, game.world.centerY, 0.5, 0.5, 0.5, 0.5);
        let videoDuration = 0
        this.time.events.add(Phaser.Timer.SECOND * videoDuration, () => {
            document.querySelector('#intro').style.display = 'none'
            document.querySelector('#content').style.display = 'block'
            this.state.start('Menu')
            // this.state.start('Game')
            //   video.destroy()

        }, this)
    }

    create() {

    }
}
