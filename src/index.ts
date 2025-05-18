import { httpServer } from './http_server/server';
import { setupWebSocketServer } from './websocket';
import { colors } from './utils';
import dotenv from 'dotenv';

dotenv.config();
const HTTP_PORT = Number(process.env.HTTP_PORT) || 8181;
const WS_PORT = Number(process.env.WS_PORT) || 3000;

console.log(
  colors.green(`WebSocket server is working on the port ${WS_PORT}!`)
);
setupWebSocketServer(WS_PORT);

console.log(colors.green(`Start static http server on the ${HTTP_PORT} port!`));
httpServer.listen(HTTP_PORT);
