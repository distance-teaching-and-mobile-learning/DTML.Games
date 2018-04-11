import Phaser from 'phaser'
import {ListView} from 'phaser-list-view'
import Button from '../model/Button'
import language from './Boot'
import Person from '../model/Person'
import english from '../language/language'
import CanvasImageSaver from 'canvas-image-saver'
import config from '../config';
import WebcamPlugin from '../model/WebcamPlugin'
import WebcamState from '../model/WebcamState'

export default class extends Phaser.State {
    init() {
        this.game.hasInitialized = false;
    }

    create() {
        this.game.selectedNode = null;
        this.bottomORside = false;
        this.bg = this.game.add.sprite(0, 0, 'fondo');
        this.bg.width = this.game.width;
        this.bg.height = this.game.height;
        this.UI = [];
        this.leftMenuButtons = [];
        this.leftMenuOpen = false;
        this.rightMenuButtons = [];
        this.rightMenuOpen = false;
        this.movingNode = false;
        this.moveDistance = 5;
        this.treeUI = [];

        this.initialMenu();

        this.game.hasInitialized = true;
    }

    initialMenu() {
        this.youText = this.game.add.text(this.game.world.centerX, this.game.world.centerY * 0.4, english.you, {
            font: "26px sans-serif", fill: "#ffffff", stroke: "#000000", strokeThickness: "6"
        });
        this.youText.scale.setTo(game.scaleRatio);
        this.youText.anchor.setTo(0.5);

        this.boyBtn = this.game.add.button(this.game.width * 0.4, this.game.world.centerY * 0.7, 'boygirl', function () {
            this.choosePlayer(0);
        }, this);
        this.boyBtn.anchor.setTo(0.5);
        this.boyBtn.scale.setTo(1.2 * game.scaleRatio);
        this.boyBtn.frame = 0;
        this.boyBtn.events.onInputOver.add(() => {
            if (this.UI[this.iterate].obj != this.boyBtn)
                this.triggerIterateUI(true);
        }, this);

        this.boyText = this.game.add.text(this.boyBtn.x, this.boyBtn.y + this.boyBtn.height, english.boy, {
            font: "26px sans-serif", fill: "#ffffff", stroke: "#000000", strokeThickness: "6"
        });
        this.boyText.scale.setTo(game.scaleRatio);
        this.boyText.anchor.setTo(0.5);

        this.girlBtn = this.game.add.button(this.game.width * 0.6, this.game.world.centerY * 0.7, 'boygirl', function () {
            this.choosePlayer(1);
        }.bind(this), this);
        this.girlBtn.anchor.setTo(0.5);
        this.girlBtn.frame = 1;
        this.girlBtn.scale.setTo(game.scaleRatio);
        this.girlBtn.events.onInputOver.add(() => {
            if (this.UI[this.iterate].obj != this.girlBtn)
                this.triggerIterateUI(false);
        }, this);

        this.girlText = this.game.add.text(this.girlBtn.x, this.girlBtn.y + (1.2 * this.girlBtn.height), english.girl, {
            font: "26px sans-serif", fill: "#ffffff", stroke: "#000000", strokeThickness: "6"
        });
        this.girlText.scale.setTo(game.scaleRatio);
        this.girlText.anchor.setTo(0.5);

        this.family = this.game.add.group();
        this.family.x = this.game.width * 0.5;
        this.family.y = this.game.height * 0.5;
        this.family.pivot.x = this.game.width * 0.5;
        this.family.pivot.y = this.game.height * 0.3;

        this.UI.push({obj: this.boyBtn, x: game.scaleRatio, y: game.scaleRatio});
        this.UI.push({obj: this.girlBtn, x: game.scaleRatio, y: game.scaleRatio});
        this.iterate = 0;
        this.leftMenuIteration = 0;
        this.rightMenuIteration = 0;
        this.personIteration = 0;
        this.genderType = false;

        this.upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        this.rightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        this.tabKey = this.game.input.keyboard.addKey(Phaser.Keyboard.TAB);
        this.upKey.onDown.add(function () {
            if(this.movingNode){
                this.moveDirection = 'up';
            }else {
                if (this.leftMenuOpen)
                    this.triggerIterateLeft(true);
                else if (this.rightMenuOpen)
                    this.triggerIterateRight(true);
                else
                    this.iteratePerson(true);
            }
        }.bind(this));
        this.downKey.onDown.add(function () {
            if(this.movingNode){
                this.moveDirection = 'down';
            }else {
                if (this.leftMenuOpen)
                    this.triggerIterateLeft(false);
                else if (this.rightMenuOpen)
                    this.triggerIterateRight(false);
                else
                    this.iteratePerson(false);
            }
        }.bind(this));
        //Iterate Left and enlarge selection.
        this.leftKey.onDown.add(function () {
            if(this.movingNode){
                this.moveDirection = 'left';
            }else {
                this.triggerIterateUI(true);
            }
        }.bind(this));
        //Iterate Right and enlarge selection.
        this.rightKey.onDown.add(function () {
            if(this.movingNode){
                this.moveDirection = 'right';
            }else{
                this.triggerIterateUI(false);
            }
        }.bind(this));

        this.upKey.onUp.add(()=>{ this.moveDirection = '';}, this);
        this.downKey.onUp.add(()=>{ this.moveDirection = '';}, this);
        this.leftKey.onUp.add(()=>{ this.moveDirection = '';}, this);
        this.rightKey.onUp.add(()=>{ this.moveDirection = '';}, this);

        this.tabKey.onDown.add(function(){
            this.swapGender();
        }.bind(this));

        this.enterKey.onDown.add(function () {
            if(this.takingPicture){
                this.takePicture();
                return;
            }
            if (!this.leftMenuOpen && !this.rightMenuOpen) {
                this.UI.forEach(function (elm) {
                    if (elm.obj.scale.x == elm.x + 0.2)
                        elm.obj.onInputUp.dispatch();
                }, this);
            }
            if (this.leftMenuOpen) {
                this.leftMenuButtons.forEach(function (elm) {
                    if (elm.obj.scale.x == elm.x + 0.2) {
                        try {
                            elm.obj.events.onInputUp.dispatch();
                        }
                        catch (err) {
                        }
                    }
                }, this);
            } else if (this.rightMenuOpen) {
                this.addCharToNode(this.rightMenuButtons[this.rightMenuIteration].children[0]);
            }

        }.bind(this));
    }

    moveIterationPerson(next) {
        if (next) {
            this.personIteration--;
            if (this.personIteration < 0)
                this.personIteration = (this.people.length - 1);
        } else {
            this.personIteration++;
            if (this.personIteration >= this.people.length)
                this.personIteration = 0;
        }
    }

    iteratePerson(bool) {
        this.moveIterationPerson(bool);

        if (this.people[this.personIteration])
            this.people[this.personIteration].selectNode();
    }

    triggerIterateUI(bool) {
        try {
            if (this.rightMenuOpen)
                this.openRightMenuBtn.events.onInputUp.dispatch();
            else if (this.leftMenuOpen)
                this.openLeftMenuBtn.events.onInputUp.dispatch();
        } catch (e) {
        }

        this.iterateUi(bool);

        if (this.UI[this.iterate].obj.key == 'openMenu') {
            this.UI[this.iterate].obj.onInputUp.dispatch();
        }


        this.UI.forEach(function (elm) {
            elm.obj.scale.setTo(elm.x, elm.y);
        }, this);

        if (this.UI[this.iterate].obj)
            this.UI[this.iterate].obj.scale.setTo(this.UI[this.iterate].obj.scale.x + 0.2);
    }

    triggerIterateRight(bool){
        this.iterateUIRight(bool);

        var charSelection =this.rightMenuButtons[this.rightMenuIteration];
        if(charSelection.y >= this.listView.bounds.height - 100){
            var distanceBetween = charSelection.y - (this.listView.bounds.height * 0.5);
            this.listView.grp.forEach(function(item){
               item.y -= distanceBetween;
            }.bind(this));
            console.log("Below bracket.");
        }else if (charSelection.y <= this.listView.bounds.y + 100){
            var distanceBetween = this.listView.bounds.y + 100 - charSelection.y;
            this.listView.grp.forEach(function(item){
                item.y += distanceBetween;
            }.bind(this));
            console.log("Above brakcet.");
        }

        this.rightMenuButtons.forEach(function (elm) {
            elm.scale.setTo(1);
        }, this);

        if (charSelection)
            charSelection.scale.setTo(charSelection.scale.x + 0.2);
    }

    triggerIterateLeft(bool) {
        this.iterateUILeft(bool);

        this.leftMenuButtons.forEach(function (elm) {
            elm.obj.scale.setTo(elm.x, elm.y);
        }, this);

        if (this.leftMenuButtons[this.leftMenuIteration].obj)
            this.leftMenuButtons[this.leftMenuIteration].obj.scale.setTo(this.leftMenuButtons[this.leftMenuIteration].obj.scale.x + 0.2);
    }

    choosePlayer(frame) {
        this.boyBtn.destroy();
        this.girlBtn.destroy();
        this.youText.destroy();
        this.boyText.destroy();
        this.girlText.destroy();
        // this.executeAnimation(this.openBottommenu);
        // this.openMenu.visible = true;
        // var mainSibGroup = new SiblingGroup({game: this});

        var config = {
            image: 'boygirl',
            key: frame,
            sex: (frame != 0),
            targetNode: null,
            relationToPlayer: english.you,
            btnText: english.you
        };
        this.you = new Person(this.game, this.game.world.centerX, this.game.world.centerY, config);
        this.game.you = this.you;
        this.family.add(this.you);
        this.picWidth = this.you.character.width;
        this.picHeight = this.you.character.height;
        this.UI = [];
        this.people = [];

        this.addLeftControls();
        this.addBottomControls();
        this.addRightControls();
        this.triggerIterateUI(false);
        this.you.selectNode();
        this.people.push(this.you);

        this.leftMenuIterateLimit = this.leftMenuButtons.length;
        this.rightMenuIterateLimit = this.rightMenuButtons.length;
        this.iterateLimitRight = 0;
    }

    addBottomControls() {
        this.deleteBtn = new Button(this.game, this.game.world.width * 0.25, this.game.world.height * 0.93, this.deleteSelectedNode.bind(this), 'Delete Person', 1.5, 1);
        this.moveBtn = new Button(this.game, this.game.world.width * 0.4, this.game.world.height * 0.93, this.enableKeyboardMove.bind(this), 'Move Person', 1.5, 1);
        this.downloadBtn = new Button(this.game, this.game.world.width * 0.55, this.game.world.height * 0.93, this.capture.bind(this), 'Download', 1.5, 1);
        this.webcamBtn = new Button(this.game, this.game.world.width * 0.7, this.game.world.height * 0.93, this.enableWebcam.bind(this), 'Take Picture', 1.5, 1);
        this.UI.push({obj: this.deleteBtn, x: 1.2 * game.scaleRatio, y: 1.2 * game.scaleRatio});
        this.UI.push({obj: this.moveBtn, x: 1.2 * game.scaleRatio, y: 1.2 * game.scaleRatio});
        this.UI.push({obj: this.downloadBtn, x: 1.2 * game.scaleRatio, y: 1.2 * game.scaleRatio});
        this.UI.push({obj: this.webcamBtn, x: 1.2 * game.scaleRatio, y: 1.2 * game.scaleRatio});
    }

    enableWebcam() {
        this.takingPicture = true;
        this.game.webcam = this.game.plugins.add(Phaser.Plugin.Webcam);
        console.log(this.game.webcam);
        this.game.bmdPic = this.game.make.bitmapData(config.camWidth, config.camHeight);
        this.game.spritePic = this.game.bmdPic.addToWorld();
        this.game.spritePic.x = this.game.world.centerX;
        this.game.spritePic.y = this.game.world.centerY;
        this.game.spritePic.anchor.setTo(0.5);

        this.game.webcam.start(config.camWidth, config.camHeight, this.game.bmdPic.context);

        this.game.input.onDown.addOnce(this.takePicture, this);
    }

    swapGender(){
        console.log("Changed list.");
        if(this.genderType) {
            this.listView.grp.forEachAlive(function (character) {
                if (this.genreType)
                    character.children[0].frame -= 11;
            }, this);

            this.genderType = false;
        }else{
            this.listView.grp.forEachAlive(function (character) {
                if (!this.genreType)
                    character.children[0].frame += 11;
            }, this);

            this.genderType = true;
        }
    }

    takePicture() {
        this.takingPicture = false;
        this.game.webcam.stop();
        this.game.webcam.grab(this.game.bmdPic.context, 0, 0);

        this.game.cache.addBitmapData('pic', this.game.bmdPic);
        this.game.selectedNode.character.loadTexture(this.game.cache.getBitmapData('pic'), 0);
        this.game.selectedNode.character.width = this.picWidth;
        this.game.selectedNode.character.height = this.picHeight;

        this.game.spritePic.destroy();
        //  bmd.context now contains your webcam image
        this.game.spritePic.tint = Math.random() * 0xff0000;
    }

    addRightControls() {
        this.rightMenu = this.game.add.sprite(this.game.world.width, this.game.world.centerY, 'sidemenu');
        this.rightMenu.height = this.game.world.height;
        this.rightMenu.scale.x = 1.5;
        this.rightMenu.anchor.setTo(0.5);

        var options = {
            direction: 'y',
            overflow: 100,
            padding: 10,
            swipeEnabled: true,
            offsetThreshold: 100,
            searchForClicks: true,
        }

        this.listView = new ListView(this.game, this.game.world, new Phaser.Rectangle(this.game.width - (this.rightMenu.width * 0.8), 0, 220, this.rightMenu.height * 0.7), options);

        for (var i = 0; i < 11; i++) {
            var item = this.game.add.sprite(0, 0, 'sidebg');
            var character = this.game.add.sprite(0, 0, 'characters', i);

            character.alignIn(item, Phaser.CENTER, 0, 0);
            item.addChild(character);

            character.inputEnabled = true;
            character.input.priorityID = 0;
            character.input.useHandCursor = true;
            character.events.onInputDown.add(this.addCharToNode, this);
            this.listView.add(item);
            this.rightMenuButtons.push(item);
        }
        this.listView.grp.visible = false;

        this.openRightMenuBtn = this.game.add.button(-this.rightMenu.width * 0.45, 0, 'openMenu', function () {
            if (this.openRightMenuBtn.frame == 1) {
                this.rightMenu.bringToTop();
                this.game.world.bringToTop(this.listView.grp);
                this.executeAnimation(this.openRightMenu);
                this.rightMenuOpen = true;
                this.game.time.events.add(700, () => {
                    this.listView.grp.visible = true;
                    // if(this.rightMenuOpen)
                    //     this.listView.grp.visible = false;
                });
                this.openRightMenuBtn.frame = 0;
            } else {
                this.executeAnimation(this.closeRightMenu);
                this.listView.grp.visible = false;
                this.rightMenuOpen = false;
                this.openRightMenuBtn.frame = 1;
            }
        }.bind(this));
        this.UI.push({obj: this.openRightMenuBtn, x: game.scaleRatio, y: game.scaleRatio});
        this.openRightMenuBtn.frame = 1;

        this.genre = this.game.add.button(0, this.game.world.centerY * 0.45, 'genre', function () {
            this.listView.grp.forEachAlive(function (character) {
                if (this.genreType)
                    character.children[0].frame -= 11;
            }, this);

            this.genreType = false;
        }.bind(this));

        this.genre.frame = 0;
        this.genre.input.priorityID = 1;
        this.genre.anchor.set(0.5);
        this.genre.scale.set(0.9, 0.9);
        this.genre.x -= this.genre.height * 0.6;
        this.genre.y -= this.genre.height * 1.2;

        this.genre2 = this.game.add.button(0, this.game.world.centerY * 0.45, 'genre', function () {
            this.listView.grp.forEachAlive(function (character) {
                if (!this.genreType)
                    character.children[0].frame += 11;
            }, this);

            this.genreType = true;
        }.bind(this));

        this.genreType = false;
        this.genre2.frame = 1;
        this.genre2.input.priorityID = 1;
        this.genre2.anchor.set(0.5);
        this.genre2.scale.set(0.9, 0.9);
        this.genre2.x += this.genre2.height * 0.6;
        this.genre2.y -= this.genre2.height * 1.2;

        this.rightMenu.addChild(this.openRightMenuBtn);
        this.rightMenu.addChild(this.genre);
        this.rightMenu.addChild(this.genre2);

        this.openRightMenuBtn.anchor.set(0.5);
        this.openRightMenuBtn.input.priorityID = 2;
        this.openRightMenuBtn.visible = true;

        this.openRightMenu = this.game.add.tween(this.rightMenu).to({x: this.game.world.width - (this.rightMenu.width * 0.5)}, 1000, Phaser.Easing.Exponential.Out);
        this.closeRightMenu = this.game.add.tween(this.rightMenu).to({x: this.game.world.width + (this.rightMenu.width * 0.5)}, 1000, Phaser.Easing.Exponential.Out);

        this.openRightMenu.onStart.add(function () {
            this.bottomORside = true;
        }, this);
        this.closeRightMenu.onStart.add(function () {
            this.bottomORside = false;
        }, this);

        this.executeAnimation(this.closeRightMenu);
    }

    deleteSelectedNode() {
        if (this.game.selectedNode != this.you) {
            this.game.selectedNode.deletePerson();
            this.game.selectedNode = null;
            this.you.selectNode();
        }
    }

    enableKeyboardMove() {
        this.movingNode = !this.movingNode;
    }

    addCharToNode(sprite) {
        if (!this.game.selectedNode || this.game.selectedNode == this.you) return;

        var config = {
            image: 'characters',
            key: sprite.frame,
            sex: this.genreType,
            targetNode: this.game.selectedNode,
            btnText: null
        };

        this.game.selectedNode.setImageBg(config);
    }

    addLeftControls() {
        this.leftMenu = this.game.add.sprite(0, this.game.world.centerY, 'sidemenu');
        this.leftMenu.height = this.game.world.height;
        this.leftMenu.scale.x = 1.5;
        this.leftMenu.anchor.setTo(0.5);

        let relations = [english.parents, english.stepparents, english.brothers, english.stepbrothers, english.children];

        var offsetY = -this.leftMenu.height * 0.08;
        for (var x = 0; x < relations.length; x++) {
            let relation = relations[x];
            let button = new Button(this.game, 0, offsetY * -(x - 2), this.addRelative.bind(this), relation, 1, 0.7);
            this.leftMenu.addChild(button);
            this.leftMenuButtons.push({obj: button, x: game.scaleRatio, y: game.scaleRatio});
        }
        ;

        this.openLeftMenuBtn = this.game.add.button(this.leftMenu.width * 0.45, 0, 'openMenu', function () {
            if (this.openLeftMenuBtn.frame == 0) {
                this.leftMenu.bringToTop();
                this.executeAnimation(this.openLeftMenu);
                this.openLeftMenuBtn.frame = 1;
            } else {
                this.executeAnimation(this.closeLeftMenu);
                // this.addBottomControls();
                this.openLeftMenuBtn.frame = 0;
            }
        }.bind(this));
        this.UI.push({obj: this.openLeftMenuBtn, x: game.scaleRatio, y: game.scaleRatio});

        this.leftMenu.addChild(this.openLeftMenuBtn);

        this.openLeftMenuBtn.anchor.set(0.5);
        this.openLeftMenuBtn.input.priorityID = 2;
        this.openLeftMenuBtn.visible = true;

        this.openLeftMenu = this.game.add.tween(this.leftMenu).to({x: this.leftMenu.width * 0.5}, 1000, Phaser.Easing.Exponential.Out);
        this.closeLeftMenu = this.game.add.tween(this.leftMenu).to({x: -this.leftMenu.width * 0.5}, 1000, Phaser.Easing.Exponential.Out);

        this.openLeftMenu.onStart.add(function () {
            this.leftMenuOpen = true;
            // this.triggerIterateLeft(true);
            // this.triggerIterateLeft(false);
        }.bind(this), this);
        this.closeLeftMenu.onStart.add(function () {
            this.leftMenuOpen = false;
        }.bind(this), this);

        this.executeAnimation(this.closeLeftMenu);
    }

    addRelative(btn) {
        var targetNode = this.game.selectedNode;
        var frame = game.rnd.integerInRange(0, 10);
        var gender = game.rnd.integerInRange(0, 1);

        var config = {
            image: 'characters',
            key: frame,
            sex: gender,
            targetNode: targetNode,
            btnText: btn.text
        };

        var person = new Person(this.game, targetNode.x + 50, targetNode.y + 50, config);
        this.family.add(person);
        this.people.push(person);
    }

    iterateUILeft(left) {
        if (left) {
            this.leftMenuIteration--;
            if (this.leftMenuIteration < 0)
                this.leftMenuIteration = (this.leftMenuIterateLimit - 1);
        } else {
            this.leftMenuIteration++;
            if (this.leftMenuIteration >= this.leftMenuButtons.length)
                this.leftMenuIteration = 0;
        }
    }

    iterateUIRight(left) {
        if (left) {
            this.rightMenuIteration--;
            if (this.rightMenuIteration < 0)
                this.rightMenuIteration = (this.rightMenuIterateLimit - 1);
        } else {
            this.rightMenuIteration++;
            if (this.rightMenuIteration >= this.rightMenuButtons.length)
                this.rightMenuIteration = 0;
        }
    }

    iterateUi(left) {
        if (left) {
            this.iterate--;
            if (this.iterate < 0)
                this.iterate = (this.UI.length - 1);
        } else {
            this.iterate++;
            if (this.iterate >= this.UI.length)
                this.iterate = 0;
        }
    }

    executeAnimation(anim) {
        if (anim && !anim.isRunning)
            anim.start();

    }

    update() {
        if(this.movingNode){
            switch(this.moveDirection){
                case 'up':
                    this.game.selectedNode.y -= this.moveDistance;
                    break;
                case 'down':
                    this.game.selectedNode.y += this.moveDistance;
                    break;
                case 'left':
                    this.game.selectedNode.x -= this.moveDistance;
                    break;
                case 'right':
                    this.game.selectedNode.x += this.moveDistance;
                    break;
                default:
                    break;
            }
        }


        if (!this.webcamAvailable) return;

        this.pixelate();

        this.countdownPlaying = this.countdown.animations.currentAnim.isPlaying;

        if (!this.countdownPlaying && this.takePicture) {
            this.shutterSound.play();

            var data = this.pixelBitmap.canvas.toDataURL();
            document.getElementById('output').style.display = "block";

            var images = ['shot-full', 'shot-120', 'shot-72', 'shot-48'];
            for (var i = 0; i < images.length; i++) {
                var img = document.getElementById(images[i]);
                img.src = data;
                var parent = img.parentNode;
                parent.href = data;
            }

            this.countdown.visible = false;
            this.takePicture = false;
            this.ui.visible = true;
            this.shutter.animations.play('shine');

            // Flash
            this.flash.alpha = 1;
            game.add.tween(this.flash)
                .to({alpha: 0}, 250)
                .start();
        }
    }

    capture() {
        // this.openMenu.frame = 0;

        var canvasImageSaver = new CanvasImageSaver(
            this.game.canvas, {
                xCropOffset: 0,
                yCropOffset: 0,
                width: this.game.width,
                height: this.game.height
            }, function (canvas, fileName) {
                // Success callback
            }, function (error) {
                // Error callback
            }, this);

        this.executeAnimation(this.closeLeftMenu);
        this.executeAnimation(this.closeRightMenu);
        this.callApiActivity();
        this.game.time.events.add(1000, function () {
            canvasImageSaver.save("myfamilytree", "myfamilytree");
        }, this);
    }

    callApiActivity() {
        fetch('https://dtml.org/Activity/RecordUserActivity?id=familytree&score=' + config.scoreRecord, {
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

    unselectAllNodes() {
        this.game.selectedNode = null;
        this.family.forEachAlive(function (e) {
            if (e.selected) {
                e.selected = false;
                e.children[0].frame = 0;
            }
        }, this);
    }

    cameraConnected() {
        this.turnOnCamera.visible = false;
        this.ui.visible = true;

        this.readySound.play();
    }

    cameraError() {
        document.getElementById('cam').style.display = "none";
        document.getElementById('notconnected').style.display = "block";
        document.getElementById('instructions').style.display = "none";
    }

    clickShutter() {
        this.buttonSound.play();

        if (!this.countdownPlaying) {
            this.countdown.alpha = 1;
            this.countdown.scale.set(2);
            this.countdown.visible = true;
            this.countdown.animations.play('go');

            this.beepSound.play();

            this.add.tween(this.countdown.scale)
                .to({x: 5, y: 5}, 500, Phaser.Easing.Cubic.In)
                .repeat(2)
                .start();
            this.add.tween(this.countdown)
                .to({alpha: 0}, 500, Phaser.Easing.Cubic.In)
                .repeat(2)
                .start();

            this.ui.visible = false;
            this.takePicture = true;
        }
    }

    pixelate() {
        var offsetX = config.camWidth / 2 - this.game.world.width / 2;
        var offsetY = config.camHeight / 2 - this.game.world.height / 2;

        var pxContext = this.pixelBitmap.context;

        this.camBitmap.update();

        var pixel = Phaser.Color.createColor();

        for (var x = 0; x < game.width; x += this.pixelSize) {
            for (var y = 0; y < game.height; y += this.pixelSize) {
                // Sample color at x+offsetX,y+offsetY in camBitmap
                this.camBitmap.getPixel(Math.floor(x + offsetX), Math.floor(y + offsetY), pixel);

                // Modify color
                this.posterizeFilter(pixel, 16);
                if (!this.color) this.grayscaleFilter(pixel);
                var tint = this.tintChoices[this.tintValue];
                this.tintFilter(pixel, tint.r, tint.g, tint.b);

                // Draw pixel at x,y in new bitmap
                pxContext.fillStyle = "rgb(" + pixel.r + "," + pixel.g + "," + pixel.b + ")"
                pxContext.fillRect(x, y, this.pixelSize, this.pixelSize);
            }
        }

        this.camBitmap.dirty = true;
        this.pixelBitmap.dirty = true;
    }

    grayscaleFilter(pixel) {
        var c = Phaser.Color.RGBtoHSV(pixel.r, pixel.g, pixel.b);
        c.s = 0;
        Phaser.Color.HSVtoRGB(c.h, c.s, c.v, pixel);
    }

    tintFilter(pixel, r, g, b) {
        pixel.r = Math.floor(pixel.r * r);
        pixel.g = Math.floor(pixel.g * g);
        pixel.b = Math.floor(pixel.b * b);
    }

    posterizeFilter(pixel, colors) {
        // Posterize
        var divisor = 256 / colors;
        pixel.r = Math.floor(Math.floor(pixel.r / divisor) * divisor);
        pixel.g = Math.floor(Math.floor(pixel.g / divisor) * divisor);
        pixel.b = Math.floor(Math.floor(pixel.b / divisor) * divisor);

        // Contrast
        var thresh = 60;
        var lowThresh = 40;
        var highThresh = 220;
        var amount = 30;
        if (pixel.r > highThresh) pixel.r = 255;
        if (pixel.r > thresh) pixel.r += amount;
        if (pixel.r < thresh) pixel.r -= amount;
        if (pixel.r < lowThresh) pixel.r = 0;

        if (pixel.g > highThresh) pixel.g = 255;
        if (pixel.g > thresh) pixel.g += amount;
        if (pixel.g < thresh) pixel.g -= amount;
        if (pixel.g < lowThresh) pixel.g = 0;

        if (pixel.b > highThresh) pixel.b = 255;
        if (pixel.b > thresh) pixel.b += amount;
        if (pixel.b < thresh) pixel.b -= amount;
        if (pixel.b < lowThresh) pixel.b = 0;
    }
}