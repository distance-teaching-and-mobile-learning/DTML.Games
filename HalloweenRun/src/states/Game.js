/* globals __DEV__ */
import Phaser from 'phaser'
import Mushroom from '../sprites/Mushroom'
import lang from '../lang'

export default class extends Phaser.State {
  init() { }
  
  preload() {
    this.game.load.tilemap('level1', 'assets/images/level1.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.image('tiles-1', 'assets/images/tiles-1.png');
    this.game.load.spritesheet('dude', 'assets/images/dude.png', 32, 48);
	this.game.load.spritesheet('pumpkin', 'assets/images/pumpkin.png', 32, 48);
    this.game.load.spritesheet('droid', 'assets/images/droid.png', 32, 32);
    this.game.load.image('starSmall', 'assets/images/star.png');
    this.game.load.image('starBig', 'assets/images/star2.png');
    this.game.load.image('background', 'assets/images/background2.png');
	}
	
update() {
    this.game.physics.arcade.collide(this.player, this.layer);
	
	for(var i = 0; i < this.maxPumpkins; i++)
	{
		this.game.physics.arcade.collide(this.pumpkin[i], this.layer);
		this.game.physics.arcade.collide(this.player, this.pumpkin[i]);
	}
	  
    this.player.body.velocity.x = 0;
    if (this.cursors.left.isDown)
    {
        this.player.body.velocity.x = -150;

        if (this.facing != 'left')
        {
            this.player.animations.play('left');
            this.facing = 'left';
        }
    }
    else if (this.cursors.right.isDown)
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
    
    if (this.jumpButton.isDown && this.player.body.onFloor() && this.game.time.now > this.jumpTimer)
    {
        this.player.body.velocity.y = -250;
        this.jumpTimer = this.game.time.now + 750;
    }

}


 create() {
	 this.facing = 'left';
	 this.jumpTimer = 0;

      this.game.physics.startSystem(Phaser.Physics.ARCADE);

      this.game.stage.backgroundColor = '#000000';

      this.bg = game.add.tileSprite(0, 0, 800, 600, 'background');
      this.bg.fixedToCamera = true;

      this.map = game.add.tilemap('level1');

      this.map.addTilesetImage('tiles-1');

      this.map.setCollisionByExclusion([ 13, 14, 15, 16, 46, 47, 48, 49, 50, 51 ]);
      this.layer = this.map.createLayer('Tile Layer 1');

      //this.layer.debug = true;

      this.layer.resizeWorld();

      this.game.physics.arcade.gravity.y = 250;

      this.player = game.add.sprite(32, 32, 'dude');
	  this.pumpkin = {};
	  this.maxPumpkins = 10;
	  
      for(var i = 0; i < this.maxPumpkins; i++)
	  {
 	  this.pumpkin[i] = game.add.sprite(32, 32, 'pumpkin');
	  this.pumpkin[i].x = 150+100*i;
      this.game.physics.enable(this.pumpkin[i], Phaser.Physics.ARCADE); 
	  this.pumpkin[i].body.collideWorldBounds = true;	  
	  }
	  
	 
      this.game.physics.enable(this.player, Phaser.Physics.ARCADE);


      this.player.body.bounce.y = 0.2;
      this.player.body.collideWorldBounds = true;
      this.player.body.setSize(20, 32, 5, 16);

      this.player.animations.add('left', [0, 1, 2, 3], 10, true);
      this.player.animations.add('turn', [4], 20, true);
      this.player.animations.add('right', [5, 6, 7, 8], 10, true);

     this.game.camera.follow( this.player);

     this.cursors =  this.game.input.keyboard.createCursorKeys();
     this.jumpButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

}


  render() {
  }
}
