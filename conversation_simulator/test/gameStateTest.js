// var assert = require('assert')
// var sinon = require('sinon')
// var puppeteer = require('puppeteer')
// var GameState = null

// describe('Game State', function () {
//   var Game
  
//   before (async function () {
//     console.log('starting to load browser')
//     global.browser = await puppeteer.launch()
//     global.window = await global.browser.newPage()
//     global.PIXI = require('phaser-ce/build/custom/pixi.js')
//     global.p2 = require('phaser-ce/build/custom/p2.js')
//     global.Phaser = require('phaser-ce/build/custom/phaser-split.js')
//     GameState = require('../src/states/game.js')
//     console.log('browser loaded')
//   })
  
//   beforeEach(function() {
//     Game = new GameState.default()
//   })

//   afterEach(function() {
//     sinon.restore()
//   })

//   after (function () {
//     global.browser.close()
//   })

//   describe('loadSpriter', function () {
//     global.game = new Phaser.Game()
//     it('should load a new Spriter object given the key \'leftCharacter\'', function () {
//       assert.ok(Game.loadSpriter('leftCharacter'))
//     })
//   })
// })