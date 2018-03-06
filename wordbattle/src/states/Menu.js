import Phaser from 'phaser'
import FreeText from '../sprites/FreeText'
import {flags, languages} from '../sprites/Flags'

Array.prototype.chunk = function (n) {
    if (!this.length) {
        return [];
    }
    return [this.slice(0, n)].concat(this.slice(n).chunk(n));
}

export default class extends Phaser.State {

    init() {
    }

    create() {
        let bg1 = game.add.sprite(game.world.centerX, game.world.centerY, 'bg1');
        bg1.anchor.set(0.5);
        // bg1.scale.set(0.6 * game.scaleRatio);

        this.click = game.add.audio('click');
        this.hover = game.add.audio('hover');

        let flagGroup = this.add.group();
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
            let flag = game.add.sprite(posx, posy, name);
            flag.name = String(idx);
            flag.anchor.set(0.5);
            flag.width = width;
            flag.height = height;
            flag.inputEnabled = true;
            flag.input.useHandCursor = true;
            flag.events.onInputOver.add(() => {
                this.hover.play();
                this.text.changeText(name);
                this.text.display();
                this.game.world.bringToTop(flag);
                this.game.add.tween(flag)
                    .to({width: width * 2, height: height * 2}, 200, Phaser.Easing.Back.Out, true)
            }, this);
            flag.events.onInputOut.add(() => {
                this.text.hide();
                this.game.add.tween(flag)
                    .to({width: width, height: height}, 200, Phaser.Easing.Back.Out, true)
            }, this);
            flag.events.onInputDown.add(() => {
                this.flagGroup.bringToTop(flag);
                for (var x = 0; x < this.flagGroup.children.length; x++) {
                    this.flagGroup.children[x].input.enabled = false;
                }

                this.click.play();

                this.game.add.tween(flag)
                    .to({
                        width: width * 5,
                        height: height * 5,
                        // x: this.world.centerX * 0.5,
                        // y: this.world.centerY * 0.5
                    }, 500, Phaser.Easing.Back.Out, true)
                    .onComplete.add(() => {
                    this.flagGroup.children.forEach(flag => {
                        this.game.add.tween(flag)
                            .to({width: 0, height: 0}, 1000, Phaser.Easing.Back.In, true)
                    });
                    this.game.state.states['Game']._language = name;
                    this.game.state.states['Game']._langCode = languages[name];

                    this.time.events.add(1100, () => {
                        this.text.hide();
                        this.state.start('Game')
                    })
                })
            });

            flagGroup.add(flag);

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
        this.game.world.bringToTop(flag);
        this.game.add.tween(flag)
            .to({
                width: flag.width * 5,
                height: flag.height * 5,
                x: this.world.centerX * 0.5,
                y: this.world.centerY * 0.5
            }, 500, Phaser.Easing.Back.Out, true)
            .onComplete.add(() => {
            this.flagGroup.children.forEach(flag => {
                this.game.add.tween(flag)
                    .to({width: 0, height: 0}, 1000, Phaser.Easing.Back.In, true)
            });
            this.game.state.states['Game']._language = flag.key;
            this.game.state.states['Game']._langCode = languages[flag.key];

            this.time.events.add(1100, () => {
                this.text.hide();
                this.state.start('Game')
            })
        })
    }

    getFlag(direction) {
        let index = this.flagIndex;
        console.log("OldIndex:" + index);
        switch (direction) {
            case 'up':
                if (index >= 8)
                    index -= 8;
                else {
                    let offset = 8 - index;
                    index = this.flagGroup.children.length - offset;
                }
                break;
            case 'down':
                if (index < this.flagGroup.children.length - 8)
                    index += 8;
                else {
                    let offset = (index + 8) - this.flagGroup.children.length;
                    index = offset;
                }
                break;
            case 'left':
                if (index > 0)
                    index -= 1;
                else
                    index = this.flagGroup.children.length - 1;
                break;
            case 'right':
                if (index < this.flagGroup.children.length - 1)
                    index += 1;
                else
                    index = 0;
                break;
            default:
                break;
        }
        this.flagIndex = index;
        console.log("NewIndex:" + index);
        this.selectedFlag = this.flagGroup.children[this.flagIndex];
        this.text.changeText(this.selectedFlag.key);
        this.text.display();
        this.game.world.bringToTop(this.selectedFlag);
        this.animateSelectedFlag(this.selectedFlag);
        return this.selectedFlag;
    }

    animateSelectedFlag(flag) {
        if(this.selectedFlag == flag) {
            this.game.add.tween(flag)
                .to({alpha: 0.2}, 400, Phaser.Easing.Linear.Out, true)
                .onComplete.add(() => {
                this.game.add.tween(flag)
                    .to({alpha: 1}, 400, Phaser.Easing.Linear.In, true)
                    .onComplete.add(this.animateSelectedFlag, this);
            }, this);
        }
    }


}
