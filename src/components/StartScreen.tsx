import { useState } from "react";
import { GAME_NAME, GAME_SUBTITLE } from "../game/constants";
import styles from "./StartScreen.module.css";

interface StartScreenProps {
  savedGameExists: boolean;
  onStart: (playerCount: number) => void;
  onContinue: () => void;
  onShowRules: () => void;
  onOnlinePlay: () => void;
}

export function StartScreen({
  savedGameExists,
  onStart,
  onContinue,
  onShowRules,
  onOnlinePlay,
}: StartScreenProps) {
  const [playerCount, setPlayerCount] = useState(5);

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <h1>{GAME_NAME}</h1>
          <p className={styles.subtitle}>{GAME_SUBTITLE}</p>
        </div>

        <div className={styles.players}>
          <span className={styles.label}>인원 선택</span>
          <div className={styles.playerButtons}>
            {[3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={playerCount === n ? styles.active : ""}
                onClick={() => setPlayerCount(n)}
              >
                {n}명
              </button>
            ))}
          </div>
          <p className={styles.playerInfo}>
            나 + 컴퓨터 {playerCount - 1}명 (김대리, 박과장, 이부장, 최사원)
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onStart(playerCount)}
          >
            싱글 플레이
          </button>
          <button
            type="button"
            className={styles.online}
            onClick={onOnlinePlay}
          >
            온라인 플레이
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={onContinue}
            disabled={!savedGameExists}
          >
            이어하기
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={onShowRules}
          >
            게임 방법
          </button>
        </div>
      </div>
    </div>
  );
}
