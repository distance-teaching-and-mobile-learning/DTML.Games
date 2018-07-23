/* The Distance Teaching and Mobile learning licenses this file
to you under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

import Phaser from 'phaser'
import { ListView } from 'phaser-list-view'
import FreeText from '../sprites/FreeText'
import Spriter from '../libs/spriter'
import Background from '../sprites/background'
import StateMachine from '../StateMachine'

export default class extends Phaser.State {
    init() {
        this.wizDead = false;
        this.restartEntered = false;
        this.questionField = null;
        this.scoreSubmitted = false;
        this.stateMachine = new StateMachine(this.game.cache.getJSON('stateData'));
        this.stateMachine.printDebugInfo();
        window.speechSynthesis.getVoices();
        this.awaitVoices = new Promise(done => window.speechSynthesis.onvoiceschanged = done);
    }

    create() {
        this.language = this.game.state.states['Game']._language;
        this.langCode = this.game.state.states['Game']._langCode;
        let bg = new Background({ game: this.game });

        let music = game.add.audio('gameMusic');
        music.onDecoded.add(() => {
            music.fadeIn(4000);
            this.time.events.add(25000, () => {
                music.fadeOut(4000);
            })
        }, this);

        this.music = music;
        this.steps = game.add.audio('steps');

        //this.createSideMenu();
        this.createBottomMenu();

        this.spritesGroup = this.add.group();

        this.wiz = this.loadSpriter('wizard');
        this.wiz.scale.set(0.8 * game.scaleRatio, 0.8 * game.scaleRatio);
        this.wiz.x = -180 * game.scaleRatio;
        this.wiz.y = this.world.height * 0.65 * game.scaleRatio;
        this.spritesGroup.add(this.wiz);

        this.gnome = this.loadSpriter('gnome');
        this.gnome.scale.set(0.7 * game.scaleRatio, 0.7 * game.scaleRatio);

        this.gnome.children.forEach(sprite => {
            sprite.anchor.set(0, 1)
        });

        this.gnome.x = game.width + 180 * game.scaleRatio;
        this.gnome.startx = this.world.width * 0.75 * game.scaleRatio;
        this.gnome.y = this.world.height * 0.65 * game.scaleRatio;
        this.gnome.setAnimationSpeedPercent(40);
        this.gnome.playAnimationByName('_IDLE');
        this.spritesGroup.add(this.gnome);

        // intro sequence
        this.wiz.setAnimationSpeedPercent(100);
        this.wiz.playAnimationByName('_RUN');
        game.add.tween(this.wiz).to({ x: this.world.width * 0.5 * game.scaleRatio }, 1500, Phaser.Easing.Linear.None, true, 1500)
            .onComplete.add(() => {
                this.wiz.setAnimationSpeedPercent(100);
                this.wiz.playAnimationByName('_IDLE');
            });

        this.gnome.setAnimationSpeedPercent(200);
        this.gnome.playAnimationByName('_RUN');
        game.add.tween(this.gnome).to({ x: this.world.width * 0.6 * game.scaleRatio }, 1500, Phaser.Easing.Linear.None, true, 1500)
            .onComplete.add(() => {
                this.gnome.setAnimationSpeedPercent(30);
                this.gnome.playAnimationByName('_IDLE');


                var label = game.add.text(this.world.width * 0.90, this.game.world.centerY * 0.1, 'Score: ', {
                    font: "32px Berkshire Swash",
                    fill: '#FFF'
                });
                label.anchor.setTo(0.5);
                this.scoreText = game.add.text(this.world.width * 0.98, this.game.world.centerY * 0.1, '0', {
                    font: "40px Berkshire Swash",
                    fill: '#FFF'
                });
                this.scoreText.anchor.setTo(0.5);
            });

        let inputW = 650;
        let inputH = 40;
        this.textBox = this.add.inputField(this.world.centerX - (inputW / 2) * game.scaleRatio, this.game.height - 100 - (inputH * 2) * game.scaleRatio, {
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
        game.add.tween(this.textBox.scale).to({ x: 1 * game.scaleRatio }, 500, Phaser.Easing.Cubic.Out, true, 2500)
            .onComplete.add(() => {
                let iconAttack = game.add.sprite(0, 0, 'iconAttack');
                iconAttack.scale.set(0.7 * game.scaleRatio);
                iconAttack.anchor.set(0.5);
                iconAttack.x = this.textBox.x + this.textBox.width * game.scaleRatio;
                iconAttack.y = this.textBox.y + this.textBox.height / 2;
                iconAttack.inputEnabled = true;
                iconAttack.input.priorityID = 0;

                this.ConversationStart();

                iconAttack.events.onInputDown.add(this.SayItByCustomer, this);
                //game.add.tween(iconAttack.scale).to({x: 0.5 * game.scaleRatio}, 500, Phaser.Easing.Bounce.Out, true)
            });

        this.errorText = new FreeText({
            game: this.game,
            x: this.world.width * 0.5,
            y: this.game.world.centerY,
            text: 'Error connecting. Retrying...',
            cloudEnabled: true
        });

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
        this.wiz.kill();
        this.gnome.kill();
        this.textBox.kill();

        var enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        enterKey.onDown.add(() => {
            this.showMenu();
        }, this);

        this.callGameOverService();
    }

    callGameOverService() {
        fetch('https://dtml.org/Activity/RecordUserActivity?id=restourant&score=' +
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
    }

    nextWord() {
        let word = this.words[this.currIndex];
        this.banner.text = this.correctText.properCase(word);
        this.currentWord = word;
        this.currIndex++;
        this.canFire = true;
    }

    loadNextAnswer() {
        if (this.currIndex >= this.words.length - 1)
            this.fetchNextSet();
        else
            this.nextWord();
    }

    textToSpeach(text, voice) {
        this.awaitVoices.then(() => {
            var voices2 = window.speechSynthesis.getVoices().filter(a => a.name === voice)[0];
            var msg = new SpeechSynthesisUtterance();

            msg.voice = voices2;
            msg.default = false;
            msg.voiceURI = 'native';
            msg.volume = 1;
            msg.rate = 1;
            msg.pitch = 2;
            msg.text = text;
            msg.lang = 'en-US';
            speechSynthesis.speak(msg);
        });

    }

    ConversationStart() {
        this.SayItByCook(this.stateMachine.getQuestion());
        // WAIT for input
    }

    SayItByCustomer() {

        this.destroySideMenu();

        var text = this.textBox.value;
        this.textBox.setText('');

        this.gnome.setAnimationSpeedPercent(30);
        this.gnome.playAnimationByName('_SAY');
        this.textToSpeach(text, 'Microsoft Zira Desktop - English (United States)');
        let label = this.game.add.text(this.gnome.x + 140, this.gnome.y - 200, text, {
            font: "15px Berkshire Swash",
            fill: "#000",
            align: "center",
            wordWrap: true,
            wordWrapWidth: 150
        });

        this.stateMachine.submitSolution(text);

        label.anchor.setTo(0.5);

        this.time.events.add(2500, () => {
            this.gnome.setAnimationSpeedPercent(30);
            this.gnome.playAnimationByName('_IDLE');
            label.kill();

            // Once the player has said something, the cook should respond
            this.SayItByCook(this.stateMachine.getQuestion());
        })
    }

    SayItByCook(text) {

        if (text == '') {
            this.state.start('GameOver', true, false, this.scoreText.text)
        }

        this.wiz.setAnimationSpeedPercent(30);
        this.wiz.playAnimationByName('_SAY');
        this.wiz.x = this.wiz.x - 120;
        this.wiz.y = this.wiz.y - 65;
        this.textToSpeach(text, 'Microsoft David Desktop - English (United States)');

        let label = this.game.add.text(this.wiz.x - 190, this.wiz.y - 160, text, {
            font: "18px Berkshire Swash",
            fill: "#000",
            align: "center",
            wordWrap: true,
            wordWrapWidth: 150
        });

        label.anchor.setTo(0.5);

        // Hack to move cook back to the right place
        this.time.events.add(5000, () => {
            this.wiz.setAnimationSpeedPercent(30);
            this.wiz.playAnimationByName('_IDLE');
            this.wiz.x = this.wiz.x + 120;
            this.wiz.y = this.wiz.y + 65;
            label.kill();
        });


        // After cook speaks, the player should be able to answer
        this.time.events.add(500, () => {
            this.createSideMenu();
        });
    }

    sendAnswer(answer, attempt) {
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
            this.showMenu();
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
        this.errorText.hide();
        this.correctText.text.destroy();
        this.addScoreText.text.destroy();
        this.correctText.destroy();
        this.addScoreText.destroy();
        this.music.destroy();
        this.state.start('Menu');
    }

    update() {
        /*   if (this.textBox.value != '') {
              // if (!this.textBox.focus)
                //   if (!this.wizDead)
                       // this.submitAnswer();
           }
   */
        if (!this.textBox.focus && !this.wizDead)
            this.textBox.startFocus();
        this.textBox.update();
        /*
                if (!this.wizDead)
                    this.wiz.updateAnimation();
                else
                    this.scoreWiz.updateAnimation();
                this.gnome.updateAnimation(); */

        // Keep the score up to date
        if (this.stateMachine && this.scoreText) {
            this.scoreText.text = this.stateMachine.getScore();
        }

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

        this.icon = icon;

        return icon
    }


    addCharToNode(sprite) {

        var names = '';
        var type = '';

        var config = {
            name: names,
            type: type,
            image: 'characters',
            frame: sprite.frame,
            sex: this.genreType
        };
        this.textBox.setText(this.textBox.value + " " + sprite.text);
        // this.textBox.value += sprite.text;
        //this.selectedNode.setImageBg(config);

        //this.processMenu(this.closeSidemenu);
        // this.listView.grp.visible = false;
        //this.openMenu.frame = 0;
        //this.processMenu(this.openBottommenu);
    }
    createSideMenu() {
        this.sidemenu = this.game.add.sprite(this.game.width, this.game.height, 'sidemenu');
        this.sidemenu.height = this.game.height;
        this.sidemenu.width = this.game.width;

        var options = {
            direction: 'x',
            overflow: 100,
            padding: 10,
            swipeEnabled: true,
            offsetThreshold: 100,
            searchForClicks: true,
        }

        this.listView = new ListView(this.game, this.game.world, new Phaser.Rectangle(50, this.sidemenu.height - 100, this.sidemenu.width, this.sidemenu.height - 10), options);

        var i = 0;
        this.stateMachine.getAnswerWords().forEach((word) => {
            var item = this.game.add.sprite(0, 0, 'sidebg');
            var character = this.game.add.text(0, 0, word, i++);// sprite(0, 0, 'characters',i);

            character.alignIn(item, Phaser.CENTER, 0, 0);
            item.addChild(character);

            character.inputEnabled = true;
            character.input.priorityID = 0;
            character.input.useHandCursor = true;
            character.events.onInputDown.add(this.addCharToNode, this);
            item.events.onInputDown.add(this.addCharToNode, this.character);
            this.listView.add(item);
        });
        this.listView.grp.visible = false;
        this.openSidemenu = this.game.add.tween(this.sidemenu).to({ y: this.game.height }, 1000, Phaser.Easing.Exponential.Out);
        this.closeSidemenu = this.game.add.tween(this.sidemenu).to({ y: this.game.height }, 1000, Phaser.Easing.Exponential.Out);
        this.openSidemenu.onStart.add(function () { this.bottomORside = true; this.listView.grp.visible = false; }, this);
        this.openSidemenu.onComplete.add(function () { this.listView.grp.visible = true; }, this);
        this.closeSidemenu.onStart.add(function () { this.bottomORside = false; }, this);
        this.openSidemenu.start();
    }

    destroySideMenu() {
        this.sidemenu.kill();
        this.listView.grp.visible = false;
    }

    createBottomMenu() {
        this.bottommenu = this.game.add.sprite(this.game.width * 0.5, this.game.height - 300, 'bottommenu');
        this.bottommenu.x -= this.bottommenu.width * 0.5;
        this.bottommenu.y += this.bottommenu.height;
    }

    loadSpriter(key) {
        if (!this.spriterLoader) this.spriterLoader = new Spriter.Loader();

        let spriterFile = new Spriter.SpriterXml(game.cache.getXML(key + 'Animations'));

        // process loaded xml/json and create internal Spriter objects - these data can be used repeatly for many instances of the same animation
        let spriter = this.spriterLoader.load(spriterFile);

        return new Spriter.SpriterGroup(game, spriter, key, key);
    }
}
