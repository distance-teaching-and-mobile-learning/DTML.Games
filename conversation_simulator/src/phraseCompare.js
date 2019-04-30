let PhraseCompare = {}

// Recursively compare a submitted phrase vs a solution phrase
PhraseCompare.compareSolution = function (submittedWords, solutionWords) {
  for (let i = 0; i < solutionWords.length; i++) {
    let phraseLength = 1
    let solutionWord = solutionWords[i]
    let optional = (solutionWord[0] === '[' && solutionWord[solutionWord.length - 1] === ']')
    // If it's optional, count the number of words in the brackets
    if (optional) {
      phraseLength = solutionWord.split(' ').length
      solutionWord = solutionWord.replace('[', '')
      solutionWord = solutionWord.replace(']', '')
    }
    let checkWord = PhraseCompare.getConcatWords(submittedWords, phraseLength)
    if (checkWord === solutionWord) {
      // Matched
      if (solutionWords.length === phraseLength) {
        // We've matched the whole phrase
        return true
      } else {
        // There are still more words to match
        return PhraseCompare.compareSolution(submittedWords.slice(phraseLength), solutionWords.slice(i + 1))
      }
    } else if (optional) {
      if (solutionWords.length === phraseLength) {
        // We've matched the whole phrase
        return true
      } else {
        return PhraseCompare.compareSolution(submittedWords, solutionWords.slice(i + 1))
      }
    } else {
      // Not a match and word isn't optional
      return false
    }
  }
  // Ran out of solution words to try and match
  return false
}

// Concatonates an amount of words from an array
PhraseCompare.getConcatWords = function (words, count) {
  if (words.length > 0) {
    let concatPhrase = words[0]
    for (let i = 1; i < count; i++) {
      concatPhrase = concatPhrase.concat(' ', words[i])
    }
    return concatPhrase
  }
}

export default PhraseCompare
