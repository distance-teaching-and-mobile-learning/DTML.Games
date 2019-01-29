// var assert = require('assert')
// var sinon = require('sinon')
// var mockBrowser = require('mock-browser').mocks.MockBrowser
// global.window = new mockBrowser()
// global.document = window.getDocument()
// global.PIXI = require('phaser-ce/build/custom/pixi.js')
// global.p2 = require('phaser-ce/build/custom/p2.js')
// global.Phaser = require('phaser-ce/build/custom/phaser-split.js')
// var GameState = require('../src/states/game.js')

// describe('Game State', function () {
//   var Game
  
//   beforeEach(function() {
//     Game = new GameState.default()
//   })

//   afterEach(function() {
//     sinon.restore()
//   })

//   describe('loadSpriter', function () {
//     global.game = {
//       cache: {
//         getXML: sinon.fake.returns()
//       }
//     }
//     it('should load a new Spriter object given the key \'leftCharacter\'', function () {
//       assert.ok(Game.loadSpriter('leftCharacter'))
//     })
//   })
// })