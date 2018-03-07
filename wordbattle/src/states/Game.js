/* globals __DEV__ */
import Phaser from 'phaser'
import FreeText from '../sprites/FreeText'
import Spriter from '../libs/spriter'
import Background from '../sprites/background'

export default class extends Phaser.State {
    init() {
        this.wizDead = false;
        this.restartEntered = false;
        this.questionField = null;
    }

    create() {
        this.language = this.game.state.states['Game']._language;
        this.langCode = this.game.state.states['Game']._langCode;
        let bg = new Background({game: this.game});

        let music = game.add.audio('gameMusic');
        music.onDecoded.add(() => {
            music.fadeIn(4000);
            this.time.events.add(25000, () => {
                music.fadeOut(4000);
            })
        }, this);

        this.music = music;
        this.explosion = game.add.audio('explosion');
        this.blaster = game.add.audio('blaster', 0.5);
        this.woosh = game.add.audio('woosh');
        this.steps = game.add.audio('steps');

        this.spritesGroup = this.add.group();

        this.wiz = this.loadSpriter('wizard');
        this.wiz.scale.set(0.20 * game.scaleRatio);
        this.wiz.x = -180 * game.scaleRatio;
        this.wiz.y = this.world.height * 0.65 * game.scaleRatio;
        this.spritesGroup.add(this.wiz);

        this.gnome = this.loadSpriter('gnome');
        this.gnome.scale.set(-0.33 * game.scaleRatio, 0.33 * game.scaleRatio);

        this.gnome.children.forEach(sprite => {
            sprite.anchor.set(0, 1)
        });

        this.gnome.x = game.width + 180 * game.scaleRatio;
        this.gnome.startx = this.world.width * 0.75 * game.scaleRatio;
        this.gnome.y = this.world.height * 0.73 * game.scaleRatio;
        this.gnome.setAnimationSpeedPercent(40);
        this.gnome.playAnimationByName('_IDLE');
        this.spritesGroup.add(this.gnome);

        // intro sequence
        this.wiz.setAnimationSpeedPercent(200);
        this.wiz.playAnimationByName('_RUN');
        game.add.tween(this.wiz).to({x: this.world.width * 0.25 * game.scaleRatio}, 1500, Phaser.Easing.Linear.None, true, 1500)
            .onComplete.add(() => {
            this.wiz.setAnimationSpeedPercent(30);
            this.wiz.playAnimationByName('_IDLE');
        });

        this.gnome.setAnimationSpeedPercent(200);
        this.gnome.playAnimationByName('_RUN');
        game.add.tween(this.gnome).to({x: this.world.width * 0.75 * game.scaleRatio}, 1500, Phaser.Easing.Linear.None, true, 1500)
            .onComplete.add(() => {
            this.gnome.setAnimationSpeedPercent(30);
            this.gnome.playAnimationByName('_IDLE');

            let iconHome = this.createIcon(this.game.world.centerX * 0.1, this.game.world.centerY * 0.15, 'iconHome')
            iconHome.scale.set(0.3);
            iconHome.anchor.setTo(0.5);
            iconHome.inputEnabled = true;
            iconHome.events.onInputDown.add(() => {
                this.state.start('Menu')
            })

            var label = game.add.text(this.world.width * 0.85, this.game.world.centerY * 0.2, 'Score: ', {
                font: "32px Berkshire Swash",
                fill: '#FFF'
            });
            label.anchor.setTo(0.5);
            this.scoreText = game.add.text(this.world.width * 0.93, this.game.world.centerY * 0.2, '0', {
                font: "40px Berkshire Swash",
                fill: '#FFF'
            });
            this.scoreText.anchor.setTo(0.5);
        });

        let graphics = game.add.graphics(0, 0);
        let width = 500;
        // draw a rectangle
        graphics.beginFill(0xFFFFFF, 1);
        graphics.lineStyle(2, 0x000000, 1);
        graphics.drawRoundedRect(0, 0, width, 50, 10);
        graphics.endFill();

        let questionField = game.add.sprite(this.world.centerX, 50 * game.scaleRatio, graphics.generateTexture());
        questionField.anchor.set(0.5, 0.5);
        graphics.destroy();

        questionField.scale.set(0, 1 * game.scaleRatio);
        this.questionField = questionField;

        this.banner = this.add.text(0, 0, '', {
            font: '40px Berkshire Swash Black',
            fill: '#000000',
            fontWeight: 'bold',
            smoothed: false
        });
        this.banner.padding.set(10, 16);
        this.banner.anchor.setTo(0.5, 0.35);
        this.banner.x = questionField.width / 2;
        questionField.addChild(this.banner);

        game.add.tween(questionField.scale).to({x: 1 * game.scaleRatio}, 500, Phaser.Easing.Bounce.Out, true, 2500);

        let inputW = 350;
        let inputH = 40;
        this.textBox = this.add.inputField(this.world.centerX - (inputW / 2) * game.scaleRatio, this.game.height - (inputH * 2) * game.scaleRatio, {
            font: '40px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: inputW,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Your answer:',
            focusOutOnEnter: false
        });
        this.textBox.scale.set(0, 1 * game.scaleRatio);
        game.add.tween(this.textBox.scale).to({x: 1 * game.scaleRatio}, 500, Phaser.Easing.Cubic.Out, true, 2500)
            .onComplete.add(() => {
            let iconAttack = game.add.sprite(0, 0, 'iconAttack');
            iconAttack.scale.set(0.7 * game.scaleRatio);
            iconAttack.anchor.set(0.5);
            iconAttack.x = this.textBox.x + this.textBox.width * game.scaleRatio;
            iconAttack.y = this.textBox.y + this.textBox.height / 2;
            iconAttack.inputEnabled = true;
            iconAttack.input.priorityID = 0;
            iconAttack.events.onInputDown.add(this.submitAnswer, this);
            //game.add.tween(iconAttack.scale).to({x: 0.5 * game.scaleRatio}, 500, Phaser.Easing.Bounce.Out, true)
        });

        // create heart to represent life
        this.life = [];
        for (let i = 0; i < 5; i++) {
            let spriteWidth = 48 * game.scaleRatio;
            let margin = 5 * game.scaleRatio;
            let startx = (this.world.centerX - ((spriteWidth + margin) * 5) / 2);
            let sprite = game.add.sprite(i * (spriteWidth + margin) + startx, 90 * game.scaleRatio, 'heart');
            sprite.anchor.set(0);
            sprite.alpha = 0;
            sprite.scale.set(game.scaleRatio);
            sprite.animations.add('rotate', [0, 1, 2, 3, 4, 5, 0], 12, false);
            this.life.push(sprite);

            game.add.tween(sprite).to({alpha: 1}, 300, Phaser.Easing.Bounce.Out, true, (i * 200) + 2000)
        }
        game.time.events.repeat(Phaser.Timer.SECOND * 15, 100, () => {
            this.life[this.life.length - 1].play('rotate')
        }, this);

        // our fireball sprite
        let fireball = game.add.sprite(0, 0, 'fireball');
        fireball.scale.set(game.scaleRatio);
        fireball.anchor.set(0.5);
        // there 2 animations to play
        // 1. while it's moving and 2. when it hits the ground
        let move = fireball.animations.add('move', [0, 1, 2, 3, 4, 5]);
        let hit = fireball.animations.add('hit', [6, 7, 8, 9, 10, 11, 12, 13, 14]);
        this.fireball = fireball;
        this.fireball.kill();

        this.canFire = true;
        this.health = 5;
        this.currIndex = 0;
        this.currLevel = 1;

        this.fetchNextSet();
        this.correctText = new FreeText({
            game: this.game,
            x: this.world.width * 0.25,
            y: this.game.world.centerY * 0.7,
            text: '0',
            cloudEnabled: true
        });

        this.addScoreText = new FreeText({
            game: this.game,
            x: this.world.width * 0.75,
            y: this.game.world.centerY * 0.7,
            text: '0',
            cloudEnabled: true
        });
        this.addScoreText.text.fill = "#00ff00";
    }

    gameOver() {
        this.questionField.alpha = 0;

        fetch('https://dtml.org/Activity/RecordUserActivity?id=wordsbattle&score=' +
            this.scoreText.text + '&complexity=' + this.complexity, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
            })
            .catch(err => {
                console.log('err', err)
            });
    }

    fetchNextSet() {
        fetch('https://dtml.org/api/GameService/Words?step=' + this.currLevel, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.complexity = data.complexity;
                this.words = data.words;
                this.currIndex = 0;
                this.loadNextAnswer();
                this.currLevel++;
            })
            .catch(err => {
                console.log('err', err)
            });
    }

    loadNextAnswer() {
        if (this.currIndex >= this.words.length - 1)
            this.fetchNextSet();
        let word = this.words[this.currIndex];
        this.banner.text = this.correctText.properCase(word);
        this.currentWord = word;
        this.currIndex++;
        this.canFire = true;
    }

    submitAnswer() {
        if (this.canFire && this.textBox.value != '' && this.textBox.value != null) {
            let answer = this.textBox.value;
            this.textBox.resetText();
            this.canFire = false;
            fetch('https://dtml.org/api/GameService/CheckWord?source=' + this.currentWord + '&guess=' + answer +
                '&lan=' + this.langCode, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.isCorrect)
                        this.castSpell(data.complexity);
                    else {
                        this.correctText.changeText(data.correct);
                        this.gnomeAttack();
                    }
                })
                .catch(err => {
                    console.log('err', err)
                })
        }
    }

    castSpell(complexity) {
        this.wiz.setAnimationSpeedPercent(100);
        this.wiz.playAnimationByName('_ATTACK');
        this.blaster.play();

        this.time.events.add(500, () => {
            this.fireball.alpha = 1;
            this.fireball.revive();
            this.fireball.x = this.wiz.position.x + 210 * game.scaleRatio;
            this.fireball.y = this.wiz.position.y - 85 * game.scaleRatio;
            this.fireball.play('move', game.rnd.between(15, 25), true);
            this.fireball.scale.set(0);
            game.add.tween(this.fireball.scale).to({
                x: 1 * game.scaleRatio,
                y: 1 * game.scaleRatio
            }, 300, Phaser.Easing.Linear.In, true);
            var tween = game.add.tween(this.fireball).to({
                x: this.gnome.x,
                y: this.gnome.y - (this.gnome.height / 2)
            }, 700, Phaser.Easing.Cubic.In, true);
            tween.onComplete.add(() => {

                this.scoreText.text = String(parseInt(this.scoreText.text) + (complexity * 10));
                this.wiz.setAnimationSpeedPercent(40);
                this.wiz.playAnimationByName('_IDLE');

                this.fireball.play('hit', 15, false);
                game.add.tween(this.fireball).to({alpha: 0}, 500, Phaser.Easing.Cubic.In, true);

                this.gnome.setAnimationSpeedPercent(100);
                this.gnome.playAnimationByName('_HURT');
                this.addScoreText.changeText('+' + parseInt(complexity * 10));
                this.addScoreText.showTick()
                this.explosion.play();

                game.time.events.add(1000, () => {
                    this.fireball.kill();
                    this.gnome.setAnimationSpeedPercent(40);
                    this.gnome.playAnimationByName('_IDLE');
                    // this.canFire = true
                    this.loadNextAnswer();
                })
            })
        })

    }

    gnomeAttack() {
        this.health--;
        this.canFire = false;

        this.gnome.setAnimationSpeedPercent(200);
        this.gnome.playAnimationByName('_RUN');
        this.steps.loopFull();

        game.add.tween(this.gnome).to({x: this.wiz.x + this.wiz.width}, 1300, Phaser.Easing.Cubic.In, true)
            .onComplete.add(() => {
            this.gnome.setAnimationSpeedPercent(100);
            this.gnome.playAnimationByName('_ATTACK');
            this.steps.stop();

            game.time.events.add(500, () => {
                this.woosh.play()
            });

            game.time.events.add(700, () => {
                this.wiz.setAnimationSpeedPercent(100)
                if (this.health <= 0)
                    this.wiz.playAnimationByName('_DIE')
                else
                    this.wiz.playAnimationByName('_HURT')
                this.correctText.showTick();

                game.add.tween(this.gnome).to({alpha: 0}, 500, Phaser.Easing.Cubic.In, true)
                    .onComplete.add(() => {
                    this.gnome.x = this.gnome.startx
                    game.add.tween(this.gnome).to({alpha: 1}, 500, Phaser.Easing.Cubic.In, true)

                    this.gnome.setAnimationSpeedPercent(40)
                    this.gnome.playAnimationByName('_IDLE')

                    let life = this.life[this.health]
                    game.add.tween(life).to({alpha: 0}, 500, Phaser.Easing.Cubic.In, true)
                    game.add.tween(life.scale).to({
                        x: life.scale.x * 2.5,
                        y: life.scale.y * 2.5
                    }, 500, Phaser.Easing.Cubic.In, true)
                })
            })

            game.time.events.add(1700, () => {
                if (this.health > 0) {
                    this.wiz.setAnimationSpeedPercent(40)
                    this.wiz.playAnimationByName('_IDLE')
                }

                if (this.health <= 0) {
                    this.correctText.hide();
                    this.wizDead = true;
                    this.showScore();
                }

                this.loadNextAnswer();
            })

            // game.add.tween(this.gnome).to({ x: this.wiz.x + this.wiz.width }, 1500, Phaser.Easing.Cubic.In, true)
            // .onComplete.add(() => {
            // })
        })
    }

    showScore() {
        let scoreDisplay = this.game.add.sprite(this.game.world.centerX * 1.3, this.game.world.centerY, 'scroll');
        scoreDisplay.anchor.setTo(0.5);
        scoreDisplay.scale.setTo(0.2);
        this.spritesGroup.add(scoreDisplay);

        let label = this.game.add.text(scoreDisplay.x, scoreDisplay.y - (scoreDisplay.height * 0.18), 'Final Score', {
            font: "50px Berkshire Swash",
            fill: "#000",
            align: "center"
        });
        label.fontWeight = 'bold';
        label.anchor.setTo(0.5);
        label.setShadow(0, 0, 'rgba(0, 0, 0, 0.5)', 0);

        let scoreText = this.game.add.text(scoreDisplay.x, scoreDisplay.y - (scoreDisplay.height * 0.05), this.scoreText.text, {
            font: "70px Berkshire Swash",
            fill: "#000",
            align: "center"
        });
        scoreText.anchor.setTo(0.5);

        let resetButton = this.game.add.text(scoreDisplay.x, scoreDisplay.y + (scoreDisplay.height * 0.2), 'RESTART', {
            font: "50px Berkshire Swash",
            fill: "#333",
            align: "center"
        });
        resetButton.anchor.setTo(0.5);
        resetButton.inputEnabled = true;
        resetButton.events.onInputDown.add(() => {
            this.restartEntered = true;
        });
        resetButton.input.useHandCursor = true;

        this.scoreWiz = this.loadSpriter('wizard');
        this.scoreWiz.scale.set(0.38 * game.scaleRatio);
        this.scoreWiz.x = scoreDisplay.x - (scoreDisplay.width);
        this.scoreWiz.y = scoreDisplay.y + (scoreDisplay.height * 0.2);
        this.scoreWiz.setAnimationSpeedPercent(40);
        this.scoreWiz.playAnimationByName('_IDLE');
        this.spritesGroup.add(this.scoreWiz);
        this.spritesGroup.bringToTop(this.scoreWiz);

        this.gameOver()
    }

    showMenu() {
        this.music.pause()
        this.state.start('Menu')
    }

    update() {
        if (this.textBox.value != '') {
            if (!this.textBox.focus)
                if (!this.wizDead)
                    this.submitAnswer();
        } else if (this.wizDead && (this.restartEntered || !this.textBox.focus))
            this.game.state.start('Menu');
        if (!this.textBox.focus)
            this.textBox.startFocus();
        this.textBox.update();
        if (!this.wizDead)
            this.wiz.updateAnimation()
        else
            this.scoreWiz.updateAnimation();
        this.gnome.updateAnimation()
    }

    render() {
        if (__DEV__) {
            // this.game.debug.spriteInfo(this.mushroom, 32, 32)
        }
    }

    createIcon(x, y, key) {
        // create a group for the icon so they don't get sorted along with the sprites in the game.world
        let iconGroup = game.add.group();

        // position the icon
        let icon = game.add.sprite(x, y, key);
        icon.scale.set(0.45);
        icon.anchor.set(0.5);

        // put a circle frame so we have rounded spell icons
        // let g = game.add.graphics(0, 0);
        // let radius = 40;
        // g.lineStyle(20, 0x000000, 0);
        // g.anchor.setTo(0, 0);
        // let xo = icon.x;
        // let yo = icon.y;
        // g.moveTo(xo,yo + radius);
        // for (let i = 0; i <= 360; i++){
        //   let x = xo+ Math.sin(i * (Math.PI / 180)) * radius;
        //   let y = yo+ Math.cos(i * (Math.PI / 180)) * radius;
        //   g.lineTo(x,y);
        // }
        // iconGroup.add(icon);
        //iconGroup.add(g);

        this.icon = icon;

        return icon
    }

    loadSpriter(key) {
        if (!this.spriterLoader) this.spriterLoader = new Spriter.Loader();

        let spriterFile = new Spriter.SpriterXml(game.cache.getXML(key + 'Animations'));

        // process loaded xml/json and create internal Spriter objects - these data can be used repeatly for many instances of the same animation
        let spriter = this.spriterLoader.load(spriterFile);

        return new Spriter.SpriterGroup(game, spriter, key, key);
    }
}
