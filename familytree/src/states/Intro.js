import Phaser from 'phaser'

export default class extends Phaser.State {
    preload() {
    
    }

    create() {
        this.introVideo = this.game.add.video('intro');
     	this.introVideo.play();
     	this.introVideo.addToWorld(this.game.world.centerX,this.game.world.centerY,0.5,0.5,0.8,0.8);

     	this.introVideo.onComplete.add(function(){
     		 this.game.stateTransition.to('Menu');
       		 this.game.world.removeAll();
     	},this);
    }
}