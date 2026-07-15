import type { GameLogEntry } from "../game/types";
import styles from "./GameLog.module.css";

interface GameLogProps {
  logs: GameLogEntry[];
}

export function GameLog({ logs }: GameLogProps) {
  const recent = [...logs].reverse().slice(0, 20);

  return (
    <div className={styles.log}>
      <h3 className={styles.title}>행동 기록</h3>
      <ul className={styles.list}>
        {recent.map((entry) => (
          <li key={entry.id} className={styles.entry}>
            {entry.message}
          </li>
        ))}
        {recent.length === 0 && (
          <li className={styles.empty}>아직 기록이 없습니다</li>
        )}
      </ul>
    </div>
  );
}
