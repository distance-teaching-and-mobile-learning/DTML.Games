import Phaser from 'phaser'
import {dtml} from '../dtml-sdk'

export default class extends Phaser.State {
	preload()
	{
      this.load.spritesheet('button', 'assets/images/button.png',175,85);
	  this.load.image('dtmlHalloween', 'assets/images/bg.png');		
	}
	
    create() {  
      this.bg = this.game.add.sprite(0, 0, 'dtmlHalloween');
      this.bg.width = this.game.width;
      this.bg.height = this.game.height;    
      this.button = this.game.add.button(this.game.width*0.5, this.game.height*0.5, 'button', this.stop, this,1,0,0,0);
      this.button.x -= this.button.width*0.5;
      this.button.y += this.button.height;
        
      this.playButton = this.game.add.text(this.button.x, this.button.y, "START", { 
        font: "20px sans-serif", fill: "#ffffff", stroke:"#000000", strokeThickness:"6"
      });

      this.playButton.alignIn(this.button, Phaser.TOP_CENTER, 0, -25);

      this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);

      this.enterKey.onDown.addOnce(function(){
          this.enterKey.onDown.removeAll();
          this.stop();
      }.bind(this), this);
      
    }
    
    stop() {
      try {
			dtml.recordGameStart("helloween");
     } catch (err) { }

      this.startGame()
    }

    startGame() {
          this.state.start('Game');
        this.game.world.removeAll();
    }
}
