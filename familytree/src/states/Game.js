import Phaser from 'phaser'
import {ListView} from 'phaser-list-view'
import Button from '../model/Button'
import language from './Boot'
import Person from '../model/Person'
import english from '../language/language'
import CanvasImageSaver from 'canvas-image-saver'
import config from '../config';
import SiblingGroup from '../model/SiblingGroup'


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
        this.scrollUI = [];
        this.treeUI = [];

        this.initialMenu();

        this.game.hasInitialized = true;
    }

    selectNode(node) {
        console.log(node);
        this.unselectAllNodes();
        this.game.selectedNode = node;
        this.game.selectedNode.children[0].frame = 0;
    }

    initialMenu() {
        this.youText = this.game.add.text(this.game.world.centerX, this.game.world.centerY * 0.4, english.you, {
            font: "26px sans-serif", fill: "#ffffff", stroke: "#000000", strokeThickness: "6"
        });
        this.youText.anchor.setTo(0.5);

        this.boyBtn = this.game.add.button(this.game.width * 0.4, this.game.world.centerY * 0.7, 'boygirl', function () {
            this.choosePlayer(0);
        }, this);
        this.boyBtn.anchor.setTo(0.5);
        this.boyBtn.scale.setTo(1.2);
        this.boyBtn.frame = 0;
        this.boyBtn.events.onInputOver.add(() => {
            if (this.UI[this.iterate].obj != this.boyBtn)
                this.triggerIterateUI(true);
        }, this);

        this.boyText = this.game.add.text(this.boyBtn.x, this.boyBtn.y + this.boyBtn.height, english.boy, {
            font: "26px sans-serif", fill: "#ffffff", stroke: "#000000", strokeThickness: "6"
        });
        this.boyText.anchor.setTo(0.5);

        this.girlBtn = this.game.add.button(this.game.width * 0.6, this.game.world.centerY * 0.7, 'boygirl', function () {
            this.choosePlayer(1);
        }.bind(this), this);
        this.girlBtn.anchor.setTo(0.5);
        this.girlBtn.frame = 1;
        this.girlBtn.events.onInputOver.add(() => {
            if (this.UI[this.iterate].obj != this.girlBtn)
                this.triggerIterateUI(false);
        }, this);

        this.girlText = this.game.add.text(this.girlBtn.x, this.girlBtn.y + this.girlBtn.height, english.girl, {
            font: "26px sans-serif", fill: "#ffffff", stroke: "#000000", strokeThickness: "6"
        });
        this.girlText.anchor.setTo(0.5);

        this.family = this.game.add.group();
        this.family.x = this.game.width * 0.5;
        this.family.y = this.game.height * 0.5;
        this.family.pivot.x = this.game.width * 0.5;
        this.family.pivot.y = this.game.height * 0.3;

        this.UI.push({obj: this.boyBtn, x: 1, y: 1});
        this.UI.push({obj: this.girlBtn, x: 1, y: 1});
        this.iterate = 0;
        this.iterateLimit = 2;

        this.upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        this.rightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        // this.backKey = this.game.input.keyboard.addKey(Phaser.Keyboard.BACKSPACE);
        //Iterate Left and enlarge selection.
        this.leftKey.onDown.add(function () {
            this.triggerIterateUI(true);
        }.bind(this));
        //Iterate Right and enlarge selection.
        this.rightKey.onDown.add(function () {
            this.triggerIterateUI(false);
        }.bind(this));
        //Delete person on backspace.
        // this.backKey.onDown.add(function () {
        //     this.iterateUi(false);
        //     this.treeUI.forEach(function (elm) {
        //         if (elm.obj.selected && elm.obj.relation != 'me')
        //             elm.obj.children[3].onInputUp.dispatch();
        //     }, this);
        //
        // }.bind(this));

        this.enterKey.onDown.add(function () {
            this.UI.forEach(function (elm) {
                if (elm.obj.scale.x == elm.x + 0.2)
                    elm.obj.onInputUp.dispatch();
            }, this);

            if (this.bottomORside == true) {
                this.scrollUI.forEach(function (elm) {
                    if (elm.obj.scale.x == elm.x + 0.1) {
                        if (elm.obj.children[0]) {
                            try {
                                elm.obj.children[0].events.onInputDown.dispatch(elm.obj.children[0]);
                            }
                            catch (err) {
                            }
                        }
                    }
                }, this);
            }

        }.bind(this));
    }

    triggerIterateUI(bool) {
        this.iterateUi(bool);
        this.UI.forEach(function (elm) {
            elm.obj.scale.setTo(elm.x, elm.y);
        }, this);
        if (this.UI[this.iterate].obj)
            this.UI[this.iterate].obj.scale.setTo(this.UI[this.iterate].obj.scale.x + 0.2);
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
        this.UI = [];

        this.addLeftControls();
        this.addRightControls();
        this.addBottomControls();
        // this.selectNode(this.you);
        this.you.selectNode();
    }

    addBottomControls() {
        this.deleteBtn = new Button(this.game, this.game.world.width * 0.3, this.game.world.height * 0.93, this.deleteSelectedNode.bind(this), 'Delete Person', 1.5, 1);
        this.moveBtn = new Button(this.game, this.game.world.width * 0.5, this.game.world.height * 0.93, this.enableKeyboardMove.bind(this), 'Move Person', 1.5, 1);
        this.downloadBtn = new Button(this.game, this.game.world.width * 0.7, this.game.world.height * 0.93, this.capture.bind(this), 'Download', 1.5, 1);
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

        this.listView = new ListView(this.game, this.game.world, new Phaser.Rectangle(this.game.width - (this.rightMenu.width * 0.8), this.rightMenu.height * 0.07, 220, this.rightMenu.height * 0.61), options);

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
        }
        this.listView.grp.visible = false;

        this.openRightMenuBtn = this.game.add.button(-this.rightMenu.width * 0.45, 0, 'openMenu', function () {
            if (this.openRightMenuBtn.frame == 1) {
                this.rightMenu.bringToTop();
                this.game.world.bringToTop(this.listView.grp);
                this.executeAnimation(this.openRightMenu);
                this.game.time.events.add(700, () => {
                    this.listView.grp.visible = true;
                });
                // this.addSideControls();
                this.openRightMenuBtn.frame = 0;
            } else {
                // this.bottommenu.bringToTop();
                this.executeAnimation(this.closeRightMenu);
                this.listView.grp.visible = false;
                // this.addBottomControls();
                this.openRightMenuBtn.frame = 1;
            }
        }.bind(this));
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
            console.log("Opening right menu");
            this.bottomORside = true;
        }, this);
        this.closeRightMenu.onStart.add(function () {
            console.log("Closing right menu");
            this.bottomORside = false;
        }, this);

        this.executeAnimation(this.closeRightMenu);
    }

    deleteSelectedNode(){
        if(this.game.selectedNode != this.you){
            this.game.selectedNode.deletePerson();
            // this.selectNode(this.you);
            this.you.selectNode();
        }
        // this.game.selectedNode.activateErase();
        // this.game.selectedNode = this.you;
    }

    enableKeyboardMove(){

    }

    addCharToNode(sprite) {
        console.log("addCharToNode")
        if (!this.game.selectedNode || this.game.selectedNode == this.you) return;

        console.log(sprite);
        var config = {
            image: 'characters',
            key: sprite.frame,
            sex: this.genreType,
            targetNode: this.game.selectedNode,
            btnText: null
        };

        this.game.selectedNode.setImageBg(config);

        // this.executeAnimation(this.closeRightMenu);
        //this.processMenu(this.openBottommenu);
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
            this.leftMenuButtons.push(button);
        }
        ;


        this.openLeftMenuBtn = this.game.add.button(this.leftMenu.width * 0.45, 0, 'openMenu', function () {
            if (this.openLeftMenuBtn.frame == 0) {
                this.leftMenu.bringToTop();
                // this.game.world.bringToTop(this.listView.grp);
                // this.processMenu(this.closeBottommenu);
                this.executeAnimation(this.openLeftMenu);
                // this.addSideControls();
                this.openLeftMenuBtn.frame = 1;
            } else {
                // this.bottommenu.bringToTop();
                // this.processMenu(this.openBottommenu);
                this.executeAnimation(this.closeLeftMenu);
                // this.addBottomControls();
                this.openLeftMenuBtn.frame = 0;
            }
        }.bind(this));

        this.leftMenu.addChild(this.openLeftMenuBtn);

        this.openLeftMenuBtn.anchor.set(0.5);
        this.openLeftMenuBtn.input.priorityID = 2;
        this.openLeftMenuBtn.visible = true;

        this.openLeftMenu = this.game.add.tween(this.leftMenu).to({x: this.leftMenu.width * 0.5}, 1000, Phaser.Easing.Exponential.Out);
        this.closeLeftMenu = this.game.add.tween(this.leftMenu).to({x: -this.leftMenu.width * 0.5}, 1000, Phaser.Easing.Exponential.Out);

        this.openLeftMenu.onStart.add(function () {
            console.log("Opening left menu");
            this.bottomORside = true;
        }, this);
        this.closeLeftMenu.onStart.add(function () {
            console.log("Closing left menu");
            this.bottomORside = false;
        }, this);

        this.executeAnimation(this.closeLeftMenu);
    }

    addRelative(btn) {
        console.log(this.game.selectedNode);
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
    }

    iterateUi(left) {
        if (left) {
            this.iterate--;
            if (this.iterate < 0)
                this.iterate = (this.iterateLimit - 1);
        } else {
            this.iterate++;
            if (this.iterate >= this.iterateLimit)
                this.iterate = 0;
        }
    }

    iterateUIScroll(up) {
        if (up) {
            this.iterateScroll--;
            if (this.iterateScroll < 0)
                this.iterateScroll = (this.iterateScrollLimit - 1);
        }
        else {
            this.iterateScroll++;
            if (this.iterateScroll >= this.iterateScrollLimit)
                this.iterateScroll = 0;
        }
    }

    executeAnimation(anim) {
        if (anim && !anim.isRunning)
            anim.start();

    }

    update() {
    }

    removeKeyListener() {
        this.upKey.onDown.removeAll();
        this.downKey.onDown.removeAll();
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
    //     this.next_time = 0;
    //     this.click = false;
    //     this.genreType = false;
    //     this.bottomORside = false;
    //
    //     this.createSideMenu();
    //     this.createBottomMenu();
    //
    //
    //
    // iterateUIScroll(up) {
    //     if (up) {
    //         this.iterateScroll--;
    //         if (this.iterateScroll < 0)
    //             this.iterateScroll = (this.iterateScrollLimit - 1);
    //     }
    //     else {
    //         this.iterateScroll++;
    //         if (this.iterateScroll >= this.iterateScrollLimit)
    //             this.iterateScroll = 0;
    //     }
    // }
    //
    // iterateTreeScroll(up) {
    //     if (up) {
    //         this.iterateTree--;
    //         if (this.iterateTree < 0)
    //             this.iterateTree = (this.iterateTreeLimit - 1);
    //     }
    //     else {
    //         this.iterateTree++;
    //         if (this.iterateTree >= this.iterateTreeLimit)
    //             this.iterateTree = 0;
    //     }
    // }
    //
    // createSideMenu() {
    //     this.sidemenu = this.game.add.sprite(this.game.width, 6, 'sidemenu');
    //     this.sidemenu.height = this.game.height;
    //
    //     var options = {
    //         direction: 'y',
    //         overflow: 100,
    //         padding: 10,
    //         swipeEnabled: true,
    //         offsetThreshold: 100,
    //         searchForClicks: true,
    //     }
    //
    //     this.listView = new ListView(this.game, this.game.world, new Phaser.Rectangle(this.game.width - (this.sidemenu.width * 0.85), this.sidemenu.height * 0.07, 220, this.sidemenu.height * 0.61), options);
    //
    //     for (var i = 0; i < 11; i++) {
    //         var item = this.game.add.sprite(0, 0, 'sidebg');
    //         var character = this.game.add.sprite(0, 0, 'characters', i);
    //
    //         character.alignIn(item, Phaser.CENTER, 0, 0);
    //         item.addChild(character);
    //
    //         character.inputEnabled = true;
    //         character.input.priorityID = 0;
    //         character.input.useHandCursor = true;
    //         character.events.onInputDown.add(this.addCharToNode, this);
    //
    //         this.listView.add(item);
    //     }
    //     this.listView.grp.visible = false;
    //
    //     this.downloadbtn = this.game.add.button(0, 360, 'sharebtn', this.capture, this, 1, 0, 0, 0);
    //     this.downloadbtn.input.priorityID = 1;
    //     this.downloadbtn.scale.set(1, 0.8);
    //     this.downloadbtn.anchor.set(0.5, 0.5);
    //     this.downloadbtn.x += this.downloadbtn.width * 0.7;
    //
    //     //this.downloadbtn.y -= this.downloadbtn.height*0.3;
    //
    //     this.sharebtn = this.game.add.button(this.downloadbtn.x, this.downloadbtn.y + this.downloadbtn.height + 4, 'sharebtn', this.share, this, 1, 0, 0, 0);
    //     this.sharebtn.anchor.set(0.5, 0.5);
    //
    //     this.downloadText = this.game.add.text(0, 0, english.download, {
    //         font: "14px sans-serif", fill: "#ffffff", stroke: "#000000", strokeThickness: "6"
    //     });
    //
    //     this.shareText = this.game.add.text(0, 1, english.share, {
    //         font: "12px sans-serif",
    //         fill: "#ffffff",
    //         stroke: "#000000",
    //         strokeThickness: "6",
    //         wordWrap: true,
    //         wordWrapWidth: this.sharebtn.width * 0.8
    //     });
    //
    //     this.downloadText.anchor.set(0.5, 0.5);
    //     this.shareText.anchor.set(0.5, 0.5);
    //     this.shareText.lineSpacing = -6;
    //
    //     this.genre = this.game.add.button(this.downloadbtn.x, this.downloadbtn.y, 'genre', function () {
    //         this.listView.grp.forEachAlive(function (character) {
    //             if (this.genreType)
    //                 character.children[0].frame -= 11;
    //         }, this);
    //
    //         this.genreType = false;
    //     }.bind(this));
    //
    //     this.genre.frame = 0;
    //     this.genre.input.priorityID = 1;
    //     this.genre.anchor.set(0.5);
    //     this.genre.scale.set(0.9, 0.9);
    //     this.genre.x -= this.genre.height * 0.6;
    //     this.genre.y -= this.genre.height * 1.2;
    //
    //     this.genre2 = this.game.add.button(this.downloadbtn.x, this.downloadbtn.y, 'genre', function () {
    //         this.listView.grp.forEachAlive(function (character) {
    //             if (!this.genreType)
    //                 character.children[0].frame += 11;
    //         }, this);
    //
    //         this.genreType = true;
    //     }.bind(this));
    //
    //     this.genre2.frame = 1;
    //     this.genre2.input.priorityID = 1;
    //     this.genre2.anchor.set(0.5);
    //     this.genre2.scale.set(0.9, 0.9);
    //     this.genre2.x += this.genre2.height * 0.6;
    //     this.genre2.y -= this.genre2.height * 1.2;
    //
    //     this.openMenu = this.game.add.button(0, 250, 'openMenu', function () {
    //         if (this.openMenu.frame == 0) {
    //             this.sidemenu.bringToTop();
    //             this.game.world.bringToTop(this.listView.grp);
    //             this.processMenu(this.closeBottommenu);
    //             this.processMenu(this.openSidemenu);
    //             this.addSideControls();
    //             this.listView.grp.visible = true;
    //             this.openMenu.frame = 1;
    //
    //         }
    //         else {
    //             this.bottommenu.bringToTop();
    //             this.processMenu(this.openBottommenu);
    //             this.processMenu(this.closeSidemenu);
    //             this.listView.grp.visible = false;
    //             this.addBottomControls();
    //             this.openMenu.frame = 0;
    //         }
    //     }.bind(this));
    //
    //     this.openMenu.anchor.set(0.5);
    //     this.openMenu.input.priorityID = 2;
    //     this.openMenu.x -= this.openMenu.width * 0.4;
    //     this.openMenu.visible = false;
    //
    //     this.downloadbtn.addChild(this.downloadText);
    //     this.sharebtn.addChild(this.shareText);
    //     this.sidemenu.addChild(this.openMenu);
    //     this.sidemenu.addChild(this.sharebtn);
    //     this.sidemenu.addChild(this.downloadbtn);
    //     this.sidemenu.addChild(this.genre);
    //     this.sidemenu.addChild(this.genre2);
    //
    //     this.openSidemenu = this.game.add.tween(this.sidemenu).to({x: this.game.width - this.sidemenu.width}, 1000, Phaser.Easing.Exponential.Out);
    //     this.closeSidemenu = this.game.add.tween(this.sidemenu).to({x: this.game.width}, 1000, Phaser.Easing.Exponential.Out);
    //
    //     this.openSidemenu.onStart.add(function () {
    //         this.bottomORside = true;
    //     }, this);
    //     this.closeSidemenu.onStart.add(function () {
    //         this.bottomORside = false;
    //     }, this);
    // }
    //
    // createBottomMenu() {
    //     this.bottommenu = this.game.add.sprite(this.game.width * 0.5, this.game.height, 'bottommenu');
    //     this.bottommenu.x -= this.bottommenu.width * 0.5;
    //     this.bottommenu.y += this.bottommenu.height;
    //
    //     this.addparents = this.game.add.button(0, 35, 'sharebtn', function () {
    //         this.addParent('')
    //     }.bind(this), this, 1, 0, 0, 0);
    //     this.addparents.scale.setTo(1.2);
    //     this.addparents.anchor.set(0.5, 0.5);
    //     this.addparents.x += this.addparents.width;
    //
    //     this.addstepparents = this.game.add.button(0, 35, 'sharebtn', function () {
    //         this.addParent(english.stepparents)
    //     }.bind(this), this, 1, 0, 0, 0);
    //     this.addstepparents.anchor.set(0.5, 0.5);
    //     this.addstepparents.x += this.addstepparents.width * 2.3;
    //
    //     this.addbrothers = this.game.add.button(this.bottommenu.width, 35, 'sharebtn', function () {
    //         this.addBrother('')
    //     }.bind(this), this, 1, 0, 0, 0);
    //     this.addbrothers.anchor.set(0.5, 0.5);
    //     this.addbrothers.x -= this.addbrothers.width * 2.3;
    //
    //     this.addstepbrothers = this.game.add.button(this.bottommenu.width, 35, 'sharebtn', function () {
    //         this.addBrother(english.stepbrothers)
    //     }.bind(this), this, 1, 0, 0, 0);
    //     this.addstepbrothers.anchor.set(0.5, 0.5);
    //     this.addstepbrothers.x -= this.addstepbrothers.width;
    //
    //     this.parentsText = this.game.add.text(0, 0, english.parents, {
    //         font: "12px sans-serif", fill: "#ffffff", stroke: "#000000", strokeThickness: "6"
    //     });
    //
    //     this.stepparentsText = this.game.add.text(0, 0, english.stepparents, {
    //         font: "12px sans-serif",
    //         fill: "#ffffff",
    //         stroke: "#000000",
    //         strokeThickness: "6",
    //         wordWrap: true,
    //         wordWrapWidth: this.addstepparents.width * 0.5
    //     });
    //
    //     this.brotherText = this.game.add.text(0, 0, english.brothers, {
    //         font: "11px sans-serif",
    //         fill: "#ffffff",
    //         align: "center",
    //         stroke: "#000000",
    //         strokeThickness: "6",
    //         wordWrap: true,
    //         wordWrapWidth: this.addbrothers.width * 0.5
    //     });
    //
    //     this.stepbrotherText = this.game.add.text(0, 0, english.stepbrothers, {
    //         font: "11px sans-serif",
    //         fill: "#ffffff",
    //         align: "center",
    //         stroke: "#000000",
    //         strokeThickness: "6",
    //         wordWrap: true,
    //         wordWrapWidth: this.addbrothers.width * 0.5
    //     });
    //
    //     this.parentsText.anchor.set(0.5, 0.5);
    //     this.stepparentsText.anchor.set(0.5, 0.5);
    //     this.brotherText.anchor.set(0.5, 0.5);
    //     this.stepbrotherText.anchor.set(0.5, 0.5);
    //     this.brotherText.lineSpacing = -6;
    //     this.stepparentsText.lineSpacing = -6;
    //     this.stepbrotherText.lineSpacing = -6;
    //
    //     this.addparents.addChild(this.parentsText);
    //     this.addstepparents.addChild(this.stepparentsText);
    //     this.addbrothers.addChild(this.brotherText);
    //     this.addstepbrothers.addChild(this.stepbrotherText);
    //
    //     this.bottommenu.addChild(this.addparents);
    //     this.bottommenu.addChild(this.addstepparents);
    //     this.bottommenu.addChild(this.addbrothers);
    //     this.bottommenu.addChild(this.addstepbrothers);
    //
    //     this.openBottommenu = this.game.add.tween(this.bottommenu).to({y: this.game.height - (this.bottommenu.height + 5)}, 1000, Phaser.Easing.Exponential.Out);
    //     this.closeBottommenu = this.game.add.tween(this.bottommenu).to({y: this.game.height + (this.bottommenu.height + 5)}, 1000, Phaser.Easing.Exponential.Out);
    // }
    //
    // processMenu(menu) {
    //     if (menu && !menu.isRunning)
    //         menu.start();
    // }
    //
    // removeKeyListener() {
    //     this.upKey.onDown.removeAll();
    //     this.downKey.onDown.removeAll();
    // }
    //
    // addBottomControls() {
    //     this.listView.grp.y = 35;
    //     this.listView.cull();
    //     this.removeKeyListener();
    //     this.treeUI = [];
    //     this.iterateTreeLimit = this.family.length;
    //
    //     this.family.forEach(function (item) {
    //         this.treeUI.push({obj: item, x: 0.5, y: 0.5});
    //     }.bind(this), this);
    //
    //     this.upKey.onDown.add(function () {
    //         this.iterateTreeScroll(true);
    //         this.unselectAllNodes();
    //         this.treeUI.forEach(function (elm) {
    //             elm.obj.scale.setTo(elm.x, elm.y);
    //         }, this);
    //
    //         if (this.treeUI[this.iterateTree]) {
    //             this.tapNode(this.treeUI[this.iterateTree].obj);
    //             this.treeUI[this.iterateTree].obj.inputFocus(this.treeUI[this.iterateTree].obj.children[2]);
    //             this.treeUI[this.iterateTree].obj.children[1].onInputUp.dispatch();
    //         }
    //
    //     }.bind(this));
    //
    //     this.downKey.onDown.add(function () {
    //         this.iterateTreeScroll(false);
    //         this.unselectAllNodes();
    //         this.treeUI.forEach(function (elm) {
    //             elm.obj.scale.setTo(elm.x, elm.y);
    //         }, this);
    //
    //         if (this.treeUI[this.iterateTree]) {
    //             this.tapNode(this.treeUI[this.iterateTree].obj);
    //             this.treeUI[this.iterateTree].obj.inputFocus(this.treeUI[this.iterateTree].obj.children[2]);
    //             this.treeUI[this.iterateTree].obj.children[1].onInputUp.dispatch();
    //         }
    //
    //     }.bind(this));
    //
    //     this.UI = [];
    //
    //     this.UI.push({obj: this.addparents, x: 1, y: 1});
    //     this.UI.push({obj: this.addstepparents, x: 1, y: 1});
    //     this.UI.push({obj: this.addbrothers, x: 1, y: 1});
    //     this.UI.push({obj: this.addstepbrothers, x: 1, y: 1});
    //     this.UI.push({obj: this.openMenu, x: 1, y: 1});
    //
    //     this.iterate = -1;
    //     this.iterateLimit = 5;
    // }
    //
    // addSideControls() {
    //     this.removeKeyListener();
    //     this.listView.grp.y = 35;
    //     this.listView.cull();
    //     this.iterateScroll = 0;
    //
    //     this.listView.grp.forEach(function (item) {
    //         this.scrollUI.push({obj: item, x: 1, y: 1});
    //     }.bind(this), this);
    //
    //     this.upKey.onDown.add(function () {
    //         this.iterateUIScroll(true);
    //         this.scrollUI.forEach(function (elm) {
    //             elm.obj.scale.setTo(elm.x, elm.y);
    //         }, this);
    //         if (this.scrollUI[this.iterateScroll].obj) {
    //             this.listView.grp.y += 118;
    //             if (this.listView.grp.y > 35)
    //                 this.listView.grp.y = -1145;
    //             this.listView.cull();
    //             this.scrollUI[this.iterateScroll].obj.scale.setTo(this.scrollUI[this.iterateScroll].x + 0.1);
    //         }
    //     }.bind(this));
    //
    //     this.downKey.onDown.add(function () {
    //         this.iterateUIScroll(false);
    //         this.scrollUI.forEach(function (elm) {
    //             elm.obj.scale.setTo(elm.x, elm.y);
    //         }, this);
    //         if (this.scrollUI[this.iterateScroll].obj) {
    //             this.listView.grp.y -= 118;
    //             if (this.listView.grp.y <= -1205)
    //                 this.listView.grp.y = 35;
    //             this.listView.cull();
    //             this.scrollUI[this.iterateScroll].obj.scale.setTo(this.scrollUI[this.iterateScroll].x + 0.1);
    //         }
    //     }.bind(this));
    //
    //     this.UI = [];
    //
    //     this.UI.push({obj: this.openMenu, x: 1, y: 1});
    //     this.UI.push({obj: this.genre, x: 0.9, y: 0.9});
    //     this.UI.push({obj: this.genre2, x: 0.9, y: 0.9});
    //     this.UI.push({obj: this.downloadbtn, x: 1, y: 0.8});
    //     this.UI.push({obj: this.sharebtn, x: 1, y: 1});
    //
    //     this.iterate = -1;
    //     this.iterateLimit = 5;
    // }
    //
    //
    // addCharToNode(sprite) {
    //     console.log("addCharToNode")
    //     if (!this.game.selectedNode || this.game.selectedNode.relation == 'me') return;
    //
    //     var names = '';
    //     var type = '';
    //
    //     if (this.game.selectedNode.areParents()) {
    //         if (!this.genreType) {
    //             names = english.father;
    //             type = 'father';
    //         }
    //         else {
    //             names = english.mother;
    //             type = 'mother';
    //         }
    //     }
    //     else if (this.game.selectedNode.areStepParents()) {
    //         if (!this.genreType) {
    //             names = english.stepfather;
    //             type = 'stepfather';
    //         }
    //         else {
    //             names = english.stepmother;
    //             type = 'stepmother';
    //         }
    //     }
    //     else if (this.game.selectedNode.areBrothers()) {
    //         if (!this.genreType) {
    //             names = english.brother;
    //             type = 'brother';
    //         }
    //         else {
    //             names = english.sister;
    //             type = 'sister';
    //         }
    //     }
    //     else if (this.game.selectedNode.areStepBrothers()) {
    //         if (!this.genreType) {
    //             names = english.stepbrother;
    //             type = 'stepbrother';
    //         }
    //         else {
    //             names = english.stepsister;
    //             type = 'stepsister';
    //         }
    //     }
    //     else if (this.game.selectedNode.areSiblings()) {
    //         if (!this.genreType) {
    //             names = english.uncle;
    //             type = 'uncle';
    //         }
    //         else {
    //             names = english.aunt;
    //             type = 'aunt';
    //         }
    //     }
    //     else if (this.game.selectedNode.areGrantparents()) {
    //         if (!this.genreType) {
    //             names = english.grandfather;
    //             type = 'grandfather';
    //         }
    //         else {
    //             names = english.grandmother;
    //             type = 'grandmother';
    //         }
    //     }
    //     else if (this.game.selectedNode.areGreatGrantparents()) {
    //         if (!this.genreType) {
    //             names = english.grandgrandfather;
    //             type = 'grandgrandfather';
    //         }
    //         else {
    //             names = english.grandgrandmother;
    //             type = 'grandgrandmother';
    //         }
    //     }
    //
    //     var personGroup = null;
    //     //todo Check person siblingGroup.
    //
    //     var config = {
    //         name: names,
    //         type: type,
    //         image: 'characters',
    //         frame: sprite.frame,
    //         sex: this.genreType,
    //         group: personGroup
    //     };
    //
    //     this.game.selectedNode.setImageBg(config);
    //
    //     this.processMenu(this.closeSidemenu);
    //     this.listView.grp.visible = false;
    //     this.openMenu.frame = 0;
    //     //this.processMenu(this.openBottommenu);
    // }
    //
    // addParent(text) {
    //     if (!this.game.selectedNode || this.game.selectedNode.parentsCount >= 2 || this.game.selectedNode.relation == 'brothers' || this.game.selectedNode.relation == 'sibling' || this.game.selectedNode.relation == 'grandgrandparents') return;
    //
    //     var relation, xoffset, direction, indexCount;
    //
    //     if (this.game.selectedNode.eraseParentNode.length > 0) {
    //         indexCount = this.game.selectedNode.eraseParentNode.shift();
    //         this.game.selectedNode.parentsCount++;
    //     }
    //     else {
    //         this.game.selectedNode.parentsCount++;
    //         indexCount = this.game.selectedNode.parentsCount;
    //     }
    //
    //     if (this.game.selectedNode.relation == 'parents' || this.game.selectedNode.relation == 'stepparents') {
    //         relation = 'grantparents';
    //         if (indexCount == 1) {
    //             if (this.game.selectedNode.direction == 'right') {
    //                 direction = 'left';
    //                 xoffset = 80;
    //             }
    //             else {
    //                 direction = 'right';
    //                 xoffset = -80;
    //             }
    //         }
    //         else {
    //             if (this.game.selectedNode.direction == 'right') {
    //                 direction = 'right';
    //                 xoffset = 160;
    //             }
    //             else {
    //                 direction = 'left';
    //                 xoffset = -160;
    //             }
    //         }
    //     }
    //     else if (this.game.selectedNode.relation == 'grantparents') {
    //         direction = 'right';
    //         relation = 'grandgrandparents';
    //         if (indexCount == 1) {
    //             xoffset = 0;
    //         }
    //         else {
    //             if (this.game.selectedNode.direction == 'right') {
    //                 direction = 'right';
    //                 xoffset = 80;
    //             }
    //             else {
    //                 direction = 'left';
    //                 xoffset = -80;
    //             }
    //         }
    //     }
    //     else if (text == english.stepparents) {
    //         relation = 'stepparents';
    //         if (indexCount == 1) {
    //             direction = 'right';
    //             xoffset = 40;
    //         }
    //         else {
    //             direction = 'left';
    //             xoffset = -40;
    //         }
    //     }
    //     else if (this.game.selectedNode.relation == 'me') {
    //         relation = 'parents';
    //         if (indexCount == 1) {
    //             direction = 'right';
    //             xoffset = 40;
    //         }
    //         else {
    //             direction = 'left';
    //             xoffset = -40;
    //         }
    //     }
    //
    //     if (indexCount == 1) {
    //         var config1 = {
    //             nombre: '',
    //             type: '',
    //             relation: relation,
    //             direction: direction
    //         };
    //     }
    //     else {
    //         var config1 = {
    //             nombre: '',
    //             type: '',
    //             relation: relation,
    //             direction: direction
    //         };
    //     }
    //
    //
    //     if (this.game.selectedNode.relation == 'me') {
    //         var character1 = new Person(this.game, this.game.selectedNode.x + (xoffset), this.game.selectedNode.y - 110, config1);
    //         // var character2 = new Person(this.game,this.game.selectedNode.x+40, this.game.selectedNode.y-110, config2);
    //     }
    //     else if (this.game.selectedNode.relation == 'parents' || this.game.selectedNode.relation == 'stepparents' || this.game.selectedNode.relation == 'grantparents') {
    //         var character1 = new Person(this.game, this.game.selectedNode.x + (xoffset), this.game.selectedNode.y - 110, config1);
    //         //var character2 = new Person(this.game,this.game.selectedNode.x+(xoffset), this.game.selectedNode.y-110, config2);
    //     }
    //
    //     character1.mainNode = this.game.selectedNode;
    //     character1.parentNum = indexCount;
    //     this.game.selectedNode.parentNum = this.game.selectedNode.parentsCount;
    //     character1.eraseSignal.add(this.unselectAllNodes, this);
    //
    //     this.family.add(character1);
    //     this.addBottomControls();
    // }
    //
    // addBrother(text) {
    //     if (!this.game.selectedNode || (this.game.selectedNode.type != 'you' && this.game.selectedNode.relation != 'parents' && this.game.selectedNode.relation != 'stepparents')) return;
    //
    //     var relation, indexCount;
    //
    //     if (this.game.selectedNode.erasebrotherNode.length > 0) {
    //         indexCount = this.game.selectedNode.erasebrotherNode.shift();
    //         this.game.selectedNode.brotherCount++;
    //     }
    //     else {
    //         this.game.selectedNode.brotherCount = this.game.selectedNode.brotherNum;
    //         this.game.selectedNode.brotherCount++;
    //         indexCount = this.game.selectedNode.brotherCount;
    //     }
    //
    //     if (this.game.selectedNode.relation == 'parents' || this.game.selectedNode.relation == 'stepparents')
    //         relation = 'sibling';
    //     else if (this.game.selectedNode.relation == 'sibling')
    //         relation = 'sibling';
    //     else if (text == english.stepbrothers)
    //         relation = 'stepbrothers';
    //     else if (this.game.selectedNode.relation == 'me')
    //         relation = 'brothers';
    //
    //
    //     var config1 = {
    //         nombre: '',
    //         type: '',
    //         relation: relation,
    //         direction: 'left'
    //     };
    //
    //     var config2 = {
    //         nombre: '',
    //         type: '',
    //         relation: relation,
    //         direction: 'right'
    //     };
    //
    //     if (this.game.selectedNode.relation == 'me') {
    //         if (indexCount % 2 == 1)
    //             var brother = new Person(this.game, this.game.selectedNode.x - (100 * Math.ceil(indexCount * 0.5)), this.game.selectedNode.y, config1);
    //         else
    //             var brother = new Person(this.game, this.game.selectedNode.x + (100 * Math.ceil(indexCount * 0.5)), this.game.selectedNode.y, config2);
    //     }
    //     else {
    //         if (this.game.selectedNode.direction == 'left')
    //             var brother = new Person(this.game, this.game.selectedNode.x - (100 * indexCount), this.game.selectedNode.y, config1);
    //         else
    //             var brother = new Person(this.game, this.game.selectedNode.x + (100 * indexCount), this.game.selectedNode.y, config2);
    //     }
    //
    //     brother.mainNode = this.game.selectedNode;
    //     brother.brotherNum = indexCount;
    //     this.game.selectedNode.brotherNum = this.game.selectedNode.brotherCount;
    //     brother.eraseSignal.add(this.unselectAllNodes, this);
    //
    //     this.family.add(brother);
    //     this.addBottomControls();
    // }
    //
    //
    //

    //
    // tryTapNode() {
    //     this.family.forEachAlive(function (e) {
    //         var bool = Phaser.Rectangle.contains(e.body, this.game.input.activePointer.x, this.game.input.activePointer.y);
    //
    //         if (this.click || !bool) return;
    //
    //         if (e.selected == false) this.tapNode(e);
    //         else this.unselectAllNodes()
    //     }, this);
    // }
    //
    // tapNode(e) {
    //     if (e.selected) return;
    //     this.processMenu(this.openBottommenu);
    //     this.addBottomControls();
    //     this.sidemenu.bringToTop();
    //     this.game.world.bringToTop(this.listView.grp);
    //
    //     this.unselectAllNodes();
    //     this.game.selectedNode = e;
    //     this.click = true;
    //     e.selected = true;
    //     e.children[0].frame = 1;
    // }
    //
    //
    //
    // update() {
    //     if (this.game.selectedNode) {
    //         if (this.click) {
    //             this.family.pivot.x = this.game.selectedNode.x;
    //             this.family.pivot.y = this.game.selectedNode.y;
    //             this.family.x = this.game.input.activePointer.x;
    //             this.family.y = this.game.input.activePointer.y;
    //         }
    //     }
    //
    //     if (this.game.input.activePointer.isDown && this.game.time.now > this.next_time) {
    //         this.tryTapNode();
    //         this.next_time = this.game.time.now + 300;
    //     }
    //     else if (this.game.input.activePointer.isUp) {
    //         this.click = false;
    //     }
    // }
}