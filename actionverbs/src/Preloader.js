export default new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function Preloader() {
        Phaser.Scene.call(this, {
            key: 'Preloader',
        });
    },
    preload: function() {
        this.load.atlas('sprites', 'media/sprites.png', 'media/sprites.json')
        this.load.image('tilemap', 'media/tilemap.png')
        this.load.tilemapTiledJSON('map', 'media/map.json')

        // Loading bar
        var width = 300
        var bar = this.add.graphics({ x: (800 - width) / 2, y: 300 })
        bar.fillStyle(0xAEAEAE, 1)
            .fillRect(0, -10, width, 20)

        this.load.on('progress', function(pct) {
            bar.clear()
                .fillStyle(0x260D36, 1)
                .fillRect(0, -10, width, 20)
                .fillStyle(0xF4F4F4, 1)
                .fillRect(0, -10, Math.round(width * pct), 20)
        });
    },
    create: function() {
        // Load sprite animatinos
        this.loadAnimations();
    },
    update: function() {
        this.scene.start('GamePlay');
    },

    loadAnimations: function() {
        this.anims.create({
            key: 'Stand',
            frames: this.anims.generateFrameNames('sprites', {
                prefix: 'play/p',
                frames: [1,2,3,4,3,2],
            }),
            frameRate: 8,
            repeat: -1,
        });
        this.anims.create({
            key: 'Jump',
            frames: this.anims.generateFrameNames('sprites', {
                prefix: 'play/p',
                frames: [15],
            }),
            frameRate: 1,
        });
        this.anims.create({
            key: 'Fall',
            frames: this.anims.generateFrameNames('sprites', {
                prefix: 'play/p',
                frames: [15],
            }),
            frameRate: 1,
        });
        this.anims.create({
            key: 'Go',
            frames: this.anims.generateFrameNames('sprites', {
                prefix: 'play/p',
                start: 5,
                end: 14,
            }),
            frameRate: 14,
            repeat: -1,
        });
        this.anims.create({
            key: 'Climb',
            frames: this.anims.generateFrameNames('sprites', {
                prefix: 'play/p',
                frames: [21,22,21,23],
            }),
            frameRate: 6,
            repeat: -1,
        });
        this.anims.create({
            key: 'Squat',
            frames: this.anims.generateFrameNames('sprites', {
                prefix: 'play/p',
                frames: [24,26,25],
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: 'Kick',
            frames: this.anims.generateFrameNames('sprites', {
                prefix: 'play/p',
                frames: [27],
            }),
            frameRate: 1,
            repeat: -1,
        });
    },
})
