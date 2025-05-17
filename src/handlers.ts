import type { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { Database } from './db';

const database = new Database();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const regHandler = (ws: WebSocket, payload: any) => {
  const id = randomUUID();
  const newUser = {
    id: id,
    name: payload.name,
    password: payload.password,
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
