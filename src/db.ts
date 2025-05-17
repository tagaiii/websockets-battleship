import { User } from './types';

export class Database {
  private users: User[] = [];

  addUser(newUser: User) {
    if (this.users.find((user) => user.name === newUser.name)) return false;

    this.users.push(newUser);
    return true;
  }
}
