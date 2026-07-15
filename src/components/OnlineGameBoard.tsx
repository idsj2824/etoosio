import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { evaluateCombination, getCombinationLabel } from '../game/combination';
import { canPlayCombination } from '../game/playableMoves';
import { TileCard } from './TileCard';
import styles from './OnlineGameBoard.module.css';

interface OnlineGameBoardProps {
  roomId: string;
  playerName: string;
  onBack: () => void;
}

interface Player {
  id: string;
  name: string;
  hand: any[];
}

interface GameState {
  currentPlayerIndex: number;
  currentCombination: any;
  lastPlayedByIndex: number | null;
  consecutivePasses: number;
  isNewLead: boolean;
  logs: Array<{ message: string; timestamp: number }>;
}

export function OnlineGameBoard({ roomId, playerName, onBack }: OnlineGameBoardProps) {
  const { playTiles, pass, on, off, leaveRoom } = useSocket();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);

  useEffect(() => {
    on('gameStateUpdated', ({ gameState: newGameState, players: newPlayers }) => {
      setGameState(newGameState);
      setPlayers(newPlayers);
      setSelectedTileIds([]);
    });

    on('gameFinished', ({ winner }) => {
      alert(`${winner.name}이(가) 승리했습니다!`);
      onBack();
    });

    on('gameAborted', ({ message }) => {
      alert(message);
      onBack();
    });

    on('playerLeft', ({ playerId }) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    return () => {
      off('gameStateUpdated');
      off('gameFinished');
      off('gameAborted');
      off('playerLeft');
    };
  }, [on, off, onBack]);

  const myPlayer = players.find(p => p.name === playerName);
  const isMyTurn = gameState && myPlayer && players.indexOf(myPlayer) === gameState.currentPlayerIndex;
  const currentPlayer = gameState && players[gameState.currentPlayerIndex];
  const lastPlayer = gameState && gameState.lastPlayedByIndex !== null ? players[gameState.lastPlayedByIndex] : null;

  const handleSelectTile = useCallback((tileId: string) => {
    if (!isMyTurn) return;
    setSelectedTileIds(prev => 
      prev.includes(tileId) ? prev.filter(id => id !== tileId) : [...prev, tileId]
    );
  }, [isMyTurn]);

  const handlePlay = useCallback(() => {
    if (!myPlayer || !gameState) return;
    
    const selected = myPlayer.hand.filter(t => selectedTileIds.includes(t.id));
    if (selected.length === 0) return;
    if (selected.length === 4) return;

    const evaluated = evaluateCombination(selected, players.length);
    if (evaluated.type === 'INVALID') return;

    if (gameState.currentCombination) {
      if (!canPlayCombination(selected, gameState.currentCombination, players.length)) {
        return;
      }
    }

    playTiles(roomId, selected);
  }, [myPlayer, gameState, selectedTileIds, players.length, playTiles, roomId]);

  const handlePass = useCallback(() => {
    if (!gameState || gameState.isNewLead) return;
    pass(roomId);
  }, [gameState, pass, roomId]);

  const handleLeave = useCallback(() => {
    leaveRoom(roomId);
    onBack();
  }, [leaveRoom, roomId, onBack]);

  const selected = myPlayer?.hand.filter(t => selectedTileIds.includes(t.id)) || [];
  const evaluated = selected.length > 0 ? evaluateCombination(selected, players.length) : null;
  
  const canPlay = evaluated && evaluated.type !== 'INVALID' && 
    (!gameState?.currentCombination || canPlayCombination(selected, gameState.currentCombination, players.length));

  if (!gameState || !myPlayer) {
    return <div className={styles.loading}>게임 로딩 중...</div>;
  }

  return (
    <div className={styles.board}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.roomCode}>방 코드: {roomId}</span>
        </div>
        <div className={styles.headerRight}>
          <button onClick={handleLeave}>나가기</button>
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.players}>
          {players.map((player, index) => (
            <div 
              key={player.id} 
              className={`${styles.player} ${index === gameState.currentPlayerIndex ? styles.current : ''}`}
            >
              <span className={styles.name}>{player.name}</span>
              <span className={styles.count}>{player.hand.length}장</span>
              {player.name === playerName && <span className={styles.you}>나</span>}
            </div>
          ))}
        </div>

        <div className={styles.center}>
          <div className={styles.turnInfo}>
            <span>현재 차례: <strong>{currentPlayer?.name}</strong></span>
            {lastPlayer && gameState.currentCombination && (
              <span>마지막 제출: {lastPlayer.name}</span>
            )}
            {gameState.consecutivePasses > 0 && (
              <span>연속 패스: {gameState.consecutivePasses}</span>
            )}
          </div>

          <div className={styles.playedArea}>
            {gameState.currentCombination ? (
              <div className={styles.combination}>
                <div className={styles.label}>{getCombinationLabel(gameState.currentCombination)}</div>
                <div className={styles.tiles}>
                  {gameState.currentCombination.tiles.map((tile: any) => (
                    <TileCard key={tile.id} tile={tile} />
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.empty}>
                <p>바닥이 비어 있습니다</p>
                <p className={styles.sub}>{currentPlayer?.name}이(가) 조합을 낼 차례입니다</p>
              </div>
            )}
          </div>

          <div className={styles.logs}>
            {gameState.logs.slice(-5).map((log, index) => (
              <div key={index} className={styles.log}>{log.message}</div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.playerSection}>
        <div className={styles.controls}>
          <p className={styles.status}>
            {!isMyTurn ? '상대의 차례입니다...' :
             !canPlay ? '유효하지 않은 조합입니다' :
             gameState.isNewLead ? '선이므로 반드시 조합을 내야 합니다' :
             '내기 준비 완료!'}
          </p>
          <div className={styles.buttons}>
            <button 
              className={styles.primary}
              onClick={handlePlay}
              disabled={!isMyTurn || !canPlay}
            >
              내기
            </button>
            <button 
              className={styles.secondary}
              onClick={handlePass}
              disabled={!isMyTurn || gameState.isNewLead}
            >
              패스
            </button>
            <button 
              className={styles.secondary}
              onClick={() => setSelectedTileIds([])}
              disabled={!isMyTurn}
            >
              선택 초기화
            </button>
          </div>
        </div>

        <div className={styles.hand}>
          <div className={styles.handInfo}>
            {selected.length > 0 && evaluated && (
              <span className={evaluated.type === 'INVALID' ? styles.invalid : styles.valid}>
                {evaluated.type === 'INVALID' ? '유효하지 않은 조합입니다' : getCombinationLabel(evaluated)}
              </span>
            )}
            {selected.length === 0 && <span className={styles.hint}>타일을 선택하세요</span>}
          </div>
          <div className={styles.tiles}>
            {myPlayer.hand.map((tile) => (
              <TileCard
                key={tile.id}
                tile={tile}
                selected={selectedTileIds.includes(tile.id)}
                onClick={() => handleSelectTile(tile.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
