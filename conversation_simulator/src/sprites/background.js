export default class {
  constructor ({ game }, startingBackground) {
    // set default
    this.gameBackground = game.add.sprite(game.world.centerX, game.world.height, 'bg' + startingBackground)
    this.gameBackground.anchor.set(0.5, 1)
    this.footerBackground = game.add.sprite(game.world.centerX, game.world.height, 'footer')
    this.footerBackground.anchor.set(0.5, 1)

    // drop the ground and bounce
    this.footerBackground.y = 0
    game.add
      .tween(this.footerBackground)
      .to(
        { y: game.world.height },
        game.rnd.integerInRange(500, 1000),
        Phaser.Easing.Bounce.Out,
        true,
        500
      )
  }
}
