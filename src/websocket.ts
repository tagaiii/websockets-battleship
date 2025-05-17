import { WebSocketServer } from 'ws';
import { regHandler } from './handlers';

export const setupWebSocketServer = (port: number) => {
  const wsServer = new WebSocketServer({ port: port });
  wsServer.on('connection', (ws) => {
    console.log('WebSocket connection is established');

    ws.on('message', (data) => {
      const payload = JSON.parse(data.toString());

      switch (payload.type) {
        case 'reg':
          regHandler(ws, payload.data);
      }
    });
  });
};
