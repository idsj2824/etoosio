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

describe('Online Game Full Round Simulation', () => {
  let ioServer: Server;
  let httpServer: any;
  let client1: ClientSocket;
  let client2: ClientSocket;
  let port: number;

  // In-memory server room state for test
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

  function calculateRoundScores(players: any[]) {
    const scores = players.map(p => ({
      playerId: p.id,
      playerName: p.name,
      roundPoints: p.hand.length === 0 ? 10 : -p.hand.length,
      remainingTiles: p.hand.length
    }));
    return scores;
  }

  let roomState: any = null;

  beforeAll(async () => {
    const app = express();
    httpServer = createServer(app);
    ioServer = new Server(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as any).port;
        resolve();
      });
    });

    ioServer.on('connection', (socket) => {
      socket.on('createRoom', ({ playerName }) => {
        roomState = {
          id: 'TEST_ROOM',
          hostId: socket.id,
          players: [{ id: socket.id, name: playerName, hand: [] }],
          gameState: null,
          status: 'waiting',
          currentRound: 1,
          totalRounds: 5,
          cumulativeScores: { [socket.id]: 0 }
        };
        socket.join('TEST_ROOM');
        socket.emit('roomCreated', { roomId: 'TEST_ROOM', room: roomState });
      });

      socket.on('joinRoom', ({ playerName }) => {
        if (!roomState) return;
        roomState.players.push({ id: socket.id, name: playerName, hand: [] });
        roomState.cumulativeScores[socket.id] = 0;
        socket.join('TEST_ROOM');
        ioServer.to('TEST_ROOM').emit('roomUpdated', roomState);
      });

      socket.on('startGame', () => {
        const deck = createDeck();
        // Give client1 2 tiles, client2 3 tiles for quick round completion test
        roomState.players[0].hand = deck.slice(0, 2);
        roomState.players[1].hand = deck.slice(2, 5);

        roomState.gameState = {
          currentPlayerIndex: 0,
          currentCombination: null,
          lastPlayedByIndex: null,
          consecutivePasses: 0,
          isNewLead: true,
          logs: [{ message: '게임 시작' }],
          playedTiles: [],
          turnStartTime: Date.now(),
          turnTimeLimit: 30,
          phase: 'playing',
          roundWinnerId: null,
          roundScores: null,
          currentRound: 1,
          totalRounds: 5,
          cumulativeScores: roomState.cumulativeScores
        };
        roomState.status = 'playing';
        ioServer.to('TEST_ROOM').emit('gameStarted', { gameState: roomState.gameState, players: roomState.players });
      });

      socket.on('playTiles', ({ tiles, combination }) => {
        const playerIndex = roomState.gameState.currentPlayerIndex;
        const player = roomState.players[playerIndex];

        // Remove played tiles
        player.hand = player.hand.filter((t: any) => !tiles.some((pt: any) => pt.id === t.id));

        roomState.gameState.playedTiles.push({
          playerIndex,
          playerName: player.name,
          tiles: [...tiles]
        });

        roomState.gameState.currentCombination = combination;
        roomState.gameState.lastPlayedByIndex = playerIndex;
        roomState.gameState.isNewLead = false;

        // Check if player won round
        if (player.hand.length === 0) {
          const roundScores = calculateRoundScores(roomState.players);
          roomState.gameState.roundWinnerId = player.id;
          roomState.gameState.roundScores = roundScores;
          roomState.gameState.phase = 'roundEnd';
          ioServer.to('TEST_ROOM').emit('gameStateUpdated', { gameState: roomState.gameState, players: roomState.players });
          return;
        }

        // Turn moves to next player
        roomState.gameState.currentPlayerIndex = (playerIndex + 1) % roomState.players.length;
        ioServer.to('TEST_ROOM').emit('gameStateUpdated', { gameState: roomState.gameState, players: roomState.players });
      });

      socket.on('pass', () => {
        const playerIndex = roomState.gameState.currentPlayerIndex;
        roomState.gameState.consecutivePasses += 1;

        if (roomState.gameState.consecutivePasses >= roomState.players.length - 1) {
          roomState.gameState.currentCombination = null;
          roomState.gameState.consecutivePasses = 0;
          roomState.gameState.isNewLead = true;
          roomState.gameState.currentPlayerIndex = roomState.gameState.lastPlayedByIndex;
        } else {
          roomState.gameState.currentPlayerIndex = (playerIndex + 1) % roomState.players.length;
        }

        ioServer.to('TEST_ROOM').emit('gameStateUpdated', { gameState: roomState.gameState, players: roomState.players });
      });

      socket.on('nextRound', () => {
        roomState.currentRound += 1;
        const deck = createDeck();
        roomState.players[0].hand = deck.slice(5, 7);
        roomState.players[1].hand = deck.slice(7, 10);
        roomState.gameState.phase = 'playing';
        roomState.gameState.currentRound = roomState.currentRound;
        roomState.gameState.currentPlayerIndex = 0;
        roomState.gameState.currentCombination = null;
        roomState.gameState.isNewLead = true;
        ioServer.to('TEST_ROOM').emit('gameStarted', { gameState: roomState.gameState, players: roomState.players });
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

  it('1. should verify playStatus when leading vs non-leading', () => {
    const tileA = { id: 'tile-0', number: 3, rank: 'EMPLOYEE' };
    const tileB = { id: 'tile-1', number: 5, rank: 'EMPLOYEE' };
    const hand = [tileA, tileB];

    // Leading turn, 0 tiles -> mustPlay
    expect(getOnlinePlayStatus(true, [], hand, null, true, 2)).toBe('mustPlay');

    // Leading turn, 1 valid tile -> ready
    expect(getOnlinePlayStatus(true, ['tile-0'], hand, null, true, 2)).toBe('ready');

    // Non-leading turn, 0 tiles -> idle (can pass)
    expect(getOnlinePlayStatus(true, [], hand, { type: 'SINGLE', tiles: [tileA], strength: [1, 1] }, false, 2)).toBe('idle');
  });

  it('2. should simulate a full online game round until a player wins and roundEnd triggers', async () => {
    let currentGameState: any = null;
    let currentPlayers: any[] = [];

    const handleUpdate = (data: any) => {
      currentGameState = data.gameState;
      currentPlayers = data.players;
    };

    client1.on('gameStarted', handleUpdate);
    client1.on('gameStateUpdated', handleUpdate);
    client2.on('gameStarted', handleUpdate);
    client2.on('gameStateUpdated', handleUpdate);

    // 1. Host creates room and Player 2 joins
    client1.emit('createRoom', { playerName: 'Host' });
    client2.emit('joinRoom', { playerName: 'Player 2' });
    client1.emit('startGame');

    // Wait for game start
    await new Promise<void>(res => setTimeout(res, 100));

    expect(currentGameState).not.toBeNull();
    expect(currentGameState.phase).toBe('playing');
    expect(currentGameState.currentPlayerIndex).toBe(0); // Host's turn

    // 2. Host plays 1st tile
    const hostTile1 = currentPlayers[0].hand[0];
    const eval1 = evaluateCombination([hostTile1], 2);
    client1.emit('playTiles', { tiles: [hostTile1], combination: eval1 });

    await new Promise<void>(res => setTimeout(res, 100));

    expect(currentGameState.currentPlayerIndex).toBe(1); // Player 2's turn
    expect(currentPlayers[0].hand.length).toBe(1); // Host has 1 card left

    // 3. Player 2 passes turn
    client2.emit('pass');
    await new Promise<void>(res => setTimeout(res, 100));

    expect(currentGameState.currentPlayerIndex).toBe(0); // Host becomes lead again
    expect(currentGameState.isNewLead).toBe(true);

    // 4. Host plays final tile (empties hand!)
    const hostTile2 = currentPlayers[0].hand[0];
    const eval2 = evaluateCombination([hostTile2], 2);
    client1.emit('playTiles', { tiles: [hostTile2], combination: eval2 });

    await new Promise<void>(res => setTimeout(res, 100));

    // 5. Verify roundEnd phase triggered & winner set!
    expect(currentGameState.phase).toBe('roundEnd');
    expect(currentGameState.roundWinnerId).toBe(client1.id);
    expect(currentGameState.roundScores).not.toBeNull();
    expect(currentPlayers[0].hand.length).toBe(0);

    // 6. Host starts next round
    client1.emit('nextRound');
    await new Promise<void>(res => setTimeout(res, 100));

    expect(currentGameState.phase).toBe('playing');
    expect(currentGameState.currentRound).toBe(2);
    expect(currentPlayers[0].hand.length).toBe(2); // New hand dealt for round 2
  });
});
