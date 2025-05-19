// src/hooks/useGameSocket.ts
import { useEffect, useCallback } from 'react';
import GameSocket from '../socket/GameSocket';
import { MessageData } from '../Types';

interface GameSocketHook {
  send: (data: MessageData) => void;
  isConnected: () => boolean;
  addListener: (callback: (event: MessageEvent) => void) => void;
  removeListener: (callback: (event: MessageEvent) => void) => void;
}

export const useGameSocket = (): GameSocketHook => {
  const socket = GameSocket.getInstance();

  const addListener = useCallback(
    (callback: (event: MessageEvent) => void) => {
      socket.addListener(callback);
    },
    [socket]
  );

  const removeListener = useCallback(
    (callback: (event: MessageEvent) => void) => {
      socket.removeListener(callback);
    },
    [socket]
  );

  const send = useCallback(
    (messageData : MessageData) => {
      socket.send(JSON.stringify(messageData));
    },
    [socket]
  );

  const isConnected = useCallback(() => {
    return socket.isConnected();
  }, [socket]);

  // Optional: Automatically clean up listeners if the component unmounts
  useEffect(() => {
    return () => {
      // If you want to clean up all listeners for this component, you can do so here.
      // However, since listeners are managed explicitly, this is optional.
    };
  }, []);

  return {
    send,
    isConnected,
    addListener,
    removeListener,
  };
};