import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SOCKET_URL as string)) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5000');

let socketInstance: Socket | null = null;

export const getSocket = (token?: string): Socket | null => {
  if (typeof window === 'undefined') return null;

  const authToken = token || localStorage.getItem('highp_token');
  if (!authToken) return null;

  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      auth: { token: authToken },
      query: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000
    });


    socketInstance.on('connect', () => {
      // console.log('[Socket] Connected to server successfully');
    });

    socketInstance.on('disconnect', () => {
      // console.log('[Socket] Disconnected from server');
    });
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
