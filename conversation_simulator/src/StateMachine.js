import UserContext from './userContext'
import PhraseCompare from './phraseCompare'
const defaultPath = 'default'

export default class {
  constructor (stateData) {
    this.score = 0
    this.stateData = stateData
    this.setCurrentState(
      this.stateData.StartAt,
      this.stateData.States[this.stateData.StartAt]
    )
    this.submitSolutionResult = true
    this.userContext = new UserContext()
    this.default = 'default'
  }

  setCurrentState (stateName, stateData) {
    this.currentStateName = stateName
    this.currentState = stateData
  }

  printDebugInfo () {
    console.log(JSON.stringify(this.stateData))
  }

  getQuestion () {
    return this.currentState.Question
  }

  getScore () {
    return this.score
  }

  getCurrentStateName () {
    return this.currentStateName
  }

  getOnEnterLeft () {
    if (this.currentState.OnStateEnter != null) {
      return this.currentState.OnStateEnter.Left
    } else {
      return null
    }
  }

  getOnEnterRight () {
    if (this.currentState.OnStateEnter != null) {
      return this.currentState.OnStateEnter.Right
    } else {
      return null
    }
  }

  getOnEnterLeftDo () {
    if (this.currentState.OnStateEnter != null) {
      return this.currentState.OnStateEnter.LeftDo
    } else {
      return null
    }
  }

  getOnEnterRightDo () {
    if (this.currentState.OnStateEnter != null) {
      return this.currentState.OnStateEnter.RightDo
    } else {
      return null
    }
  }

  getOnExitLeft () {
    if (this.currentState.OnStateExit != null) {
      return this.currentState.OnStateExit.Left
    } else {
      return null
    }
  }

  getOnExitRight () {
    if (this.currentState.OnStateExit != null) {
      return this.currentState.OnStateExit.Right
    } else {
      return null
    }
  }

  getOnExitLeftDo () {
    if (this.currentState.OnStateExit != null) {
      return this.currentState.OnStateExit.LeftDo
    } else {
      return null
    }
  }

  getOnExitRightDo () {
    if (this.currentState.OnStateExit != null) {
      return this.currentState.OnStateExit.RightDo
    } else {
      return null
    }
  }

  getOnEnterBg () {
    if (this.currentState.OnStateEnter != null) {
      return this.currentState.OnStateEnter.Background
    } else {
      return null
    }
  }

  getAnswerWords () {
    return this.currentState.AnswerWords
  }

  set submitSolutionResult (value) {
    this._submitSolutionResult = value
  }

  get submitSolutionResult () {
    return this._submitSolutionResult
  }

  getShortestSolution () {
    let shortestSolution = null
    for (var key in this.currentState.Solutions) {
      if (key !== defaultPath && (!shortestSolution || key.split(' ').length < shortestSolution.split(' ').length)) {
        shortestSolution = key
      }
    }
    return shortestSolution
  }

  isNumber (o) {
    return (
      typeof o === 'number' ||
      (typeof o === 'object' && o !== null && o['constructor'] === Number)
    )
  }

  normalizeSolution (solution) {
    return solution.toLowerCase().trim()
  }

  // Finds the matching solution in a state's possible solutions
  matchSolution (solutionPhrase) {
    let solution
    for (let possibleSolution in this.currentState.Solutions) {
      if (this.currentState.Solutions.hasOwnProperty(possibleSolution)) {
        let submittedWords = this.splitString(solutionPhrase)
        let solutionWords = this.splitString(possibleSolution)
        if (possibleSolution !== defaultPath && PhraseCompare.compareSolution(submittedWords, solutionWords)) {
          solution = possibleSolution
          break
        }
      }
    }
    if (solution === undefined) {
      // Return default if it exists
      if (this.currentState.Solutions[defaultPath] && this.currentState.Solutions[defaultPath].Next) return defaultPath
    }
    return solution
  }

  // Returns the score of a solution
  scoreSolution (solution, isCorrect, source) {
    let _this = this
    return new Promise(function (resolve, reject) {
      dtml.scorePhrase(solution, isCorrect, result => {
        if (result) {
          resolve(result)
        } else {
          let score = _this.currentState.Solutions[solution].Score || _this.currentState.Solutions[solution].scoreadjustment
          if (_this.isNumber(score)) {
            resolve(score)
          } else {
            reject(new Error('Could not find a score'))
          }
        }
      }, source, _this.getCurrentStateName())
    })
  }

  // Adds the score to the player's total score
  applyScore (score) {
    this.score += score
  }

  markSolution (stateName, solution) {
    // Save state/answer so it can't be used again for points
    this.userContext.markSolution(stateName, solution)
  }

  getUserContext () {
    return this.userContext
  }

  // Goes to the state indicated by the solution
  goToNextState (solution) {
    let nextState = this.currentState.Solutions[solution].Next
    this.setCurrentState(
      nextState,
      this.stateData.States[nextState]
    )
  }

  splitString (input) {
    // Split the string but keep groups of words inside brackets intact
    let split = input.match(/(\[.*?\]|\s.*?\s|.*?\s|.*)/g)
    for (let i = split.length - 1; i >= 0; i--) {
      split[i] = split[i].trim()
      if (split[i].length === 0) {
        split.splice(i, 1)
      }
    }
    return split
  }

  createState (question, answerWords, solutions, awardPoints, suggestPhrase) {
    let newState = {}
    newState.Question = question
    newState.AnswerWords = answerWords
    newState.Solutions = solutions
    if (awardPoints === undefined) awardPoints = true
    newState.AwardPoints = awardPoints
    if (suggestPhrase === undefined) suggestPhrase = false
    newState.SuggestPhrase = suggestPhrase
    return newState
  }

  // Takes a solution from game data and formats into conversational english eg: i need [some] time => I need time
  formatSolution (solution) {
    let splitWords = solution.split(' ')
    for (let i = 0; i < splitWords.length; i++) {
      splitWords[i] = splitWords[i].replace('[', '')
      splitWords[i] = splitWords[i].replace(']', '')
      if (splitWords[i] === 'i') splitWords[i] = 'I'
    }
    return splitWords.join(' ')
  }
}
