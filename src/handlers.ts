import type { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { database } from './db';
import { RequestPayload, Room, User } from './types';
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

export const addToRoomHandler = (
  ws: WebSocket,
  payload: RequestPayload<Required<Pick<Room, 'indexRoom'>>>
) => {
  const roomId = JSON.parse(payload.data.toString()).indexRoom;
  const userId = getClient(ws);
  if (userId) {
    const userData = database.getUserById(userId);
    if (userData) {
      const roomUser = { name: userData.name, index: userData.id };
      if (roomId) {
        database.addUserToRoom(roomId, roomUser);
      }
    }
  }
};

export const createGameHandler = (
  payload: RequestPayload<Required<Pick<Room, 'indexRoom'>>>
) => {
  const roomId = JSON.parse(payload.data.toString()).indexRoom;
  if (roomId) {
    const room = database.getRoomById(roomId);
    if (room) {
      const allClients = getAllClients();
      const idGame = randomUUID();
      database.createGameSession(idGame, []);
      allClients.entries().forEach(([ws, userId]) => {
        if (room.roomUsers.find((user) => user.index === userId)) {
          database.addUserToGameSession(idGame, userId);
          if (room.roomUsers.length === 2) {
            ws.send(
              JSON.stringify({
                type: 'create_game',
                data: JSON.stringify({
                  idGame,
                  idPlayer: userId,
                }),
                id: 0,
              })
            );
          }
        }
      });
    }
  }
};
