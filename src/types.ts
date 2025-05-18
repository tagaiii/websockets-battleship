export interface User {
  id: string;
  name: string;
  password: string;
  wins?: string[];
}

export interface RequestPayload<T> {
  type: string;
  id: number;
  data: T;
}

export interface Room {
  roomId?: string;
  indexRoom?: string;
  roomUsers: RoomUser[];
}

export interface RoomUser {
  name: string;
  index: string;
}

export interface GameSession {
  idGame: string;
  idPlayer: string;
}
