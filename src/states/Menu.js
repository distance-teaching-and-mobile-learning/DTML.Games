import Phaser from 'phaser'

Array.prototype.chunk = function ( n ) {
  if ( !this.length ) {
      return [];
  }
  return [ this.slice( 0, n ) ].concat( this.slice(n).chunk(n) );
}

export default class extends Phaser.State {
  init() {}

  create() {
    let bg1 = game.add.sprite(game.world.centerX, game.world.centerY, 'bg1')
    bg1.anchor.set(0.5)
    bg1.scale.set(0.5)

    this.click = game.add.audio('click')
    this.hover = game.add.audio('hover')

    let flags = { "Afrikaans":"af","Irish":"ga",
    "Albanian":"al","Italian":"it",
    "Arabic":"ar","Japanese":"jp",
    "Azerbaijani":"az","Kannada":"kn",
    "Basque":"es","Korean":"kr",
    "Bengali":"bn","Latin":"la",
    "Belarusian":"be","Latvian":"lv",
    "Bulgarian":"bg","Lithuanian":"lt",
    "Catalan":"ca","Macedonian":"mk",
    "Chinese":"cn","Malay":"ms",
    "Amharic":"am","Maltese":"mt",
    "Croatian":"hr","Norwegian":"no",
    "Czech":"cz","Persian":"ir",
    "Danish":"dk","Polish":"pl",
    "Dutch":"nl","Portuguese":"pt",
    "English":"us","Romanian":"ro",
    "Russian":"ru",
    "Estonian":"et","Serbian":"sr",
    "Filipino":"ph","Slovak":"sk",
    "Finnish":"fi","Slovenian":"sl",
    "French":"fr","Spanish":"es",
    "Galician":"gl","Swahili":"cd",
    "Georgian":"ge","Swedish":"sv",
    "German":"de","Tamil":"lk",
    "Greek":"gr","Telugu":"in",
    "Gujarati":"gu","Thai":"th",
    "Haitian Creole":"ht","Turkish":"tr",
    "Hebrew":"il","Ukrainian":"ua",
    "Hindi":"in","Urdu":"pk",
    "Hungarian":"hu","Vietnamese":"vi",
    "Icelandic":"is","Welsh":"cy",
    "Indonesian":"id","Yiddish":"de"}
    
    var fragmentSrc = [

      "precision mediump float;",

      "uniform float     time;",
      "uniform vec2      resolution;",
      "uniform sampler2D iChannel0;",

      "void main( void ) {",

          "vec2 uv = gl_FragCoord.xy / resolution.xy;",
          "uv.y *= -1.0;",
          "uv.y += (sin((uv.x + (time * 0.5)) * 10.0) * 0.1) + (sin((uv.x + (time * 0.2)) * 32.0) * 0.01);",
          "vec4 texColor = texture2D(iChannel0, uv);",
          "gl_FragColor = texColor;",

      "}"
    ];


    let flagGroup = this.add.group()
    this.filters = []
    let gapx = 10
    let posx = 40
    let posy = 20
    let width = 95
    let height = 50
    Object.keys(flags).forEach((name, idx) => {    
      let flag = game.add.sprite(posx, posy, flags[name])
      flag.anchor.set(0.5)
      flag.width = width
      flag.height = height
      flag.inputEnabled = true

      flag.events.onInputOver.add(() =>{
        this.hover.play()
        flagGroup.bringToTop(flag)
        this.game.add.tween(flag)
        .to({width: width * 2, height: height * 2}, 200, Phaser.Easing.Back.Out, true)
      }, this)
	    flag.events.onInputOut.add(() =>{
        this.game.add.tween(flag)
        .to({width: width, height: height}, 200, Phaser.Easing.Back.Out, true)
      }, this)
      flag.events.onInputDown.add(() => {
        this.click.play()

        this.flagGroup.children.forEach(flag => {   
          this.game.add.tween(flag)
            .to({width: 0, height: 0}, 1000, Phaser.Easing.Back.In, true)
        })

        this.time.events.add(1100, () =>{
          this.state.start('Game')
        })
      })

      // var customUniforms = {
      //   iChannel0: { type: 'sampler2D', value: flag.texture, textureData: { repeat: true } }
      // };
      // let filter = new Phaser.Filter(this.game, customUniforms, fragmentSrc);
      // filter.setResolution(80, 50);
      // this.filters.push(filter)
      // flag.filters = [ filter ]
      
      flagGroup.add(flag)
      
      // console.log(idx % 10)
      posx += flag.width + gapx
      if(idx % 8 == 7) {
        posx = 0 + 40
        posy += flag.height + 10
      }
    })
    flagGroup.x = this.world.centerX - flagGroup.width / 2
    flagGroup.y = this.world.centerY - flagGroup.height / 2
    this.flagGroup = flagGroup
  }
  
  update() {
    this.flagGroup.children.forEach(flag => {   
    })
    // this.filters.forEach(filter => {
    //   filter.update()
    // })
  }
  render() {    }

}
