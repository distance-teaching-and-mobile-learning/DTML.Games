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

import assembleScene from './assembleScene';

import sceneData from 'scene/title.json';

export default new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function Title() {
        Phaser.Scene.call(this, {
            key: 'Title',
        });

        this.isTransition = false;
    },
    create: function() {
        this.add.image(0, 0, 'sprites', 'bg/bg').setOrigin(0, 0)
        assembleScene(this, sceneData);

        var button = this.objectMap.get('button_play')
            .setInteractive()

        button.on('pointerover', function() {
            if (this.isTransition) {
                return;
            }
            this.setScale(1.1);
        })
        button.on('pointerout', function() {
            if (this.isTransition) {
                return;
            }
            this.setScale(1);
        })
        button.on('pointerdown', function() {
                if (this.isTransition) {
                    return;
                }
                this.isTransition = true;

                this.tweens.add({
                    targets: button,
                    scaleX: 0.9,
                    scaleY: 0.9,
                    duration: 160,
                    yoyo: true,
                    onComplete: function() {
                        this.cameras.main.fadeOut(400, 0, 0, 0, function() {
                            this.scene.switch('GamePlay');
                        }, this);
                    },
                    callbackScope: this,
                })
            }, this);

        this.cameras.main.fadeIn(400);
    },
})
