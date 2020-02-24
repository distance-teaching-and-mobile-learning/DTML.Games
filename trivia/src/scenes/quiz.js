import QuestionBoard from './questionBoard.js'
import MoneyBoard from './moneyBoard.js'
import ResultsScreen from './resultsScreen.js'
import {dtml} from 'dtml.sdk'

export default class QuizScene extends Phaser.Scene {

  constructor () {
    super({key: 'quiz'})
  }

  create (data) {

    this.categoryName = data.categoryName
    this.fileName = data.fileName

    let centerX = this.cameras.main.width / 2
    let centerY = this.cameras.main.height / 2

    this.add.image(centerX, centerY, 'gameBackground')

    // Speech bubble
    this.speechBubble = this.add.image(320, 100, 'speechBubble').setOrigin(0.5, 0.5)
    this.speechBubble.visible = false
    this.speechString = ''
    this.speechStringProgress = 0
    this.speechText = this.add.text(325, 90, this.speechString, {fontFamily: 'Acme', fontSize: 20, color: '#000000'}).setOrigin(0.5, 0.5)
    this.speechText.setAlign('center')
    this.speechText.setWordWrapWidth(175)
    this.speechText.visible = false

    this.categoryText = this.add.text(25, 20, this.categoryName, {fontFamily: 'Acme', fontSize: 32, color: '#FFFFFF'}).setOrigin(0, 0)
    this.categoryText.setWordWrapWidth(200)

    this.score = 0

    // Question board
    let numberOfAnswers = 4
    let answersPerRow = 2
    this.questionBoard = new QuestionBoard(this, numberOfAnswers, answersPerRow)
    this.scene.add('QuestionBoard', this.questionBoard, true)
    this.questionBoard.input.enabled = false

    // Money board
    this.moneyBoard = new MoneyBoard(this)
    this.scene.add('MoneyBoard', this.moneyBoard, true)

    // Timer
    this.timer = 0
    this.timerMax = 30
    this.timerCircle = this.add.graphics()
    this.timerCircle.fillStyle(0xFFFFFF, 1)
    this.timerCircle.fillCircle(433, 90, 35)
    this.timerText = this.add.text(433, 90, '0', {fontFamily: 'Acme', fontSize: 32, color: '0x000000'}).setOrigin(0.5, 0.5)
    this.hideTimer()

    // Load questions and select the first one
    this.questionNumber = 1
    let _this = this
    this.questionFile = import('../questions/' + this.game.userLanguage + '_' + this.fileName + '.json').then(function (result) {
      _this.questionFile = result
      _this.checkQuestionsForErrors(_this.questionFile)
      _this.questions = _this.sortQuestions(_this.questionFile.questions)
      _this.welcomeText()
    })

    // Tween objects onto screen
    this.moneyBoard.cameras.main.x += 200
    this.tweens.add({
      targets: this.moneyBoard.cameras.main,
      x: '-=200',
      duration: 1000,
      ease: 'Power2'
    })
    this.questionBoard.cameras.main.y += 400

    this.ruleIndex = null

  }

  update (elapsedTime, dt) {

    if (this.timerRunning) {
      this.timer = this.timer - (dt / 1000)
      this.timerText.setText(Math.floor(this.timer))
      let angle = 360 - 360 * (this.timer / this.timerMax) - 90
      this.timerCircle.clear()
      this.timerCircle.fillStyle(0xFFFFFF, 1)
      this.timerCircle.fillCircle(433, 90, 35)
      this.timerCircle.fillStyle(0x9BE1FF, 1)
      this.timerCircle.slice(433, 90, 35, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(angle), true)
      this.timerCircle.fillPath()

      if (this.timer <= 0) {
        this.hideTimer()
        this.timerRunning = false
        this.gameOver()
      }
    }

    // Update host speech bubble text
    if (this.speechTextTween && this.speechTextTween.isPlaying()) {
      this.speechText.setText(this.speechString.slice(0, this.speechStringProgress))
    }

  }

  startQuiz () {

    let firstQuestion = this.chooseQuestion(1)
    this.questionBoard.updateQuestionText(firstQuestion)

  }

  // Prints an error if any questions are improperly formatted
  checkQuestionsForErrors (questionFile) {

    let questions = questionFile.questions
    if (!questions) { console.error('Question file: ' + questionFile.name + ' has no questions')}

    for (let i = 0; i < questions.length; i++) {
      let question = questions[i]
      if (!question.text || question.text === '') {
        console.error('Question number ' + i + ' has no question text')
      }
      if (!question.complexity) {
        console.error('Question "' + question.text + '" has no complexity')
      }
      if (!question.correctAnswer) {
        console.error('Question "' + question.text + '" has no correct answer')
      }
      if (!question.incorrectAnswers || question.incorrectAnswers.length !== 3) {
        console.error('Question "' + question.text + '" has either no incorrect answers or the wrong number of incorrect answers')
      }
    }

  }

  // Sorts questions by complexity
  sortQuestions (questions) {

    let sortedQuestions = []

    for (let i = 0; i < questions.length; i++) {
      let question = questions[i]
      if (!sortedQuestions[question.complexity]) {
        sortedQuestions[question.complexity] = []
      }
      sortedQuestions[question.complexity].push(question)
    }

    return sortedQuestions

  }

  getQuestionComplexity (questionNumber) {
    return Math.floor(questionNumber / 5) + 1
  }

  chooseQuestion (complexity) {

    // Cap it to the highest complexity in this category
    complexity = Math.min(complexity, this.questions.length - 1)

    let random = Math.floor((Math.random() * this.questions[complexity].length))
    let question = this.questions[complexity][random]
    this.questions[complexity].splice(random, 1)
    return question

  }

  submitAnswer (button) {
    
    this.stopTimer()
    this.questionBoard.input.enabled = false

    if (button.correct) {
      this.questionBoard.flashGreen(button)
      this.score += this.moneyBoard.scoreValues[this.questionNumber - 1]
      this.time.delayedCall(2000, function () {
        // Game won!
        if (this.questionNumber === 15) {
          this.gameWon()
        // Next question
        } else {
          this.nextQuestion()
          this.moneyBoard.advanceMoneyBoard()
          this.hideTimer()
        }
      }, [], this)
    } else {
      this.questionBoard.flashRed(button)
      this.time.delayedCall(1500, function () {
        this.questionBoard.highlightCorrectButton()
      }, [], this)
      this.time.delayedCall(2500, function () {
        this.gameOver()
      }, [], this)
    }

  }

  nextQuestion () {

    this.questionNumber++
    let nextQuestion = this.chooseQuestion(Math.ceil(this.questionNumber / 3))
    this.questionBoard.resetAnswerButtons()
    this.questionBoard.updateQuestionText(nextQuestion)

  }

  gameWon () {

    this.resultsScreen = new ResultsScreen(this, this.score, true)
    this.scene.add('ResultsScreen', this.resultsScreen, true)

    this.questionBoard.input.enabled = false

  }

  gameOver () {
    
    this.resultsScreen = new ResultsScreen(this, this.score, false)
    this.scene.add('ResultsScreen', this.resultsScreen, true)

    this.questionBoard.input.enabled = false

    dtml.recordGameEnd('eslquiz', this.score, null)

  }

  backToMenu () {
    this.scene.remove('QuestionBoard')
    this.scene.remove('MoneyBoard')
    this.scene.remove('ResultsScreen')
    this.scene.start('menu')
  }

  startTimer () {

    this.timer = this.timerMax
    this.timerRunning = true

  }

  stopTimer () {

    this.timerRunning = false

  }

  hideTimer () {

    this.timerCircle.visible = false
    this.timerText.visible = false

  }

  showTimer () {

    this.timerCircle.visible = true
    this.timerText.visible = true

  }

  // Shows text in a speech bubble by the gameshow host
  hostSay (text, callback, delay) {

    delay = delay || 0


    // Stop potentially running tween
    if (this.speechTextTween && this.speechTextTween.isPlaying()) {
      this.speechTextTween.stop()
    }

    // Show speech bubble and text
    this.speechBubble.visible = true
    this.speechText.visible = true

    // Tween the text to start showing up on screen
    this.speechString = text
    this.speechStringProgress = 0
    this.speechTextTween = this.tweens.add({
      targets: this,
      speechStringProgress: this.speechString.length + 1,
      duration: this.speechString.length * 50,
      ease: 'Linear'
    }).on('complete', function () {
      if (callback) {
        this.time.delayedCall(delay, callback, [], this)
      }
    }, this)

  }

  // Hides the gameshow hosts speech bubble and text
  hideSpeech () {

    this.speechBubble.visible = false
    this.speechText.visible = false

  }

  // Show the hosts introductory text
  welcomeText () {

    let welcomeText = this.game.localizedText.intro_text
    this.hostSay(welcomeText, this.showYesNoButtons, 200)

  }

  // Show the yes or no buttons to see the rules
  showYesNoButtons () {

    this.yesButton = this.add.image(290, 170, 'yesButton').setOrigin(0.5, 0.5)
    this.input.enable(this.yesButton)
    this.yesButton.on('pointerdown', function () {
      this.hideYesNoButtons()
      this.showRules()
    }, this)
    this.yesButton.setScale(0.8, 0.8)

    this.noButton = this.add.image(360, 170, 'noButton').setOrigin(0.5, 0.5)
    this.input.enable(this.noButton)
    this.noButton.on('pointerdown', function () {
      this.hideYesNoButtons()
      this.hostStartQuiz()
    }, this)
    this.noButton.setScale(0.8, 0.8)

  }

  hideYesNoButtons () {

    this.yesButton.destroy()
    this.noButton.destroy()

  }

  // Show the game rules
  showRules () {

    if (this.ruleIndex === undefined) { this.ruleIndex = -1 }
    this.ruleIndex++
    this.hostSay(this.game.localizedText.rules_text[this.ruleIndex])

    this.input.once('pointerdown', function () {
      
      let rulesLength = this.game.localizedText.rules_text.length
      if (this.ruleIndex < rulesLength - 1) {
        this.showRules()
      } else {
        this.hostStartQuiz()
      }

    }, this)

  }

  // Host says intro text then starts game
  hostStartQuiz () {

    this.hostSay(this.game.localizedText.quiz_start_text, function () {
      this.hideSpeech()
      this.startQuiz()
    }, 500)

    this.showQuizBoard()

  }

  showQuizBoard () {

    this.tweens.add({
      targets: this.questionBoard.cameras.main,
      y: '-=400',
      duration: 1000,
      ease: 'Power2'
    })

  }

}