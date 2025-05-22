// src/store/useGameSocketStore.ts
import { create } from 'zustand'

const SOCKET_URL = 'wss://bingo-master-ts.onrender.com';

type Listener = (event: MessageEvent) => void;

interface GameSocketStore {
  socket: WebSocket | null;
  listeners: Set<Listener>;
  messageQueue: string[];
  isConnected: boolean;
  send: (data: string) => void;
  addListener: (cb: Listener) => void;
  removeListener: (cb: Listener) => void;
  connect: () => void;
  disconnect: () => void;
}

export const useGameSocketStore = create<GameSocketStore>((set, get) => {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  let socket: WebSocket | null = null;
  const listeners: Set<Listener> = new Set();
  const messageQueue: string[] = [];

  const flushQueue = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      while (messageQueue.length > 0) {
        const data = messageQueue.shift();
        if (data) socket.send(data);
      }
    }
  };

  const connect = () => {
    if (socket) return;

    socket = new WebSocket(SOCKET_URL);

    socket.onopen = () => {
      console.log('[ZustandSocket] Connected');
      reconnectAttempts = 0;
      set({ isConnected: true });
      flushQueue();
    };

    socket.onmessage = (event) => {
      listeners.forEach((cb) => cb(event));
    };

    socket.onclose = () => {
      set({ isConnected: false });
      socket = null;

      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
        console.warn(`[ZustandSocket] Reconnecting in ${delay}ms...`);
        setTimeout(() => {
          reconnectAttempts++;
          get().connect();
        }, delay);
      } else {
        console.error('[ZustandSocket] Max reconnection attempts reached.');
      }
    };

    socket.onerror = (event) => {
      console.error('[ZustandSocket] Error:', event);
      socket?.close();
    };

    set({ socket });
  };

  return {
    socket: null,
    listeners,
    messageQueue,
    isConnected: false,

    connect,

    disconnect: () => {
      socket?.close();
      socket = null;
      reconnectAttempts = 0;
      set({ isConnected: false });
    },

    send: (data: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(data);
        console.log(listeners)
      } else {
        console.warn('[ZustandSocket] Socket not open. Queuing message.');
        messageQueue.push(data);
      }
    },

    addListener: (cb: Listener) => {
      listeners.add(cb);
    },

    removeListener: (cb: Listener) => {
      listeners.delete(cb);
    },
  };
});
