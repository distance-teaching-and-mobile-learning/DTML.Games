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
        bg1.scale.set(0.6 * game.scaleRatio);

        this.click = game.add.audio('click');
        this.hover = game.add.audio('hover');

        let flagGroup = this.add.group()
        let gapx = 10 * game.scaleRatio
        let posx = 40 * game.scaleRatio
        let posy = 20 * game.scaleRatio
        let width = 110 * game.scaleRatio
        let height = 50 * game.scaleRatio
        if (game.aspectRatio < 1) {
            height = 45 * game.scaleRatio
        }

        this.text = new FreeText({
            game: this.game,
            x: this.game.world.centerX,
            y: this.game.world.centerY * 0.085,
            text: ''
        });
        Object.keys(flags).forEach((name, idx) => {
            let flag = game.add.sprite(posx, posy, name)
            flag.frameName = flags[name]
            flag.anchor.set(0.5)
            flag.width = width
            flag.height = height
            flag.inputEnabled = true
            flag.input.useHandCursor = true;
            flag.events.onInputOver.add(() => {
                this.hover.play()
                this.text.changeText(name);
                this.text.display();
                flagGroup.bringToTop(flag)
                this.game.add.tween(flag)
                    .to({width: width * 2, height: height * 2}, 200, Phaser.Easing.Back.Out, true)
            }, this)
            flag.events.onInputOut.add(() => {
                this.text.hide();
                this.game.add.tween(flag)
                    .to({width: width, height: height}, 200, Phaser.Easing.Back.Out, true)
            }, this)
            flag.events.onInputDown.add(() => {
                for (var x = 0; x < this.flagGroup.children.length; x++) {
                    this.flagGroup.children[x].input.enabled = false;
                }

                this.click.play()

                this.game.add.tween(flag)
                    .to({
                        width: width * 5,
                        height: height * 5,
                        x: game.width / 2 - (width / 2),
                        y: game.height / 2 - (height / 2)
                    }, 500, Phaser.Easing.Back.Out, true)
                    .onComplete.add(() => {
                    this.flagGroup.children.forEach(flag => {
                        this.game.add.tween(flag)
                            .to({width: 0, height: 0}, 1000, Phaser.Easing.Back.In, true)
                    })
                    this.game.state.states['Game']._language = name;
                    this.game.state.states['Game']._langCode = languages[name];

                    this.time.events.add(1100, () => {
                        this.text.hide();
                        this.state.start('Game')
                    })
                })
            })

            flagGroup.add(flag)

            posx += flag.width + gapx
            if (idx % 8 == 7) {
                posx = 0 + 40 * game.scaleRatio
                posy += flag.height + 10
            }
        })
        flagGroup.x = this.world.centerX - flagGroup.width / 2
        flagGroup.y = this.world.centerY - flagGroup.height / 2
        this.flagGroup = flagGroup
    }
}
