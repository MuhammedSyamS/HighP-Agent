import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SOCKET_URL as string)) || '';
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost && (!envUrl || envUrl.includes('127.0.0.1') || envUrl.includes('localhost'))) {
      return 'https://highpbackend.vercel.app';
    }
  }
  return envUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5000');
};

const SOCKET_URL = getSocketUrl();

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
