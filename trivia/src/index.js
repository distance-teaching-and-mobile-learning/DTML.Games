import Phaser from 'phaser'
import BootScene from './scenes/boot.js'
import LoadScene from './scenes/load.js'
import MenuScene from './scenes/menu.js'
import CategoriesScene from './scenes/categories.js'
import QuizScene from './scenes/quiz.js'

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1000,
  height: 700,
  pixelArt: false,
  backgroundColor: '#000000',
  scene: [BootScene, LoadScene, MenuScene, CategoriesScene, QuizScene],
  scale: {
    mode: Phaser.Scale.FIT
  }
}

window.game = new Phaser.Game(config)