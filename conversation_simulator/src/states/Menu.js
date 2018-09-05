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

import Phaser from 'phaser'
import FreeText from '../sprites/FreeText'
import Border from '../sprites/Border'
import Spriter from '../libs/spriter'
import Background from '../sprites/background'
import jQuery from 'jquery'



export default class extends Phaser.State {

    init() {

    }

    create() {
      
             this.phaserJSON = this.cache.getJSON('gameSetup');
              let bg = new Background({ game: this.game }, 0);

           
                let enterSpriteButton = game.add.sprite(0, 0, 'iconPlay');
              //  enterSpriteButton.scale.set(0.7 * game.scaleRatio);
                enterSpriteButton.anchor.set(0.5);
                enterSpriteButton.x = game.world.centerX;
                enterSpriteButton.y = game.world.centerY+200;
                enterSpriteButton.inputEnabled = true;
                enterSpriteButton.input.priorityID = 0;
                enterSpriteButton.events.onInputDown.add(this.SayItByCustomer, this);
                         enterSpriteButton.alpha = 0;
                         game.add.tween(enterSpriteButton).to({x: game.world.centerX, alpha: 1}, 500, Phaser.Easing.Cubic.In, true, 2000)

                  var style = { font: "bold 42px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };

    //  The Text is positioned at 0, 100
    var text;
    text = game.add.text(0, 0, this.phaserJSON.title, style);
    text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);

    //  We'll set the bounds to be from x0, y100 and be 800px wide by 100px high
    text.setTextBounds(0, 0, game.world.width, game.world.height);
    text.alpha = 0;
     game.add.tween(text).to({alpha: 1}, 500, Phaser.Easing.Cubic.In, true, 2500)
           
             // let menuSpriteButton = game.add.sprite(this.game.width - 100, 100, 'openmenu');
                // menuSpriteButton.scale.set(0.7 * game.scaleRatio);
                // menuSpriteButton.anchor.set(0.5);
                // menuSpriteButton.inputEnabled = true;
                // menuSpriteButton.input.priorityID = 0;
                // menuSpriteButton.events.onInputDown.add(this.openMenu, this);
                jQuery.post( "https://dtml.org/api/User/Activity", { activity: this.phaserJSON.title, time: "", eventType: "GameStarted", EventData: "" } );
      
    }

    SayItByCustomer() {
            this.state.start('Game');
    }

    
}
