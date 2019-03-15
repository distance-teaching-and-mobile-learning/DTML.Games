let Validator = {}

Validator.validateGraph = function (graph) {
  let graphErrors = Validator.getGraphErrors(graph)
  if (graphErrors.length > 0) {
    let errorConcat = graphErrors.join('\n')
    alert(errorConcat)
  } else {
    alert('No errors found!')
  }
}

Validator.getGraphErrors = function (graph) {
  let errors = []

  for (let i = 0; i < graph.attributes.cells.models.length; i++) {
    let cell = graph.attributes.cells.models[i]
    if (cell.attributes.type === 'dialogue.Solution') {
      let inputStates = getInputCells(graph, cell)
      if (inputStates.length > 0) {
        let stateWords = splitWords(inputStates[0].attributes.answerWords)
        for (let j = 0; j < cell.attributes.answers.length; j++) {
          let answer = cell.attributes.answers[j]
          let solutionWords = splitWords(answer)
          for (let k = 0; k < solutionWords.length; k++) {
            if (!wordInArray(solutionWords[k], stateWords)) {
              errors.push('Solution phrase: "' + answer + '" contains a word not in its state\'s answer words')
            }
          }
        }
      } else {
        errors.push('Solution node has no input state')
      }
    }
  }

  return errors
}

function splitWords (answer) {
  let splitWords = answer.split(' ')

  for (let i = 0; i < splitWords.length; i++) {
    splitWords[i] = splitWords[i].trim()
    if (splitWords[i][0] === '[') splitWords[i] = splitWords[i].slice(1)
    if (splitWords[i][splitWords[i].length - 1] === ']') splitWords[i] = splitWords[i].slice(0, -1)
    if (splitWords[i][splitWords[i].length - 1] === ',') splitWords[i] = splitWords[i].slice(0, -1)
  }

  return splitWords
}

function getInputCells (graph, cell) {
  let cells = []
  for (let i = 0; i < graph.attributes.cells.models.length; i++) {
    let link = graph.attributes.cells.models[i]
    if (link.attributes.type === 'link') {
      let source = graph.getCell(link.attributes.source.id)
      let target = graph.getCell(link.attributes.target.id)
      if (target === cell) cells.push(source)
    }
  }
  return cells
}

function wordInArray (word, array) {
  for (let i = 0; i < array.length; i++) {
    if (word.toLowerCase() === array[i].toLowerCase()) {
      return true
    }
  }
  return false
}

export default Validator
