/* globals __DEV__ */
import Phaser from 'phaser'
import lang from '../lang'
import {dtml} from '../dtml-sdk'
import PhaserInput from '../libs/phaser-input'
import utils from '../utils'

export default class extends Phaser.State {

    init()
    {

    }

    preload()
    {
        this.add.plugin(PhaserInput.Plugin);
        this.game.load.tilemap('level1', 'assets/images/level1.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image('tiles-1', 'assets/images/tiles-1.png');
        this.game.load.spritesheet('dude', 'assets/images/dude.png', 32, 48);
        this.game.load.spritesheet('pumpkin', 'assets/images/pumpkin.png', 32, 48);
        this.game.load.spritesheet('droid', 'assets/images/droid.png', 32, 32);
        this.game.load.image('starSmall', 'assets/images/star.png');
        this.game.load.image('starBig', 'assets/images/star2.png');
        this.game.load.image('background', 'assets/images/background2.png');
        this.game.load.spritesheet('bat', 'assets/images/bat.png', 150, 150);
        this.load.spritesheet('letter', 'assets/images/letters.png',75,85);

        // audio
        this.load.audio('gameMusic', 'assets/audio/music/music_david_gwyn_jones_teddy_comes_too_instrumental.mp3')
        this.load.audio('click', 'assets/audio/Click.wav')
        this.load.audio('explosion', 'assets/audio/Explosion.wav')
        this.load.audio('blaster', 'assets/audio/Blastwave_FX_FireballWhoosh_S08FI.42.mp3')
        this.load.audio('hover', 'assets/audio/ButtonHover.wav')
        this.load.audio('steps', 'assets/audio/LandingFootsteps.wav')
        this.load.audio('woosh', 'assets/audio/Whoosh.wav')
    }

    create()
    {
        this.inputIndex;
        this.batCount = 0;
        this.pumpkinHitCount = 0;
        this.facing = 'right';
        this.jumpTimer = 0;
        this.score = 0;
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.game.stage.backgroundColor = '#000000';
        this.bg = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'background');
        this.bg.fixedToCamera = true;
        
        let music = game.add.audio('gameMusic');
        music.onDecoded.add(() => {
            music.fadeIn(4000, true);
            this.time.events.add(60000, () => {
                music.fadeOut(1000);
            })
        }, this);

        this.music = music;
        this.explosion = game.add.audio('explosion');
        this.blaster = game.add.audio('blaster', 0.5);
        this.woosh = game.add.audio('woosh');
        this.steps = game.add.audio('steps');

        this.map = this.game.add.tilemap('level1');

        this.map.addTilesetImage('tiles-1');

        this.map.setCollisionByExclusion([ 13, 14, 15, 16, 46, 47, 48, 49, 50, 51 ]);
        this.layer = this.map.createLayer('Tile Layer 1');

        this.layer.resizeWorld();

        this.game.physics.arcade.gravity.y = 250;

        this.player = game.add.sprite(32, 32, 'dude');
        this.pumpkin = {};
        this.letters = {};
        this.bat = {};
        this.maxPumpkins = 10;
        this.pumpkinCount = 0;
        this.addPumpkins(this.maxPumpkins);
        this.game.physics.enable(this.player, Phaser.Physics.ARCADE);

        this.player.body.bounce.y = 0.2;
        this.player.body.collideWorldBounds = true;
        this.player.body.setSize(20, 32, 5, 16);


        this.player.animations.add('left', [0, 1, 2, 3], 10, true);
        this.player.animations.add('turn', [4], 20, true);
        this.player.animations.add('right', [5, 6, 7, 8], 10, true);
        
        this.game.camera.follow(this.player);

        this.cursors =  this.game.input.keyboard.createCursorKeys();
        this.jumpButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.jumpButton1 = this.game.input.keyboard.addKey(Phaser.Keyboard.E);
        this.leftButton = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.rightButton = this.game.input.keyboard.addKey(Phaser.Keyboard.F);
        dtml.getWords(1, this.renderwords, this);
        this.scoreText = this.game.add.text(780, 30, 'Score: 0', { fontSize: '30px', fill: '#fff' });
        this.scoreText.fixedToCamera = true;
        
        this.addScoreText = new utils({
            game: this.game,
            x: this.world.width * 0.85,
            y: this.game.world.centerY * 0.7,
            text: '0',
            cloudEnabled: true
        });
        this.addScoreText.text.fill = "#ff0000";

        this.currentWordText = new utils({
            game: this.game,
            x: this.world.width * 0.82,
            y: this.game.world.centerY * 0.7,
            text: '0',
            cloudEnabled: true
        });
        this.currentWordText.text.fill = "#ff0000";
    }

    update() {
        this.game.physics.arcade.collide(this.player, this.layer);
        for(var j = 0; j < this.batCount; j++) {
            this.game.physics.arcade.collide(this.bat[j], this.player, this.hitBat, null, this);
        }
        for(var i = 0; i < this.maxPumpkins; i++)
        {
            this.game.physics.arcade.collide(this.pumpkin[i], this.layer);
            this.game.physics.arcade.collide(this.player, this.pumpkin[i], this.hitPumpkin, null, this);
            for(var j = 0; j < this.maxPumpkins; j++)
            {
                if (j != i)
                {
                    this.game.physics.arcade.collide(this.pumpkin[j], this.pumpkin[i]);
                }
            }
        }

        this.player.body.velocity.x = 0;
        if (this.leftButton.isDown || this.cursors.left.isDown)
        {
            this.player.body.velocity.x = -150;

            if (this.facing != 'left')
            {
                this.player.animations.play('left');
                this.facing = 'left';
            }
        }
        else if (this.rightButton.isDown || this.cursors.right.isDown)
        {
            this.player.body.velocity.x = 150;

            if (this.facing != 'right')
            {
                this.player.animations.play('right');
                this.facing = 'right';
            }
        }
        else
        {
            if (this.facing != 'idle')
            {
                this.player.animations.stop();

                if (this.facing == 'left')
                {
                    this.player.frame = 0;
                }
                else
                {
                    this.player.frame = 5;
                }

                this.facing = 'idle';
            }
        }

        if (this.jumpButton.isDown && this.game.time.now > this.jumpTimer || this.jumpButton1.isDown && this.game.time.now > this.jumpTimer )
        {
            this.player.body.velocity.y = -250;
            this.jumpTimer = this.game.time.now + 750;
        }
    }

    hitPumpkin(player, pumpkin)
    {

        var wordLength = this.currentWord.length;

        if (this.pumpkinHitCount < wordLength - 1)
        {
            this.textBox[this.pumpkinHitCount].setText(this.currentWord[this.pumpkinHitCount]);
            this.textBox[this.pumpkinHitCount].inputEnabled = false;
            pumpkin.kill();
            this.pumpkinHitCount++;
        }
        else
        {
            // this.reloadPumpkins();
            // this.getNewWord();
        }
    }

    hitBat()
    {
        this.killPlayer(this.player);
    }

    enterletter(a)
    {

    }

    submitAnswer(a)
    {
        var fail = false;

        for(var i = 0; i < this.currentWord.length; i++)
        {
            if(this.textBox[i].value != this.currentWord[i])
            {
                fail = true;
                break;
            }
        }

        this.clearTextBoxs();
        if (!fail)
        {
            this.score += 10 * (this.currentWord.length - this.pumpkinHitCount);
            this.scoreText.text = 'Score: ' + this.score.toString();
            this.addScoreText.changeText('+' + 10 * (this.currentWord.length - this.pumpkinHitCount));
            this.addScoreText.showTick()
        }
        else
        {
            this.addBats();
            this.currentWordText.changeText(this.currentWord);
            this.currentWordText.showTick()
        }

        this.reloadPumpkins();
        this.getNewWord();
    }

    clearTextBoxs() {
        for(var i = 0; i < this.currentWord.length; i++)
        {
            this.textBox[i].resetText();
            this.textBox[i].hide;
        }
    }

    addPumpkins(numberOfPumpkins) {
        for(var i = 0; i < numberOfPumpkins; i++)
        {
            this.pumpkin[this.pumpkinCount] = this.game.add.sprite(32, 32, 'pumpkin');
            var x;
            if (this.pumpkinCount <= 9) {
                x = 160+88*(this.pumpkinCount%10);
            }
            else
            {
                x = game.rnd.integerInRange(0, 760);
            }

            this.pumpkin[this.pumpkinCount].x = x;
            this.game.physics.enable(this.pumpkin[this.pumpkinCount], Phaser.Physics.ARCADE);
            this.pumpkin[this.pumpkinCount].body.collideWorldBounds = true;
            this.pumpkin[this.pumpkinCount].body.bounce.y = 0.1;
            this.pumpkin[this.pumpkinCount].body.bounce.x = 0.1;
            this.pumpkinCount++;
        }
    }

    addBats()
    {
        this.bat[this.batCount] = this.game.add.sprite(800, 160, 'bat');
        this.bat[this.batCount].animations.add('bat', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 10, true);
        this.bat[this.batCount].animations.play('bat');
        this.bat[this.batCount].scale.setTo(0.5, 0.5);
        this.game.physics.enable(this.bat[this.batCount], Phaser.Physics.ARCADE);
        this.bat[this.batCount].body.allowGravity = false;
        this.bat[this.batCount].body.velocity.x=-Math.floor(Math.random() * 400);
        this.bat[this.batCount].body.velocity.y=Math.floor(Math.random() * 100);
        this.bat[this.batCount].body.collideWorldBounds = true;
        this.bat[this.batCount].body.bounce.set(1);
        this.reloadPumpkins();
        this.batCount++;
    }

    reloadPumpkins()
    {
        // refill all the hit pumpkins
        this.addPumpkins(this.pumpkinHitCount);
        this.maxPumpkins += this.pumpkinHitCount;
        this.pumpkinHitCount = 0;
    }

    getNewWord()
    {
        dtml.getWords(1, this.renderwords, this);
    }

    removeObsoleteUI(that)
    {
        if (that.sumbmitbutton)
        {
            that.sumbmitbutton.kill();
        }
        if (that.sumbmitbuttonText)
        {
            that.sumbmitbuttonText.kill();
        }
        // If we can figure out how to update their position,
        // we don't need to kill them, just hide\reposition some components
        if (that.currentWord)
        {
            for(var i = 0; i < that.currentWord.length; i++)
            {
                that.letters[i].kill();
                that.textBox[i].kill();
            }
        }
    }

    // data is the input word that will display
    // letter is the buttons
    renderwords(data, that)
    {
        that.wordsForLearning = data;
        //If word length is greater than 6 then generate another word
        var j = 0;
        that.removeObsoleteUI(that);
        that.textBox = {};
        that.letters =  {};

        while(data.words[j].length > 6 || data.words[j].length < 3)
        {
            j++;
        }

        that.currentWord = data.words[j];

        for(var i = 0; i < that.currentWord.length; i++)
        {
            that.letters[i] = that.game.add.button(80+80*i, 10, 'letter', that.enterletter, that,1,0,0,0);
            that.textBox[i] = that.add.inputField(80+80*i+10, 20, {
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
                textAlign:'center',
                max: 1,
            });
            that.textBox[i].focusIn.add(that.autoFocusIn, that, 0, i);
            that.textBox[i].focusOut.add(that.autoFocusOut, that, 0, i);
            that.letters[i].fixedToCamera = true;
            that.textBox[i].fixedToCamera = true;
        }
        that.sumbmitbutton = that.game.add.button(80*(data.words[j].length+1), 10, 'button', that.submitAnswer, that,1,0,0,0);
        that.sumbmitbuttonText = that.game.add.text(that.sumbmitbutton.x+30, that.sumbmitbutton.y+20, "Submit", { font: "30px sans-serif", fill: "#ffffff", stroke:"#000000", strokeThickness:"6"      });
        that.sumbmitbutton.fixedToCamera = true;
        that.sumbmitbuttonText.fixedToCamera = true;
    }

    render()
    {
        
    }

    killPlayer(player)
    {
        player.kill();
        this.currentWord = '';
        this.music.destroy();
        this.currentWordText.hide();
        this.game.state.start('GameOver', true, false, this.score);
    }
    
    autoFocusIn()
    {
        this.inputIndex = arguments[0] + 1;
        this.game.input.keyboard.addCallbacks(this, null, null, this.keyPressFocusIn);
    }

    autoFocusOut()
    {
        this.inputIndex = arguments[0] + 1;
        this.game.input.keyboard.addCallbacks(this, null, null, this.keyPressFocusOut);
    }

    keyPressFocusIn()
    {
        if(this.inputIndex < this.currentWord.length)
        {
            this.textBox[this.inputIndex].startFocus();
        }
    }

    keyPressFocusOut()
    {
        if(this.inputIndex < this.currentWord.length)
        {
            this.textBox[this.inputIndex].endFocus();
        }
    }
}