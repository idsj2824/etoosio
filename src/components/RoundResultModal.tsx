import type { GameState } from "../game/types";
import styles from "./RoundResultModal.module.css";

interface RoundResultModalProps {
  state: GameState;
  onNextRound: () => void;
  onNewGame: () => void;
  onMenu: () => void;
}

export function RoundResultModal({
  state,
  onNextRound,
  onNewGame,
  onMenu,
}: RoundResultModalProps) {
  const sorted = [...state.roundScores].sort(
    (a, b) => a.remainingTiles - b.remainingTiles
  );

  const winner = state.players.find((p) => p.id === state.roundWinnerId);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>퇴근 성공!</h2>
        <p className={styles.winner}>
          {winner?.name}이(가) 먼저 모든 타일을 냈습니다!
        </p>

        <h3>라운드 순위</h3>
        <table className={styles.table}>
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
            {sorted.map((rs, i) => {
              const player = state.players.find((p) => p.id === rs.playerId);
              return (
                <tr key={rs.playerId}>
                  <td>{i + 1}</td>
                  <td>{player?.name}</td>
                  <td>{rs.remainingTiles}</td>
                  <td className={rs.roundPoints > 0 ? styles.positive : rs.roundPoints < 0 ? styles.negative : ""}>
                    {rs.roundPoints > 0 ? "+" : ""}
                    {rs.roundPoints}
                  </td>
                  <td>{state.cumulativeScores[rs.playerId] ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className={styles.roundInfo}>
          라운드 {state.currentRound} / {state.totalRounds}
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onNextRound}>
            {state.currentRound >= state.totalRounds ? "최종 결과" : "다음 라운드"}
          </button>
          <button type="button" className={styles.secondary} onClick={onNewGame}>
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
