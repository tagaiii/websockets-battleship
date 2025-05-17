import { httpServer } from './http_server/server';
import { setupWebSocketServer } from './websocket';
import dotenv from 'dotenv';

dotenv.config();
const HTTP_PORT = Number(process.env.HTTP_PORT) || 8181;
const WS_PORT = Number(process.env.WS_PORT) || 3000;

setupWebSocketServer(WS_PORT);

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);
