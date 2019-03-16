import BootState from './states/Boot'
import SplashState from './states/Splash'
import MenuState from './states/Menu'
import GameState from './states/Game'
import GameOverState from './states/GameOver'
import MenuBeforeState from './states/MenuBefore'

// Get the actual dtml module
dtml = dtml.dtml

// import config from './config'

class Game extends Phaser.Game {
  constructor () {
    const docElement = document.documentElement
    // const width = docElement.clientWidth > config.gameWidth ? config.gameWidth : docElement.clientWidth
    // const height = docElement.clientHeight > config.gameHeight ? config.gameHeight : docElement.clientHeight

    super(1920, 1080, Phaser.CANVAS, 'content', null)

    // super(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, Phaser.AUTO, 'content', null)

    this.state.add('Boot', BootState, false)
    this.state.add('Splash', SplashState, false)
    this.state.add('Menu', MenuState, false)
    this.state.add('Game', GameState, false)
    this.state.add('GameOver', GameOverState, false)
    this.state.add('MenuBefore', MenuBeforeState, false)

    // with Cordova with need to wait that the device is ready so we will call the Boot state in another file
    if (!window.cordova) {
      this.state.start('Boot')
    }
  }
}

window.game = new Game()

// Load game json
let queryString = new URLSearchParams(window.location.search)
let gameName = queryString.get('name')
let gameVersion = queryString.get('version')

if (!gameName || !gameVersion) {
  gameName = prompt('Which game module would you like to run?')
  gameVersion = prompt('Which version would you like to run?')
}

requestGameDataFromServer(gameName, gameVersion).then(function (response) {
  game.gameModule = JSON.parse(response)
}).catch(function (response) {
  game.gameModule = gameName
})

if (window.cordova) {
  var app = {
    initialize: function () {
      document.addEventListener(
        'deviceready',
        this.onDeviceReady.bind(this),
        false
      )
    },

    // deviceready Event Handler
    //
    onDeviceReady: function () {
      this.receivedEvent('deviceready')
      /*
       window.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      window.scale.windowConstraints.bottom = 'visual';
      window.game.scale.setResizeCallback(()=> {
          window.scale.setMaximum();
      });
      if (!window.game.device.desktop) {
          window.scale.minWidth = 300;
          window.scale.minHeight = 100;
          window.scale.maxWidth = window.innerWidth * 2;
          window.scale.maxHeight = window.innerHeight * 2;
      }

      window.scale.pageAlignHorizontally = false;
      window.scale.pageAlignVertically = true;

      window.scale.forceOrientation(true, false);
      window.scale.refresh(true);

      console.log('starting')
      */
      //  this.stage.backgroundColor = '#000000'
      // this.fontsReady = false
      // this.fontsLoaded = this.fontsLoaded.bind(this)

      // When the device is ready, start Phaser Boot state.
      game.state.start('Boot')
    },

    receivedEvent: function (id) {
      console.log('Received Event: ' + id)
    }
  }

  app.initialize()
}

window.videoLoaded = false
window.videoElapsed = 0
window.addEventListener('load', () => {
  let video = document.getElementById('intro')
  function checkVideo () {
    window.videoElapsed += 500
    if (video.readyState === 4) {
      window.videoLoaded = true
    } else {
      setTimeout(checkVideo, 500)
    }
  }
  checkVideo()
}, false)

function requestGameDataFromServer (name, version) {
  return new Promise(function (resolve, reject) {
    let xmlHttp = new XMLHttpRequest()
    xmlHttp.open('Get', 'https://dtml.org/api/DialogService/Dialog?name=' + name + '&version=' + version, false)
    xmlHttp.send(null)
    if (xmlHttp.responseText === '') {
      reject(xmlHttp.statusText)
    } else {
      resolve(xmlHttp.responseText)
    }
  })
}
