import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env['VITE_SOCKET_URL'] ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function createSocket(token: string, role: 'driver' | 'admin'): Socket {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token, role },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    forceNew: true,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type { Socket };
