/* globals __DEV__ */
import Phaser from 'phaser'
import Mushroom from '../sprites/Mushroom'
import Spriter from '../libs/spriter'
import Background from '../sprites/background'

export default class extends Phaser.State {
  init() { }
  preload() { }

  create() {
    let bg = new Background({game: this.game})

    let music = game.add.audio('gameMusic')
    music.onDecoded.add(() =>{
      music.fadeIn(4000)
      this.time.events.add(25000, () =>{
        music.fadeOut(4000)
      })
    }, this)
    this.explosion = game.add.audio('explosion')
    this.blaster = game.add.audio('blaster', 0.5)

    this.spritesGroup = this.add.group()

    this.wiz = this.loadSpriter('wizard')
    this.wiz.scale.set(0.17, 0)
    this.wiz.x = this.world.centerX - this.wiz.width - 120
    this.wiz.y = this.world.height - (this.wiz.height / 2) - 150
    this.wiz.setAnimationSpeedPercent(40)
    this.wiz.playAnimationByName('_IDLE')
    this.spritesGroup .add(this.wiz)
    
    this.gnome = this.loadSpriter('gnome')
    this.gnome.scale.set(-0.3, 0)

    this.gnome.children.forEach(sprite => {
      sprite.anchor.set(0, 1)
    })

    this.gnome.x = this.world.centerX - this.gnome.width + 80
    this.gnome.y = this.world.height - (this.gnome.height / 2) - 90
    this.gnome.setAnimationSpeedPercent(40)
    this.gnome.playAnimationByName('_IDLE')
    this.spritesGroup.add(this.gnome)

    game.add.tween(this.wiz.scale).to({y: 0.17}, 800, Phaser.Easing.Bounce.Out, true, 1500);    
    game.add.tween(this.gnome.scale).to({y: 0.3}, 800, Phaser.Easing.Bounce.Out, true, 1500);    
    

    let graphics = game.add.graphics(0, 0)
    let width = 500
    // draw a rectangle
    graphics.beginFill(0xFFFFFF, 1)
    graphics.lineStyle(2, 0x000000, 1)
    graphics.drawRoundedRect(0, 0, width, 50, 10)
    graphics.endFill()

    let questionField = game.add.sprite(this.world.centerX, 50, graphics.generateTexture())
    questionField.anchor.set(0.5, 0.5)
    graphics.destroy()

    questionField.scale.set(0, 1)

    const bannerText = 'APPLE BANANA'
    let banner = this.add.text(0, 0, bannerText, {
      font: '40px Arial Black',
      fill: '#000000',
      fontWeight: 'bold',
      smoothed: false
    })
    banner.padding.set(10, 16)
    banner.anchor.setTo(0.5, 0.5)
    banner.x = questionField.width / 2
    questionField.addChild(banner)
    console.log('banner width', banner.width, -(questionField.width / 2) - banner.width)

    
    game.add.tween(questionField.scale).to({x: 1 }, 500, Phaser.Easing.Bounce.Out, true, 2500)

    let inputW = 350
    let inputH = 40
    let inputField = this.add.inputField(this.world.centerX - (inputW / 2), this.game.height - (inputH * 2), {
      font: '40px Arial',
      fill: '#212121',
      fontWeight: 'bold',
      width: inputW,
      padding: 8,
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: 6,
      placeHolder: 'Your answer:'
    })
    inputField.scale.set(0, 1)
    game.add.tween(inputField.scale).to({x: 1 }, 500, Phaser.Easing.Cubic.Out, true, 2500)

    let iconAttack = this.createIcon(0, 0, 'iconAttack')
    iconAttack.scale.set(0, 0.5)
    iconAttack.x = inputField.x + inputField.width + (this.icon.width)
    iconAttack.y = inputField.y + this.icon.height / 2 - 3
    iconAttack.inputEnabled = true
    iconAttack.events.onInputDown.add(() => {
      if(this.canFire) {
        this.castSpell()
      }
    })       
    game.add.tween(iconAttack.scale).to({x: 0.5}, 500, Phaser.Easing.Bounce.Out, true, 2700)    

    // let iconHome = this.createIcon(50, 50, 'iconHome')
    // iconHome.scale.set(0.3)
    // iconHome.inputEnabled = true
    // iconHome.events.onInputDown.add(() => {
    //   this.state.start('Menu')
    // })      

    // our fireball sprite
    let fireball = game.add.sprite(0, 0, 'fireball');
    fireball.scale.set(1);
    fireball.anchor.set(0.5);
    // there 2 animations to play
    // 1. while it's moving and 2. when it hits the ground
    let move = fireball.animations.add('move', [0, 1, 2, 3, 4, 5]);
    let hit = fireball.animations.add('hit', [6, 7, 8, 9, 10, 11, 12, 13, 14]);
    this.fireball = fireball
    this.fireball.kill()

    this.canFire = true

    console.log('game state created')
  }

  castSpell() {
    this.canFire = false

    this.wiz.setAnimationSpeedPercent(100)
    this.wiz.playAnimationByName('_ATTACK')
    this.blaster.play()

    this.time.events.add(500, () =>{
      this.fireball.alpha = 1
      this.fireball.revive()
      this.fireball.x = this.wiz.position.x + 210
      this.fireball.y = this.wiz.position.y - 85
      this.fireball.play('move', game.rnd.between(15, 25), true)
      this.fireball.scale.set(0)
      game.add.tween(this.fireball.scale).to({x: 1, y: 1}, 300, Phaser.Easing.Linear.In, true)
      var tween = game.add.tween(this.fireball).to({ x: this.gnome.x, y: this.gnome.y - (this.gnome.height / 2) }, 700, Phaser.Easing.Cubic.In, true)
      tween.onComplete.add(() => {

        this.wiz.setAnimationSpeedPercent(40)
        this.wiz.playAnimationByName('_IDLE')

        this.fireball.play('hit', 15, false)
        game.add.tween(this.fireball).to({alpha: 0}, 500, Phaser.Easing.Cubic.In, true)
        
        this.gnome.setAnimationSpeedPercent(100)
        this.gnome.playAnimationByName('_HURT')
        this.explosion.play()

        game.time.events.add(1000, () => {
          this.fireball.kill()
          this.gnome.setAnimationSpeedPercent(40)
          this.gnome.playAnimationByName('_IDLE')
          this.canFire = true
        })
      })
    })
  }

  update() {
    this.wiz.updateAnimation() 
    this.gnome.updateAnimation()  
  }

  render() {
    if (__DEV__) {
      // this.game.debug.spriteInfo(this.mushroom, 32, 32)
    }
  }

  createIcon(x, y, key) {
    // create a group for the icon so they don't get sorted along with the sprites in the game.world
    let iconGroup = game.add.group();

    // position the icon
    let icon = game.add.sprite(x, y, key);
    icon.scale.set(0.45)
    icon.anchor.setTo(0.5, 0.5);

    // put a circle frame so we have rounded spell icons
    // let g = game.add.graphics(0, 0);
    // let radius = 40;
    // g.lineStyle(20, 0x000000, 0);
    // g.anchor.setTo(0, 0);
    // let xo = icon.x;
    // let yo = icon.y;
    // g.moveTo(xo,yo + radius);
    // for (let i = 0; i <= 360; i++){
    //   let x = xo+ Math.sin(i * (Math.PI / 180)) * radius;
    //   let y = yo+ Math.cos(i * (Math.PI / 180)) * radius;
    //   g.lineTo(x,y);
    // }
    iconGroup.add(icon);
    //iconGroup.add(g);

    this.icon = icon
    
    return icon
  }  

  loadSpriter(key) {
    if(!this.spriterLoader) this.spriterLoader = new Spriter.Loader();

    let spriterFile = new Spriter.SpriterXml(game.cache.getXML(key + 'Animations'));

    // process loaded xml/json and create internal Spriter objects - these data can be used repeatly for many instances of the same animation
    let spriter = this.spriterLoader.load(spriterFile);

    return new Spriter.SpriterGroup(game, spriter, key, key);
  }  
}