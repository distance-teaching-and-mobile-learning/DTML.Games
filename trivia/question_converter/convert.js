const fs = require('fs')
const path = require('path')
const readline = require('readline')

let filePath = path.join(__dirname, 'input.txt')

fs.readFile(filePath, function(err, data) {
    if (!err) {
      convertTextToQuestions(data)
    } else {
      console.log(err)
    }
});

function convertTextToQuestions (data) {

  let text = '' + data
  let textArray = text.split('\n')
  let complexity = 5

  let questions = ['[']
  for (i = 0; i < textArray.length; i += 2) {
    let questionText = '{"text":"'
    questionText += textArray[i].trim()
    questionText += '","complexity":' + complexity + ',"correctAnswer":"'
    let answers = textArray[i + 1].split(',')
    questionText += answers[0].trim()
    questionText += '","incorrectAnswers":['
    for (j = 1; j < answers.length; j++) {
      questionText += '"' + answers[j].trim() + '"'
      if (j < answers.length - 1) {
        questionText += ","
      }
    }
    questionText += ']}'
    questions.push(questionText)
  }
  questions.push(']')

  let file = fs.writeFile('./question_converter/output.json', questions, (err) => {
    if (err) throw err
    console.log('Conversion successful!')
  })

}