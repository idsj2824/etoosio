import { useState } from "react";
import { GAME_NAME, GAME_SUBTITLE } from "../game/constants";
import { UserProfileCard } from "./UserProfileCard";
import type { UserProfile } from "../game/level";
import styles from "./StartScreen.module.css";

interface StartScreenProps {
  savedGameExists: boolean;
  userProfile: UserProfile;
  onStart: (playerCount: number) => void;
  onContinue: () => void;
  onOnlinePlay: () => void;
  onOpenSaveCodeModal: () => void;
}

export function StartScreen({
  savedGameExists,
  userProfile,
  onStart,
  onContinue,
  onOnlinePlay,
  onOpenSaveCodeModal,
}: StartScreenProps) {
  const [playerCount, setPlayerCount] = useState(5);

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src="/app_icon.jpg" alt="이투시오 로고" className={styles.logoIcon} />
          <h1>{GAME_NAME}</h1>
          <p className={styles.subtitle}>{GAME_SUBTITLE}</p>
        </div>

        {/* 유저 프로필 카드 */}
        <UserProfileCard
          profile={userProfile}
          onOpenSaveCodeModal={onOpenSaveCodeModal}
        />

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
          <a
            href="/tutorial.html"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.tutorial}
          >
            📖 처음이라면? 튜토리얼
          </a>
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
        </div>
      </div>
    </div>
  );
}
