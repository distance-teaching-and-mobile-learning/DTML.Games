// var assert = require('assert')
// var sinon = require('sinon')
// var puppeteer = require('puppeteer')
// var path = require('path')
// var GameState = null

// describe('Game State', function () {
//   var Game
  
//   before (async function () {
//     global.browser = await puppeteer.launch()
//     global.window = await global.browser.newPage()
//     await window.goto('file://' + path.join(__dirname + '/mockData/index.html'))
//     let globalVars = await window.evaluate(function () {
//       return {
//         PIXI: require('phaser-ce/build/custom/pixi.js'),
//         p2: require('phaser-ce/build/custom/p2.js'),
//         Phaser: require('phaser-ce/build/custom/phaser-split.js'),
//         GameState: require('../src/states/game.js'),
//       }
//     })
//     global.PIXI = globalVars.PIXI
//     global.p2 = globalVars.p2
//     global.Phaser = globalVars.Phaser
//     GameState = globalVars.GameState
//     global.game = new Phaser.Game()
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
//     it('should load a new Spriter object given the key \'leftCharacter\'', function () {
//       assert.ok(Game.loadSpriter('leftCharacter'))
//     })
//   })
// })