export default class Player extends Phaser.Sprite {
  constructor (game, scene, x, y, key) {
    super(game, x, y, key)
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
    this.hp = 3

    this.initialJumpPower = 300
    this.jumpSustainPower = 30
    this.maxFallSpeed = 1800
    this.jumpTimerMax = 8
    this.airJumpPower = 400
    this.maxJumps = 2
    this.numberOfJumps = this.maxJumps
    this.jumping = false
    this.canMove = true
    this.canCollide = true
  }

  update () {
    this.body.velocity.x = 0
    if (this.canMove) {
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
        if (this.jumping) {
          if (this.jumpTimer > 0 && this.numberOfJumps === this.maxJumps - 1) {
            this.body.velocity.y -= this.jumpSustainPower
            this.jumpTimer--
          }
        } else if (this.numberOfJumps > 0) {
          this.jumping = true
          this.onGround = false
          this.jumpTimer = this.jumpTimerMax
          if (this.numberOfJumps === this.maxJumps) {
            this.body.velocity.y = -this.initialJumpPower
          } else {
            this.body.velocity.y = -this.airJumpPower
          }
          this.numberOfJumps--
        }
      } else {
        this.jumping = false
        this.jumpTimer = 0
      }
    }

    // Max fall speed
    if (this.body.velocity.y > this.maxFallSpeed) {
      this.body.velocity.y = this.maxFallSpeed
    }
  }

  // Runs when the player collides with level geometry
  collideWithWorld (self, tile) {
    if (self.isTileBelow(tile)) {
      self.onGround = true
      self.numberOfJumps = self.maxJumps
    }
  }

  isTileBelow (tile) {
    if (this.body.bottom <= tile.top) {
      return true
    }
  }
}
