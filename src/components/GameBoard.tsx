import type { GameState } from "../game/types";
import { PlayerArea } from "./PlayerArea";
import { HumanHand } from "./HumanHand";
import { GameControls } from "./GameControls";
import { GameLog } from "./GameLog";
import { TileCard } from "./TileCard";
import { CombinationReference } from "./CombinationReference";
import { Notification } from "./Notification";
import { getCombinationLabel, evaluateCombination } from "../game/combination";
import { useState, useEffect, useRef } from "react";
import { useSound } from "../hooks/useSound";
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
  const { play } = useSound(state.soundEnabled);
  const [notification, setNotification] = useState<string | null>(null);
  const playedTilesRef = useRef<HTMLDivElement>(null);
  const [remainingTime, setRemainingTime] = useState<number>(state.turnTimeLimit);

  const [showComboModal, setShowComboModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showAllPlayed, setShowAllPlayed] = useState(false);

  const human = state.players.find((p) => p.type === "human") ?? null;
  const computers = state.players.filter((p) => p.type === "computer");
  const currentPlayer = state.players[state.currentPlayerIndex];
  const lastPlayer =
    state.lastPlayedByIndex !== null
      ? state.players[state.lastPlayedByIndex]
      : null;
  const isHumanTurn = currentPlayer?.type === "human";

  // Get the last played group for prominent display
  const lastPlayedGroup = state.playedTiles && state.playedTiles.length > 0
    ? state.playedTiles[state.playedTiles.length - 1]
    : null;
  const lastComboLabel = lastPlayedGroup
    ? getCombinationLabel(evaluateCombination(lastPlayedGroup.tiles, state.playerCount))
    : null;

  // Trigger sound on my turn
  useEffect(() => {
    if (isHumanTurn) {
      play("turn");
    }
  }, [isHumanTurn, play]);

  // Show notification when human becomes lead
  useEffect(() => {
    if (state.isNewLead && isHumanTurn && currentPlayer?.type === "human") {
      setNotification(`${currentPlayer.name}이(가) 새로운 선이 되었습니다!`);
    }
  }, [state.isNewLead, isHumanTurn, currentPlayer]);

  // Auto-scroll played tiles to bottom when new tiles are added
  useEffect(() => {
    if (playedTilesRef.current) {
      playedTilesRef.current.scrollTop = playedTilesRef.current.scrollHeight;
    }
  }, [state.playedTiles]);

  // Timer countdown
  useEffect(() => {
    if (state.phase !== "playing" || !state.turnStartTime) {
      setRemainingTime(state.turnTimeLimit);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.turnStartTime!) / 1000);
      const remaining = state.turnTimeLimit - elapsed;
      setRemainingTime(Math.max(0, remaining));

      if (remaining <= 0 && isHumanTurn) {
        onPass();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.turnStartTime, state.phase, isHumanTurn, onPass]);

  return (
    <div className={styles.board}>
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {showComboModal && (
        <div className={styles.mobileModalOverlay} onClick={() => setShowComboModal(false)}>
          <div className={styles.mobileModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileModalHeader}>
              <h3>📖 조합 족보</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowComboModal(false)}>✕</button>
            </div>
            <div className={styles.mobileModalBody}>
              <CombinationReference />
            </div>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className={styles.mobileModalOverlay} onClick={() => setShowLogModal(false)}>
          <div className={styles.mobileModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileModalHeader}>
              <h3>📜 게임 로그</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowLogModal(false)}>✕</button>
            </div>
            <div className={styles.mobileModalBody}>
              <GameLog logs={state.logs} />
            </div>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.round}>
            라운드 {state.currentRound}/{state.totalRounds}
          </span>
        </div>
        <div className={styles.headerRight}>
          <button type="button" className={styles.mobileOnlyBtn} onClick={() => setShowComboModal(true)}>
            📖 족보
          </button>
          <button type="button" className={styles.mobileOnlyBtn} onClick={() => setShowLogModal(true)}>
            📜 로그
          </button>
          <button type="button" onClick={onShowRules}>
            게임방법
          </button>
          <button type="button" onClick={onToggleSound}>
            {state.soundEnabled ? "🔊" : "🔇"}
          </button>
          <button type="button" onClick={onNewGame}>
            새게임
          </button>
          <button type="button" onClick={onSave} className={styles.desktopOnlyBtn}>
            저장
          </button>
          <button type="button" onClick={onMenu}>
            메인
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
              <span className={`${styles.currentTurn} ${isHumanTurn ? styles.myTurn : ""}`}>
                현재 차례: <strong>{currentPlayer?.name}{isHumanTurn && " (나)"}</strong>
              </span>
              {state.phase === "playing" && (
                <span className={`${styles.timer} ${remainingTime <= 5 ? styles.urgent : ''}`}>
                  ⏱️ {remainingTime}초
                </span>
              )}
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
                {state.playedTiles && state.playedTiles.length > 1 && (
                  <button
                    type="button"
                    className={styles.toggleHistoryBtn}
                    onClick={() => setShowAllPlayed(v => !v)}
                  >
                    {showAllPlayed ? '▲ 접기' : `▼ 이전 이력 (${state.playedTiles.length - 1}번)`}
                  </button>
                )}
              </div>

              {/* 마지막 낸 조합 - 크고 선명하게 */}
              {lastPlayedGroup ? (
                <div className={styles.lastPlayedHighlight}>
                  <div className={styles.lastPlayedMeta}>
                    <span className={styles.lastPlayedBy}>{lastPlayedGroup.playerName}</span>
                    {lastComboLabel && <span className={styles.lastComboLabel}>{lastComboLabel}</span>}
                  </div>
                  <div className={styles.lastPlayedTiles}>
                    {lastPlayedGroup.tiles.map((tile) => (
                      <TileCard key={tile.id} tile={tile} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.empty}>
                  <p>아직 타일이 없습니다</p>
                </div>
              )}

              {/* 이전 이력 - 토글로 펼치기 */}
              {showAllPlayed && state.playedTiles && state.playedTiles.length > 1 && (
                <div className={styles.allPlayedTiles} ref={playedTilesRef}>
                  <div className={styles.tilesContainer}>
                    {state.playedTiles.slice(0, -1).map((played, index) => (
                      <div key={index} className={styles.tileGroup}>
                        {played.tiles.map((tile) => (
                          <TileCard
                            key={tile.id}
                            tile={tile}
                            compact
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.scores}>
              {state.players.map((p) => {
                const isCurrent = state.players.indexOf(p) === state.currentPlayerIndex;
                const isHuman = p.type === "human";
                return (
                  <div
                    key={p.id}
                    className={`${styles.scoreItem} ${
                      isCurrent ? styles.activeScoreItem : ""
                    } ${isCurrent && isHuman ? styles.myTurnScoreItem : ""}`}
                  >
                    <span>{p.name}</span>
                    <span>{p.hand?.length ?? 0}장</span>
                    <span className={styles.cumulative}>
                      {state.cumulativeScores[p.id] ?? 0}점
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.playerSection} ${isHumanTurn ? styles.myTurnActive : ""}`}>
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
          hand={human?.hand ?? []}
          selectedIds={state.selectedTileIds}
          hintIds={state.hintTileIds}
          playerCount={state.playerCount}
          onSelect={onSelectTile}
        />
      </div>
    </div>
  );
}
