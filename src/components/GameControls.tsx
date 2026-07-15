import styles from "./GameControls.module.css";

interface GameControlsProps {
  playStatus: "idle" | "invalid" | "tooWeak" | "ready" | "mustPlay";
  isHumanTurn: boolean;
  isNewLead: boolean;
  onPlay: () => void;
  onPass: () => void;
  onClear: () => void;
  onHint: () => void;
  onSortNumber: () => void;
  onSortRank: () => void;
}

export function GameControls({
  playStatus,
  isHumanTurn,
  isNewLead,
  onPlay,
  onPass,
  onClear,
  onHint,
  onSortNumber,
  onSortRank,
}: GameControlsProps) {
  const statusMessage = () => {
    if (!isHumanTurn) return "상대의 차례입니다...";
    if (playStatus === "invalid") return "유효하지 않은 조합입니다";
    if (playStatus === "tooWeak")
      return "이전 조합보다 높은 조합을 내야 합니다";
    if (playStatus === "mustPlay") return "선이므로 반드시 조합을 내야 합니다";
    if (playStatus === "ready") return "내기 준비 완료!";
    return "타일을 선택하거나 패스하세요";
  };

  return (
    <div className={styles.controls}>
      <p className={styles.status}>{statusMessage()}</p>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.primary}
          onClick={onPlay}
          disabled={!isHumanTurn || playStatus !== "ready"}
        >
          내기
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={onPass}
          disabled={!isHumanTurn || isNewLead}
          title={isNewLead ? "선일 때는 패스할 수 없습니다" : ""}
        >
          패스
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={onClear}
          disabled={!isHumanTurn}
        >
          선택 초기화
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={onHint}
          disabled={!isHumanTurn}
        >
          힌트
        </button>
        <button
          type="button"
          className={styles.tertiary}
          onClick={onSortNumber}
        >
          숫자순 정렬
        </button>
        <button
          type="button"
          className={styles.tertiary}
          onClick={onSortRank}
        >
          직급순 정렬
        </button>
      </div>
    </div>
  );
}
