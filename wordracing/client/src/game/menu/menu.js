import * as v from 'engine/index';

import { flags, languages } from '../flags';

export default class Menu extends v.Node2D {
    _ready() {
        const node = this.get_node('flags');

        for (const name in flags) {
            const f = node.add_child(new v.TextureButton())
                .set_texture_normal(`flags/${flags[name]}`)
                .set_name(languages[name])
            f.connect('pressed', () => this.on_lang_selected(languages[name]))
        }
    }

    /**
     * @param {string} name
     */
    on_lang_selected(name) {
        console.log(`choose ${name}`)
    }
}

v.attach_script('res://scene/menu.tscn', Menu);
