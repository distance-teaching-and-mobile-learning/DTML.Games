var assert = require('assert');
var dtml = require('../dtml-sdk.js').dtml;

describe('userService', function () {
  it('should set the correct userService', function() {
    debugger;
    var userService = dtml.urls.userService;
    assert.equal(userService, 'https://dtml.org/Activity/Record/')
    })
})

describe('gameService', function () {
  it('should set the correct gameService', function() {
    var gameService = dtml.urls.gameService;
    assert.equal(gameService ,'https://dtml.org/api/GameService/')
    })
})

describe('gameService', function () {
  it('should set the correct gameService', function() {
    var gameService = dtml.urls.gameService;
    assert.equal(gameService ,'https://dtml.org/api/GameService/')
    })
})

describe('Init List of Voices', function () {
  it('should set browser voices', function() {
    var gameService = dtml.initVoices();
    })
})

