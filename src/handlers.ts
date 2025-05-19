import type { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { database } from './db';
import {
  PlayerAttackData,
  PlayerShipsData,
  RequestPayload,
  Room,
  User,
  WinnerData,
} from './types';
import {
  addClient,
  getClient,
  getAllClients,
  getClientById,
} from './connections';
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
    const room = database.getRoomById(roomId);
    if (room) {
      const idGame = randomUUID();
      database.createGameSession(idGame, []);
      logger(
        'SERVER',
        'create_game',
        `Game session for room ID ${roomId} is created!`
      );

      if (room.roomUsers.length === 2) {
        room.roomUsers.forEach((user) => {
          database.addUserToGameSession(idGame, user.index);
          const ws = getClientById(user.index);
          ws?.send(
            JSON.stringify({
              type: 'create_game',
              data: JSON.stringify({
                idGame,
                idPlayer: user.index,
              }),
              id: 0,
            })
          );
          logger(
            'SERVER',
            'create_game',
            `Game created message sent to: ${user?.name}`
          );
        });
      }
    }
  }
};

export const startGameHandler = (payload: RequestPayload<PlayerShipsData>) => {
  const data: PlayerShipsData = JSON.parse(payload.data.toString());
  const user = database.getUserById(data.indexPlayer);
  logger('CLIENT', payload.type, `Ships added by: ${user?.name}`);

  const gameSession = database.getGameSessionById(data.gameId);
  database.addUserShips(data.gameId, data.indexPlayer, data.ships);

  if (
    gameSession?.players.every((player) => {
      if (player.ships) {
        return player.ships.length > 0;
      }
    })
  ) {
    gameSession.players.forEach((player) => {
      const ws = getClientById(player.id);
      const response = {
        type: 'start_game',
        data: JSON.stringify({
          ships: player.ships,
          currentPlayerIndex: player.id,
        }),
        id: 0,
      };

      ws?.send(JSON.stringify(response));

      const currUser = database.getUserById(player.id);
      logger(
        'SERVER',
        'start_game',
        `Game started message sent to: ${currUser?.name}`
      );
    });
    playerTurnHandler(payload);
  }
};

export const playerTurnHandler = (
  payload: RequestPayload<PlayerShipsData | PlayerAttackData>
) => {
  const data: PlayerShipsData | PlayerAttackData = JSON.parse(
    payload.data.toString()
  );

  const gameSession = database.getGameSessionById(data.gameId);
  if (gameSession) {
    if (!gameSession?.currentPlayerId) {
      const index = Math.floor(Math.random() * 2) + 1;
      gameSession.currentPlayerId = gameSession.players[index]?.id;
    } else {
      gameSession.currentPlayerId = gameSession.players.find(
        (player) => player.id !== gameSession.currentPlayerId
      )?.id;
    }

    gameSession.players.forEach((player) => {
      const ws = getClientById(player.id);

      const response = {
        type: 'turn',
        data: JSON.stringify({
          currentPlayer: gameSession.currentPlayerId,
        }),
        id: 0,
      };
      ws?.send(JSON.stringify(response));
    });
    if (gameSession.currentPlayerId) {
      const user = database.getUserById(gameSession.currentPlayerId);
      logger('SERVER', 'turn', `Current player is ${user?.name}`);
    }
  }
};
