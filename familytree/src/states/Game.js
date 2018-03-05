import Phaser from 'phaser'
import {ListView} from 'phaser-list-view'
import language from './Boot'
import Person from './Person'
import english from '../language/language'
import CanvasImageSaver from 'canvas-image-saver'


export default class extends Phaser.State {
    create() {
        this.next_time = 0;
        this.click = false;
        this.genreType = false;
        this.selectedNode = null;

        this.bg = this.game.add.sprite(0, 0, 'fondo');

        this.createSideMenu();
        this.createBottomMenu();

        this.youText = this.game.add.text(this.game.width*0.5, 80, english.you, { 
            font: "26px sans-serif", fill: "#ffffff", stroke:"#000000", strokeThickness:"6"
        });   

        this.activeBottomMenu(false);

        this.boyBtn = this.game.add.button(this.game.width*0.5, 150, 'boygirl', this.chooseMe, this);
        this.boyBtn.x -= this.boyBtn.width;
        this.boyBtn.frame = 0;

        this.girlBtn = this.game.add.button(this.game.width*0.5, 150, 'boygirl', this.chooseMe, this);
        this.girlBtn.x += this.girlBtn.width*0.5;
        this.girlBtn.frame = 1;

        this.family = this.game.add.group();
        this.family.x = this.game.width*0.5;
        this.family.y = this.game.height*0.5;
        this.family.pivot.x =this.game.width*0.5;
        this.family.pivot.y =  this.game.height*0.3;

    }
   
    createSideMenu() {
        this.sidemenu = this.game.add.sprite(this.game.width, 6, 'sidemenu');
        
        this.downloadbtn = this.game.add.button(0, this.sidemenu.height, 'sharebtn', this.capture, this,1,0,0,0);
        this.downloadbtn.input.priorityID = 1;
        this.downloadbtn.scale.set(1,0.8);
        this.downloadbtn.anchor.set(0.5,0.5);
        this.downloadbtn.x += this.downloadbtn.width*0.7;
        this.downloadbtn.y -= this.downloadbtn.height*2.1;

        this.sharebtn = this.game.add.button(this.downloadbtn.x, this.downloadbtn.y+this.downloadbtn.height+4, 'sharebtn', this.share, this,1,0,0,0);
        this.sharebtn.anchor.set(0.5,0.5);

        this.downloadText = this.game.add.text(0, 0, english.download, { 
            font: "14px sans-serif", fill: "#ffffff", stroke:"#000000", strokeThickness:"6"
         });
    
        this.shareText = this.game.add.text(0, 1, english.share, { 
            font: "12px sans-serif", fill: "#ffffff", stroke:"#000000", strokeThickness:"6",wordWrap: true, wordWrapWidth: this.sharebtn.width*0.8
         }); 

        this.downloadText.anchor.set(0.5,0.5);  
        this.shareText.anchor.set(0.5,0.5); 
        this.shareText.lineSpacing = -6;

        var options = {
          direction: 'y',
          overflow: 100,
          padding: 10,
          swipeEnabled: true,
          offsetThreshold: 100,
          searchForClicks: true,
        }

        this.listView = new ListView(this.game, this.game.world, new Phaser.Rectangle(this.game.width-150,30, 220,280), options);

        for (var i = 0; i < 11; i++) {
            var item = this.game.add.sprite(0, 0, 'sidebg');
            var character = this.game.add.sprite(0, 0, 'characters',i);
            
            character.alignIn(item, Phaser.CENTER,0,0);
            item.addChild(character);

            character.inputEnabled = true;
            character.input.priorityID = 0;
            character.input.useHandCursor = true;
            character.events.onInputDown.add(this.addCharToNode,this);
       
            this.listView.add(item);
        }
        this.listView.grp.visible = false;

        this.genre = this.game.add.button(this.downloadbtn.x,this.downloadbtn.y, 'genre',function(){
            this.listView.grp.forEachAlive(function(character) {
                if(this.genreType)
                    character.children[0].frame -= 11;
            }, this);

            this.genreType = false;
        }.bind(this));

        this.genre.frame = 0;
        this.genre.input.priorityID = 1;
        this.genre.anchor.set(0.5);
        this.genre.scale.set(0.9,0.9);
        this.genre.x -= this.genre.height*0.6;
        this.genre.y -= this.genre.height*1.2;

        this.genre2 = this.game.add.button(this.downloadbtn.x,this.downloadbtn.y, 'genre',function(){
            this.listView.grp.forEachAlive(function(character) {
                if(!this.genreType)
                    character.children[0].frame += 11;
            }, this);

            this.genreType = true;
        }.bind(this));

        this.genre2.frame = 1;
        this.genre2.input.priorityID = 1;
        this.genre2.anchor.set(0.5);
        this.genre2.scale.set(0.9,0.9);
        this.genre2.x += this.genre2.height*0.6;
        this.genre2.y -= this.genre2.height*1.2;

        this.openMenu = this.game.add.button(0,this.sidemenu.height*0.5, 'openMenu',function(){
            if(this.openMenu.frame ==0){
                this.processMenu(this.closeBottommenu);
                this.processMenu(this.openSidemenu);
            }
            else{
               this.processMenu(this.closeSidemenu);
               this.processMenu(this.openBottommenu); 
            }
        }.bind(this));

        this.openMenu.anchor.set(0.5);
        this.openMenu.input.priorityID = 2;
        this.openMenu.x -= this.openMenu.width*0.4;

        this.downloadbtn.addChild(this.downloadText);
        this.sharebtn.addChild(this.shareText);
        this.sidemenu.addChild(this.openMenu);
        this.sidemenu.addChild(this.sharebtn);
        this.sidemenu.addChild(this.downloadbtn);
        this.sidemenu.addChild(this.genre);
        this.sidemenu.addChild(this.genre2);

        this.openSidemenu = this.game.add.tween(this.sidemenu).to({ x: this.game.width-(this.sidemenu.width+6) }, 1000, Phaser.Easing.Exponential.Out);
        this.closeSidemenu = this.game.add.tween(this.sidemenu).to({ x: this.game.width}, 1000, Phaser.Easing.Exponential.Out);
        
        this.openSidemenu.onComplete.add(function(){this.listView.grp.visible = true; this.openMenu.frame = 1;},this);
        this.closeSidemenu.onStart.add(function(){this.listView.grp.visible = false; this.openMenu.frame = 0;},this);
    }

    createBottomMenu(){
        this.bottommenu = this.game.add.sprite(5, this.game.height, 'bottommenu');
        this.bottommenu.y += this.bottommenu.height;

        this.addparents = this.game.add.button(this.bottommenu.x, 35, 'sharebtn', this.addParent, this,1,0,0,0);
        this.addparents.anchor.set(0.5,0.5);
        this.addparents.x += this.addparents.width*2;

        this.addbrothers = this.game.add.button(this.bottommenu.width, 35, 'sharebtn', this.addBrother, this,1,0,0,0);
        this.addbrothers.anchor.set(0.5,0.5);
        this.addbrothers.x -= this.addbrothers.width*2;

        this.parentsText = this.game.add.text(0, 0, english.parents, { 
            font: "12px sans-serif", fill: "#ffffff", stroke:"#000000", strokeThickness:"6"
        });

        this.brotherText = this.game.add.text(0, 0, english.brothers, { 
            font: "11px sans-serif", fill: "#ffffff",align:"center", stroke:"#000000", strokeThickness:"6",wordWrap: true, wordWrapWidth: this.addbrothers.width*0.5
         }); 

        this.parentsText.anchor.set(0.5,0.5);  
        this.brotherText.anchor.set(0.5,0.5);  
        this.brotherText.lineSpacing = -6;

        this.addparents.addChild(this.parentsText);
        this.addbrothers.addChild(this.brotherText);

        this.bottommenu.addChild(this.addparents);
        this.bottommenu.addChild(this.addbrothers);

        this.openBottommenu = this.game.add.tween(this.bottommenu).to({ y: this.game.height-(this.bottommenu.height+5)}, 1000, Phaser.Easing.Exponential.Out,true);
        this.closeBottommenu = this.game.add.tween(this.bottommenu).to({ y: this.game.height+(this.bottommenu.height+5)}, 1000, Phaser.Easing.Exponential.Out);
    }

    processMenu(menu){
        if(menu && !menu.isRunning)
            menu.start();
    }

    chooseMe(button){
        var id = button.frame;
        this.boyBtn.destroy(); 
        this.girlBtn.destroy(); 
        this.youText.destroy();
        this.activeBottomMenu(true);
        this.openMenu.visible = true;

        var config = {
            nombre:  english.you,
            image: 'boygirl',
            frame: id,
            sex: (id==0)?false:true,
            type: 'you',
            relation: 'me'
        };

        this.you = new Person(this.game,this.game.width*0.5, 150, config);
        this.family.add(this.you);
    }

    activeBottomMenu(lock){
        this.addparents.inputEnabled = lock;
        this.addbrothers.inputEnabled = lock;

        if(lock == false){
            this.addparents.alpha = 0.7;
            this.addbrothers.alpha = 0.7;
        }
        else{
            this.addparents.alpha = 1;
            this.addbrothers.alpha = 1;  
        }
    }

    addCharToNode(sprite){
        if(!this.selectedNode || this.selectedNode.haveImageBg()) return;

        var names = '';
        var type = '';
            
        if(this.selectedNode.areParents()){
            if(!this.genreType){
                 names = english.father;
                 type = 'father';
            }
            else{
                 names = english.mother;
                 type = 'mother';
            }
        }
        else if (this.selectedNode.areBrothers()){
             if(!this.genreType){
                 names = english.brother;
                 type = 'brother';
            }
            else{
                 names = english.sister;
                 type = 'sister';
            }
        }
        else if (this.selectedNode.areSiblings()){
             if(!this.genreType){
                 names = english.uncle;
                 type = 'uncle';
            }
            else{
                 names = english.aunt;
                 type = 'aunt';
            }
        }
        else if (this.selectedNode.areGrantparents()){
             if(!this.genreType){
                 names = english.grandfather;
                 type = 'grandfather';
            }
            else{
                 names = english.grandmother;
                 type = 'grandmother';
            }
        }

        var config = {
            name: names,
            type: type,
            image: 'characters',
            frame: sprite.frame,
            sex: this.genreType
        };

        this.selectedNode.setImageBg(config);
      
        this.processMenu(this.closeSidemenu);
        this.processMenu(this.openBottommenu);
    }

    addParent(){
        if(!this.selectedNode || this.selectedNode.getParents() || this.selectedNode.relation == 'brothers' || this.selectedNode.relation == 'sibling' || this.selectedNode.relation == 'grantparents') return;

        var relation,xoffset;
       if(this.selectedNode.relation == 'parents'){
            relation = 'grantparents';
            if(this.selectedNode.direction == 'left')
                xoffset = -80;
            else
                 xoffset = 80;
       }
        else if(this.selectedNode.relation == 'me')
            relation = 'parents';

        var config1 = {
            nombre: '',
            type: '',
            relation: relation,
            direction: 'left'
        };

        var config2 = {
            nombre: '',
            type: '',
            relation: relation,
            direction: 'right'
        };

        this.selectedNode.setParents(true);

        if(this.selectedNode.relation == 'me'){
            var character1 = new Person(this.game, this.selectedNode.x-40, this.selectedNode.y-110, config1);
            var character2 = new Person(this.game,this.selectedNode.x+40, this.selectedNode.y-110, config2);
        }
        else  if(this.selectedNode.relation == 'parents'){
            var character1 = new Person(this.game, this.selectedNode.x, this.selectedNode.y-110, config1);
            var character2 = new Person(this.game,this.selectedNode.x+(xoffset), this.selectedNode.y-110, config2);
        }

        this.family.add(character1);
        this.family.add(character2);
    }

    addBrother(){
        if(!this.selectedNode || (this.selectedNode.type != 'you' && this.selectedNode.type != 'mother' && this.selectedNode.type != 'father')) return;

       this.selectedNode.brotherCount++;
       var relation;

       if(this.selectedNode.relation == 'parents')
            relation = 'sibling';
        else if(this.selectedNode.relation == 'me')
             relation = 'brothers';

        var config1 = {
            nombre: '',
            type: '',
            relation: relation,
            direction: 'left'
        };

         var config2 = {
            nombre: '',
            type: '',
            relation: relation,
            direction: 'right'
        };

        if(this.selectedNode.relation != 'parents'){
            if(this.selectedNode.brotherCount % 2 == 1)
                var brother = new  Person(this.game,this.selectedNode.x-(100*Math.ceil(this.selectedNode.brotherCount*0.5)), this.selectedNode.y, config1);
            else
                var brother = new  Person(this.game,this.selectedNode.x+(100*Math.ceil(this.selectedNode.brotherCount*0.5)), this.selectedNode.y, config2);
        }
        else{
             if(this.selectedNode.direction == 'left')
                var brother = new  Person(this.game,this.selectedNode.x-(100*this.selectedNode.brotherCount), this.selectedNode.y, config1);
            else
                var brother = new  Person(this.game,this.selectedNode.x+(100*this.selectedNode.brotherCount), this.selectedNode.y, config2);
        }
        this.family.add(brother);
    }

    capture(){
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
         
         this.processMenu(this.closeSidemenu);
         this.game.time.events.add(1000,function(){canvasImageSaver.save("myfamilytree","myfamilytree");},this);
    }

    share(){
        var canvasImageSaver = new CanvasImageSaver(
          this.game.canvas, {
            xCropOffset: 0,
            yCropOffset: 0,
            width: this.game.width-180,
            height: this.game.height
          }, function (canvas, fileName) {
            // Success callback 
          }, function (error) {
            // Error callback 
          }, this);


        var url = 'https://www.facebook.com/dialog/share?app_id=152735522079067&display=page&quote=Checkout family tree I build. Visit dtml.org&href=https://blog.dtml.org/'
        
        window.open(url , '_blank');

        fetch('https://dtml.org/Activity/RecordUserActivity?id=familytree&score=1000',{
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

    tryTapNode(){
        this.family.forEachAlive(function(e) {
            var bool = Phaser.Rectangle.contains(e.body, this.game.input.activePointer.x, this.game.input.activePointer.y);
            if (this.click || !bool) return;

            if (e.selected == false) this.tapNode(e);
            else this.unselectAllNodes()
        }, this);
    }

    tapNode(e) {
        if(e.selected) return;

        if(e.type != 'you' && !e.haveImageBg()){
            this.processMenu(this.closeBottommenu);
            this.processMenu(this.openSidemenu);
        }

        this.unselectAllNodes();
        this.selectedNode = e;
        this.click = true;
        e.selected = true;
        e.children[0].frame = 1;
    }

     unselectAllNodes() {
        this.selectedNode = null;
        this.family.forEachAlive(function(e) {
            if (e.selected) {
                e.selected = false;
                e.children[0].frame = 0;
            }
        }, this);
    }
    
    update() {
        
        if(this.selectedNode){
            if(this.selectedNode.type == "you")
                if(this.click){
                    this.family.x = this.game.input.x;
                    this.family.y = this.game.input.y;
                }
        }

        if (this.game.input.activePointer.isDown && this.game.time.now > this.next_time) {
            this.tryTapNode();
            this.next_time = this.game.time.now + 300;
        }
        else if (this.game.input.activePointer.isUp){
            this.click = false;
        }
    }
}