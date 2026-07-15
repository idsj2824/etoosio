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
    origin: '*',
    methods: ['GET', 'POST']
  }
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

function startGame(room) {
  const deck = shuffleDeck(createDeck(room.playerCount));
  const hands = dealTiles(deck, room.playerCount);
  const startIndex = findStartingPlayerIndex(hands);

  room.players.forEach((player, index) => {
    player.hand = hands[index];
  });

  room.gameState = {
    currentPlayerIndex: startIndex,
    currentCombination: null,
    lastPlayedByIndex: null,
    consecutivePasses: 0,
    isNewLead: true,
    logs: [{ message: `${room.players[startIndex].name}이(가) 선입니다.`, timestamp: Date.now() }],
    playedTiles: [] // Track all tiles played on the table
  };

  room.status = 'playing';
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
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
    const room = getRoom(roomId);
    
    if (!room) {
      return;
    }
    
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: '방장만 게임을 시작할 수 있습니다.' });
      return;
    }
    
    if (room.players.length < 2) {
      socket.emit('error', { message: '최소 2명이 필요합니다.' });
      return;
    }
    
    startGame(room);
    io.to(roomId).emit('gameStarted', { gameState: room.gameState, players: room.players });
    
    console.log(`Game started in room ${roomId}`);
  });
  
  socket.on('playTiles', ({ roomId, tiles }) => {
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
    gameState.currentCombination = { type: 'played', tiles };
    gameState.lastPlayedByIndex = playerIndex;
    gameState.consecutivePasses = 0;
    gameState.isNewLead = false;
    gameState.logs.push({ message: `${player.name}이(가) 타일을 냈습니다.`, timestamp: Date.now() });
    
    // Move to next player
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % room.players.length;
    
    // Check if player finished
    if (player.hand.length === 0) {
      room.status = 'finished';
      io.to(roomId).emit('gameFinished', { winner: player, room });
      return;
    }
    
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
    
    const othersCount = room.players.filter(p => p.hand.length > 0).length - 1;
    
    if (gameState.consecutivePasses >= othersCount) {
      // Everyone passed, last player leads again
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
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove player from all rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        removePlayerFromRoom(room, socket.id);
        io.to(roomId).emit('roomUpdated', room);
        io.to(roomId).emit('playerLeft', { playerId: socket.id });
        
        if (room.status === 'playing') {
          // Handle disconnect during game
          room.status = 'finished';
          io.to(roomId).emit('gameAborted', { message: '플레이어가 연결이 끊겼습니다.' });
        }
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
