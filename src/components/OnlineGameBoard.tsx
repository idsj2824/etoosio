import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { evaluateCombination } from '../game/combination';
import { canPlayCombination } from '../game/playableMoves';
import type { GameState, Player } from '../game/types';


import styles from './OnlineGameBoard.module.css';
import { sortTiles, sortTilesByRank } from '../game/deck';
import { GameBoard } from './GameBoard';

interface OnlineGameBoardProps {
  roomId: string;
  onBack: () => void;
  initialPlayers: Player[];
  initialGameState: GameState;
  playerName?: string;

}

// duplicate import removed
export function OnlineGameBoard({ roomId, onBack, initialPlayers, initialGameState, playerName }: OnlineGameBoardProps) {
  const { playTiles, pass, leaveRoom, socket, requestGameState, on, off } = useSocket();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameState, setGameState] = useState<GameState | null>(initialGameState);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [myPlayerName, setMyPlayerName] = useState<string | null>(playerName || null);

  const playedTilesRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<'number' | 'rank'>('number');

  // Real-time socket event listeners for game state updates
  useEffect(() => {
    const handleUpdate = ({ gameState: newGameState, players: newPlayers }: { gameState: GameState; players: Player[] }) => {
      setGameState(newGameState);
      setPlayers(newPlayers);
      setSelectedTileIds([]);
    };

    on('gameStateUpdated', handleUpdate);
    on('gameStarted', handleUpdate);

    return () => {
      off('gameStateUpdated', handleUpdate);
      off('gameStarted', handleUpdate);
    };
  }, [on, off]);

  // Save game state to localStorage when updated
  useEffect(() => {
    if (gameState && roomId) {
      localStorage.setItem(`gameState_${roomId}`, JSON.stringify(gameState));
      localStorage.setItem(`players_${roomId}`, JSON.stringify(players));
    }
  }, [gameState, players, roomId]);

  // Load game state from localStorage on mount
  useEffect(() => {
    if (!gameState && roomId) {
      const savedGameState = localStorage.getItem(`gameState_${roomId}`);
      const savedPlayers = localStorage.getItem(`players_${roomId}`);
      if (savedGameState && savedPlayers) {
        try {
          setGameState(JSON.parse(savedGameState));
          setPlayers(JSON.parse(savedPlayers));
        } catch (e) {
          console.error('Failed to load saved game state:', e);
        }
      }
    }
  }, [gameState, roomId]);

  // Request game state if still not available after loading from localStorage
  useEffect(() => {
    if (!gameState && socket?.connected && roomId) {
      requestGameState(roomId);
    }
  }, [gameState, socket?.connected, roomId, requestGameState]);

  // Set initial player name
  useEffect(() => {
    if (socket?.id && initialPlayers && initialPlayers.length > 0) {
      const myPlayer = initialPlayers.find(p => p.id === socket.id);
      if (myPlayer) {
        setMyPlayerName(myPlayer.name);
      }
    }
  }, [socket?.id, initialPlayers]);

  // Auto-scroll played tiles to bottom when new tiles are added
  useEffect(() => {
    if (playedTilesRef.current && gameState?.playedTiles) {
      playedTilesRef.current.scrollTop = playedTilesRef.current.scrollHeight;
    }
  }, [gameState?.playedTiles]);

  const myPlayer = players.find(p => (socket?.id && p.id === socket.id) || (myPlayerName && p.name === myPlayerName));
  const myPlayerIndex = myPlayer ? players.indexOf(myPlayer) : -1;
  const isMyTurn = gameState && myPlayerIndex !== -1 && myPlayerIndex === gameState.currentPlayerIndex;

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

    const evaluated = evaluateCombination(selected, players.length);
    if (evaluated.type === 'INVALID') return;

    if (gameState.currentCombination) {
      if (!canPlayCombination(selected, gameState.currentCombination, players.length)) {
        return;
      }
    }

    playTiles(roomId, selected, evaluated);
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
  

  // Show round/game end modal for ALL players before myPlayer guard
  if (gameState && (gameState.phase === 'roundEnd' || gameState.phase === 'gameEnd') && gameState.roundScores) {
    const winnerName = players.find(p => p.id === gameState.roundWinnerId)?.name || '알 수 없음';
    const isHost = socket?.id === (players[0]?.id ?? null);

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalCard}>
          <h2 className={styles.modalTitle}>
            {gameState.phase === 'gameEnd' ? '🏆 게임 종료! 최종 결과' : '🎉 퇴근 성공!'}
          </h2>
          <p className={styles.modalWinner}>
            <strong>{winnerName}</strong>이(가) 먼저 모든 타일을 냈습니다!
          </p>

          <h3>{gameState.phase === 'gameEnd' ? '최종 순위' : '라운드 순위'}</h3>
          <table className={styles.resultTable}>
            <thead>
              <tr>
                <th>순위</th>
                <th>플레이어</th>
                <th>남은 타일</th>
                <th>라운드 점수</th>
                <th>누적 점수</th>
              </tr>
            </thead>
            <tbody>
              {[...gameState.roundScores]
                .sort((a, b) => a.remainingTiles - b.remainingTiles)
                .map((rs, i) => {
                  const isMe = rs.playerId === socket?.id;
                  return (
                    <tr key={rs.playerId}>
                      <td>{i + 1}</td>
                      <td>
                        {players.find(p => p.id === rs.playerId)?.name || '알 수 없음'}
                          {isMe && <span className={styles.youBadge}>나</span>}
                      </td>
                      <td>{rs.remainingTiles}장</td>
                      <td className={rs.roundPoints > 0 ? styles.positiveScore : rs.roundPoints < 0 ? styles.negativeScore : ''}>
                        {rs.roundPoints > 0 ? '+' : ''}{rs.roundPoints}
                      </td>
                      <td>{gameState.cumulativeScores?.[rs.playerId] ?? 0}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <p className={styles.roundInfoText}>
            라운드 {gameState.currentRound} / {gameState.totalRounds}
          </p>

          <div className={styles.modalActions}>
            {gameState.phase === 'gameEnd' ? (
              <button className={styles.primaryBtn} onClick={handleLeave}>
                메인 화면으로
              </button>
            ) : (
              <>
                {isHost ? (
                  <button className={styles.primaryBtn} onClick={() => socket?.emit('nextRound', { roomId })}>
                    다음 라운드 시작
                  </button>
                ) : (
                  <div className={styles.waitingText}>⏳ 방장이 다음 라운드를 시작할 때까지 기다려주세요</div>
                )}
                <button className={styles.secondaryBtn} onClick={handleLeave}>
                  방 나가기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!gameState || !myPlayer) {
    return <div className={styles.loading}>게임 로딩 중...</div>;
  }

  // Sort the hand based on the user's selected preference
  const sortedHand = myPlayer && myPlayer.hand ? (sortBy === 'number' ? sortTiles(myPlayer.hand) : sortTilesByRank(myPlayer.hand)) : [];

  // Map players for GameBoard component: set type to 'human' for local player, and 'computer' for opponents
  const mappedPlayers: Player[] = players.map(p => {
    const isMe = (socket?.id && p.id === socket.id) || (myPlayerName && p.name === myPlayerName);
    return {
      ...p,
      type: isMe ? 'human' as const : 'computer' as const,
      hand: isMe ? sortedHand : (p.hand || []),
    };
  });

  // Prepare board state for GameBoard component
  const boardState: GameState = {
    ...gameState,
    selectedTileIds,
    hintTileIds: [],
    playerCount: players.length,
    turnStartTime: gameState.turnStartTime,
    turnTimeLimit: gameState.turnTimeLimit,
    soundEnabled: gameState.soundEnabled,
    players: mappedPlayers,
  };

  // Determine play status for GameBoard
  let playStatus: "idle" | "invalid" | "tooWeak" | "ready" | "mustPlay" = "idle";
  if (isMyTurn) {
    if (selected.length === 0) {
      playStatus = gameState.isNewLead ? "mustPlay" : "idle";
    } else if (selected.length === 4) {
      playStatus = "invalid";
    } else if (!evaluated || evaluated.type === "INVALID") {
      playStatus = "invalid";
    } else if (
      gameState.currentCombination &&
      !canPlayCombination(selected, gameState.currentCombination, players.length)
    ) {
      playStatus = "tooWeak";
    } else {
      playStatus = "ready";
    }
  }

  // Render unified GameBoard UI
  return (
    <GameBoard
      state={boardState}
      playStatus={playStatus}
      onSelectTile={handleSelectTile}
      onPlay={handlePlay}
      onPass={handlePass}
      onClear={() => setSelectedTileIds([])}
      onHint={() => {}}
      onSortNumber={() => setSortBy('number')}
      onSortRank={() => setSortBy('rank')}
      onNewGame={() => {}}
      onShowRules={() => {}}
      onToggleSound={() => {}}
      onSave={() => {}}
      onMenu={onBack}
    />
  );
}
