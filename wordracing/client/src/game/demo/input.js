import * as v from 'engine/index';

export default class Input extends v.Node2D {
    constructor() {
        super();

        this.width = 280;
        this.height = 40;
        this.show_button = true;

        this.input_elem = null;
        this.go_button = null;

        this.change_handler = this._on_input_change.bind(this);
    }
    _load_data(data) {
        super._load_data(data);

        if (data.width !== undefined) this.width = data.width;
        if (data.height !== undefined) this.height = data.height;
        if (data.show_button !== undefined) this.show_button = data.show_button;

        return this;
    }

    _enter_tree() {
        this.input_elem = /** @type {HTMLInputElement} */(document.getElementById('word_input'));
        this.input_elem.addEventListener('change', this.change_handler);

        this.set_process(true);
    }
    _exit_tree() {
        this.input_elem.removeEventListener('change', this.change_handler);
    }
    _ready() {
        this.go_button = /** @type {v.TextureButton} */(this.get_node('go'));
        this.go_button.connect('pressed', () => {
            this.emit_signal('changed', this.input_elem.value);
        });

        this.go_button.visible = this.show_button;
        if (this.visible) {
            this.show()
        }
    }

    /**
     * @param {number} delta
     */
    _process(delta) {
        if (this.visible) {
            this.redraw();
        }
    }

    show() {
        this.visible = true;

        this.redraw();
        this.input_elem.style.display = 'block';
        this.input_elem.focus();
    }
    hide() {
        this.visible = false;
        this.input_elem.style.display = 'none';
    }
    clear(focus = true) {
        this.input_elem.value = '';
        focus && this.input_elem.focus();
    }
    focus() {
        this.input_elem.focus();
    }

    redraw() {
        const rect = this.get_tree().view.getBoundingClientRect();
        const game_scale = rect.width / this.get_tree().viewport_rect.size.width;

        this.input_elem.style.left = `${rect.left + this.get_global_position().x * game_scale}px`;
        this.input_elem.style.top = `${rect.top + this.get_global_position().y * game_scale}px`;
        this.input_elem.style.width = `${(this.width * game_scale) | 0}px`;
        this.input_elem.style.height = `${(this.height * game_scale) | 0}px`;
        this.input_elem.style.fontSize = `${((this.height * 0.8) * game_scale) | 0}px`;
    }

    /**
     * @param {Event} e
     */
    _on_input_change(e) {
        this.emit_signal('changed', /** @type {HTMLInputElement} */(e.target).value);
    }
}

v.attach_script('res://scene/input.tscn', Input);
