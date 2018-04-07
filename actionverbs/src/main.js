import 'phaser';

import Preloader from './Preloader';
import GamePlay from './GamePlay';

var game;

function resize() {
    var canvas = document.getElementById('game');
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if (windowRatio < gameRatio){
        canvas.style.width = windowWidth + 'px';
        canvas.style.height = (windowWidth / gameRatio) + 'px';
    } else {
        canvas.style.width = (windowHeight * gameRatio) + 'px';
        canvas.style.height = windowHeight + 'px';
    }
}

window.onload = function() {
    game = new Phaser.Game({
        type: Phaser.AUTO,
        canvas: document.getElementById('game'),
        width: 800,
        height: 600,
        pixelArt: true,
        scene: [
            Preloader,
            GamePlay,
        ],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {
                    x: 0,
                    y: 400,
                },
                debug: true,
            },
        },
    });

    resize();
    window.addEventListener('resize', resize, false);
}
