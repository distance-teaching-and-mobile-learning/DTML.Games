import Phaser from 'phaser'
import english from '../language/language'


export default class extends Phaser.State {
    create() {  
      this.sfxbtn = this.game.add.audio('boton'); 

      this.bg = this.game.add.sprite(0, 0, 'fondo');
      this.bg.width = this.game.width;
      this.bg.height = this.game.height;
      
      this.title = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'title');
      this.title.x -= this.title.width*0.4;
      this.title.y -= this.title.height*0.8;

      this.button = this.game.add.button(this.game.world.centerX, this.game.world.centerY, 'button', this.stop, this,1,0,0,0);
      this.button.x -= this.button.width*0.5;
      this.button.y += this.button.height;
        
      this.playButton = this.game.add.text(this.button.x, this.button.y, english.start, { 
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

      var data = { "envelop": null, "page": "familytree", "time": null, "eventType": "GameStarted", "eventData": navigator.userAgent }

      $.ajax({
          type: 'POST',
          async: true,
          processData: false,
          contentType: 'application/json',
          url: 'https://dtml.org/Activity/Record/',
          data: JSON.stringify(data)
      });
     } catch (err) { }

      this.sfxbtn.play();
      this.startGame()
    }

    startGame() {
        this.game.stateTransition.to('Game');
        this.game.world.removeAll();
    }
}