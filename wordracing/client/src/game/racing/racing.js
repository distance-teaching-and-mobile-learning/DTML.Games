import * as v from 'engine/index';
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

const words = [
    'knowledge',
    'number',
]
const answers = {
    'knowledge': '知识',
    'number': '数字',
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

        this.voice = null;

        // ref to nodes
        this.self_car = null;
        /** @type {Car[]} */
        this.other_cars = [];

        this.self_mark = null;

        this.wait_view = null;
        this.wait_timer = null;

        this.dimmer = null;

        this.target_label = null;
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
        this.self_mark = /** @type {v.Label} */(this.get_node('track/self_mark'));
        this.self_mark.visible = false;
        this.other_cars = /** @type {Car[]} */(this.get_node('track/cars').children.slice());

        // ui
        this.dimmer = this.get_node('dimmer');
        this.wait_view = this.get_node('wait_view');
        this.wait_timer = /** @type {v.Label} */(this.get_node('wait_view/sec'));

        this.target_label = /** @type {v.Label} */(this.get_node('top/TextureRect/Label'));
        this.target_label.set_text('');

        this.input = /** @type {Input} */(this.get_node('bottom/input'));
        this.input.connect('changed', this.submit_answer, this);

        // service
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };

        // load data from server
        this.fetch_next_set();

        // network
        this.setup_sync(get_room());
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

        this.next_word(true);
        this.input.show();

        this.is_racing = true;
        this.self_car.last_accel_time = this.current_time;
    }

    async fetch_next_set() {
        this.words = words;
        this.curr_level++;
        this.curr_index = -1;
    }
    /**
     * @param {boolean} should_say
     */
    next_word(should_say) {
        this.curr_index += 1;

        const word = this.words[this.curr_index];
        this.target_label.set_text(`${word}`);

        this.can_control = true;

        if (should_say) {
            this.speak(word);
        }
    }

    /**
     * @param {string} answer
     */
    async submit_answer(answer) {
        if (!this.can_control) {
            return;
        }

        const word = this.words[this.curr_index];
        if (answers[word] && answers[word] === answer) {
            this.can_control = false;

            this.input.clear();

            this.self_car.accelerate(this.current_time);
            this.room.send({
                action: 'accelerate',
                time: this.current_time,
            })

            const tween = this.target_label.tweens.create()
                .interpolate_property(this.target_label, 'rect_scale', this.target_label.rect_scale, new v.Vector2(0, 0), 0.1, 'Quadratic.Out', 0)
                .interpolate_property(this.target_label, 'rect_scale', new v.Vector2(0, 0), this.target_label.rect_scale, 0.1, 'Back.Out', 0.1)
                .start()

            await v.yield(this.get_tree().create_timer(0.1), 'timeout');
            this.next_word(true);
            await v.yield(tween, 'tween_all_completed')

            this.input.focus();
            this.can_control = true;
        }
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

                    this.self_mark.rect_position.y = this.self_car.y - (170 - 142);
                    this.self_mark.visible = true;
                } else {
                    const cars = /** @type {Car[]} */(this.get_node('track/cars').children);
                    for (const c of cars) {
                        if (c.name === `${player.index + 1}`) {
                            c.uid = player.uid;
                            c.player_name = player.name;
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

        room.onMessage.add((msg) => {
            switch (msg) {
                case 'game_start': {
                    this.start_racing();
                } break;
            }
        })

        room.onStateChange.add((/** @type {State} */data) => {
            for (const k in data.players) {
                const player = data.players[k];
                if (player.uid !== this.session_id) {
                    for (const car of this.other_cars) {
                        if (car.uid === player.uid) {
                            car.pos = player.pos;
                            car.last_accel_time = player.last_accel_time;
                        }
                    }
                }
            }
        });
    }
}

v.attach_script('res://scene/racing.tscn', Racing);
