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
