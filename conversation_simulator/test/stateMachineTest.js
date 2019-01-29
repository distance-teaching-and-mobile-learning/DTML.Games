var assert = require('assert')
var sinon = require('sinon')
var StateMachine = require('../src/StateMachine.js')
var mockStateData = require('./mockData/gameStates.json')

describe('StateMachine', function () {
  var stateMachine

  beforeEach(function() {
    stateMachine = new StateMachine.default(mockStateData)
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('constructor', function () {
    it('should set the correct starting state', function() {
      assert.equal(stateMachine.currentStateName, 'Welcome')
      assert.equal(stateMachine.currentState, mockStateData.States['Welcome'])
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
})