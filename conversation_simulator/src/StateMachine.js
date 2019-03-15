export default class {
  constructor (stateData) {
    this.score = 0
    this.stateData = stateData
    this.setCurrentState(
      this.stateData.StartAt,
      this.stateData.States[this.stateData.StartAt]
    )
    this.submitSolutionResult = true
    this.visitedStates = {}
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
    return  this.currentStateName
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
    let normalizedPhrase = solutionPhrase.toLowerCase().trim()

    // Find a phrase matching the submitted phrase if one exists
    let solution
    for (let possibleSolution in this.currentState.Solutions) {
      if (this.currentState.Solutions.hasOwnProperty(possibleSolution)) {
        let submittedWords = this.splitString(normalizedPhrase)
        let solutionWords = this.splitString(possibleSolution)
        if (possibleSolution !== 'default' && this.checkSolution(submittedWords, solutionWords)) {
          solution = possibleSolution
          break
        }
      }
    }
    let success = solution !== undefined ? 'True' : 'False'

    // Apply score
    dtml.scorePhrase(normalizedPhrase, success, result => {
      if (result) {
        this.scoreSolution(solution, result, hintUsed)
      } else {
        let score = solution.Score || solution.scoreadjustment
        if (this.isNumber(score)) {
          this.scoreSolution(solution, score, hintUsed)
        }
      }
    })
  }

  scoreSolution (solution, score, hintUsed) {
    if (solution !== undefined) {
      let nextState = this.currentState.Solutions[solution].Next
      this.submitSolutionResult = true
      if (score > 0 && !hintUsed && !this.checkIfSolutionUsed(this.currentState, solution)) {
        this.score += score
      }
      // Save state/answer so it can't be used again for points
      this.markSolution(this.currentState, solution)
      // Go to next state
      this.setCurrentState(
        nextState,
        this.stateData.States[nextState]
      )
    } else {
      this.submitSolutionResult = false
      this.score -= 10
    }
  }

  // Recursively compare a submitted phrase vs a solution phrase
  checkSolution (submittedWords, solutionWords) {
    for (let i = 0; i < solutionWords.length; i++) {
      let phraseLength = 1
      let solutionWord = solutionWords[i]
      let optional = (solutionWord[0] === '[' && solutionWord[solutionWord.length - 1] === ']')
      if (optional) {
        phraseLength = solutionWord.split(' ').length
        solutionWord = solutionWord.replace('[', '')
        solutionWord = solutionWord.replace(']', '')
      }
      let checkWord = this.getConcatWords(submittedWords, phraseLength)
      if (checkWord === solutionWord) {
        // Matched
        if (submittedWords.length === phraseLength) {
          // We've matched the whole phrase
          return true
        } else {
          // There are still more words to match
          return this.checkSolution(submittedWords.slice(phraseLength), solutionWords.slice(i + 1))
        }
      } else if (!optional) {
        // Not a match and word isn't optional
        return false
      }
    }
    // Ran out of solution words to try and match
    return false
  }

  // Concatonates an amount of words from an array
  getConcatWords (words, count) {
    let concatPhrase = words[0]
    for (let i = 1; i < count; i++) {
      concatPhrase = concatPhrase.concat(' ', words[i])
    }
    return concatPhrase
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

  // Marks that a specific answer was already used on a certain state
  markSolution (state, answer) {
    let stateName = this.getStateName(state)
    if (!this.visitedStates[stateName]) {
      this.visitedStates[stateName] = []
    }
    this.visitedStates[stateName].push(answer)
  }

  // Checks to see if a solution has already been used
  checkIfSolutionUsed (state, answer) {
    let stateName = this.getStateName(state)
    if (this.visitedStates[stateName] && this.visitedStates[stateName].indexOf(answer) !== -1) {
      return true
    } else {
      return false
    }
  }

  // Finds a state object's name
  getStateName (state) {
    for (let stateName in this.stateData.States) {
      if (state === this.stateData.States[stateName]) {
        return stateName
      }
    }
  }
}
