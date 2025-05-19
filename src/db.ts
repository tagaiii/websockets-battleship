import {
  User,
  Room,
  RoomUser,
  GameSession,
  GameSessionUser,
  Ship,
} from './types';

class Database {
  private users: User[] = [];
  private rooms: Room[] = [];
  private gameSessions: GameSession[] = [];

  addUser(newUser: User) {
    if (this.users.find((user) => user.name === newUser.name)) return false;
    this.users.push(newUser);
    return true;
  }

  getUsers() {
    return this.users;
  }

  getUserById(userId: string) {
    return this.users.find((user) => user.id === userId);
  }

  removeUser(userId: string) {
    this.users = this.users.filter((user) => user.id !== userId);
    const room = this.rooms.find((r) =>
      r.roomUsers.find((user) => user.index === userId)
    );
    if (room) {
      room.roomUsers = room.roomUsers.filter((user) => user.index !== userId);
    }

    const gameSession = this.gameSessions.find((gs) =>
      gs.players.find((player) => player.id === userId)
    );
    if (gameSession) {
      gameSession.players = gameSession.players.filter(
        (player) => player.id !== userId
      );
    }
  }

  createRoom(newRoom: Room) {
    this.rooms.push(newRoom);
  }

  getRooms() {
    return this.rooms;
  }

  getRoomById(roomId: string) {
    return this.rooms.find((room) => room.roomId === roomId);
  }

  addUserToRoom(roomId: string, user: RoomUser) {
    const room = this.rooms.find((r) => r.roomId === roomId);
    if (room) {
      if (!room.roomUsers.find((u) => u.index === user.index)) {
        room.roomUsers.push(user);
        return true;
      }
    }
    return false;
  }

  createGameSession(idGame: string, players: GameSessionUser[]) {
    const newGame = { idGame, players };
    this.gameSessions.push(newGame);
  }

  getGameSessionById(idGame: string) {
    return this.gameSessions.find((gs) => gs.idGame === idGame);
  }

  addUserToGameSession(idGame: string, userId: string) {
    const gameSession = this.gameSessions.find((gs) => gs.idGame === idGame);
    const player = { id: userId, ships: [] };
    if (gameSession) {
      gameSession.players.push(player);
    }
  }

  addUserShips(idGame: string, userId: string, ships: Ship[]) {
    const gameSession = this.gameSessions.find((gs) => gs.idGame === idGame);
    const user = gameSession?.players.find((player) => player.id === userId);
    user?.ships?.push(...ships);
    console.log('db', user);
    console.log('gs', gameSession);
  }
}

export const database = new Database();
