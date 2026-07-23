import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import express from 'express';
import { evaluateCombination } from '../game/combination';
import { canPlayCombination } from '../game/playableMoves';

// Helper function to evaluate playStatus logic used in OnlineGameBoard
function getOnlinePlayStatus(
  isMyTurn: boolean,
  selectedTileIds: string[],
  myHand: any[],
  currentCombination: any | null,
  isNewLead: boolean,
  playerCount: number
): "idle" | "invalid" | "tooWeak" | "ready" | "mustPlay" {
  if (!isMyTurn) return "idle";

  const selected = myHand.filter(t => selectedTileIds.includes(t.id));

  if (selected.length === 0) {
    return isNewLead ? "mustPlay" : "idle";
  }

  if (selected.length === 4) return "invalid";

  const evaluated = evaluateCombination(selected, playerCount);
  if (evaluated.type === "INVALID") return "invalid";

  if (
    currentCombination &&
    !canPlayCombination(selected, currentCombination, playerCount)
  ) {
    return "tooWeak";
  }

  return "ready";
}

describe('Online Game Play & Button State Test', () => {
  let ioServer: Server;
  let httpServer: any;
  let client1: ClientSocket;
  let client2: ClientSocket;
  let port: number;

  beforeAll(async () => {
    const app = express();
    httpServer = createServer(app);
    ioServer = new Server(httpServer);

    // Dynamic port allocation
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as any).port;
        resolve();
      });
    });

    // Mirror server handlers from server.js
    const RANKS = ["EMPLOYEE", "ASSISTANT_MANAGER", "MANAGER", "DIRECTOR"];
    function createDeck() {
      const deck = [];
      let id = 0;
      for (const rank of RANKS) {
        for (let num = 1; num <= 13; num++) {
          deck.push({ id: `tile-${id++}`, number: num, rank });
        }
      }
      return deck;
    }

    ioServer.on('connection', (socket) => {
      socket.on('createRoom', ({ playerName }) => {
        socket.join('ROOM1');
        socket.emit('roomCreated', { roomId: 'ROOM1', room: { id: 'ROOM1', hostId: socket.id, players: [{ id: socket.id, name: playerName }] } });
      });

      socket.on('joinRoom', ({ playerName }) => {
        socket.join('ROOM1');
        ioServer.to('ROOM1').emit('roomUpdated', { id: 'ROOM1', players: [{ id: 'p1', name: 'P1' }, { id: socket.id, name: playerName }] });
      });

      socket.on('startGame', () => {
        const deck = createDeck();
        const p1Hand = deck.slice(0, 13);
        const p2Hand = deck.slice(13, 26);
        const players = [
          { id: client1.id, name: 'P1', hand: p1Hand, type: 'human' },
          { id: client2.id, name: 'P2', hand: p2Hand, type: 'human' }
        ];
        const gameState = {
          currentPlayerIndex: 0,
          currentCombination: null,
          isNewLead: true,
          playedTiles: [],
          logs: [],
          turnStartTime: Date.now(),
          turnTimeLimit: 30,
          phase: 'playing'
        };
        ioServer.to('ROOM1').emit('gameStarted', { gameState, players });
      });

      socket.on('playTiles', ({ tiles, combination }) => {
        const p1Hand = createDeck().slice(0, 13).filter(t => !tiles.some((pt: any) => pt.id === t.id));
        const p2Hand = createDeck().slice(13, 26);
        const players = [
          { id: client1.id, name: 'P1', hand: p1Hand, type: 'human' },
          { id: client2.id, name: 'P2', hand: p2Hand, type: 'human' }
        ];
        const gameState = {
          currentPlayerIndex: 1,
          currentCombination: combination,
          isNewLead: false,
          playedTiles: [{ playerIndex: 0, playerName: 'P1', tiles }],
          logs: [{ message: 'P1이 타일을 냈습니다.' }],
          turnStartTime: Date.now(),
          turnTimeLimit: 30,
          phase: 'playing'
        };
        ioServer.to('ROOM1').emit('gameStateUpdated', { gameState, players });
      });
    });

    client1 = Client(`http://localhost:${port}`);
    client2 = Client(`http://localhost:${port}`);

    await new Promise<void>((resolve) => {
      let connected = 0;
      const check = () => { if (++connected === 2) resolve(); };
      client1.on('connect', check);
      client2.on('connect', check);
    });
  });

  afterAll(() => {
    client1.disconnect();
    client2.disconnect();
    ioServer.close();
    httpServer.close();
  });

  it('1. should calculate playStatus correctly when tiles are selected', () => {
    const sampleTile = { id: 'tile-0', number: 3, rank: 'EMPLOYEE' };
    const myHand = [sampleTile, { id: 'tile-1', number: 4, rank: 'EMPLOYEE' }];

    // No cards selected on lead turn -> mustPlay (button disabled)
    let status = getOnlinePlayStatus(true, [], myHand, null, true, 2);
    expect(status).toBe('mustPlay');

    // 1 valid card selected on lead turn -> ready (button ENABLED!)
    status = getOnlinePlayStatus(true, ['tile-0'], myHand, null, true, 2);
    expect(status).toBe('ready');

    // Invalid cards selected -> invalid (button disabled)
    status = getOnlinePlayStatus(true, ['tile-0', 'tile-1'], myHand, null, true, 2); // 3 and 4 don't make a pair
    expect(status).toBe('invalid');
  });

  it('2. should simulate socket flow for online game start and tile playing', async () => {
    let initialGameData: any = null;
    let updatedGameData: any = null;

    client1.on('gameStarted', (data) => {
      initialGameData = data;
    });

    client1.emit('createRoom', { playerName: 'P1' });
    client2.emit('joinRoom', { playerName: 'P2' });
    client1.emit('startGame');

    // Wait for gameStarted
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (initialGameData) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    expect(initialGameData).not.toBeNull();
    expect(initialGameData.players.length).toBe(2);
    expect(initialGameData.players[0].hand.length).toBe(13);

    // Simulate P1 selecting first card and clicking '내기' (playTiles)
    const cardToPlay = initialGameData.players[0].hand[0];
    const evaluated = evaluateCombination([cardToPlay], 2);

    client2.on('gameStateUpdated', (data) => {
      updatedGameData = data;
    });

    client1.emit('playTiles', { roomId: 'ROOM1', tiles: [cardToPlay], combination: evaluated });

    // Wait for gameStateUpdated
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (updatedGameData) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    expect(updatedGameData).not.toBeNull();
    expect(updatedGameData.gameState.currentPlayerIndex).toBe(1); // Turn moved to P2
    expect(updatedGameData.gameState.playedTiles.length).toBe(1); // Card placed on table
    expect(updatedGameData.players[0].hand.length).toBe(12); // P1 has 12 cards left
  });
});
