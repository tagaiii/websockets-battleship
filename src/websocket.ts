import { WebSocketServer } from 'ws';
import {
  regHandler,
  createRoomHandler,
  updateRoomsHandler,
  addToRoomHandler,
  createGameHandler,
  updateWinnersHandler,
  startGameHandler,
  // playerTurnHandler,
} from './handlers';
import { getClient, removeClient } from './connections';
import { database } from './db';
import { colors } from './utils';

export const setupWebSocketServer = (port: number) => {
  const wsServer = new WebSocketServer({ port: port });
  wsServer.on('connection', (ws) => {
    console.log(colors.red('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
    console.log('New WebSocket connection is established');
    console.log(colors.red('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));

    ws.on('message', (data) => {
      const payload = JSON.parse(data.toString());

      switch (payload.type) {
        case 'reg':
          regHandler(ws, payload);
          updateRoomsHandler();
          updateWinnersHandler();
          break;
        case 'create_room':
          createRoomHandler(ws);
          updateRoomsHandler();
          break;
        case 'add_user_to_room':
          addToRoomHandler(ws, payload);
          createGameHandler(payload);
          updateRoomsHandler();
          break;
        case 'add_ships':
          startGameHandler(payload);
          // playerTurnHandler(payload);
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
        console.log(colors.red(`User ${user?.name} disconnected!`));
      }
    });
  });
};
