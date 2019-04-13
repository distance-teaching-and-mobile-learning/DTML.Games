let the_client = null;
export function set_client(client) {
    the_client = client;
}
export function get_client() {
    return the_client;
}

let the_room = null;
export function set_room(room) {
    the_room = room;
}
export function get_room() {
    return the_room;
}

/** @type {string} */
let the_name = null;
/**
 * @param {string} name
 */
export function set_name(name) {
    the_name = name;
}
export function get_name() {
    return the_name;
}

/** @type {string} */
let the_lang = null;
/**
 * @param {string} lang
 */
export function set_lang(lang) {
    the_lang = lang;
}
export function get_lang() {
    return the_lang;
}
