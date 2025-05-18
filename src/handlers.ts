import type { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { database } from './db';
import { RequestPayload, User } from './types';
import { addClient, getClient, getAllClients } from './connections';
import { logger } from './logger';

export const regHandler = (
  ws: WebSocket,
  payload: RequestPayload<Omit<User, 'id'>>
) => {
  const id = randomUUID();
  const userData = JSON.parse(payload.data.toString());
  logger('CLIENT', payload.type, `Player: ${userData.name}`);

  const newUser = {
    id: id,
    name: userData.name,
    password: userData.password,
  };

  const success = database.addUser(newUser);
  if (success) {
    addClient(ws, id);
  }
  const response = JSON.stringify({
    type: 'reg',
    data: JSON.stringify({
      name: success ? newUser.name : '',
      index: success ? newUser.id : '',
      error: !success,
      errorText: success ? '' : 'User with this name already exists!',
    }),
    id: 0,
  });
  logger(
    'SERVER',
    'reg',
    `Player: ${userData.name}` + (success ? ' - success' : ' - failed')
  );
  ws.send(response);
};

export const createRoomHandler = (ws: WebSocket) => {
  const roomId = randomUUID();
  const userId = getClient(ws);
  if (userId) {
    const user = database.getUserById(userId);
    if (user) {
      logger('CLIENT', 'create_room', `Player: ${user.name}`);
      const newRoom = {
        roomId: roomId,
        indexRoom: roomId,
        roomUsers: [{ name: user.name, index: user.id }],
      };
      database.createRoom(newRoom);
      logger('SERVER', 'create_room', `Player: ${user.name} - success`);
    }
  }
};

export const updateRoomsHandler = () => {
  const allClient = getAllClients();
  const rooms = database
    .getRooms()
    .filter((room) => room.roomUsers.length === 1);

  const response = JSON.stringify({
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  });
  allClient.keys().forEach((ws) => ws.send(response));
  logger('SERVER', 'update_room', 'Rooms list is updated');
};
