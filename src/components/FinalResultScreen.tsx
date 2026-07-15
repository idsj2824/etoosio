import type { GameState } from "../game/types";
import styles from "./FinalResultScreen.module.css";

interface FinalResultScreenProps {
  state: GameState;
  onNewGame: () => void;
  onMenu: () => void;
}

export function FinalResultScreen({
  state,
  onNewGame,
  onMenu,
}: FinalResultScreenProps) {
  const rankings = Object.entries(state.cumulativeScores)
    .map(([id, score]) => ({
      id,
      name: state.players.find((p) => p.id === id)?.name ?? id,
      score,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1>최종 결과</h1>
        <p className={styles.subtitle}>5라운드 완료!</p>

        <ol className={styles.rankings}>
          {rankings.map((r, i) => (
            <li
              key={r.id}
              className={`${styles.rank} ${i === 0 ? styles.first : ""}`}
            >
              <span className={styles.position}>{i + 1}위</span>
              <span className={styles.name}>{r.name}</span>
              <span className={styles.score}>
                {r.score > 0 ? "+" : ""}
                {r.score}점
              </span>
            </li>
          ))}
        </ol>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onNewGame}>
            새 게임
          </button>
          <button type="button" className={styles.secondary} onClick={onMenu}>
            메인 화면
          </button>
        </div>
      </div>
    </div>
  );
}
