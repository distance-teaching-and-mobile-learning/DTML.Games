var States = {
    Wait: 0,
    Play: 1,
    Guide: 2,
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
        Phaser.Scene.call(this, { key: 'GamePlay' });

        this.state = '';
        this.playerState = PlayerStates.Stop;

        this.activeGuide;
        this.climbX = 0;
        this.canClimb = false;
        this.isPushing = false;
        this.distance = 0;
        this.coin = 0;
        this.playerOffsetToPlatform = 0;

        this.buttons = {};
        this.buttonList;

        // Actors
        this.player;
        this.cameraTarget;
        this.hand;
        this.handMotion;
        this.touchedPlatform;

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

        // Map
        var map = this.add.tilemap('map')
        var tileset = map.addTilesetImage('tile', 'tilemap')

        map.createStaticLayer('terrain', tileset)
        map.createStaticLayer('grass', tileset)
        map.createStaticLayer('deco', tileset)

        var collisionMap = map.createStaticLayer('collide', tileset)
        collisionMap.setCollision([36], true);
        console.log(collisionMap)

        this.createTriggers(map);
        this.createActors(map);

        var debugGraphics = this.add.graphics();
        map.renderDebug(debugGraphics, {
            tileColor: null, // Non-colliding tiles
            collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200), // Colliding tiles
            faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Colliding face edges
        });

        // Player
        this.player = this.physics.add.sprite(100, 300, 'sprites', 'play/p1')
            .setSize(20, 70, false)
            .setOffset(28, 25)
            .play('Stand')

        this.physics.add.collider(this.player, collisionMap)
        this.physics.add.overlap(this.player, this.triggers, function(player, trigger) {
            // Show the button
            this.buttons[trigger.name].show()

            // Start to guide
            this.changeState(States.Guide, trigger)

            // Destroy the trigger
            trigger.destroy()
            this.triggers.remove(trigger)
        }, null, this)
        this.physics.add.collider(this.actors, collisionMap);
        this.physics.add.collider(this.player, this.actors, function(player, actor) {
        }, function(player, actor) {
            switch (actor.name) {
                case 'Coin': {
                    this.coin += 1;

                    var label = this.add.text(actor.x, actor.y, '+5', {
                        fontSize: '24px',
                        fill: 'gold',
                    }).setOrigin(0.5, 1)
                    this.tweens.add({
                        targets: label,
                        y: '-=40',
                        onComplete: label.destroy,
                        callbackScope: label,
                    })

                    actor.destroy()

                    return false;
                } break;
                case 'Saw': {
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
            }

            return true;
        }, this);

        // Setup camera
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.cameraTarget = this.add.image(0, 0).setVisible(false)
        this.cameras.main.startFollow(this.cameraTarget, true)

        // Setup action buttons
        this.setupActions()

        // Setup UI
        this.hand = this.add.image(-100, -100, 'sprites', 'hand')
            .setScrollFactor(0)

        this.add.image(42, 40, 'sprites', 'coin&distance_bar')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
        this.add.image(20, 40, 'sprites', 'UI_coin')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
        this.coinLabel = this.add.text(82, 40, '0', {
            fontSize: 28,
        }).setOrigin(0, 0.5).setScrollFactor(0)

        this.add.image(42, 80, 'sprites', 'coin&distance_bar')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
        this.add.image(20, 80, 'sprites', 'UI_distance')
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
        this.distLabel = this.add.text(82, 80, '0', {
            fontSize: 28,
        }).setOrigin(0, 0.5).setScrollFactor(0)

        // State
        this.changeState(States.Wait, null)
    },
    update: function(time, delta) {
        switch (this.state) {
            case States.Wait: this.update_wait(delta); break
            case States.Play: this.update_play(delta); break
            case States.Guide: this.update_guide(delta); break
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
        // Show first button
        this.buttons['Go'].show()

        // Let the player stop
        this.requestAction('Stop')
    },
    update_play: function(delta) {
        this.cameraTarget.x = this.player.x + 150;
        this.cameraTarget.y = this.player.y;

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

        this['p_update_' + this.playerState](delta);
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

    // Player states
    changePlayerState: function(state) {
        this.playerState = state;
        console.log('Player.' + state)
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

        if (this.player.body.onFloor()) {
            this.changePlayerState('Go')
        }
    },
    p_action_Jump: function(action) {},

    p_enter_Climb: function() {
        this.player.allowGravity = false;
        this.player.x = this.climbX;
        this.tweens.timeline({
            targets: this.player,
            tweens: [
                {
                    y: '-=180',
                    duration: 1000,
                },
                {
                    x: '+=30',
                    duration: 200,
                }
            ],
            onComplete: function() {
                this.canClimb = false;
                this.player.allowGravity = true;
                this.changePlayerState('Go');
            },
            callbackScope: this,
        });

        this.player.play('Climb');
    },
    p_update_Climb: function(delta) {},
    p_action_Climb: function(action) {
        if (!this.canClimb) {
            this.changePlayerState(action);
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
        this.player.x = this.touchedPlatform.x + this.playerOffsetToPlatform;

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
            .setVelocityX(150)
            .play('Push')
    },
    p_action_Push: function(action) {
        switch (action) {
            case 'Jump':
            case 'Squat':
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

    p_enter_Open: function() {},
    p_update_Open: function(delta) {},
    p_action_Open: function(action) {},

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
            .setInteractive()
        var label = this.add.text(x, y, Phaser.Utils.Array.GetRandomElement(actions))
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)

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

    createTriggers: function(map) {
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Jump'));
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Climb'));
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Stop'));
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Ride'));
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Kick'));
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Push'));
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Squat'));
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Open'));
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Close'));
        this.triggers.addMultiple(map.createFromObjects('trigger', 'Drop'));

        this.triggers.getChildren().forEach(function(trigger) {
            trigger.visible = false;
        });
    },
    createActors: function(map) {
        this.actors.addMultiple(map.createFromObjects('actor', 'Coin', {
            key: 'sprites',
            frame: 'coin',
        }));
        this.actors.addMultiple(map.createFromObjects('actor', 'Box', {
            key: 'sprites',
            frame: 'box',
        }));
        this.actors.addMultiple(map.createFromObjects('actor', 'Platform', {
            key: 'sprites',
            frame: 'platform',
        }));

        var saws = map.createFromObjects('actor', 'Saw', {
            key: 'sprites',
            frame: 'saw',
            scale: 0.3,
        });
        var moveUp = (function() {
            this.tweens.add({
                targets: saws,
                y: '-=300',
                duration: 1600,
                onComplete: moveDown,
            })
        }).bind(this)
        var moveDown = (function() {
            this.tweens.add({
                targets: saws,
                y: '+=300',
                duration: 1600,
                onComplete: moveUp,
            })
        }).bind(this)
        moveUp();
        this.actors.addMultiple(saws);

        // Actors are not affected by gravity
        this.actors.getChildren().forEach(function(actor) {
            if (actor.name !== 'Box') {
                actor.body.allowGravity = false;
            }
        });
    },
});
