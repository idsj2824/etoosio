import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://etoosio-server.onrender.com';

// Singleton socket instance to share connection across screens
let socketInstance: Socket | null = null;

function getSocket() {
  if (!socketInstance) {
    console.log('Initializing singleton socket connection to:', SERVER_URL);
    socketInstance = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    setIsConnected(socket.connected);

    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Connected to server');
    };

    const onConnectError = (error: any) => {
      console.error('Connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const createRoom = useCallback((playerName: string, playerCount: number) => {
    console.log('Creating room:', playerName, playerCount);
    const socket = getSocket();
    socket.emit('createRoom', { playerName, playerCount });
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    const socket = getSocket();
    socket.emit('joinRoom', { roomId, playerName });
  }, []);

  const rejoinRoom = useCallback((roomId: string, playerName: string) => {
    const socket = getSocket();
    socket.emit('rejoinRoom', { roomId, playerName });
  }, []);

  const requestGameState = useCallback((roomId: string) => {
    const socket = getSocket();
    socket.emit('requestGameState', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    const socket = getSocket();
    socket.emit('leaveRoom', { roomId });
    setRoomId(null);
  }, []);

  const startGame = useCallback((roomId: string) => {
    const socket = getSocket();
    socket.emit('startGame', { roomId });
  }, []);

  const playTiles = useCallback((roomId: string, tiles: any[]) => {
    const socket = getSocket();
    socket.emit('playTiles', { roomId, tiles });
  }, []);

  const pass = useCallback((roomId: string) => {
    const socket = getSocket();
    socket.emit('pass', { roomId });
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    const socket = getSocket();
    socket.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    const socket = getSocket();
    socket.off(event, callback);
  }, []);

  return {
    isConnected,
    connectionError,
    roomId,
    setRoomId,
    socket: getSocket(),
    createRoom,
    joinRoom,
    rejoinRoom,
    requestGameState,
    leaveRoom,
    startGame,
    playTiles,
    pass,
    on,
    off
  };
}
