import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Game logic functions (copied from deck.ts for server-side use)
const RANKS = ["EMPLOYEE", "ASSISTANT_MANAGER", "MANAGER", "DIRECTOR"];

function createDeck(playerCount) {
  const maxNumber = getMaxNumber(playerCount);
  const deck = [];
  let idCounter = 0;

  for (const rank of RANKS) {
    for (let num = 1; num <= maxNumber; num++) {
      deck.push({
        id: `tile-${idCounter++}`,
        number: num,
        rank,
      });
    }
  }

  return deck;
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealTiles(deck, playerCount) {
  const tilesPerPlayer = getTilesPerPlayer(playerCount);
  const hands = [];

  for (let i = 0; i < playerCount; i++) {
    hands.push(deck.slice(i * tilesPerPlayer, (i + 1) * tilesPerPlayer));
  }

  return hands;
}

function findStartingPlayerIndex(hands) {
  for (let i = 0; i < hands.length; i++) {
    const hasEmployee3 = hands[i].some(
      (t) => t.rank === "EMPLOYEE" && t.number === 3
    );
    if (hasEmployee3) return i;
  }
  return 0;
}

function getMaxNumber(playerCount) {
  switch (playerCount) {
    case 3:
      return 9;
    case 4:
      return 13;
    case 5:
      return 15;
    default:
      return 15;
  }
}

function getTilesPerPlayer(playerCount) {
  switch (playerCount) {
    case 3:
      return 12;
    case 4:
      return 13;
    case 5:
      return 12;
    default:
      return 12;
  }
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins dynamically (useful for Vercel preview deployments and localhost)
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.send('Etoosio Server is running!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

// Room management
const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function createRoom(roomId, hostId, hostName, playerCount) {
  const room = {
    id: roomId,
    hostId,
    playerCount,
    players: [],
    gameState: null,
    status: 'waiting' // waiting, playing, finished
  };
  rooms.set(roomId, room);
  return room;
}

function addPlayerToRoom(room, playerId, playerName) {
  if (room.players.length >= room.playerCount) {
    return false;
  }
  
  const player = {
    id: playerId,
    name: playerName,
    hand: [],
    isReady: false
  };
  
  room.players.push(player);
  return true;
}

function removePlayerFromRoom(room, playerId) {
  room.players = room.players.filter(p => p.id !== playerId);
  
  if (room.players.length === 0) {
    rooms.delete(room.id);
  } else if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
  }
}

function calculateRoundScores(players) {
  const remaining = players.map((p) => ({
    playerId: p.id,
    remaining: p.hand.length,
  }));

  const scores = players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    roundPoints: 0,
    remainingTiles: p.hand.length,
  }));

  for (let i = 0; i < remaining.length; i++) {
    for (let j = i + 1; j < remaining.length; j++) {
      const a = remaining[i];
      const b = remaining[j];
      const diff = Math.abs(a.remaining - b.remaining);

      if (a.remaining < b.remaining) {
        const scoreA = scores.find((s) => s.playerId === a.playerId);
        const scoreB = scores.find((s) => s.playerId === b.playerId);
        if (scoreA) scoreA.roundPoints += diff;
        if (scoreB) scoreB.roundPoints -= diff;
      } else if (b.remaining < a.remaining) {
        const scoreA = scores.find((s) => s.playerId === a.playerId);
        const scoreB = scores.find((s) => s.playerId === b.playerId);
        if (scoreB) scoreB.roundPoints += diff;
        if (scoreA) scoreA.roundPoints -= diff;
      }
    }
  }

  return scores;
}

function applyRoundScores(cumulativeScores, roundScores) {
  const updated = { ...cumulativeScores };
  for (const rs of roundScores) {
    updated[rs.playerId] = (updated[rs.playerId] ?? 0) + rs.roundPoints;
  }
  return updated;
}

function startGame(room) {
  room.currentRound = 1;
  room.totalRounds = 5;
  room.cumulativeScores = {};
  room.players.forEach(p => {
    room.cumulativeScores[p.id] = 0;
  });

  startNewRound(room);
}

function startNewRound(room) {
  const deck = shuffleDeck(createDeck(room.playerCount));
  const hands = dealTiles(deck, room.playerCount);
  const startIndex = findStartingPlayerIndex(hands);

  room.players.forEach((player, index) => {
    player.hand = hands[index];
  });

  // Ensure startIndex is valid
  const safeStartIndex = Math.min(startIndex, room.players.length - 1);
  const startingPlayer = room.players[safeStartIndex];

  room.gameState = {
    currentPlayerIndex: safeStartIndex,
    currentCombination: null,
    lastPlayedByIndex: null,
    consecutivePasses: 0,
    isNewLead: true,
    logs: [{ message: `라운드 ${room.currentRound}이(가) 시작되었습니다. ${startingPlayer?.name || '플레이어'}이(가) 선입니다.`, timestamp: Date.now() }],
    playedTiles: [], // Track all tiles played on the table
    turnStartTime: Date.now(),
    turnTimeLimit: 30,
    phase: 'playing',
    roundWinnerId: null,
    roundScores: null,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    cumulativeScores: room.cumulativeScores,
    hostId: room.hostId
  };

  room.status = 'playing';

  // Start timer for this room
  startRoomTimer(room.id);
}

function startRoomTimer(roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }

  const timer = setInterval(() => {
    const room = getRoom(roomId);
    if (!room || room.status !== 'playing') {
      clearInterval(timer);
      if (room) room.timer = null;
      return;
    }

    const gameState = room.gameState;
    if (gameState.phase !== 'playing') {
      clearInterval(timer);
      room.timer = null;
      return;
    }

    if (!gameState.turnStartTime) return;

    const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
    if (elapsed >= gameState.turnTimeLimit) {
      // Time limit exceeded, auto-pass
      const currentPlayer = room.players[gameState.currentPlayerIndex];
      if (currentPlayer) {
        gameState.consecutivePasses++;
        gameState.logs.push({ message: `${currentPlayer.name}이(가) 시간 초과로 패스했습니다.`, timestamp: Date.now() });
        gameState.turnStartTime = Date.now();

        const othersCount = room.players.filter(p => p.hand.length > 0).length - 1;

        if (gameState.consecutivePasses >= othersCount) {
          gameState.currentCombination = null;
          gameState.consecutivePasses = 0;
          gameState.isNewLead = true;
          gameState.currentPlayerIndex = gameState.lastPlayedByIndex;
          gameState.logs.push({
            message: `${room.players[gameState.lastPlayedByIndex].name}이(가) 새로운 선이 되었습니다.`,
            timestamp: Date.now()
          });
        } else {
          gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % room.players.length;
        }

        io.to(roomId).emit('gameStateUpdated', { gameState, players: room.players });
      }
    }
  }, 1000);

  room.timer = timer;
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('rejoinRoom', ({ roomId, playerName }) => {
    const room = getRoom(roomId);
    
    if (!room) {
      socket.emit('error', { message: '방을 찾을 수 없습니다.' });
      return;
    }
    
    // Find disconnected player with same name
    const disconnectedPlayer = room.players.find(p => p.disconnected && p.name === playerName);
    if (disconnectedPlayer) {
      // Reconnect the player
      disconnectedPlayer.id = socket.id;
      disconnectedPlayer.disconnected = false;
      socket.join(roomId);
      
      // Send current game state if game is in progress
      if (room.status === 'playing' && room.gameState) {
        socket.emit('gameStarted', { gameState: room.gameState, players: room.players });
      } else {
        socket.emit('roomUpdated', room);
      }
      
      console.log(`Player ${playerName} reconnected to room ${roomId}`);
    }
  });
  
  socket.on('createRoom', ({ playerName, playerCount }) => {
    const roomId = generateRoomId();
    const room = createRoom(roomId, socket.id, playerName, playerCount);
    addPlayerToRoom(room, socket.id, playerName);
    
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, room });
    io.to(roomId).emit('roomUpdated', room);
    
    console.log(`Room ${roomId} created by ${playerName}`);
  });
  
  socket.on('joinRoom', ({ roomId, playerName }) => {
    const room = getRoom(roomId);
    
    if (!room) {
      socket.emit('error', { message: '방을 찾을 수 없습니다.' });
      return;
    }
    
    if (room.status !== 'waiting') {
      socket.emit('error', { message: '이미 시작된 방입니다.' });
      return;
    }
    
    if (room.players.length >= room.playerCount) {
      socket.emit('error', { message: '방이 꽉 찼습니다.' });
      return;
    }
    
    const success = addPlayerToRoom(room, socket.id, playerName);
    
    if (success) {
      socket.join(roomId);
      socket.emit('roomJoined', { roomId, room });
      io.to(roomId).emit('roomUpdated', room);
      
      console.log(`${playerName} joined room ${roomId}`);
    } else {
      socket.emit('error', { message: '방에 참가할 수 없습니다.' });
    }
  });
  
  socket.on('leaveRoom', ({ roomId }) => {
    const room = getRoom(roomId);
    
    if (room) {
      removePlayerFromRoom(room, socket.id);
      socket.leave(roomId);
      io.to(roomId).emit('roomUpdated', room);
      io.to(roomId).emit('playerLeft', { playerId: socket.id });
      
      console.log(`Player ${socket.id} left room ${roomId}`);
    }
  });
  
  socket.on('startGame', ({ roomId }) => {
    console.log('startGame event received:', { roomId, socketId: socket.id });
    const room = getRoom(roomId);
    
    if (!room) {
      console.log('Room not found:', roomId);
      socket.emit('error', { message: '방을 찾을 수 없습니다.' });
      return;
    }
    
    console.log('Room hostId:', room.hostId, 'Socket ID:', socket.id);
    if (room.hostId !== socket.id) {
      console.log('Not host - rejecting start game');
      socket.emit('error', { message: '방장만 게임을 시작할 수 있습니다.' });
      return;
    }
    
    console.log('Players count:', room.players.length, 'Target:', room.playerCount);
    if (room.players.length < room.playerCount) {
      console.log('Not enough players to start game');
      socket.emit('error', { message: `설정한 인원(${room.playerCount}명)이 모두 입장해야 게임을 시작할 수 있습니다.` });
      return;
    }
    
    console.log('Starting game...');
    startGame(room);
    io.to(roomId).emit('gameStarted', { gameState: room.gameState, players: room.players });
    
    console.log(`Game started in room ${roomId}`);
  });
  
  socket.on('playTiles', ({ roomId, tiles, combination }) => {
    const room = getRoom(roomId);
    
    if (!room || room.status !== 'playing') {
      return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    const gameState = room.gameState;
    const playerIndex = room.players.indexOf(player);
    
    if (playerIndex !== gameState.currentPlayerIndex) {
      return;
    }
    
    // Remove played tiles from hand
    player.hand = player.hand.filter(t => !tiles.some(pt => pt.id === t.id));

    // Add tiles to played tiles on table
    gameState.playedTiles.push({
      playerIndex,
      playerName: player.name,
      tiles: [...tiles]
    });

    // Update game state
    gameState.currentCombination = combination || { type: 'played', tiles };
    gameState.lastPlayedByIndex = playerIndex;
    gameState.consecutivePasses = 0;
    gameState.isNewLead = false;
    gameState.logs.push({ message: `${player.name}이(가) 타일을 냈습니다.`, timestamp: Date.now() });
    // Check if player finished
    if (player.hand.length === 0) {
      const roundScores = calculateRoundScores(room.players);
      room.cumulativeScores = applyRoundScores(room.cumulativeScores, roundScores);

      gameState.roundWinnerId = player.id;
      gameState.roundScores = roundScores;
      gameState.cumulativeScores = room.cumulativeScores;
      gameState.logs.push({ message: `${player.name}이(가) 모든 타일을 냈습니다! 라운드 종료!`, timestamp: Date.now() });

      // Stop timer
      gameState.turnStartTime = null;
      if (room.timer) {
        clearInterval(room.timer);
        room.timer = null;
      }

      if (room.currentRound >= room.totalRounds) {
        gameState.phase = 'gameEnd';
        room.status = 'finished';
      } else {
        gameState.phase = 'roundEnd';
      }

      io.to(roomId).emit('gameStateUpdated', { gameState, players: room.players });
      return;
    }

    // Move to next player (only if current player didn't finish)
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % room.players.length;
    gameState.turnStartTime = Date.now();
    
    io.to(roomId).emit('gameStateUpdated', { gameState, players: room.players });
  });
  
  socket.on('pass', ({ roomId }) => {
    const room = getRoom(roomId);
    
    if (!room || room.status !== 'playing') {
      return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    const gameState = room.gameState;
    const playerIndex = room.players.indexOf(player);
    
    if (playerIndex !== gameState.currentPlayerIndex) {
      return;
    }
    
    if (gameState.isNewLead) {
      return; // Cannot pass when leading
    }
    
    gameState.consecutivePasses++;
    gameState.logs.push({ message: `${player.name}이(가) 패스했습니다.`, timestamp: Date.now() });
    gameState.turnStartTime = Date.now();

    const othersCount = room.players.filter(p => p.hand.length > 0).length - 1;
    
    if (gameState.consecutivePasses >= othersCount) {
      // Everyone passed, last player leads again
      gameState.currentCombination = null;
      gameState.consecutivePasses = 0;
      gameState.isNewLead = true;
      gameState.currentPlayerIndex = gameState.lastPlayedByIndex;
      // Keep played tiles on table (don't clear)
      gameState.logs.push({
        message: `${room.players[gameState.lastPlayedByIndex].name}이(가) 새로운 선이 되었습니다.`,
        timestamp: Date.now()
      });
    } else {
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % room.players.length;
    }
    
    io.to(roomId).emit('gameStateUpdated', { gameState, players: room.players });
  });
  
  socket.on('nextRound', ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) return;
    
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: '방장만 다음 라운드를 시작할 수 있습니다.' });
      return;
    }
    
    if (room.status === 'playing' && room.gameState && room.gameState.phase === 'roundEnd') {
      room.currentRound += 1;
      startNewRound(room);
      io.to(roomId).emit('gameStarted', { gameState: room.gameState, players: room.players });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove player from all rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        // Mark player as disconnected but keep them in the room
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.disconnected = true;
        }
        io.to(roomId).emit('roomUpdated', room);
        
        // Don't abort game on disconnect - allow reconnection
        // Only abort if all players are disconnected
        const allDisconnected = room.players.every(p => p.disconnected);
        if (allDisconnected && room.status === 'playing') {
          room.status = 'finished';
          io.to(roomId).emit('gameAborted', { message: '모든 플레이어가 연결이 끊겼습니다.' });
        }
      }
    }
  });
  
  // Send game state to reconnected players
  socket.on('requestGameState', ({ roomId }) => {
    const room = getRoom(roomId);
    if (room && room.status === 'playing' && room.gameState) {
      socket.emit('gameStarted', { gameState: room.gameState, players: room.players });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
