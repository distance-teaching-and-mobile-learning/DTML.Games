import * as v from 'engine/index';

import { dtml } from 'dtml-sdk';

import Input from 'game/demo/input';
import Car from './car';
import { get_room, get_client, get_name } from 'game/client';

class Player {
    /**
     * @param {string} uid
     * @param {string} name
     * @param {number} index
     */
    constructor(uid, name, index) {
        this.uid = uid;
        this.name = name;
        this.index = index;
        this.pos = 0;
        this.last_accel_time = 0;
    }
}

class State {
    constructor() {
        /** @type {Object<string, Player>} */
        this.players = {};
        this.current_time = 0;
    }
}

const DIST_PER_RACE_UNIT = 200;
const ACCELERATE_TIME = 4;
const BASE_SPEED = 130;
const MAX_SPEED = 150;

export default class Racing extends v.Node2D {
    constructor() {
        super();

        // config
        this.lang_code = 'zh';

        // state
        this.curr_level = 0;
        this.curr_index = 0;

        this.complexity = 0;

        /** @type {string[]} */
        this.words = [];

        this.can_control = true;
        this.current_time = 0;
        this.is_racing = false;
        this.is_time_out = false;

        this.voice = null;

        // ref to nodes
        this.self_car = null;
        /** @type {Car[]} */
        this.other_cars = [];

        this.time_label = null;
        this.wait_view = null;
        this.wait_timer = null;

        this.dimmer = null;

        this.target_label = null;
        this.rank_label = null;

        this.input = null;

        // network
        this.session_id = '';
        this.room = null;
    }
    async _ready() {
        this.set_process(true);

        // background
        this.road = this.get_node('track/ground').add_child(new v.TilingSprite('road', 800, 358))
            .set_anchor(0, 0)

        // car
        this.other_cars = /** @type {Car[]} */(this.get_node('track/cars').children.slice());
        for (const car of this.other_cars) {
            car.named_children.get('label').visible = false;
        }

        // ui
        this.dimmer = this.get_node('dimmer');
        this.wait_view = this.get_node('wait_view');
        this.wait_timer = /** @type {v.Label} */(this.get_node('wait_view/sec'));
        this.wait_view.visible = true;
        this.dimmer.visible = true;

        this.time_label = /** @type {v.Label} */(this.get_node('top/time'));

        this.rank_label = /** @type {v.Label} */(this.get_node('bottom/rank/label'));
        this.rank_label.set_text('1st');

        this.target_label = /** @type {v.Label} */(this.get_node('top/TextureRect/Label'));
        this.target_label.set_text('');

        this.input = /** @type {Input} */(this.get_node('bottom/input'));
        this.input.connect('changed', this.submit_answer, this);

        // service
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };

        // network
        this.setup_sync(get_room());

        // load data from server
        await this.fetch_next_set();
    }
    /**
     * @param {number} delta
     */
    _process(delta) {
        // update background scrolling
        if (this.is_racing) {
            this.road.tile_position.x -= this.get_car_velocity(this.self_car) * delta;

            // update state of other cars
            for (const car of this.other_cars) {
                this.update_car_position(car);
            }
        }
    }

    async start_racing() {
        this.wait_view.visible = false;
        this.dimmer.visible = false;

        await this.next_word(true);
        this.input.show();

        this.is_racing = true;
        this.self_car.last_accel_time = this.current_time;
    }
    time_over() {
        this.is_racing = false;
        this.time_label.set_text('Time Over');

        this.dimmer.visible = true;

        // TODO: show rank view
    }

    async fetch_next_set() {
        this.curr_level++;
        this.curr_index = -1

        dtml.getWords(this.curr_level, (data) => {
            this.complexity = data.complexity;
            this.words = data.words;

            this.emit_signal('words_data_loaded');
        }, this)

        await v.yield(this, 'words_data_loaded');
    }
    /**
     * @param {boolean} should_say
     */
    async next_word(should_say) {
        this.curr_index += 1;

        if (this.curr_index < this.words.length) {
            const word = this.words[this.curr_index];
            this.target_label.set_text(`${word}`);

            this.can_control = true;

            if (should_say) {
                this.speak(word);
            }
        } else {
            // fetch more words since the game is not over yet
            await this.fetch_next_set();
        }
    }

    /**
     * @param {string} answer
     */
    async submit_answer(answer) {
        if (!this.can_control) {
            return;
        }

        this.can_control = false;

        this.input.clear();
        this.input.hide();

        const word = this.words[this.curr_index];

        fetch(`https://dtml.org/api/GameService/CheckWord?source=${word}&guess=${answer}&lan=${this.lang_code}`, {
            method: 'get',
            credentials: 'same-origin',
        }).catch((err) => {
            console.log('err', err);

            this.input.show();
            this.input.focus();
            this.can_control = true;
        }).then((res) => res && res.json()).then(async (data) => {
            if (data.isCorrect) {
                this.self_car.accelerate(this.current_time);
                this.room.send({
                    action: 'accelerate',
                    time: this.current_time,
                })

                await this.next_word(true);
            }

            this.input.show();
            this.input.focus();
            this.can_control = true;
        });
    }

    /**
     * @param {Car} car
     */
    update_car_position(car) {
        car.x = this.get_car_position(car) - this.get_car_position(this.self_car) + this.self_car.x;
    }

    /**
     * @param {Car} car
     */
    get_car_position(car) {
        const base_pos = (car.pos - 1) * DIST_PER_RACE_UNIT;
        const accel_offset = this.get_dist_by_accel_time(car.get_time_since_last_accel(this.current_time));
        return base_pos + accel_offset;
    }
    /**
     * @param {Car} car
     */
    get_car_velocity(car) {
        // accel -> keep -> decel
        const accel_time = car.get_time_since_last_accel(this.current_time);
        if (accel_time < ACCELERATE_TIME / 3) {
            return BASE_SPEED + MAX_SPEED * (accel_time / (ACCELERATE_TIME / 3));
        } else if (accel_time > ACCELERATE_TIME / 3 && accel_time < ACCELERATE_TIME / 3 * 2) {
            return BASE_SPEED + MAX_SPEED * (1 - (accel_time - ACCELERATE_TIME / 3 * 2) / (ACCELERATE_TIME / 3));
        } else {
            return BASE_SPEED;
        }
    }
    /**
     * @param {number} time
     */
    get_dist_by_accel_time(time) {
        if (time > ACCELERATE_TIME) {
            return DIST_PER_RACE_UNIT;
        }

        return DIST_PER_RACE_UNIT * (time / ACCELERATE_TIME);
    }

    /**
     * @param {string} word
     */
    speak(word) {
        const voice = window.speechSynthesis.getVoices()[0]
        if (voice) {
            const msg = new SpeechSynthesisUtterance();

            msg.voice = voice;
            msg.volume = 1;
            msg.rate = 1;
            msg.text = word;
            msg.lang = 'en-US';

            window.speechSynthesis.speak(msg);
        }
    }

    setup_sync(room) {
        const client = get_client();
        this.room = room;

        this.session_id = client.id;
        room.listen("players/:id", (change) => {
            if (change.operation === 'add') {
                /** @type {Player} */
                const player = change.value;

                // Fetch self state from server
                if (player.uid === this.session_id) {
                    player.name = get_name();

                    this.self_car = /** @type {Car} */(this.get_node(`track/cars/${player.index + 1}`));
                    this.self_car.uid = player.uid;
                    for (let i = 0; i < this.other_cars.length; i++) {
                        if (this.other_cars[i] === this.self_car) {
                            v.remove_items(this.other_cars, i, 1);
                            break;
                        }
                    }
                    const label = /** @type {v.Label} */(this.self_car.named_children.get('label'));
                    label.self_modulate.set(1, 0, 0, 1);
                    label.set_text(`(You) ->`).set_visible(true)
                } else {
                    const cars = /** @type {Car[]} */(this.get_node('track/cars').children);
                    for (const c of cars) {
                        if (c.name === `${player.index + 1}`) {
                            c.uid = player.uid;
                            c.player_name = player.name;
                            const label = /** @type {v.Label} */(c.named_children.get('label'));
                            label.set_text(`${player.name} ->`).set_visible(true)
                        }
                    }
                }
            }
        })
        room.listen('wait_timer', (change) => {
            const time = change.value;

            if (time > 0) {
                this.wait_timer.set_text(`${Math.floor(time)}s`)
            }
        })
        room.listen('current_time', (change) => {
            this.current_time = change.value;
        })
        room.listen('rest_time', (change) => {
            if (!this.is_time_out) {
                const time = change.value;
                const min = Math.floor(time / 60);
                const sec = Math.floor(time % 60);
                this.time_label.set_text(`Time: ${pad(min)}:${pad(sec)}`);
            }
        })

        room.onMessage.add((msg) => {
            switch (msg) {
                case 'game_start': {
                    this.start_racing();
                } break;
                case 'timeover': {
                    this.time_over();
                } break;
            }
        })

        room.onStateChange.add((/** @type {State} */data) => {
            /** @type {Player[]} */
            const players = [];
            for (const k in data.players) {
                const player = data.players[k];
                players.push(player);

                if (player.uid !== this.session_id) {
                    for (const car of this.other_cars) {
                        if (car.uid === player.uid) {
                            car.pos = player.pos;
                            car.last_accel_time = player.last_accel_time;

                            // in case bot name is not displayed
                            /** @type {v.Label} */(car.named_children.get('label'))
                                .set_text(`${player.name} ->`)
                                .set_visible(true)
                        }
                    }
                }
            }

            // update rank info
            players.sort((a, b) => {
                if (a.pos !== b.pos) {
                    return b.pos - a.pos;
                } else {
                    return b.last_accel_time - a.last_accel_time;
                }
            })

            for (let i = 0; i < players.length; i++) {
                if (players[i].uid === this.session_id) {
                    this.rank_label.set_text(rank_text(i + 1))
                }
            }
        });
    }
}

/**
 * @param {number} number
 */
function pad(number) {
    if (number < 10) {
        return `0${number}`
    } else {
        return `${number}`
    }
}

function rank_text(num) {
    switch (num) {
        case 1: return '1st';
        case 2: return '2nd';
        case 3: return '3rd';
        default: return `${num}th`;
    }
}

v.attach_script('res://scene/racing.tscn', Racing);
