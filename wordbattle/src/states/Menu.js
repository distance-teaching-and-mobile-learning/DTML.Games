import Phaser from 'phaser'

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

        let flags = {
            "Afrikaans": "af", "Irish": "ga",
            "Albanian": "al", "Italian": "it",
            "Arabic": "ar", "Japanese": "jp",
            "Azerbaijani": "az", "Kannada": "kn",
            "Basque": "es", "Korean": "kr",
            "Bengali": "bn", "Latin": "la",
            "Belarusian": "be", "Latvian": "lv",
            "Bulgarian": "bg", "Lithuanian": "lt",
            "Catalan": "ca", "Macedonian": "mk",
            "Chinese": "cn", "Malay": "ms",
            "Amharic": "am", "Maltese": "mt",
            "Croatian": "hr", "Norwegian": "no",
            "Czech": "cz", "Persian": "ir",
            "Danish": "dk", "Polish": "pl",
            "Dutch": "nl", "Portuguese": "pt",
            "Romanian": "ro",
            "Russian": "ru",
            "Estonian": "et", "Serbian": "sr",
            "Filipino": "ph", "Slovak": "sk",
            "Finnish": "fi", "Slovenian": "sl",
            "French": "fr", "Spanish": "es",
            "Galician": "gl", "Swahili": "cd",
            "Georgian": "ge", "Swedish": "sv",
            "German": "de", "Tamil": "lk",
            "Greek": "gr", "Telugu": "in",
            "Gujarati": "gu", "Thai": "th",
            "Haitian Creole": "ht", "Turkish": "tr",
            "Hebrew": "il", "Ukrainian": "ua",
            "Hindi": "in", "Urdu": "pk",
            "Hungarian": "hu", "Vietnamese": "vi",
            "Icelandic": "is", "Welsh": "cy",
            "Indonesian": "id", "Yiddish": "de"
        };
        let language = {
            "Afrikaans": "af", "Irish": "ga",
            "Albanian": "sq", "Italian": "it",
            "Arabic": "ar", "Japanese": "ja",
            "Azerbaijani": "az", "Kannada": "kn",
            "Basque": "eu", "Korean": "ko",
            "Bengali": "bn", "Latin": "la",
            "Belarusian": "be", "Latvian": "lv",
            "Bulgarian": "bg", "Lithuanian": "lt",
            "Catalan": "ca", "Macedonian": "mk",

            "Chinese": "zh", "Malay": "ms",
            "Amharic": "am", "Maltese": "mt",
            "Croatian": "hr", "Norwegian": "no",
            "Czech": "cs", "Persian": "fa",
            "Danish": "da", "Polish": "pl",
            "Dutch": "nl", "Portuguese": "pt",
            "Romanian": "ro",
            "Russian": "ru",
            "Estonian": "et", "Serbian": "sr",
            "Filipino": "tl", "Slovak": "sk",
            "Finnish": "fi", "Slovenian": "sl",
            "French": "fr", "Spanish": "es",
            "Galician": "gl", "Swahili": "sw",

            "Georgian": "ka", "Swedish": "sv",
            "German": "de", "Tamil": "ta",
            "Greek": "el", "Telugu": "te",
            "Gujarati": "gu", "Thai": "th",
            "Haitian Creole": "ht", "Turkish": "tr",
            "Hebrew": "iw", "Ukrainian": "uk",
            "Hindi": "hi", "Urdu": "ur",
            "Hungarian": "hu", "Vietnamese": "vi",
            "Icelandic": "is", "Welsh": "cy",
            "Indonesian": "id", "Yiddish": "yi"
        };

        let flagGroup = this.add.group()
        let gapx = 10 * game.scaleRatio
        let posx = 40 * game.scaleRatio
        let posy = 20 * game.scaleRatio
        let width = 110 * game.scaleRatio
        let height = 50 * game.scaleRatio
        if (game.aspectRatio < 1) {
            height = 45 * game.scaleRatio
        }

        Object.keys(flags).forEach((name, idx) => {
            let flag = game.add.sprite(posx, posy, 'flags')
            flag.frameName = flags[name]
            flag.anchor.set(0.5)
            flag.width = width
            flag.height = height
            flag.inputEnabled = true

            flag.events.onInputOver.add(() => {
                this.hover.play()
                flagGroup.bringToTop(flag)
                this.game.add.tween(flag)
                    .to({width: width * 2, height: height * 2}, 200, Phaser.Easing.Back.Out, true)
            }, this)
            flag.events.onInputOut.add(() => {
                this.game.add.tween(flag)
                    .to({width: width, height: height}, 200, Phaser.Easing.Back.Out, true)
            }, this)
            flag.events.onInputDown.add(() => {
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
                    this.game.state.states['Game']._langCode = language[name];

                    this.time.events.add(1100, () => {
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
