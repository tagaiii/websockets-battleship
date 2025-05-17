import type { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { database } from './db';
import { RequestPayload, User } from './types';
import { addClient, getClient } from './connections';

export const regHandler = (
  ws: WebSocket,
  payload: RequestPayload<Omit<User, 'id'>>
) => {
  const id = randomUUID();
  const userData = JSON.parse(payload.data.toString());

  const newUser = {
    id: id,
    name: userData.name,
    password: userData.password,
  };

  const success = database.addUser(newUser);
  if (success) {
    addClient(ws, id);
    const response = JSON.stringify({
      type: 'reg',
      data: JSON.stringify({
        name: newUser.name,
        index: newUser.id,
        error: !success,
        errorText: success ? '' : 'User with this name already exists!',
      }),
      id: 0,
    });

    ws.send(response);
  }
};

export const createRoomHandler = (ws: WebSocket) => {
  const roomId = randomUUID();
  const userId = getClient(ws);
  if (userId) {
    const user = database.getUserById(userId);
    if (user) {
      const newRoom = {
        roomId: roomId,
        indexRoom: roomId,
        roomUsers: [{ name: user.name, index: user.id }],
      };
      database.createRoom(newRoom);
    }
  }
};

export const updateRoomsHandler = (ws: WebSocket) => {
  const rooms = database
    .getRooms()
    .filter((room) => room.roomUsers.length === 1);
  const response = JSON.stringify({
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  });

  ws.send(response);
};
