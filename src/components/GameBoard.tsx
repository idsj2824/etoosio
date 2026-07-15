import type { GameState } from "../game/types";
import { PlayerArea } from "./PlayerArea";
import { HumanHand } from "./HumanHand";
import { GameControls } from "./GameControls";
import { GameLog } from "./GameLog";
import { TileCard } from "./TileCard";
import { CombinationReference } from "./CombinationReference";
import { Notification } from "./Notification";
import { useState, useEffect } from "react";
import styles from "./GameBoard.module.css";

interface GameBoardProps {
  state: GameState;
  playStatus: "idle" | "invalid" | "tooWeak" | "ready" | "mustPlay";
  onSelectTile: (id: string) => void;
  onPlay: () => void;
  onPass: () => void;
  onClear: () => void;
  onHint: () => void;
  onSortNumber: () => void;
  onSortRank: () => void;
  onNewGame: () => void;
  onShowRules: () => void;
  onToggleSound: () => void;
  onSave: () => void;
  onMenu: () => void;
}

export function GameBoard({
  state,
  playStatus,
  onSelectTile,
  onPlay,
  onPass,
  onClear,
  onHint,
  onSortNumber,
  onSortRank,
  onNewGame,
  onShowRules,
  onToggleSound,
  onSave,
  onMenu,
}: GameBoardProps) {
  const [notification, setNotification] = useState<string | null>(null);

  const human = state.players.find((p) => p.type === "human")!;
  const computers = state.players.filter((p) => p.type === "computer");
  const currentPlayer = state.players[state.currentPlayerIndex];
  const lastPlayer =
    state.lastPlayedByIndex !== null
      ? state.players[state.lastPlayedByIndex]
      : null;
  const isHumanTurn = currentPlayer?.type === "human";

  // Show notification when human becomes lead
  useEffect(() => {
    if (state.isNewLead && isHumanTurn && currentPlayer?.type === "human") {
      setNotification(`${currentPlayer.name}이(가) 새로운 선이 되었습니다!`);
    }
  }, [state.isNewLead, isHumanTurn, currentPlayer]);

  return (
    <div className={styles.board}>
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.round}>
            라운드 {state.currentRound}/{state.totalRounds}
          </span>
        </div>
        <div className={styles.headerRight}>
          <button type="button" onClick={onNewGame}>
            새 게임
          </button>
          <button type="button" onClick={onShowRules}>
            게임 방법
          </button>
          <button type="button" onClick={onToggleSound}>
            {state.soundEnabled ? "🔊 음향" : "🔇 음향"}
          </button>
          <button type="button" onClick={onSave}>
            게임 저장
          </button>
          <button type="button" onClick={onMenu}>
            메인으로
          </button>
        </div>
      </header>

      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <CombinationReference />
          <GameLog logs={state.logs} />
        </aside>

        <div className={styles.table}>
          <div className={styles.opponents}>
            {computers.map((cpu, i) => (
              <PlayerArea
                key={cpu.id}
                player={cpu}
                isCurrentTurn={
                  state.players.indexOf(cpu) === state.currentPlayerIndex
                }
                position={i < 2 ? "top" : "top"}
              />
            ))}
          </div>

          <div className={styles.center}>
            <div className={styles.turnInfo}>
              <span className={styles.currentTurn}>
                현재 차례: <strong>{currentPlayer?.name}</strong>
              </span>
              {lastPlayer && state.currentCombination && (
                <span className={styles.lastPlay}>
                  마지막 제출: {lastPlayer.name}
                </span>
              )}
              {state.consecutivePasses > 0 && (
                <span className={styles.passes}>
                  연속 패스: {state.consecutivePasses}
                </span>
              )}
            </div>

            <div className={styles.playedArea}>
              <div className={styles.playedTilesHeader}>
                <h3>바닥에 깔린 타일</h3>
              </div>
              <div className={styles.allPlayedTiles}>
                {state.playedTiles && state.playedTiles.length > 0 ? (
                  <div className={styles.tilesContainer}>
                    {state.playedTiles.map((played, index) => (
                      <div key={index} className={styles.tileGroup}>
                        {played.tiles.map((tile) => (
                          <TileCard
                            key={tile.id}
                            tile={tile}
                            compact
                            className={index === state.playedTiles.length - 1 ? styles.recent : ''}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>
                    <p>아직 타일이 없습니다</p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.scores}>
              {state.players.map((p) => (
                <div key={p.id} className={styles.scoreItem}>
                  <span>{p.name}</span>
                  <span>{p.hand.length}장</span>
                  <span className={styles.cumulative}>
                    {state.cumulativeScores[p.id] ?? 0}점
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.playerSection}>
        <GameControls
          playStatus={playStatus}
          isHumanTurn={isHumanTurn}
          isNewLead={state.isNewLead}
          onPlay={onPlay}
          onPass={onPass}
          onClear={onClear}
          onHint={onHint}
          onSortNumber={onSortNumber}
          onSortRank={onSortRank}
        />
        <HumanHand
          hand={human.hand}
          selectedIds={state.selectedTileIds}
          hintIds={state.hintTileIds}
          playerCount={state.playerCount}
          onSelect={onSelectTile}
        />
      </div>
    </div>
  );
}
