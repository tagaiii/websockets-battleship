import type WebSocket from 'ws';

const clients = new Map<WebSocket, string>();

export const addClient = (ws: WebSocket, userId: string) => {
  clients.set(ws, userId);
};

export const getClient = (ws: WebSocket) => {
  return clients.get(ws);
};

export const removeClient = (ws: WebSocket) => {
  clients.delete(ws);
};
