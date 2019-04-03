import { Room, Client, EntityMap, nosync } from "colyseus";

const MAX_PLAYERS_PER_ROOM = 5;
const ROOM_WAIT_TIME = 10;

class Player {
    uid: string;
    name: string;
    index: number;
    constructor(uid: string, name: string, index: number) {
        this.uid = uid;
        this.name = name;
        this.index = index;
    }
}

class State {
    @nosync is_waiting: boolean = true;
    wait_timer: number = ROOM_WAIT_TIME;
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

                this.broadcast('game_start');
            }
        }
    }

    onInit(options: any) {
        console.log("CREATING NEW ROOM");
        this.setState(new State());

        this.setSimulationInterval((delta: number) => this.update(delta / 1000));
    }

    onJoin(client: Client, options: any, auth: boolean) {
        console.log("JOINING ROOM");

        const state = this.state;

        const idx = Object.keys(state.players).length;

        state.players[client.sessionId] = new Player(client.id, `Player NO.${idx}`, idx);

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

        const player = state.players[client.id];

        console.log(`Player [${player.name}] ${message.action}`);
    }

    onLeave(client: Client) {
        const state = this.state;

        // FIXME: should we update player orders?
        const player = state.players[client.id];

        // Remove from state
        delete state.players[client.id];

        console.log(`Player [${player.name}] left!`);
    }
}
