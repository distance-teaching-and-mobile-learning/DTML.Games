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

  errors = errors.concat(checkGameName(graph))
  errors = errors.concat(checkGameTitle(graph))
  errors = errors.concat(checkSolutions(graph))
  errors = errors.concat(checkQuestions(graph))
  errors = errors.concat(checkEnding(graph))

  return errors
}

function checkGameName (graph) {
  let errors = []

  let hasStart = false

  let cells = getCells(graph)
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i]
    if (cell.attributes.type === 'dialogue.Start') {
      if (!hasStart) {
        hasStart = true
      } else {
        errors.push('Game has more than one start node')
      }
      if (cell.attributes.gameName === '') {
        errors.push('Game does not have a name')
        break
      }
    }
  }

  if (!hasStart) {
    errors.push('Game does not have a start node')
  }

  return errors
}

function checkGameTitle (graph) {
  let errors = []

  let cells = getCells(graph)
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i]
    if (cell.attributes.type === 'dialogue.Start') {
      if (cell.attributes.gameTitle === '') {
        errors.push('Game does not have a title')
        break
      }
    }
  }

  return errors
}

function checkSolutions (graph) {
  let errors = []

  let cells = getCells(graph)
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i]
    if (cell.attributes.type === 'dialogue.Solution') {
      let inputCells = getInputCells(graph, cell)
      let outputCells = getOutputCells(graph, cell)
      if (inputCells.length === 0) {
        errors.push('Solution has no input question')
      } else {
        let stateWords = splitWords(inputCells[0].attributes.answerWords)
        let answers = cell.attributes.answers
        if (answers.length === 1 && (answers[0] === null || answers[0] === '')) {
          errors.push('Solution node has no solutions')
        } else {
          for (let j = 0; j < answers.length; j++) {
            let answer = answers[j]
            // OH I SEE, THE FIRST ENTRY IS ALWAYS NULL SO IT'S NEVER LENGTH 0
            let solutionWords = splitWords(answer)
            for (let k = 0; k < solutionWords.length; k++) {
              if (!wordInArray(solutionWords[k], stateWords)) {
                errors.push('Solution phrase: "' + answer + '" contains a word not in its question\'s answer words')
              }
            }
          }
        }
      }
      if (outputCells.length === 0) {
        errors.push('Solution has no output question or end node')
      }
    }
  }

  return errors
}

function checkQuestions (graph) {
  let errors = []

  let questionNames = []

  let cells = getCells(graph)
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i]
    if (cell.attributes.type === 'dialogue.Question') {
      let name = cell.attributes.name
      if (name === '') {
        errors.push('There\'s a question node with no name')
      }
      if (questionNames.indexOf(name) !== -1) {
        errors.push('There are multiple question nodes with the name: ' + name)
      } else {
        questionNames.push(name)
      }
      let inputCells = getInputCells(graph, cell)
      let outputCells = getOutputCells(graph, cell)
      if (inputCells.length === 0) {
        errors.push('Question "' + cell.attributes.name + '" has no input solutions')
      }
      if (outputCells.length === 0) {
        errors.push('Question "' + cell.attributes.name + '" has no output solutions')
      }
    }
  }

  return errors
}

function checkEnding (graph) {
  let errors = []

  let hasEnd = false

  let cells = getCells(graph)
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i]
    if (cell.attributes.type === 'dialogue.End') {
      hasEnd = true
      let inputCells = getInputCells(graph, cell)
      if (inputCells.length === 0) {
        errors.push('End node has no input')
      }
    }
  }

  if (!hasEnd) {
    errors.push('Game has no end node')
  }

  return errors
}

/* ------------------------------------------------------
--------------------Utility Functions--------------------
------------------------------------------------------ */

function splitWords (answer) {
  let splitWords = answer.split(' ')

  for (let i = splitWords.length - 1; i >= 0; i--) {
    splitWords[i] = splitWords[i].trim()
    if (splitWords[i][0] === '[') splitWords[i] = splitWords[i].slice(1)
    if (splitWords[i][splitWords[i].length - 1] === ']') splitWords[i] = splitWords[i].slice(0, -1)
    if (splitWords[i][splitWords[i].length - 1] === ',') splitWords[i] = splitWords[i].slice(0, -1)
    if (splitWords[i] === '') {
      splitWords.splice(i, 1)
    }
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

function getOutputCells (graph, cell) {
  let cells = []
  for (let i = 0; i < graph.attributes.cells.models.length; i++) {
    let link = graph.attributes.cells.models[i]
    if (link.attributes.type === 'link') {
      let source = graph.getCell(link.attributes.source.id)
      let target = graph.getCell(link.attributes.target.id)
      if (source === cell) cells.push(target)
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

function getCells(graph) {
  return graph.attributes.cells.models
}

export default Validator
