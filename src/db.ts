import { User, Room, RoomUser, GameSession } from './types';

class Database {
  private users: User[] = [];
  private rooms: Room[] = [];
  private gameSessions: GameSession[] = [];

  addUser(newUser: User) {
    if (this.users.find((user) => user.name === newUser.name)) return false;
    this.users.push(newUser);
    return true;
  }

  getUserById(userId: string) {
    return this.users.find((user) => user.id === userId);
  }

  removeUser(userId: string) {
    this.users = this.users.filter((user) => user.id !== userId);
    this.rooms = this.rooms.filter(
      (room) => !room.roomUsers.some((user) => user.index === userId)
    );
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
      room.roomUsers.push(user);
      return true;
    }
    return false;
  }

  createGameSession(idGame: string, idPlayer: string) {
    const newGame = { idGame, idPlayer };
    this.gameSessions.push(newGame);
  }
}

export const database = new Database();
