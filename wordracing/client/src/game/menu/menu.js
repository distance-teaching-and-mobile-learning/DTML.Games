import * as v from 'engine/index';

import { flags, languages } from '../flags';
import { set_lang } from 'game/client';

export default class Menu extends v.Node2D {
    _ready() {
        let is_selected = false;

        const node = this.get_node('flags');

        for (const name in flags) {
            const f = new v.TextureButton()
                .set_texture_normal(`flags/${flags[name]}`)
                .set_name(languages[name])
            node.add_child(f);
            f.connect('pressed', async () => {
                if (is_selected) return;
                is_selected = true;

                console.log(`select lang: ${languages[name]}`)

                this.on_lang_selected(languages[name])

                await v.yield(this.get_tree().create_timer(0.3), 'timeout');

                this.get_tree().change_scene('res://scene/Demo.tscn');
            })
        }
    }

    /**
     * @param {string} name
     */
    on_lang_selected(name) {
        set_lang(name);
    }
}

v.attach_script('res://scene/menu.tscn', Menu);
