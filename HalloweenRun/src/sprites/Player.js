export default class Player extends Phaser.Sprite {
  constructor (game, scene, x, y, asset) {
    super(game, x, y, asset)
    this.gameScene = scene
    this.anchor.setTo(0.5)

    game.physics.enable(this, Phaser.Physics.ARCADE)

    this.body.bounce.y = 0
    this.body.collideWorldBounds = true
    this.body.setSize(20, 32, 5, 16)

    this.animations.add('left', [0, 1, 2, 3], 10, true)
    this.animations.add('turn', [4], 20, true)
    this.animations.add('right', [5, 6, 7, 8], 10, true)

    this.facing = 'right'
    this.jumpTimer = 0
    this.onGround = false

    this.initialJumpPower = 300
    this.jumpSustainPower = 45
    this.maxFallSpeed = 1800
    this.jumpTimerMax = 6
  }

  update () {
    this.body.velocity.x = 0
    if (this.gameScene.leftButton.isDown || this.gameScene.cursors.left.isDown) {
      this.body.velocity.x = -150

      if (this.facing !== 'left') {
        this.animations.play('left')
        this.facing = 'left'
      }
    } else if (this.gameScene.rightButton.isDown || this.gameScene.cursors.right.isDown) {
      this.body.velocity.x = 150

      if (this.facing !== 'right') {
        this.animations.play('right')
        this.facing = 'right'
      }
    } else {
      if (this.facing !== 'idle') {
        this.animations.stop()

        if (this.facing === 'left') {
          this.frame = 0
        } else {
          this.frame = 5
        }

        this.facing = 'idle'
      }
    }

    if (this.gameScene.jumpButton.isDown || this.gameScene.jumpButton1.isDown) {
      if (this.onGround) {
        console.log('jump')
        this.body.velocity.y = -this.initialJumpPower
        this.onGround = false
        this.jumpTimer = this.jumpTimerMax
      } else if (this.jumpTimer > 0) {
        this.body.velocity.y -= this.jumpSustainPower
        this.jumpTimer--
      }
    } else {
      this.jumpTimer = 0
    }

    // Max fall speed
    if (this.body.velocity.y > this.maxFallSpeed) {
      this.body.velocity.y = this.maxFallSpeed
    }
  }

  // Runs when the player collides with level geometry
  collideWithWorld (self, tile) {
    if (tile.worldY > self.body.y) {
      console.log(self.body.y, tile.worldY)
      self.onGround = true
    }
  }
}
