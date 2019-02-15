import { dtml } from './dtmlSDK'

export default class {
  constructor (stateData) {
    this.score = 0
    this.stateData = stateData
    this.setCurrentState(
      this.stateData.StartAt,
      this.stateData.States[this.stateData.StartAt]
    )
    this.submitSolutionResult = true
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

  getOnExitBg () {
    if (this.currentState.OnStateExit != null) {
      return this.currentState.OnStateExit.Background
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

  isNumber (o) {
    return (
      typeof o === 'number' ||
      (typeof o === 'object' && o !== null && o['constructor'] === Number)
    )
  }

  submitSolution (solutionPhrase, hintUsed) {
    var normalizedPhrase = solutionPhrase.toLowerCase().trim()

    // Select solution, or default
    var solution =
      this.currentState.Solutions[normalizedPhrase] ||
      this.currentState.Solutions.default
    var success =
      solution === this.currentState.Solutions.default ? 'False' : 'True'

    // var resultReceived = false
    // Apply score
    dtml.scorePhrase(normalizedPhrase, success, result => {
      // resultReceived = true
      if (result) {
        this.scoreSolution(solution, result, hintUsed)
      } else {
        let score = solution.Score || solution.scoreadjustment
        if (this.isNumber(score)) {
          this.scoreSolution(solution, score, hintUsed)
        }
      }
    })
    // setTimeout(function () {
    //   console.log(resultReceived)
    //   if (!resultReceived) {
    //     let score = solution.score || solution.scoreadjustment
    //     if (this.isNumber(score)) {
    //       this.scoreSolution(solution, score, hintUsed)
    //     }
    //   }
    // }, 5000)
  }

  scoreSolution (solution, score, hintUsed) {
    if (solution.Next !== null) {
      this.setCurrentState(
        solution.Next,
        this.stateData.States[solution.Next]
      )
      this.submitSolutionResult = true
      if (score > 0 && !hintUsed) {
        this.score += score
      }
    } else {
      this.submitSolutionResult = false
      this.score -= 10
    }
  }
}
