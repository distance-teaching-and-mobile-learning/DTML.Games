import { Room, Client, EntityMap, nosync } from "colyseus";

const MAX_PLAYERS_PER_ROOM = 5;
const ROOM_WAIT_TIME = 10;
const GAME_LENGTH = 1 * 60;

class Player {
    uid: string;
    name: string;
    index: number;
    pos: number;
    last_accel_time: number;
    constructor(uid: string, name: string, index: number) {
        this.uid = uid;
        this.name = name;
        this.index = index;
        this.pos = 0;
        this.last_accel_time = 0;
    }
}

class State {
    @nosync is_waiting: boolean = true;
    @nosync is_timeover: boolean = false;
    wait_timer: number = ROOM_WAIT_TIME;
    current_time: number;
    rest_time: number = GAME_LENGTH;
    players: EntityMap<Player> = {};
}

export class Racing extends Room<State> {
    maxClients = MAX_PLAYERS_PER_ROOM;

    update(delta: number) {
        const state = this.state;
        if (state.is_waiting) {
            state.wait_timer -= delta;
            if (state.wait_timer < 0) {
                state.wait_timer = 0;
                state.is_waiting = false;

                state.current_time = 0;

                // create bots for cars without player
                const player_count : number = Object.keys(state.players).length;
                if (player_count < MAX_PLAYERS_PER_ROOM) {
                    for (let i = player_count; i < MAX_PLAYERS_PER_ROOM; i++) {
                        // TODO: real uuid
                        const id = (Math.random() * 10000000).toString().substr(0, 7);
                        const player = new Player(id, '[Bot]', i);
                        state.players[id] = player;

                        console.log(`Bot [${id}] joined!`);
                    }
                }

                this.broadcast('game_start');
            }
        } else {
            state.current_time += delta;

            if (!state.is_timeover) {
                state.rest_time -= delta;
                if (state.rest_time < 0) {
                    state.rest_time = 0;
                    state.is_timeover = true;

                    this.broadcast('time_over');
                }
            }
        }
    }

    onInit(options: any) {
        console.log("CREATING NEW ROOM");
        this.setState(new State());

        this.setSimulationInterval((delta: number) => this.update(delta / 1000));
    }

    onJoin(client: Client, options: any, auth: boolean) {
        const state = this.state;

        const idx = Object.keys(state.players).length;
        const player = new Player(client.id, options.name, idx);
        state.players[client.sessionId] = player;

        console.log(`Player [${player.name}] joined!`);

        this.broadcast('new_join', { afterNextPatch: true });
    }

    requestJoin(options: any, isNewRoom: boolean) {
        // Do not allow join if game is already started
        if (!this.state.is_waiting) {
            return false;
        }

        // Prioritize rooms with more players
        return 1 - (this.clients.length / MAX_PLAYERS_PER_ROOM);
    }

    onMessage(client: Client, message: any) {
        const state = this.state;

        const player = state.players[client.sessionId];
        switch (message.action) {
            case 'accelerate': {
                player.pos += 1;
                player.last_accel_time = message.time;
                console.log(`player[${player.name}.accelerate]`)
            } break;
        }
    }

    onLeave(client: Client) {
        const state = this.state;

        // FIXME: should we update player orders?
        const player = state.players[client.sessionId];

        // Remove from state
        delete state.players[client.sessionId];

        console.log(`Player [${player.name}] left!`);
    }
}
