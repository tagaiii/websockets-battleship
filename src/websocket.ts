import { WebSocketServer } from 'ws';
import { regHandler, createRoomHandler, updateRoomsHandler } from './handlers';
import { getClient, removeClient } from './connections';
import { database } from './db';

export const setupWebSocketServer = (port: number) => {
  const wsServer = new WebSocketServer({ port: port });
  wsServer.on('connection', (ws) => {
    console.log('WebSocket connection is established');

    ws.on('message', (data) => {
      const payload = JSON.parse(data.toString());

      switch (payload.type) {
        case 'reg':
          regHandler(ws, payload);
          updateRoomsHandler();
          break;
        case 'create_room':
          createRoomHandler(ws);
          updateRoomsHandler();
          break;
      }
    });

    ws.on('close', () => {
      const userId = getClient(ws);
      if (userId) {
        const user = database.getUserById(userId);
        database.removeUser(userId);
        removeClient(ws);
        updateRoomsHandler();
        console.log(`User ${user?.name} disconnected!`);
      }
    });
  });
};
