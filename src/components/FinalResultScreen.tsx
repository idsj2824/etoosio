import type { GameState } from "../game/types";
import type { ExpGainResult } from "../game/level";
import styles from "./FinalResultScreen.module.css";

interface FinalResultScreenProps {
  state: GameState;
  expResult: ExpGainResult | null;
  onNewGame: () => void;
  onMenu: () => void;
}

export function FinalResultScreen({
  state,
  expResult,
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

        {/* 경험치 획득 안내 카운터 */}
        {expResult && (
          <div
            style={{
              backgroundColor: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#0369a1", fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>
              ✨ 획득 경험치: +{expResult.totalEarnedExp} EXP
            </div>
            <div style={{ color: "#0284c7", fontSize: "12px" }}>
              완주(+{expResult.baseExp}) | 순위 보너스(+{expResult.rankBonusExp})
            </div>
          </div>
        )}

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
