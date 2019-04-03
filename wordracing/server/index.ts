import * as path from 'path';
import * as express from 'express';
import * as serve_index from 'serve-index';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { monitor } from '@colyseus/monitor';

import { Racing } from "./rooms/racing";

const port = Number(process.env.PORT || 2567);
const app = express();

// Attach WebSocket Server on HTTP Server.
const game_server = new Server({
  server: createServer(app)
});

game_server.register("racing", Racing);

app.use('/', express.static(path.join(__dirname, "static")));
app.use('/', serve_index(path.join(__dirname, "static"), {'icons': true}))

// attach web monitoring panel
// app.use('/colyseus', monitor(game_server));

game_server.onShutdown(function(){
  console.log(`game server is going down.`);
});

game_server.listen(port);
console.log(`Listening on http://localhost:${ port }`);
