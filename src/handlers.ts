import type { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { database } from './db';
import { RequestPayload, Room, User, WinnerData } from './types';
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
    wins: 0,
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

export const updateWinnersHandler = () => {
  const users = database.getUsers();
  const allClients = getAllClients();
  const winnersData: WinnerData[] = [];
  if (users) {
    users.forEach((user) => {
      const winner = { name: user.name, wins: user.wins };
      winnersData.push(winner);
    });
  }
  const response = {
    type: 'update_winners',
    data: JSON.stringify(winnersData),
    id: 0,
  };
  allClients.keys().forEach((ws) => ws.send(JSON.stringify(response)));
  logger('SERVER', 'update_winners', 'Winners table is updated');
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
  logger('SERVER', 'update_room', `Rooms list is updated`);
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
      logger('CLIENT', payload.type, `Player: ${userData.name}`);
      const roomUser = { name: userData.name, index: userData.id };
      if (roomId) {
        database.addUserToRoom(roomId, roomUser);
        logger('SERVER', payload.type, `Player: ${userData.name} - success`);
      }
    }
  }
};

export const createGameHandler = (
  payload: RequestPayload<Required<Pick<Room, 'indexRoom'>>>
) => {
  const roomId = JSON.parse(payload.data.toString()).indexRoom;
  if (roomId) {
    logger(
      'SERVER',
      'create_game',
      `Game session for room ID ${roomId} is created!`
    );
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
            const user = database.getUserById(userId);
            logger(
              'SERVER',
              'create_game',
              `Game started message sent to: ${user?.name}`
            );
          }
        }
      });
    }
  }
};
