import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const socket = socketRef.current;

  const createRoom = useCallback((playerName: string, playerCount: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('createRoom', { playerName, playerCount });
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('joinRoom', { roomId, playerName });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('leaveRoom', { roomId });
    setRoomId(null);
  }, []);

  const startGame = useCallback((roomId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('startGame', { roomId });
  }, []);

  const playTiles = useCallback((roomId: string, tiles: any[]) => {
    if (!socketRef.current) return;
    socketRef.current.emit('playTiles', { roomId, tiles });
  }, []);

  const pass = useCallback((roomId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('pass', { roomId });
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, callback);
  }, []);

  return {
    isConnected,
    roomId,
    setRoomId,
    socket: socketRef.current,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    playTiles,
    pass,
    on,
    off
  };
}
