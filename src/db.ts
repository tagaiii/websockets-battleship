import { User, Room } from './types';

class Database {
  private users: User[] = [];
  private rooms: Room[] = [];

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
}

export const database = new Database();
