import * as v from 'engine/index';

export default class Car extends v.Sprite {
    constructor() {
        super();

        this.pos = 0;
        this.last_accel_time = 0;
    }

    /**
     * @param {number} now
     */
    accelerate(now) {
        this.pos += 1;
        this.last_accel_time = now;
    }

    /**
     * @param {number} now
     */
    get_time_since_last_accel(now) {
        return now - this.last_accel_time;
    }
}

v.attach_script('res://scene/car.tscn', Car);
