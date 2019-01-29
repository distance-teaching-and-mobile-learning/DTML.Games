export default class {
  constructor ({ game }, apa) {
    // super(game)
    // set default
    this.bgs = []
    for (let i = 1; i < 5; i++) {
      let bg = game.add.sprite(game.world.centerX, game.world.height, 'bg' + i)
      bg.anchor.set(0.5, 1)
      // bg.scale.set(0.75 * game.scaleRatio)
      bg.alpha = 0
      this.bgs.push(bg)
    }
    // green background always shows
    this.bgs[0].alpha = 1

    /*
        // trees, left and right
        bgs[1].x -= 100
        game.add.tween(bgs[1]).to({x: game.world.centerX, alpha: 1}, 2000, Phaser.Easing.Cubic.In, true, 1000)
        bgs[3].x += 100
        game.add.tween(bgs[3]).to({x: game.world.centerX, alpha: 1}, 1500, Phaser.Easing.Cubic.In, true, 1000)
        bgs[4].x -= 100
        game.add.tween(bgs[4]).to({x: game.world.centerX, alpha: 1}, 1000, Phaser.Easing.Cubic.In, true, 1000)

        // bush, from the ground up
        bgs[2].y += 100
        bgs[5].y += 100
        game.add.tween(bgs[2]).to({y: game.world.height, alpha: 1}, 2000, Phaser.Easing.Cubic.In, true, 1000)
        game.add.tween(bgs[5]).to({y: game.world.height, alpha: 1}, 1000, Phaser.Easing.Cubic.In, true, 1000)
        */
    // drop the ground and bounce
    if (apa === 1) {
      this.bgs[3].alpha = 1
      this.bgs[3].y = 0
      game.add
        .tween(this.bgs[3])
        .to(
          { y: game.world.height },
          game.rnd.integerInRange(500, 1000),
          Phaser.Easing.Bounce.Out,
          true,
          500
        )
    }

    if (apa === 0) {
      this.bgs[1].y = game.world.height / 2 - 75
      game.add
        .tween(this.bgs[1])
        .to(
          { x: game.world.centerX, alpha: 1 },
          500,
          Phaser.Easing.Cubic.In,
          true,
          500
        )
      this.bgs[2].y += 400
      game.add
        .tween(this.bgs[2])
        .to(
          { y: this.bgs[1].y + this.bgs[2].height + 30, alpha: 1 },
          2000,
          Phaser.Easing.Cubic.In,
          true,
          500
        )
    }
  }
}
