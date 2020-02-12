import Config from '../config.json'
import { dtml } from 'dtml.sdk'

export default class CategoriesScene extends Phaser.Scene {

  constructor () {
    super({key: 'categories'})
  }

  create () {

    let centerX = this.cameras.main.width / 2
    let centerY = this.cameras.main.height / 2

    this.add.image(centerX, centerY, 'menuBackground')

    this.titleText = this.add.text(centerX, 150 - 800, this.game.localizedText.select_category, {fontFamily: 'Acme', fontSize: 64, color: '#FFFFFF'}).setOrigin(0.5, 0.5)

    // Create category buttons
    this.categoryButtons = []
    this.categoryButtonText = []
    let categories = Config.categories
    let maxRowLength = 3
    let numberOfRows = Math.ceil(categories.length / maxRowLength)
    for (let i = 0; i < categories.length; i++) {
      let rowLength = maxRowLength
      if (Math.ceil((i + 1) / maxRowLength) === numberOfRows) {
        rowLength = categories.length % maxRowLength
        if (rowLength === 0) { rowLength = maxRowLength }
      }

      let categoryName = categories[i].display_name
      let categoryFile = categories[i].file_name
      let x = centerX + ((i % maxRowLength - (rowLength / 2 - 0.5)) * 250)
      let y = centerY + Math.floor(i / maxRowLength) * 150
      let button = this.add.image(x, y - 800, 'categoryButton').setOrigin(0.5, 0.5)
      button.setInteractive({ useHandCursor: true })
      button.on('pointerdown', function () {
        dtml.recordGameEvent('eslquiz', 'ChallengeSelected', categoryName)
        this.scene.start('quiz', {categoryName: categoryName, fileName: categoryFile})
      }, this)
      this.categoryButtons.push(button)

      // Category name
      let text = this.add.text(x, y - 800, categoryName, {fontFamily: 'Acme', fontSize: 32, color: '#FFFFFF'}).setOrigin(0.5, 0.5)
      text.setWordWrapWidth(180)
      text.setAlign('center')
      this.categoryButtonText.push(text)
    }

    // Tween in ui objects
    this.tweens.add({
      targets: this.titleText,
      y: '+=800',
      ease: 'Quad.easeOut',
      duration: 500
    })
    this.tweens.add({
      targets: this.categoryButtons,
      y: '+=800',
      ease: 'Quad.easeOut',
      duration: 500
    })
    this.tweens.add({
      targets: this.categoryButtonText,
      y: '+=800',
      ease: 'Quad.easeOut',
      duration: 500
    })

  }

}