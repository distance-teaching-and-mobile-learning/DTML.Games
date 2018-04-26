var MapList = [
    'climb',
    'jump',
    'stand',
    'push',
    'squat',
    'ride',
    'open',
];

var States = {
    Wait: 'Wait',
    Play: 'Play',
    Guide: 'Guide',
    Burn: 'Burn',
    GameOver: 'GameOver',
};

var PlayerStates = {
    Go: 'Go',
    Jump: 'Jump',
    Climb: 'Climb',
    Stop: 'Stop',
    Ride: 'Ride',
    Kick: 'Kick',
    Push: 'Push',
    Squat: 'Squat',
    Open: 'Open',
    Close: 'Close',
    Drop: 'Drop',
};

export default new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function GamePlay() {
        Phaser.Scene.call(this, {
            key: 'GamePlay',
            physics: {
                arcade: {
                    gravity: {
                        x: 0,
                        y: 400,
                    },
                    debug: false,
                },
            },
        });

        this.state = '';
        this.playerState = PlayerStates.Stop;

        this.activeGuide;
        this.climbX = 0;
        this.canClimb = false;
        this.isPushing = false;
        this.distance = 0;
        this.coin = 0;
        this.playerOffsetToPlatform = 0;
        this.mapCreateCooldown = 0;

        this.buttons = {};
        this.buttonList;

        // Actors
        this.player;
        this.cameraTarget;
        this.hand;
        this.handMotion;
        this.touchedPlatform;

        this.collisionMap;
        this.activeMaps = [];

        // UI
        this.coinLabel;
        this.distLabel;

        // Groups
        this.triggers;
        this.actors;
    },

    create: function() {
        // Create groups
        this.triggers = this.physics.add.staticGroup()
        this.actors = this.physics.add.group()

        // Background
        this.add.image(0, 0, 'sprites', 'bg/bg').setOrigin(0, 0).setScrollFactor(0)

        // Player
        this.player = this.physics.add.sprite(900, 300, 'sprites', 'play/p1')
            .setSize(20, 70, false)
            .setOffset(28, 25)
            .setDepth(50)
            .play('Stand')

        // Dragon
        this.dragon = this.add.sprite(500, 200)
            .setDepth(60)
            .play('dragon/fly')
            .setData('speed', 40)
            .setData('accel', 0.5)

        this.physics.add.overlap(this.player, this.triggers, function(player, trigger) {
            if (trigger.name === 'End') {
                trigger.destroy();
                return;
            }

            switch (trigger.name) {
                case 'Climb': {
                    this.climbX = trigger.x;
                    this.canClimb = true;
                } break;
            }

            if (!this.buttons[trigger.name].visible) {
                // Show the button
                this.buttons[trigger.name].show()

                // Start to guide
                this.changeState(States.Guide, trigger)
            }

            // Destroy the trigger
            trigger.destroy()
        }, null, this)
        // this.physics.add.collider(this.actors, collisionMap);
        this.physics.add.collider(this.player, this.actors, function(player, actor) {
        }, function(player, actor) {
            switch (actor.name) {
                case 'Coin': {
                    if (!actor.visible) {
                        return false;
                    }

                    this.coin += 1;

                    var label = this.add.text(actor.x, actor.y - 16, '+5', {
                        fontSize: '36px',
                        fill: 'gold',
                    }).setOrigin(0.5, 1).setDepth(20)
                    .setShadow(2, 2, "#333333", 2, false, true)
                    this.tweens.add({
                        targets: label,
                        y: '-=40',
                        onComplete: label.destroy,
                        callbackScope: label,
                    })

                    actor.destroy();

                    return false;
                } break;
                case 'Saw': {
                    this.changeState(States.GameOver);
                    return false;
                } break;
                case 'Box': {
                    actor.body.immovable = !this.isPushing;
                    return true;
                } break;
                case 'Platform': {
                    actor.body.immovable = true;
                    this.touchedPlatform = actor;
                    return true;
                } break;
                case 'Door': {
                    this.touchedDoor = actor;
                    return !actor.getData('is_open');
                } break;
            }

            return true;
        }, this);

        // Map
        this.activeMaps = [];
        this.createMap('map');

        // Setup camera
        this.cameraTarget = this.add.image(0, 0).setVisible(false)
        this.cameras.main.setBounds(0, 0, Number.MAX_VALUE, 600)
        this.cameras.main.startFollow(this.cameraTarget, true)

        // Setup action buttons
        this.setupActions()

        // Setup UI
        this.hand = this.add.image(-100, -100, 'sprites', 'hand')
            .setScrollFactor(0)
            .setDepth(2000)

        this.add.image(42, 40, 'sprites', 'coin&distance_bar')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
        this.add.image(20, 40, 'sprites', 'UI_coin')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
        this.coinLabel = this.add.text(82, 40, '0', {
            fontSize: 28,
        }).setOrigin(0, 0.5).setScrollFactor(0).setShadow(2, 2, "#333333", 2, false, true)

        this.add.image(42, 80, 'sprites', 'coin&distance_bar')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
        this.add.image(20, 80, 'sprites', 'UI_distance')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
        this.distLabel = this.add.text(82, 80, '0', {
            fontSize: 28,
        }).setOrigin(0, 0.5).setScrollFactor(0).setShadow(2, 2, "#333333", 2, false, true)

        this.dimmer = this.add.graphics()
            .fillStyle(0x000000, 0.5)
            .fillRect(0, 0, 800, 600)
            .setDepth(100)
            .setScrollFactor(0)
            .setVisible(false)

        var modal = this.add.graphics()
            .fillStyle(0x837697)
            .fillRect(200, 100, 400, 400)
        var title = this.add.text(400, 130, 'Game Over', {
            fontSize: 32,
        }).setOrigin(0.5, 0.5)
        var coinIcon = this.add.image(320, 240, 'sprites', 'UI_coin')
            .setOrigin(0, 0.5)
        var coinLabel = this.add.text(390, 240, '0', {
            fontSize: 28,
        }).setOrigin(0, 0.5)
        var distIcon = this.add.image(320, 340, 'sprites', 'UI_distance')
            .setOrigin(0, 0.5)
        var distLabel = this.add.text(390, 340, '0', {
            fontSize: 28,
        }).setOrigin(0, 0.5)
        var prompt = this.add.text(400, 450, 'Touch to restart', {
            fontSize: 24,
        }).setOrigin(0.5, 0.5).setInteractive()

        this.gameover = this.add.container(0, 0, [
            modal,
            title,
            coinIcon, coinLabel,
            distIcon, distLabel,
            prompt,
        ]).setDepth(200).setScrollFactor(0)
        .setVisible(false)
        this.gameover.show = function() {
            this.dimmer.visible = true;
            this.gameover.visible = true;
            coinLabel.setText(this.coin);
            distLabel.setText(Math.floor(this.distance));

            this.input.once('pointerdown', function() {
                this.scene.stop('GamePlay');
                this.scene.start('GamePlay');
            }, this)

            // API calls
            var http = new XMLHttpRequest();
            http.open('POST', 'https://dtml.org/Activity/RecordUserActivity/', true);
            http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            http.send(
                'id=actionverbs' +
                '&coin=' + this.coin +
                '&distance=' + Math.floor(this.distance) +
                '&score=' + (Math.floor(this.distance) + this.coin * 5)
            );
        }.bind(this);

        // State
        this.changeState(States.Wait, null)

        this.cameras.main.fadeIn(400);
    },
    update: function(time, delta) {
        switch (this.state) {
            case States.Wait: this.update_wait(delta); break
            case States.Play: this.update_play(delta); break
            case States.Guide: this.update_guide(delta); break
            case States.Burn: this.update_burn(delta); break
        }
    },
    changeState: function(state, data) {
        if (this.state === state) {
            return;
        }

        this.state = state;
        switch (this.state) {
            case States.Wait: this.enter_wait(data); break
            case States.Play: this.enter_play(data); break
            case States.Guide: this.enter_guide(data); break
            case States.Burn: this.enter_burn(data); break
            case States.GameOver: this.enter_gameover(data); break
        }
    },

    // States
    enter_wait: function(data) {
        // Hide buttons
        for (var i = 0; i < this.buttonList.length; i++) {
            this.buttonList[i].hide()
        }

        // Now let's play
        this.changeState(States.Play, null)
    },
    update_wait: function(delta) {},
    enter_play: function(data) {
        if (this.mapCreateCooldown > 0) {
            this.mapCreateCooldown -= delta;
        }

        // Show first button
        this.buttons['Go'].show()

        // Let the player stop
        this.requestAction('Stop')
    },
    update_play: function(delta) {
        this.cameraTarget.x = this.player.x + 150;
        this.cameraTarget.y = this.player.y;

        // Move the dragon
        this.dragon.setData('speed', this.dragon.getData('speed') + this.dragon.getData('accel') * delta * 0.001)
        this.dragon.x += this.dragon.getData('speed') * delta * 0.001;
        this.dragon.y += (this.player.y - 100 - this.dragon.y) * delta * 0.002;
        this.dragon.x = Math.max(this.dragon.x, this.player.x - 320);

        if (this.dragon.x > this.player.x - 150) {
            this.changeState(States.Burn);
            return;
        }

        // Increase distance
        if (this.player.body.velocity.x > 0) {
            this.distance += 5 * delta * 0.001;
        }
        // this.scoreLabel.setText('Score: ' + (Math.floor(this.distance) + this.coin * 5))
        this.coinLabel.setText(this.coin)
        this.distLabel.setText(Math.floor(this.distance))

        if (this.touchedPlatform && Math.abs(this.touchedPlatform.x - this.player.x) > 90) {
            this.touchedPlatform = false;
        }
        if (this.touchedDoor && Math.abs(this.touchedDoor.x - this.player.x) > 40) {
            this.touchedDoor = false;
        }

        this['p_update_' + this.playerState](delta);

        // Create map if required
        var map = this.activeMaps[this.activeMaps.length - 1];
        if (this.player.x > map.collision.x + 300) {
            // Create a new map
            this.createMap(Phaser.Utils.Array.GetRandom(MapList));
        }

        // Remove actors and triggers out of screen
        var objs = this.triggers.getChildren();
        for (var i = 0; i < objs.length; i++) {
            if (objs[i].x < this.player.x - 500) {
                objs[i].destroy();
            }
        }
        objs = this.actors.getChildren();
        for (var i = 0; i < objs.length; i++) {
            if (objs[i].x < this.player.x - 500) {
                objs[i].destroy();
            }
        }

        if (this.player.y > 660) {
            this.changeState(States.GameOver);
        }
    },
    enter_guide: function(data) {
        this.activeGuide = data.name;

        if (this.activeGuide === 'Climb') {
            this.climbX = data.x;
            this.canClimb = true;
        }

        // Stop the player
        this.player
            .setVelocityX(0)
            .play('Stand');
        this.playerState = 'Stop';
        this.p_enter_Stop();

        // Show hand prompt
        this.hand.setPosition(this.buttons[this.activeGuide].x + 30, this.buttons[this.activeGuide].y + 20)
        this.handMotion = this.tweens.add({
            targets: this.hand,
            x: this.hand.x + 20,
            y: this.hand.y + 20,
            duration: 400,
            yoyo: true,
            loop: 1080,
        })
    },
    update_guide: function(delta) {},
    exit_guide: function() {
        this.activeGuide = null;
        this.hand.setPosition(-100, -100);
        this.handMotion.stop();

        this.changeState(States.Play, null);
    },
    enter_burn: function() {
        // Hide buttons
        for (var i = 0; i < this.buttonList.length; i++) {
            this.buttonList[i].hide()
        }

        // Stop the player
        this.player.body.velocity.x = 0;

        // Dragon fire
        this.dragon.play('dragon/atk');
        var emitter;
        this.time.delayedCall(200, function() {
            var p = this.add.particles('sprites', 'fire')
            var deathZone = new Phaser.Geom.Rectangle(this.dragon.x, this.dragon.y + 150, 400, 400);

            emitter = p.createEmitter({
                x: this.dragon.x + 80,
                y: this.dragon.y + 40,
                angle: { min: 30, max: 80 },
                speed: 300,
                gravityY: 200,
                lifespan: { min: 1000, max: 2000 },
                scale: { start: 0.75, end: 0.75 },
                blendMode: 'ADD',
                deathZone: { type: 'onEnter', source: deathZone },
            })
        }, [], this)

        this.time.delayedCall(400, function() {
            this.player.play('Burn')
            this.player.once('animationcomplete', function() {
                this.player.visible = false;
            }, this);
        }, [], this);
        this.time.delayedCall(3200, function() {
            emitter.killAll();

            this.player.visible = false;
            this.changeState(States.GameOver);
        }, [], this)
    },
    update_burn: function() {},
    exit_burn: function() {},
    enter_gameover: function() {
        this.gameover.show();
    },

    // Player states
    changePlayerState: function(state) {
        this.playerState = state;
        // console.log('Player.' + state)
        this['p_enter_' + this.playerState]();
    },
    p_enter_Go: function() {
        this.player
            .setVelocityX(150)
            .play('Go')
    },
    p_update_Go: function(delta) {},
    p_action_Go: function(action) {
        switch (action) {
            case 'Jump':
            case 'Squat':
            case 'Push':
            case 'Open':
            case 'Stop': {
                this.changePlayerState(action)
            } break;
            case 'Climb': {
                if (this.canClimb) {
                    this.changePlayerState(action)
                }
            } break;
            case 'Ride': {
                if (this.touchedPlatform) {
                    this.changePlayerState(action)
                }
            } break;
        }
    },

    p_enter_Jump: function() {
        this.player
            .setVelocityY(-250)
            .play('Jump')
    },
    p_update_Jump: function(delta) {
        this.player.setVelocityX(150)

        if (this.player.body.velocity.y > 0) {
            this.player.play('Fall');
        }

        if (this.player.body.blocked.down || this.player.body.touching.down) {
            this.changePlayerState('Go')
        }
    },
    p_action_Jump: function(action) {},

    p_enter_Climb: function() {
        console.log(this.player.x, this.climbX)
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        this.player.body.allowGravity = false;
        this.player.x = this.climbX - 10;
        this.tweens.timeline({
            targets: this.player,
            tweens: [
                {
                    y: '-=170',
                    duration: 1000,
                },
                {
                    x: '+=40',
                    duration: 300,
                },
            ],
            onComplete: function() {
                this.canClimb = false;
                this.player.body.allowGravity = true;
                this.changePlayerState('Go');
            },
            callbackScope: this,
        });

        this.player.play('Climb');

        this.time.delayedCall(1000, function() {
            this.player.play('Go')
        }, [], this);
    },
    p_update_Climb: function(delta) {},
    p_action_Climb: function(action) {
        if (!this.canClimb) {
            // this.changePlayerState(action);
        }
    },

    p_enter_Stop: function() {
        this.player
            .setVelocityX(0)
            .play('Stand');
    },
    p_update_Stop: function(delta) {},
    p_action_Stop: function(action) {
        switch (action) {
            case 'Go':
            case 'Jump':
            case 'Push':
            case 'Open':
            case 'Squat': {
                this.changePlayerState(action)
            } break;
            case 'Climb': {
                if (this.canClimb) {
                    this.changePlayerState(action)
                }
            } break;
            case 'Ride': {
                if (this.touchedPlatform) {
                    this.changePlayerState(action)
                }
            } break;
        }
    },

    p_enter_Ride: function() {
        this.touchedPlatform.body.velocity.x = 120;
        this.playerOffsetToPlatform = this.touchedPlatform.x - this.player.x;
    },
    p_update_Ride: function(delta) {
        this.player.x = this.touchedPlatform.x - this.playerOffsetToPlatform;

        if (this.touchedPlatform.body.velocity.x === 0) {
            this.changePlayerState('Stop')
        }
    },
    p_action_Ride: function(action) {
        switch (action) {
            case 'Stop': {
                this.changePlayerState(action)
            } break;
        }
    },

    p_enter_Kick: function() {},
    p_update_Kick: function(delta) {},
    p_action_Kick: function(action) {},

    p_enter_Push: function() {
        this.isPushing = true;
    },
    p_update_Push: function(delta) {
        this.player
            .setVelocityX(120)
            .play('Push')
    },
    p_action_Push: function(action) {
        switch (action) {
            case 'Go':
            case 'Jump':
            case 'Squat':
            case 'Open':
            case 'Stop': {
                this.isPushing = false;
                this.changePlayerState(action)
            } break;
            case 'Climb': {
                this.isPushing = false;
                if (this.canClimb) {
                    this.changePlayerState(action)
                }
            } break;
            case 'Ride': {
                if (this.touchedPlatform) {
                    this.changePlayerState(action)
                }
            } break;
        }
    },

    p_enter_Squat: function() {
        this.player
            .setSize(20, 50, false)
            .setOffset(28, 45)

        this.player
            .setVelocityX(120)
            .play('Squat');
    },
    p_update_Squat: function(delta) {
        this.player
            .setVelocityX(120)
    },
    p_action_Squat: function(action) {
        switch (action) {
            case 'Go':
            case 'Stop':
            case 'Push':
            case 'Open':
            case 'Jump': {
                this.player
                    .setSize(20, 70, false)
                    .setOffset(28, 25)

                this.changePlayerState(action)
            } break;
            case 'Climb': {
                if (this.canClimb) {
                    this.changePlayerState(action)
                }
            } break;
            case 'Ride': {
                if (this.touchedPlatform) {
                    this.changePlayerState(action)
                }
            } break;
        }
    },

    p_enter_Open: function() {
        if (this.touchedDoor && !this.touchedDoor.getData('is_open')) {
            this.touchedDoor
                .setData('is_open', true)
                .setDepth(5)
                .setTexture('sprites', 'dooropen')
            this.touchedDoor = false;

            this.changePlayerState('Stop');
        }
    },
    p_update_Open: function(delta) {},
    p_action_Open: function(action) {
        switch (action) {
            case 'Go':
            case 'Stop':
            case 'Push':
            case 'Open':
            case 'Jump': {
                this.changePlayerState(action)
            } break;
        }
    },

    p_enter_Close: function() {},
    p_update_Close: function(delta) {},
    p_action_Close: function(action) {},

    p_enter_Drop: function() {},
    p_update_Drop: function(delta) {},
    p_action_Drop: function(action) {},

    // Methods
    setupActions: function() {
        var START_X = 75, START_Y = 450,
            SPACE_X = 130, SPACE_Y = 80;
        this.buttonList = [
            this.addButton(START_X + SPACE_X * 0, START_Y + SPACE_Y * 0, ['Go', 'Run', 'Sprint']),
            this.addButton(START_X + SPACE_X * 1, START_Y + SPACE_Y * 0, ['Jump', 'Hop']),
            this.addButton(START_X + SPACE_X * 2, START_Y + SPACE_Y * 0, ['Climb', 'Ascent']),
            this.addButton(START_X + SPACE_X * 3, START_Y + SPACE_Y * 0, ['Stop', 'Stand']),
            this.addButton(START_X + SPACE_X * 4, START_Y + SPACE_Y * 0, ['Ride', 'Drive']),
            this.addButton(START_X + SPACE_X * 5, START_Y + SPACE_Y * 0, ['Kick', 'Hit', 'Break']),

            this.addButton(START_X + SPACE_X * 0, START_Y + SPACE_Y * 1, ['Push', 'Move']),
            this.addButton(START_X + SPACE_X * 1, START_Y + SPACE_Y * 1, ['Squat', 'Crawl']),
            this.addButton(START_X + SPACE_X * 2, START_Y + SPACE_Y * 1, ['Open', 'Enter']),
            this.addButton(START_X + SPACE_X * 3, START_Y + SPACE_Y * 1, ['Close']),
            this.addButton(START_X + SPACE_X * 4, START_Y + SPACE_Y * 1, ['Drop']),
        ];
        this.buttons['Go'] = this.buttonList[0];
        this.buttons['Jump'] = this.buttonList[1];
        this.buttons['Climb'] = this.buttonList[2];
        this.buttons['Stop'] = this.buttonList[3];
        this.buttons['Ride'] = this.buttonList[4];
        this.buttons['Kick'] = this.buttonList[5];
        this.buttons['Push'] = this.buttonList[6];
        this.buttons['Squat'] = this.buttonList[7];
        this.buttons['Open'] = this.buttonList[8];
        this.buttons['Close'] = this.buttonList[9];
        this.buttons['Drop'] = this.buttonList[10];
    },
    requestAction: function(action) {
        if (this.state === States.Play) {
            this['p_action_' + this.playerState](action)
        } else if (this.state === States.Guide) {
            if (this.activeGuide === action) {
                this.exit_guide()
                this['p_action_' + this.playerState](action)
            }
        }
    },

    // Utils
    addButton: function(x, y, actions, revActions) {
        var button = this.add.image(x, y, 'sprites', 'button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive()
        var label = this.add.text(x, y, Phaser.Utils.Array.GetRandom(actions))
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(100)
            .setShadow(2, 2, "#333333", 2, false, true)

        button.on('pointerdown', function(event) {
            button.alpha = 0.6;
            // console.log('requestAction(' + actions[0] + ')')
            this.requestAction(actions[0])
        }, this)
        button.on('pointerup', function(event) {
            button.alpha = 1;
        }, this)

        button.show = function(rev) {
            button.visible = true
            label.visible = true

            if (rev && revActions) {
                label.setText()
            }
        };
        button.hide = function() {
            button.visible = false
            label.visible = false
        };

        return button;
    },

    createMap: function(key) {
        var x = 0;
        if (this.activeMaps.length > 0) {
            x = this.activeMaps[this.activeMaps.length - 1].collision.x + this.activeMaps[this.activeMaps.length - 1].map.widthInPixels;
        }
        console.log(`map: ${key}, x: ${x}`)

        var mapPack = {
            map: null,
            collision: null,
            playerCollider: null,
            actorCollider: null,
            createdNext: false,
        };
        this.activeMaps.push(mapPack);

        // Create a new map
        var map = this.add.tilemap(key)
        var tileset = map.addTilesetImage('tile', 'tilemap')
        mapPack.map = map;

        map.createStaticLayer('terrain', tileset, x, 0)
        map.createStaticLayer('grass', tileset, x, 0)
        map.createStaticLayer('deco', tileset, x, 0)

        var collisionMap = map.createStaticLayer('collide', tileset, x, 0)
        collisionMap.setCollision([39], true);
        mapPack.collision = collisionMap;

        mapPack.playerCollider = this.physics.add.collider(this.player, collisionMap);
        mapPack.actorCollider = this.physics.add.collider(this.actors, collisionMap);

        var width = 0;
        for (var i = 0; i < this.activeMaps.length; i++) {
            width += this.activeMaps[i].map.widthInPixels;
        }

        // Create new triggers and actors
        this.createTriggers(map, x);
        this.createActors(map, x);

        // Remove first map
        if (this.activeMaps.length >= 3) {
            var map = this.activeMaps.shift();
            map.playerCollider.destroy();
            map.actorCollider.destroy();
            map.map.destroy();
        }
    },
    createTriggers: function(map, offsetX) {
        var list = [];

        list = list.concat(map.createFromObjects('trigger', 'Jump'));
        list = list.concat(map.createFromObjects('trigger', 'Climb'));
        list = list.concat(map.createFromObjects('trigger', 'Stop'));
        list = list.concat(map.createFromObjects('trigger', 'Ride'));
        list = list.concat(map.createFromObjects('trigger', 'Kick'));
        list = list.concat(map.createFromObjects('trigger', 'Push'));
        list = list.concat(map.createFromObjects('trigger', 'Squat'));
        list = list.concat(map.createFromObjects('trigger', 'Open'));
        list = list.concat(map.createFromObjects('trigger', 'Close'));
        list = list.concat(map.createFromObjects('trigger', 'Drop'));
        list = list.concat(map.createFromObjects('trigger', 'End'));

        list.forEach(function(trigger) {
            trigger.x += offsetX;
            trigger.visible = false;
        });

        this.triggers.addMultiple(list);
        // console.log(this.triggers.getLength() + ' triggers')
    },
    createActors: function(map, offsetX) {
        var newActors = [];
        var list;

        list = map.createFromObjects('actor', 'Coin', {
            key: 'sprites',
            frame: 'coin',
        })
        newActors = newActors.concat(list);
        this.actors.addMultiple(list);

        list = map.createFromObjects('actor', 'Box', {
            key: 'sprites',
            frame: 'stone',
        })
        newActors = newActors.concat(list);
        this.actors.addMultiple(list);

        list = map.createFromObjects('actor', 'Platform', {
            key: 'sprites',
            frame: 'platform',
        })
        newActors = newActors.concat(list);
        this.actors.addMultiple(list);

        list = map.createFromObjects('actor', 'Trigger', {
            key: 'sprites',
            frame: 'powerswitchclose',
        })
        newActors = newActors.concat(list);
        this.actors.addMultiple(list);

        list = map.createFromObjects('actor', 'Door', {
            key: 'sprites',
            frame: 'doorclose',
        })
        newActors = newActors.concat(list);
        this.actors.addMultiple(list);
        list.forEach(function(d) {
            d.setData('is_open', false)
                .setDepth(20)
            d.body.immovable = true;
        });


        list = map.createFromObjects('actor', 'Saw', {
            key: 'sprites',
            frame: 'saw',
            scale: 0.3,
        });
        var moveUp = (function() {
            this.tweens.add({
                targets: list,
                y: '-=300',
                duration: 1600,
                onComplete: moveDown,
            })
        }).bind(this)
        var moveDown = (function() {
            this.tweens.add({
                targets: list,
                y: '+=300',
                duration: 1600,
                onComplete: moveUp,
            })
        }).bind(this)
        moveUp();
        newActors = newActors.concat(list);
        this.actors.addMultiple(list);

        // Actors are not affected by gravity
        newActors.forEach(function(actor) {
            actor.setDepth(100);

            actor.x += offsetX;

            if (actor.name !== 'Box') {
                actor.body.allowGravity = false;
            }

            // console.log(`create actor: "${actor.name}" at (${actor.x}, ${actor.y})`)
        });

        // console.log(`createActors(${this.actors.getLength()}): with offset ${offsetX}`)
    },
});
