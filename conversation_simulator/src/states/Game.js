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
        
        this.stateMachine = new StateMachine(this.game.cache.getJSON('stateData'));
        this.stateMachine.printDebugInfo();
       
    }

    create() {
        this.cursors = game.input.keyboard.createCursorKeys();
        this.phaserJSON = this.cache.getJSON('gameSetup');
         window.speechSynthesis.getVoices();

        this.awaitVoices = new Promise(done => window.speechSynthesis.onvoiceschanged = done);
        this.cookVoice = this.phaserJSON.LeftVoice;
        this.customerVoice = this.phaserJSON.RightVoice;
       
        this.language = this.game.state.states['Game']._language;
        this.langCode = this.game.state.states['Game']._langCode;
        this.bg = new Background({ game: this.game }, 1);

        let music = game.add.audio('gameMusic');
        music.onDecoded.add(() => {
            music.fadeIn(4000);
            this.time.events.add(25000, () => {
                music.fadeOut(4000);
            })
        }, this);

        this.music = music;
        this.steps = game.add.audio('steps');

         this.createSprites();
        let inputW = 650;
        let inputH = 50;
        this.textBox = this.add.inputField(this.world.centerX - (inputW / 2) * game.scaleRatio, this.game.height - 115 - (inputH * 2) * game.scaleRatio +17, {
            font: '40px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: inputW,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Your answer:',
            focusOutOnEnter: true,
            disabled : true
        });
        this.enter = null;
        this.exit = null;
        this.textBox.disabled = true;
       this.textBox.scale.set(0, 1 * game.scaleRatio);
        game.add.tween(this.textBox.scale).to({ x: 1 * game.scaleRatio }, 500, Phaser.Easing.Cubic.Out, true, 2500)
            .onComplete.add(() => {
                let enterSpriteButton = game.add.sprite(0, 0, 'iconAttack');
                //enterSpriteButton.scale.set(0.7 * game.scaleRatio);
                enterSpriteButton.anchor.set(0.5);
                enterSpriteButton.x = this.textBox.x + this.textBox.width * game.scaleRatio;
                enterSpriteButton.y = this.textBox.y + this.textBox.height / 2 ;
                enterSpriteButton.inputEnabled = true;
                enterSpriteButton.input.priorityID = 0;
                enterSpriteButton.events.onInputDown.add(this.SayItByCustomer, this);
                this.enter = enterSpriteButton;
                this.enter.visible = false;


                let deleteSpriteButton = game.add.sprite(0, 0, 'iconDelete');
                //enterSpriteButton.scale.set(0.7 * game.scaleRatio);
                deleteSpriteButton.anchor.set(0.5);
                deleteSpriteButton.x = this.textBox.x + (this.textBox.width * game.scaleRatio) + enterSpriteButton.width+5;
                deleteSpriteButton.y = this.textBox.y + this.textBox.height / 2 ;
                deleteSpriteButton.inputEnabled = true;
                deleteSpriteButton.input.priorityID = 0;


                deleteSpriteButton.events.onInputDown.add(this.deleteBox, this);
                this.exit = deleteSpriteButton;
                 //this.exit.visible = false;
                // let menuSpriteButton = game.add.sprite(this.game.width - 100, 100, 'openmenu');
                // menuSpriteButton.scale.set(0.7 * game.scaleRatio);
                // menuSpriteButton.anchor.set(0.5);
                // menuSpriteButton.inputEnabled = true;
                // menuSpriteButton.input.priorityID = 0;
                // menuSpriteButton.events.onInputDown.add(this.openMenu, this);
            });

    }

    createSprites() {

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
        var enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        enterKey.onDown.add(this.SayItByCustomer, this);

        this.spritesGroup = this.add.group();
        this.cook = this.loadSpriter('wizard');
       // this.cook.scale.set(0.7 * game.scaleRatio, 0.7 * game.scaleRatio);
        this.cook.x = -200 * game.scaleRatio;
        this.cook.y = this.world.height - 470;
        this.spritesGroup.add(this.cook);
        this.customer = this.loadSpriter('gnome');

       // this.customer.scale.set(0.7 * game.scaleRatio, 0.7 * game.scaleRatio);
        this.customer.scale.x *= -1;
        this.customer.children.forEach(sprite => {
            sprite.anchor.set(0, 1);
        });
        this.customer.x = game.width + 180 * game.scaleRatio;
        this.customer.startx = this.world.width * 0.75 * game.scaleRatio;
        this.customer.y = this.world.height - 460;
        this.customer.setAnimationSpeedPercent(100);
        this.customer.playAnimationByName('_IDLE');
        this.spritesGroup.add(this.customer);

        this.patienceRemaining = 5;
        // intro sequence
        this.cook.setAnimationSpeedPercent(100);
       // this.cook.playAnimationByName('_RUN');
        this.cook.playAnimationByName('_RUN');
        game.add.tween(this.cook).to({ x: this.world.width * 0.4 * game.scaleRatio }, 1500, Phaser.Easing.Linear.None, true, 1500)
            .onComplete.add(() => {
                this.cook.setAnimationSpeedPercent(100);
                this.cook.playAnimationByName('_IDLE');
                let numberOfPatienceBars = 5;
                this.patienceBarsGroup = this.add.group();
                this.patienceBars = new Array(numberOfPatienceBars);
                
                var p = game.make.sprite(0, 0, 'patienceBar5');
                this.patienceBarsGroup.add(p);
                this.patienceBars[4] = p;

                
                var p1 = game.make.sprite(0, 0, 'patienceBar4');
                this.patienceBarsGroup.add(p1);
                this.patienceBars[3] = p1;
                var p2 = game.make.sprite(90, 0, 'patienceBar3');
                this.patienceBarsGroup.add(p2);
                this.patienceBars[2] = p2;
                var p3 = game.make.sprite(180, 0, 'patienceBar2');
                this.patienceBarsGroup.add(p3);
                this.patienceBars[1] = p3;
                var p4 = game.make.sprite(270, 0, 'patienceBar1');
                this.patienceBarsGroup.add(p4);
                this.patienceBars[0] = p4;

                this.patienceBarsGroup.x =  this.world.width * 0.1;
                this.patienceBarsGroup.y = this.game.world.centerY * 0.1 - 15;

                this.ConversationStart();
            });
        this.customer.setAnimationSpeedPercent(100);
        this.customer.playAnimationByName('_RUN');


        game.add.tween(this.customer).to({ x: this.world.width * 0.7 * game.scaleRatio }, 1500, Phaser.Easing.Linear.None, true, 1500)
            .onComplete.add(() => {
                this.customer.setAnimationSpeedPercent(100);
                this.customer.playAnimationByName('_IDLE');
                var image = game.add.image(this.world.width * 0.78, this.game.world.centerY * 0.02, 'scoreBar');
                this.scoreText = game.add.text(this.world.width * 0.89, this.game.world.centerY * 0.16, '0', {
                    font: "60px Berkshire Swash",
                    fill: 'black'
                });
                this.scoreText.anchor.setTo(0.5,0.5);
            });

    }

    gameOver() {
        this.cook.kill();
        this.customer.kill();
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

    textToSpeach(text, voice, pitch) {
        this.awaitVoices.then(() => {
            var listOfVoices = window.speechSynthesis.getVoices();
            var voices2 = listOfVoices.filter(a => a.name.toLowerCase().includes(voice.toLowerCase()))[0];
            var msg = new SpeechSynthesisUtterance();

            msg.voice = voices2;
            msg.default = false;
            msg.voiceURI = 'native';
            msg.volume = 1;
            msg.rate = 1;
            msg.pitch = parseInt(pitch);
            msg.text = text;
            msg.lang = 'en-US';
            speechSynthesis.speak(msg);
        });

    }

    ConversationStart() {
        this.SayItByCook(this.stateMachine.getQuestion(), true);
    }

    SayItByCustomer() {
        //this.exit.visible = false;
        this.enter.visible = false;


        this.lastState = this.stateMachine.currentStateName;
        this.leftnya = '';
        this.rightnya = '';
        this.bgnya = '';

          if(this.stateMachine.getOnExitLeft()!=null){
            console.log('gaada'+ this.stateMachine.getOnExitLeft());
            this.leftnya = this.stateMachine.getOnExitLeft();

            }else{
            console.log('gaada'); 
            }


            if(this.stateMachine.getOnExitRight()!=null){
            console.log('gaada'+ this.stateMachine.getOnExitRight());
            this.rightnya = this.stateMachine.getOnExitRight();

            }else{
            console.log('gaada'); 
            }

             if(this.stateMachine.getOnExitBg()!=null){
            console.log('gaada'+ this.stateMachine.getOnExitBg());
            this.bgnya = this.stateMachine.getOnExitBg();

            }else{
            console.log('gaada'); 
            }



        console.log('textnya = ' +this.textBox.value.length)
        if(this.textBox.value.length>0 ){
        this.onSelection = false;
        this.destroySideMenu();

        var text = this.textBox.value;
        this.textBox.setText('');

        this.customer.setAnimationSpeedPercent(100);
        this.customer.playAnimationByName('_SAY');
        this.textToSpeach(text, this.customerVoice, this.phaserJSON.RightPitch);
        let label = this.game.add.text(this.customer.x + parseInt(this.phaserJSON.CallOutRightX), this.customer.y - parseInt(this.phaserJSON.CallOutRightY), text, {
            font: "30px Berkshire Swash",
            fill: "#000",
            align: "center",
            wordWrap: true,
            wordWrapWidth: 300
        });

        this.stateMachine.submitSolution(text);






        label.anchor.setTo(0.5);

        this.time.events.add(2500, () => {

            this.timernya = 0;
            
            if( this.lastState != this.stateMachine.currentStateName){
                console.log('masuk sini = '+ this.leftnya);

                if(this.leftnya!=''){
                    if(this.leftnya=='Leave'){

                                    console.log('masuk sini');
                                    this.cook.scale.x *= -1;
                                    this.cook.playAnimationByName('_RUN');
                                    game.add.tween(this.cook).to({ x: -300 * game.scaleRatio }, 1500, Phaser.Easing.Linear.None, true, 0)
                                    .onComplete.add(() => {
                                          //this.cook.scale.x *= 1;
                                            this.cook.setAnimationSpeedPercent(100);
                                            this.cook.playAnimationByName('_IDLE');
                                    });

                                    this.timernya = 2000;
                    }else
                    {
                        this.cook.playAnimationByName(this.leftnya);
                        this.timernya = 2000;

                    }


                }

                if(this.rightnya!=''){
                    if(this.rightnya=='Leave'){

                                    console.log('masuk sini');
                                    this.customer.scale.x *= -1;
                                    this.customer.playAnimationByName('_RUN');
                                    game.add.tween(this.customer).to({ x: game.width + 180 * game.scaleRatio }, 1500, Phaser.Easing.Linear.None, true, 0)
                                    .onComplete.add(() => {
                                         //this.customer.scale.x *= -1;
                                            this.customer.setAnimationSpeedPercent(100);
                                            this.customer.playAnimationByName('_IDLE');
                                    });

                                    this.timernya = 2000;
                    }else
                    {
                        this.customer.playAnimationByName(this.rightnya);
                        this.timernya = 2000;

                    }


                }

                 if(this.bgnya!=''){
                    //this.load.image('bgn', 'assets/images/res/backgrounds/'+this.bgnya);
                    this.bg.bgs[0].loadTexture(this.bgnya);
                }


                

            }




            this.customer.setAnimationSpeedPercent(100);
            this.customer.playAnimationByName('_IDLE');
            label.kill();

            // Once the player has said something, the cook should respond
            if(this.stateMachine.currentStateName!="End"){
                this.time.events.add(this.timernya, () => {
                    this.cekEnter = 0;


                    this.SayItByCook(this.stateMachine.getQuestion(), this.stateMachine.submitSolutionResult);
                });
            }else{
               this.state.start('GameOver', true, false, this.scoreText.text) 
            }      
        })

        }

    
    }

     deleteBox() {

        this.textBox.setText("");
        
    }

    SayItByCook(text, submitResult) {

        if (text == '') {
            this.state.start('GameOver', true, false, this.scoreText.text)
        }

        this.cook.setAnimationSpeedPercent(100);
        this.cook.playAnimationByName('_SAY');
        //this.cook.x = this.cook.x - 120;
        //this.cook.y = this.cook.y - 30;


        if (!submitResult) {
            this.cekEnter = 1;
            if (this.patienceRemaining > 1) {
                this.patienceBars[this.patienceRemaining - 1].kill()
                this.patienceRemaining -= 1;
            } else {
                this.state.start('GameOver', true, false, this.scoreText.text);
                return;
            }
            var submitFailureText = "I'm sorry, I didn't understand you...";
            this.textToSpeach(submitFailureText, this.cookVoice, this.phaserJSON.LeftPitch);

            let label2 = this.game.add.text(this.cook.x - parseInt(this.phaserJSON.CallOutLeftX), this.cook.y - parseInt(this.phaserJSON.CallOutLeftY), submitFailureText, {
                font: "30px Berkshire Swash",
                fill: "#000",
                align: "center",
                wordWrap: true,
                wordWrapWidth: 300
            });
            label2.anchor.setTo(0.5);

            this.time.events.add(4000, () => {
                this.customer.setAnimationSpeedPercent(100);
                this.customer.playAnimationByName('_IDLE');
                label2.kill();

                //this.cook.x = this.cook.x + 120;
                //this.cook.y = this.cook.y + 65;
                // Once the player has said something, the cook should respond
                this.SayItByCook(this.stateMachine.getQuestion(), true);
            })
            return;
        }


        this.timernya = 0;
        if(this.cekEnter==0){

                this.leftnya = '';
                this.rightnya = '';
                this.bgnya = '';

          if(this.stateMachine.getOnEnterLeft()!=null){
            console.log('gaada'+ this.stateMachine.getOnEnterLeft());
            this.leftnya = this.stateMachine.getOnEnterLeft();

            }else{
            console.log('gaada'); 
            }


            if(this.stateMachine.getOnEnterRight()!=null){
            console.log('gaada'+ this.stateMachine.getOnEnterRight());
            this.rightnya = this.stateMachine.getOnEnterRight();

            }else{
            console.log('gaada'); 
            }


             if(this.stateMachine.getOnEnterBg()!=null){
            console.log('gaada'+ this.stateMachine.getOnEnterBg());
            this.bgnya = this.stateMachine.getOnEnterBg();

            }else{
            console.log('gaada'); 
            }




            if(this.leftnya!=''){
                    if(this.leftnya=='BringFood'){

                                    console.log('masuk sini');
                                    this.cook.scale.x *= -1;
                                    this.cook.playAnimationByName('_WALK');
                                    game.add.tween(this.cook).to({ x: this.world.width * 0.4 * game.scaleRatio }, 1500, Phaser.Easing.Linear.None, true, 0)
                                    .onComplete.add(() => {
                                          //this.cook.scale.x *= -1;
                                            this.cook.setAnimationSpeedPercent(100);
                                            this.cook.playAnimationByName('_IDLE');
                                    });

                                    this.timernya = 2000;
                    }else
                    {
                        this.cook.playAnimationByName(this.leftnya);
                        this.timernya = 2000;

                    }


                }

                if(this.rightnya!=''){
                    if(this.rightnya=='BringFood'){

                                    console.log('masuk sini');
                                    this.customer.scale.x *= -1;
                                    this.customer.playAnimationByName('_WALK');
                                    game.add.tween(this.customer).to({ x: this.world.width * 0.7 * game.scaleRatio }, 1500, Phaser.Easing.Linear.None, true, 0)
                                    .onComplete.add(() => {
                                         //this.customer.scale.x *= -1;
                                            this.customer.setAnimationSpeedPercent(100);
                                            this.customer.playAnimationByName('_IDLE');
                                    });

                                    this.timernya = 2000;
                    }else
                    {
                        this.customer.playAnimationByName(this.rightnya);
                        this.timernya = 2000;

                    }


                }


                 if(this.bgnya!=''){
                    //this.load.image('bgn', 'assets/images/res/backgrounds/'+this.bgnya);
                    this.bg.bgs[0].loadTexture(this.bgnya);
                }
                

            }

          this.time.events.add(this.timernya, () => { 

        this.cook.playAnimationByName('_SAY');
        this.textToSpeach(text, this.cookVoice, this.phaserJSON.LeftPitch);

        let label = this.game.add.text(this.cook.x - parseInt(this.phaserJSON.CallOutLeftX), this.cook.y - parseInt(this.phaserJSON.CallOutLeftY), text, {
            font: "30px Berkshire Swash",
            fill: "#000",
            align: "center",
            wordWrap: true,
            wordWrapWidth: 300
        });
        label.anchor.setTo(0.5);

        if (submitResult) {

            // Hack to move cook back to the right place
            this.time.events.add(5000, () => {
                this.cook.setAnimationSpeedPercent(100);
                this.cook.playAnimationByName('_IDLE');
                 this.exit.visible = true;
                this.enter.visible = true;
               //this.cook.x = this.cook.x + 120;
               // this.cook.y = this.cook.y + 65;
                label.kill();
            });


            // After cook speaks, the player should be able to answer
            this.time.events.add(500, () => {
                this.createSideMenu();
            });
        }
        });
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

/*
        if(this.cook.currentAnimationName!='_IDLE'){
            if(this.enter!=null){
             this.enter.visible = false;
            }


              if(this.exit!=null){
             this.exit.visible = false; 
            }
        }else{
             if(this.enter!=null){
            this.enter.visible = true;
            }

        if(this.exit!=null){
              this.exit.visible = true; 
          }
        }
*/

       // console.log("this.cook.animation = "+this.cook.currentAnimationName);

        if(this.onSelection){
            

            if ( this.game.input.keyboard.justPressed(Phaser.KeyCode.RIGHT) ){
                 console.log("just pressed 1");
                 console.log("pencet kanan" + this.selection +" - "+this.ansLength);
                 this.listView.items[this.selection].frame = 0;
                

                    this.selection+=1;
                    if(this.selection>this.ansLength-1){
                        this.selection = 0;
                    }

                     this.listView.items[this.selection].frame = 1;
            }

            if ( this.game.input.keyboard.justPressed(Phaser.KeyCode.LEFT) ){
                 console.log("just pressed 1");
                 console.log("pencet kanan" + this.selection +" - "+this.ansLength);
                 this.listView.items[this.selection].frame = 0;
                

                    this.selection-=1;
                    if(this.selection<0){
                        this.selection = this.ansLength-1;
                    }

                     this.listView.items[this.selection].frame = 1;
            }

            if ( this.game.input.keyboard.justPressed(Phaser.KeyCode.UP) || this.game.input.keyboard.justPressed(Phaser.KeyCode.SPACEBAR) ){
                 //SayItByCustomer(this.listView.items[this.selection].text);
                 this.addCharToNode(this.listView.items[this.selection]);
            }

            if ( this.game.input.keyboard.justPressed(Phaser.KeyCode.DOWN) || this.game.input.keyboard.justPressed(Phaser.KeyCode.BACKSPACE) ){
                 //SayItByCustomer(this.listView.items[this.selection].text);
                 this.deleteBox();
            }

              if ( this.game.input.keyboard.justPressed(Phaser.KeyCode.ENTER) ){
                if(this.enter.visible==true){
                 this.SayItByCustomer();
                }
               
            }


            /*
            if (this.cursors.right.isDown)
            {
                

            }
            else if (this.cursors.left.isDown)
            {
                game.camera.x += 4;
            }
            */

        }

        //this.spritesGroup.updateAnimation();
        this.cook.updateAnimation();
         this.customer.updateAnimation();
       // if(this.textBox.) 
        this.textBox.endFocus();
        // Keep the score up to date
        if (this.stateMachine && this.scoreText) {
            this.scoreText.text = this.stateMachine.getScore();
        }

    }


    addCharToNode(sprite) {
        this.textBox.setText(this.textBox.value + " " + sprite.text);
    }

    openMenu() {
        this.menu = this.game.add.sprite(this.game.width - 250, 128, 'sidemenu');

        var listOfVoices = window.speechSynthesis.getVoices();


        var options = {
            direction: 'y',
            overflow: 100,
            padding: 10,
            swipeEnabled: true,
            offsetThreshold: 100,
            searchForClicks: true,
        }
        var i = 0;
        var listView = new ListView(this.game, this.game.world, new Phaser.Rectangle(this.game.width - 225, 250, this.game.width - 150, 300), options);
        listOfVoices.forEach(element => {

            var character = this.game.add.text(0, 0, element.name, i++);
            character.borderColor = 'Black';
            character.borderWidth = 5;
            character.fontWeight = 'normal';
            character.wordWrap = true;
            character.wordWrapWidth = 125;
            character.maxWidth = 125;
            listView.add(character);
        });

        this.inputCustomerVoice = this.add.inputField(this.game.width - 225, 150, {
            font: '20px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 100,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Customer voice',
            focusOutOnEnter: false
        });

        this.inputCookVoice = this.add.inputField(this.game.width - 225, 200, {
            font: '20px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 100,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Cook voice',
            focusOutOnEnter: false
        });

        this.inputCustomerSpritePng = this.add.inputField(this.game.width - 350, 150, {
            font: '20px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 100,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Cus png',
            focusOutOnEnter: false
        });
        this.inputCustomerSpriteJson = this.add.inputField(this.game.width - 500, 150, {
            font: '20px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 100,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Cus json',
            focusOutOnEnter: false
        });
        this.inputCustomerSpriteScml = this.add.inputField(this.game.width - 650, 150, {
            font: '20px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 100,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Cus scml',
            focusOutOnEnter: false
        });
        this.inputCookSpritePng = this.add.inputField(this.game.width - 350, 200, {
            font: '20px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 100,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Co png',
            focusOutOnEnter: false
        });
        this.inputCookSpriteJson = this.add.inputField(this.game.width - 500, 200, {
            font: '20px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 100,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Co json',
            focusOutOnEnter: false
        });
        this.inputCookSpriteScml = this.add.inputField(this.game.width - 650, 200, {
            font: '20px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 100,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Co scml',
            focusOutOnEnter: false
        });


        let enterSpriteButton = game.add.sprite(this.game.width - 150, 605, 'iconAttack');
        //enterSpriteButton.scale.set(0.5);
        enterSpriteButton.anchor.set(0.5);
        enterSpriteButton.inputEnabled = true;
        enterSpriteButton.input.priorityID = 0;

        enterSpriteButton.events.onInputDown.add(this.updateSounds, this);
    }

    updateSounds() {


        game.load.atlas('wizard', this.inputCookSpritePng.value, this.inputCookSpriteJson.value);
        game.load.xml('wizardAnimations', this.inputCookSpriteScml.value);

        game.load.atlas('gnome', this.inputCustomerSpritePng.value, this.inputCustomerSpriteJson.value);
        game.load.xml('gnomeAnimations', this.inputCustomerSpriteScml.value);

        
        this.customerVoice = this.inputCustomerVoice.value;
        this.cookVoice = this.inputCookVoice.value;
    }

    createSideMenu() {
        this.onSelection = true;

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

        this.listView = new ListView(this.game, this.game.world, new Phaser.Rectangle(50, this.sidemenu.height - 128, this.sidemenu.width, this.sidemenu.height - 10), options);

        var i = 0;
        var rect;

        this.selection = 0;
        this.ansLength = 0;


        this.stateMachine.getAnswerWords().forEach((word) => {
            this.ansLength+=1
            var item = this.game.add.sprite(0, 0, 'sidebg');
           // item.scale.set(0.8 * game.scaleRatio);
            item.text = word;

            var character = this.game.add.text(0, 0, word, i++);// sprite(0, 0, 'characters',i);

            character.scale.set((2.05 - (word.length*0.17)) * game.scaleRatio);
            rect = new Phaser.Rectangle(item.x, item.y, item.width, item.height);
            character.alignIn(rect, Phaser.CENTER, 0, 0);
            item.frame = 0;
            item.addChild(character);

            character.inputEnabled = true;
            character.input.priorityID = 0;
            character.input.useHandCursor = true;
            character.events.onInputDown.add(this.addCharToNode, this);
            item.inputEnabled = true;
           item.input.priorityID = 0;
            item.input.useHandCursor = true;
            item.events.onInputDown.add(this.addCharToNode, this);
            this.listView.add(item);
        });

        console.log("asd = "+ this.listView.items[2].text);
        this.listView.items[this.selection].frame = 1;

       /* this.listView.grp.visible = false;
        this.openSidemenu = this.game.add.tween(this.sidemenu).to({ y: this.game.height }, 1000, Phaser.Easing.Exponential.Out);
        this.closeSidemenu = this.game.add.tween(this.sidemenu).to({ y: this.game.height }, 1000, Phaser.Easing.Exponential.Out);
        this.openSidemenu.onStart.add(function () { this.bottomORside = true; this.listView.grp.visible = false; }, this);
        this.openSidemenu.onComplete.add(function () { this.listView.grp.visible = true; }, this);
        this.closeSidemenu.onStart.add(function () { this.bottomORside = false; }, this);
        this.openSidemenu.start();
        */
    }

    destroySideMenu() {
        this.sidemenu.kill();
        this.listView.grp.visible = false;
    }

    loadSpriter(key) {
        if (!this.spriterLoader) this.spriterLoader = new Spriter.Loader();

        let spriterFile = new Spriter.SpriterXml(game.cache.getXML(key + 'Animations'));

        // process loaded xml/json and create internal Spriter objects - these data can be used repeatly for many instances of the same animation
        let spriter = this.spriterLoader.load(spriterFile);

        return new Spriter.SpriterGroup(game, spriter, key, key);
    }
}
