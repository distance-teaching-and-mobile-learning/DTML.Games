import Phaser from 'phaser'


export default class extends Phaser.State {
    preload() {
        this.logo = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        this.logo.x -= this.logo.width*0.5;
        this.logo.y -= this.logo.height;

        this.preloadBarbg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'preloaderBar');
        this.preloadBarbg.x -= this.preloadBarbg.width*0.5;

        this.preloadBar = this.add.sprite(this.game.world.centerX, this.preloadBarbg.y, 'preloaderBar2');
        this.preloadBar.alignIn(this.preloadBarbg, Phaser.CENTER, 0, 0);
        this.load.setPreloadSprite(this.preloadBarbg);
        
        this.load.video('intro', ['assets/video/intro.ogv','assets/video/intro.webm','assets/video/intro.mp4']);
        this.load.audio('boton', ['assets/audio/boton.ogg', 'assets/audio/boton.acc']);
        this.load.audio('you','assets/audio/you.ogg');
        this.load.audio('father','assets/audio/father.ogg');
        this.load.audio('mother','assets/audio/mother.ogg');
        this.load.audio('stepfather','assets/audio/stepfather.ogg');
        this.load.audio('stepmother','assets/audio/stepmother.ogg');
        this.load.audio('brother','assets/audio/brother.ogg');
        this.load.audio('sister','assets/audio/sister.ogg');
        this.load.audio('stepbrother','assets/audio/stepbrother.ogg');
        this.load.audio('stepsister','assets/audio/stepsister.ogg');
        this.load.audio('uncle','assets/audio/uncle.ogg');
        this.load.audio('aunt','assets/audio/aunt.ogg');
        this.load.audio('grandfather','assets/audio/grandfather.ogg');
        this.load.audio('grandmother','assets/audio/grandmother.ogg');
        this.load.audio('grandgrandfather','assets/audio/grandgrandfather.ogg');
        this.load.audio('grandgrandmother','assets/audio/grandgrandmother.ogg');
        this.load.image('fondo', 'assets/bg.png');
        this.load.image('title', 'assets/title.png');
        this.load.image('sidemenu', 'assets/sidemenu.png');
        this.load.image('bottommenu', 'assets/bottommenu.png');
        this.load.image('voice', 'assets/voice.png');
        this.load.image('erase', 'assets/erase.png');
        this.load.image('treebg', 'assets/treebg.png');
        this.load.spritesheet('openMenu', 'assets/openMenu.png',64,64);
        this.load.spritesheet('genre', 'assets/genre.png',32,32);
        this.load.spritesheet('sidebg', 'assets/sidebg.png',115,117);
        this.load.spritesheet('boygirl', 'assets/boygirl.png',96,128);
        this.load.spritesheet('sharebtn', 'assets/sharebtn.png',128,48);
        this.load.spritesheet('button', 'assets/button.png',175,85);
        this.load.spritesheet('characters', 'assets/characters.png', 96, 128);
    }

    create() {
        this.preloadBar.cropEnabled = false;
        this.state.start('Game');
    }
}