/* The Distance Teaching and Mobile learning licenses this file
to you under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

import 'phaser/src/phaser-arcade-physics';

import Preloader from './Preloader';
import Title from './Title';
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
            Title,
            GamePlay,
        ],
    });

    resize();
    window.addEventListener('resize', resize, false);
}
