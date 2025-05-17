import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';
import { Database } from './db';

export const setupWebSocketServer = (port: number) => {
  const database = new Database();

  const wsServer = new WebSocketServer({ port: port });
  wsServer.on('connection', (ws) => {
    console.log('WebSocket connection is established');

    ws.on('message', (data) => {
      const payload = JSON.parse(data.toString());

      if (payload.type === 'reg') {
        const id = randomUUID();
        const newUser = {
          id: id,
          name: payload.name,
          password: payload.password,
        };
        const success = database.addUser(newUser);
        if (success) {
          const response = JSON.stringify({
            type: 'reg',
            data: JSON.stringify({
              name: newUser.name,
              index: newUser.id,
              error: false,
              errorText: '',
            }),
            id: 0,
          });

          ws.send(response);
        } else {
          const response = JSON.stringify({
            type: 'reg',
            data: JSON.stringify({
              name: newUser.name,
              index: newUser.id,
              error: true,
              errorText: 'User with this name already exists!',
            }),
            id: 0,
          });
          ws.send(response);
        }
      }
    });
  });
};
