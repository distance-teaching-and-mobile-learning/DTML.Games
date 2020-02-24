// Shows the question and answer buttons
export default class Questions extends Phaser.Scene {

  constructor (parentScene, numberOfAnswers, answersPerRow) {

    super({key: 'QuestionBoard'})

    this.parentScene = parentScene
    this.numberOfAnswers = numberOfAnswers
    this.answersPerRow = answersPerRow

  }

  create () {

    let centerX = this.cameras.main.width / 2
    let centerY = this.cameras.main.height / 2

    this.questionString = ''
    this.questionProgress = 0

    this.questionBox = this.add.image(centerX - 135, 405, 'questionBox').setOrigin(0.5, 0.5)

    this.questionText = this.add.text(centerX - 135, 405, '', {fontFamily: 'Acme', fontSize: 32, color: '0x000000'}).setOrigin(0.5, 0.5)
    this.questionText.setWordWrapWidth(600)
    this.questionText.setAlign('center')

    this.answerButtons = this.makeAnswerButtons(centerX - 135, centerY, this.numberOfAnswers, this.answersPerRow)

  }

  update () {

    if (this.questionTextTween && this.questionTextTween.isPlaying()) {
      this.questionText.setText(this.questionString.slice(0, this.questionProgress))
    }

  }

  makeAnswerButtons (x, y, numberOfAnswers, answersPerRow) {

    let answerButtons = []

    let numberOfRows = Math.ceil(numberOfAnswers / answersPerRow)
    for (let i = 0; i < 4; i++) {
      let rowLength = answersPerRow
      if (Math.ceil((i + 1) / answersPerRow) === numberOfRows) {
        rowLength = numberOfAnswers % answersPerRow
        if (rowLength === 0) { rowLength = answersPerRow }
      }

      let buttonX = x + ((i % answersPerRow - (rowLength / 2 - 0.5)) * 325)
      let buttonY = y + 165 + Math.floor(i / answersPerRow) * 105
      let button = this.add.image(buttonX, buttonY, 'answerButton').setOrigin(0.5, 0.5)
      button.text = this.add.text(buttonX, buttonY, '', {fontFamily: 'Acme', fontSize: 32, color: '0x000000'}).setOrigin(0.5, 0.5)
      button.setInteractive({ useHandCursor: true })
      button.on('pointerdown', function () {
        this.parentScene.submitAnswer(button)
      }, this)
      button.on('pointerover', function () {
        button.setFrame(1)
      }, this)
      button.on('pointerout', function () {
        button.setFrame(0)
      }, this)
      answerButtons.push(button)
    }

    return answerButtons

  }

  updateQuestionText (question) {
  
    this.input.enabled = false

    // Reset frames for each button
    for (let i = 0; i < this.answerButtons.length; i++) {
      this.answerButtons[i].setFrame(0)
    }

    // Animate new question string
    this.questionString = question.text
    this.questionProgress = 0
    this.questionTextTween = this.tweens.add({
      targets: this,
      questionProgress: this.questionString.length + 1,
      duration: this.questionString.length * 50,
      ease: 'Linear'
    }).on('complete', function () {
      this.displayAnswerText(question)
    }, this)

    this.clearAnswerText()

  }

  clearAnswerText() {

    for (let i = 0; i < this.answerButtons.length; i++) {
      let button = this.answerButtons[i]
      button.text.setText('')
      button.correct = false
    }

  }

  displayAnswerText (question) {

    // Shuffle the answers
    let correctAnswer = question.correctAnswer
    let answers = [correctAnswer]
    for (let i = 0; i < question.incorrectAnswers.length; i++) {
      answers.push(question.incorrectAnswers[i])
    }
    answers = this.shuffleArray(answers)

    // Update the buttons in order
    for (let i = 0; i < this.answerButtons.length; i++) {

      let correct = false
      if (answers[i] === correctAnswer) {
        correct = true
      }

      this.time.delayedCall((i + 1) * 500, this.updateAnswerButton, [i, answers[i], correct], this)

    }

    // Reenable input
    this.time.delayedCall((this.answerButtons.length + 1) * 500, function () {
      this.input.enabled = true
      this.parentScene.startTimer()
      this.parentScene.showTimer()
    }, [], this)

  }

  updateAnswerButton (buttonIndex, text, correct) {

    let button = this.answerButtons[buttonIndex]

    button.text.scale = 1
    button.text.setText(text)
    if (button.text.width > button.width * 0.9) {
      button.text.scale = (button.width * 0.9) / button.text.width
    }

    button.correct = correct

  }

  shuffleArray (array) {

    let i = 0, j = 0, temp = null
    for (i = array.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1))
      temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
    return array

  }

  flashGreen (button) {

    this.flashColor(button, 2)

  }

  flashRed (button) {

    this.flashColor(button, 3)

  }

  flashColor (button, frameNumber) {

    let flashSpeed = 150

    this.time.delayedCall(flashSpeed, function () {
      button.setFrame(frameNumber)
    })
    this.time.delayedCall(flashSpeed * 2, function () {
      button.setFrame(0)
    })
    this.time.delayedCall(flashSpeed * 3, function () {
      button.setFrame(frameNumber)
    })
    this.time.delayedCall(flashSpeed * 4, function () {
      button.setFrame(0)
    })
    this.time.delayedCall(flashSpeed * 5, function () {
      button.setFrame(frameNumber)
    })

  }

  highlightCorrectButton () {

    for (let i = 0; i < this.answerButtons.length; i++) {
      if (this.answerButtons[i].correct) {
        this.answerButtons[i].setFrame(2)
      }
    }

  }

  resetAnswerButtons () {

    for (let i = 0; i < this.answerButtons.length; i++) {
      if (this.answerButtons[i].correct) {
        this.answerButtons[i].setFrame(0)
      }
    }

  }

}