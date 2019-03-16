export default class {
  constructor () {
    this.visitedStates = {}
  }

  // Marks that a specific answer was already used on a certain state
  markSolution (stateName, answer) {
    if (!this.visitedStates[stateName]) {
      this.visitedStates[stateName] = []
    }
    this.visitedStates[stateName].push(answer)
  }

  // Checks to see if a solution has already been used
  hasSolutionBeenUsed (stateName, answer) {
    if (this.visitedStates[stateName] && this.visitedStates[stateName].indexOf(answer) !== -1) {
      return true
    } else {
      return false
    }
  }
}
