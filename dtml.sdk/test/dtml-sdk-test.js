var assert = require('assert')
var dtml = require('../dtml-sdk.js')

describe('userService', function () {
  it('should set the correct userService', function() {
    userService = dtml.userService;
    userService.equal(userService, 'https://dtml.org/Activity/Record/')
    })
})

describe('gameService', function () {
  it('should set the correct gameService', function() {
    service = dtml.gameService;
    service.equal(service, 'https://dtml.org/api/GameService/')
    })
})
