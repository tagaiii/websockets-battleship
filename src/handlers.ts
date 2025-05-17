import type { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { Database } from './db';
import { RequestPayload, User } from './types';

const database = new Database();

export const regHandler = (
  ws: WebSocket,
  payload: RequestPayload<Omit<User, 'id'>>
) => {
  const id = randomUUID();
  const newUser = {
    id: id,
    name: payload.data.name,
    password: payload.data.password,
  };
  const success = database.addUser(newUser);
  if (success) {
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
