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
import {flags, languages} from '../sprites/Flags'
import Border from '../sprites/Border'

Array.prototype.chunk = function (n) {
    if (!this.length) {
        return [];
    }
    return [this.slice(0, n)].concat(this.slice(n).chunk(n));
}

export default class extends Phaser.State {

    init() {
	var data = { "envelop": null, "page": "wordsbattle", "time": null, "eventType": "GameStarted", "eventData": navigator.userAgent };
        fetch('https://dtml.org/Activity/Record/', 
		{ method: 'post',
		  credentials: 'same-origin', 
		  body: JSON.stringify(data),
		  headers: {
      			   'content-type': 'application/json'
    			   }
		}).catch(err => {
                console.log('err', err)
            });
    }

    create() {
        let bg1 = game.add.sprite(game.world.centerX, game.world.centerY, 'bg1');
        bg1.anchor.set(0.5);
        // bg1.scale.set(0.6 * game.scaleRatio);

        this.click = game.add.audio('click');
        this.hover = game.add.audio('hover');

        let flagGroup = this.add.group();
        this.indexedFlags = [];
        let gapx = 30 * game.scaleRatio;
        let posx = 40 * game.scaleRatio;
        let posy = 20 * game.scaleRatio;
        let width = 110 * game.scaleRatio;
        let height = 50 * game.scaleRatio;
        if (game.aspectRatio < 1) {
            height = 45 * game.scaleRatio
        }

        this.text = new FreeText({
            game: this.game,
            x: this.game.world.centerX,
            y: this.game.world.centerY * 0.2,
            text: '',
            cloudEnabled: false
        });


        Object.keys(flags).forEach((name, idx) => {
            let flag = game.add.sprite(posx, posy, 'flags', flags[name] + '.png');
            flag.name = name;
            flag.anchor.set(0.5);
            flag.width = width;
            flag.height = height;
            flag.inputEnabled = true;
            flag.input.useHandCursor = true;
            flag.events.onInputOver.add(() => {
                this.hover.play();
                this.text.display();
                this.animateSelectedFlag(flag);
            }, this);
            flag.events.onInputDown.add(() => {
                this.selectCurrentFlag(flag);
            });

            flagGroup.add(flag);
            this.indexedFlags.push(flag);

            posx += flag.width + gapx;
            if (idx % 8 == 7) {
                posx = 0 + 40 * game.scaleRatio;
                posy += flag.height + 10;
            }
        });
        flagGroup.x = this.world.centerX - flagGroup.width / 2;
        flagGroup.y = this.world.centerY - flagGroup.height / 2;
        this.flagGroup = flagGroup;

        this.flagIndex = 0;
        this.getFlag('');

        /**
         *  Adding Keyboard handlers for Flag selection
         * */

        var upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        upKey.onDown.add(() => {
            this.getFlag('up');
        }, this);

        var downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        downKey.onDown.add(() => {
            this.getFlag('down');
        }, this);

        var leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        leftKey.onDown.add(() => {
            this.getFlag('left');
        }, this);

        var rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        rightKey.onDown.add(() => {
            this.getFlag('right');
        }, this);

        var enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        enterKey.onDown.add(() => {
            this.selectCurrentFlag();
        }, this);
        /**End Keyboard handler*/
    }

    selectCurrentFlag() {
        let flag = this.selectedFlag;
        this.flagGroup.bringToTop(flag);
        for (var x = 0; x < this.flagGroup.children.length; x++) {
            this.flagGroup.children[x].input.enabled = false;
        }

        this.click.play();

        this.game.add.tween(flag)
            .to({
                width: flag.width * 2,
                height: flag.height * 2
            }, 500, Phaser.Easing.Elastic.Out, true)
            .onComplete.add(() => {
            flag.alpha = 1;
            this.flagGroup.children.forEach(flag => {
                this.game.add.tween(flag)
                    .to({width: 0, height: 0}, 1000, Phaser.Easing.Back.In, true)
            });
            this.game.state.states['Game']._language = flag.name;
            this.game.state.states['Game']._langCode = languages[flag.name];

            this.time.events.add(1100, () => {
                this.text.hide();
                this.state.start('Game')
            })
        })
    }

    getFlag(direction) {
        let index = this.flagIndex;
        switch (direction) {
            case 'up':
                if (index >= 8)
                    index -= 8;
                else {
                    let offset = 8 - index;
                    index = this.indexedFlags.length - offset;
                }
                break;
            case 'down':
                if (index < this.indexedFlags.length - 8)
                    index += 8;
                else {
                    let offset = (index + 8) - this.indexedFlags.length;
                    index = offset;
                }
                break;
            case 'left':
                if (index > 0)
                    index -= 1;
                else
                    index = this.indexedFlags.length - 1;
                break;
            case 'right':
                if (index < this.indexedFlags.length - 1)
                    index += 1;
                else
                    index = 0;
                break;
            default:
                break;
        }
        this.flagIndex = index;
        this.animateSelectedFlag(this.indexedFlags[this.flagIndex]);
    }

    unselectPreviousFlag() {
        this.game.add.tween(this.selectedFlag)
            .to({width: 110 * game.scaleRatio, height: 50 * game.scaleRatio}, 200, Phaser.Easing.Back.Out, true)
    }

    animateSelectedFlag(flag) {
        if (this.selectedFlag != flag) {
            if(null != this.selectedFlag)
                this.unselectPreviousFlag();
            this.selectedFlag = flag;
            this.game.add.tween(flag)
                .to({width: flag.width * 2, height: flag.height * 2}, 200, Phaser.Easing.Back.Out, true)

            this.flagIndex = this.indexedFlags.indexOf(flag);
            this.text.changeText(flag.name);
            this.text.display();
            this.flagGroup.bringToTop(flag);
            this.game.world.bringToTop(flag);
        }
    }
}
