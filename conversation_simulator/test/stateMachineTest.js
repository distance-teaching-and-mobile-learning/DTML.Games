var assert = require('assert')
var StateMachine = require('../src/StateMachine.js')
var mockStateData = require('./mockData/gameData.json')

describe('StateMachine', function () {
  var stateMachine

  beforeEach(function() {
    stateMachine = new StateMachine.default(mockStateData)
  })

  describe('constructor', function () {
    it('should set the correct starting state', function() {
      assert.equal(stateMachine.currentStateName, 'Question 1')
      assert.equal(stateMachine.currentState, mockStateData.States[mockStateData.StartAt])
    })
  })

  describe('getQuestion', function () {
    it('should return the question text for the current Question', function () {
      assert.equal(stateMachine.getQuestion(), mockStateData.States[mockStateData.StartAt].Question)
    })
  })

  describe('getScore', function () {
    it('should get the current score', function () {
      assert.equal(stateMachine.getScore(), 0)
    })
  })

  describe('getCurrentStateName', function () {
    it('should get the name of the current Question', function () {
      assert.equal(stateMachine.getCurrentStateName(), 'Question 1')
    })
  })

  describe('getOnEnterLeft', function () {
    it('should return the starting animation for the left character', function () {
      assert.equal(stateMachine.getOnEnterLeft(), '_WALK')
    })
  })

  describe('getOnEnterRight', function () {
    it('should return the starting animation for the right character', function () {
      assert.equal(stateMachine.getOnEnterRight(), '_WALK')
    })
  })

  describe('getOnEnterLeftDo', function () {
    it('should return the starting direction for the left character', function () {
      assert.equal(stateMachine.getOnEnterLeftDo(), 'in')
    })
  })

  describe('getOnEnterRightDo', function () {
    it('should return the starting direction for the right character', function () {
      assert.equal(stateMachine.getOnEnterRightDo(), 'in')
    })
  })

  describe('getOnExitLeft', function () {
    it('should return the ending animation for the left character', function () {
      assert.equal(stateMachine.getOnExitLeft(), '_RUN')
    })
  })

  describe('getOnExitRight', function () {
    it('should return the ending animation for the right character', function () {
      assert.equal(stateMachine.getOnExitRight(), '_RUN')
    })
  })

  describe('getOnExitLeftDo', function () {
    it('should return the exiting direction for the left character', function () {
      assert.equal(stateMachine.getOnExitLeftDo(), 'out')
    })
  })

  describe('getOnExitRightDo', function () {
    it('should return the exiting direction for the right character', function () {
      assert.equal(stateMachine.getOnExitRightDo(), 'out')
    })
  })

  describe('getOnEnterBg', function () {
    it('should return the background for the question', function () {
      assert.equal(stateMachine.getOnEnterBg(), 'bg_store.png')
    })
  })

  describe('getAnswerWords', function () {
    it('should return the possible answer words for the current question', function () {
      assert.equal(stateMachine.getAnswerWords(), mockStateData.States['Question 1'].AnswerWords)
    })
  })

  describe('getShortestSolution', function () {
    it('should get the shortest acceptable answer to the question', function () {
      assert.equal(stateMachine.getShortestSolution(), 'right answer')
    })
  })

  describe('isNumber()', function () {
    it('should return true when given a number', function () {
      assert.equal(stateMachine.isNumber(5), true)
    }),

    it('should return false when given any non-number primitive', function () {
      assert.equal(stateMachine.isNumber(true), false)
      assert.equal(stateMachine.isNumber(undefined), false)
      assert.equal(stateMachine.isNumber('string'), false)
    }),

    it('should return false if given a null object', function () {
      assert.equal(stateMachine.isNumber(null), false)
    })
  })

  describe('normalizeSolution', function () {
    it('should convert the string to lower case and remove trailing spaces', function () {
      assert.equal(stateMachine.normalizeSolution('   hOW ArE  yoU TODAy ?   '), 'how are  you today ?')
    })
  })

  describe('matchSolution', function () {
    it('should find the matching solution if it exists', function () {
      assert.equal(stateMachine.matchSolution('wrong answer words'), 'wrong [of list] answer words [question]')
      assert.equal(stateMachine.matchSolution('wrong of list answer words'), 'wrong [of list] answer words [question]')
      assert.equal(stateMachine.matchSolution(' wrong answer words question'), 'wrong [of list] answer words [question]')
    })
  })
})