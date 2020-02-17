const fs = require('fs')
const path = require('path')
const readline = require('readline')

let filePath = path.join(__dirname, 'input.json')

fs.readFile(filePath, function(err, data) {
    if (!err) {
      capitalizeAnswers(data)
    } else {
      console.log(err)
    }
});

function capitalizeAnswers (data) {

  let fileData = JSON.parse('' + data)
  
  for (let i = 0; i < fileData.questions.length; i++) {
    let question = fileData.questions[i]
    question.correctAnswer = capitalizeString(question.correctAnswer)
    for (let j = 0; j < question.incorrectAnswers.length; j++) {
      question.incorrectAnswers[j] = capitalizeString(question.incorrectAnswers[j])
    }
  }

  let file = fs.writeFile('./question_converter/output.json', JSON.stringify(fileData), (err) => {
    if (err) throw err
    console.log('Capitalization successful!')
  })

}

function capitalizeString (text) {

  return text.charAt(0).toUpperCase() + text.slice(1)

}