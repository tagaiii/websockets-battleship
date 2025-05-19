export interface User {
  id: string;
  name: string;
  password: string;
  wins: number;
}

export interface WinnerData {
  name: string;
  wins: number;
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
  players: GameSessionUser[];
}

export interface GameSessionUser {
  id: string;
  ships?: Ship[];
}

export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface PlayerShipsData {
  gameId: string;
  ships: Ship[];
  indexPlayer: string;
}
