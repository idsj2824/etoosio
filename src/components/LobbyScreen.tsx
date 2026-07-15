import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import styles from './LobbyScreen.module.css';

interface Room {
  id: string;
  hostId: string;
  playerCount: number;
  players: Array<{ id: string; name: string; hand: any[]; isReady: boolean }>;
  status: 'waiting' | 'playing' | 'finished';
}

interface LobbyScreenProps {
  playerName: string;
  onBack: () => void;
  onGameStart: (roomId: string, players: any[], gameState: any) => void;
}

export function LobbyScreen({ playerName, onBack, onGameStart }: LobbyScreenProps) {
  const { createRoom, joinRoom, startGame, leaveRoom, on, off, setRoomId } = useSocket();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [playerCount, setPlayerCount] = useState(5);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    on('roomCreated', ({ roomId, room }: { roomId: string; room: Room }) => {
      setCurrentRoom(room);
      setRoomId(roomId);
      setError('');
    });

    on('roomJoined', ({ roomId, room }: { roomId: string; room: Room }) => {
      setCurrentRoom(room);
      setRoomId(roomId);
      setError('');
    });

    on('roomUpdated', (room: Room) => {
      setCurrentRoom(room);
    });

    on('gameStarted', ({ gameState, players }: { gameState: any; players: any[] }) => {
      onGameStart(currentRoom?.id || '', players, gameState);
    });

    on('error', ({ message }: { message: string }) => {
      setError(message);
    });

    on('playerLeft', ({ playerId }: { playerId: string }) => {
      if (currentRoom) {
        setCurrentRoom({
          ...currentRoom,
          players: currentRoom.players.filter(p => p.id !== playerId)
        });
      }
    });

    return () => {
      off('roomCreated');
      off('roomJoined');
      off('roomUpdated');
      off('gameStarted');
      off('error');
      off('playerLeft');
    };
  }, [currentRoom, onGameStart, on, off, setRoomId]);

  const handleCreateRoom = () => {
    setError('');
    createRoom(playerName, playerCount);
  };

  const handleJoinRoom = () => {
    if (!roomIdInput.trim()) {
      setError('방 코드를 입력하세요.');
      return;
    }
    setError('');
    joinRoom(roomIdInput.toUpperCase(), playerName);
  };

  const handleLeaveRoom = () => {
    if (currentRoom) {
      leaveRoom(currentRoom.id);
      setCurrentRoom(null);
      setRoomId(null);
    }
  };

  const handleStartGame = () => {
    if (currentRoom) {
      startGame(currentRoom.id);
    }
  };

  if (currentRoom) {
    const isHost = currentRoom.hostId === currentRoom.players.find(p => p.name === playerName)?.id;
    const canStart = currentRoom.players.length >= 2 && currentRoom.status === 'waiting';

    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <h2>대기실</h2>
          <div className={styles.roomInfo}>
            <p><strong>방 코드:</strong> {currentRoom.id}</p>
            <p><strong>인원:</strong> {currentRoom.players.length} / {currentRoom.playerCount}</p>
            <p><strong>상태:</strong> {currentRoom.status === 'waiting' ? '대기 중' : '게임 중'}</p>
          </div>

          <div className={styles.players}>
            <h3>플레이어</h3>
            <ul>
              {currentRoom.players.map((player, index) => (
                <li key={player.id} className={styles.player}>
                  <span className={styles.name}>{player.name}</span>
                  {index === 0 && <span className={styles.hostBadge}>방장</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.actions}>
            {isHost && canStart && (
              <button className={styles.primary} onClick={handleStartGame}>
                게임 시작
              </button>
            )}
            {!canStart && currentRoom.status === 'waiting' && (
              <p className={styles.waiting}>
                {currentRoom.players.length < 2 ? '최소 2명이 필요합니다.' : '기다리는 중...'}
              </p>
            )}
            <button className={styles.secondary} onClick={handleLeaveRoom}>
              나가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h2>온라인 플레이</h2>
        
        <div className={styles.modeToggle}>
          <button
            className={mode === 'create' ? styles.active : ''}
            onClick={() => setMode('create')}
          >
            방 만들기
          </button>
          <button
            className={mode === 'join' ? styles.active : ''}
            onClick={() => setMode('join')}
          >
            방 참가하기
          </button>
        </div>

        {mode === 'create' ? (
          <div className={styles.form}>
            <div className={styles.field}>
              <label>플레이어 이름</label>
              <input
                type="text"
                value={playerName}
                readOnly
                className={styles.readonly}
              />
            </div>
            <div className={styles.field}>
              <label>인원 수</label>
              <div className={styles.playerCount}>
                {[3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={playerCount === n ? styles.active : ''}
                    onClick={() => setPlayerCount(n)}
                  >
                    {n}명
                  </button>
                ))}
              </div>
            </div>
            <button className={styles.primary} onClick={handleCreateRoom}>
              방 만들기
            </button>
          </div>
        ) : (
          <div className={styles.form}>
            <div className={styles.field}>
              <label>방 코드</label>
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="6자 코드 입력"
                maxLength={6}
              />
            </div>
            <div className={styles.field}>
              <label>플레이어 이름</label>
              <input
                type="text"
                value={playerName}
                readOnly
                className={styles.readonly}
              />
            </div>
            <button className={styles.primary} onClick={handleJoinRoom}>
              방 참가하기
            </button>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.back} onClick={onBack}>
          뒤로 가기
        </button>
      </div>
    </div>
  );
}
