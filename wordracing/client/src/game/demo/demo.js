import * as v from 'engine/index';
import * as Colyseus from 'colyseus.js';

import { set_room, set_client, set_name, get_name } from 'game/client';

import Input from './input';

const host = window.document.location.host.replace(/:.*/, '');
// const client = new Colyseus.Client(location.protocol.replace("http", "ws") + host + (location.port ? ':' + location.port : ''));

const client = new Colyseus.Client('ws://localhost:2567');

client.onOpen.add(() => {
    set_client(client);
    console.log("Server connected");
});

export default class Demo extends v.Node2D {
    constructor() {
        super();

        this.is_trans = false;
    }
    _ready() {
        const anim = /** @type {v.AnimationPlayer} */(this.get_node('anim'));
        anim.play('idle');

        const input = /** @type {Input} */(this.get_node('input'));
        input.connect('changed', (value) => {
            set_name(value);
        })

        const rename_button = /** @type {v.TextureButton} */(this.get_node('input/TextureButton'));
        rename_button.connect('pressed', () => {
            if (this.is_trans) return;

            set_name(input.input_elem.value);
        })

        const join_button = /** @type {v.TextureButton} */(this.get_node('start_game'));
        join_button.connect('pressed', () => {
            if (this.is_trans) return;

            const name = get_name();
            if (name && typeof (name) === 'string') {
                input.clear()
                input.hide();

                this.join_a_room();
            }
        })
    }

    async join_a_room() {
        this.is_trans = true;

        const input = /** @type {Input} */(this.get_node('input'));
        if (input.input_elem.value && typeof(input.input_elem.value) === 'string') {
            set_name(input.input_elem.value);
        }

        set_room(client.join('racing'))
        this.get_tree().change_scene('res://scene/racing.tscn');
    }
}

v.attach_script('res://scene/Demo.tscn', Demo);
