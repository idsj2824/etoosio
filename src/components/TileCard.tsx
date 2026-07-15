import type { Tile } from "../game/types";
import { RANK_LABELS, RANK_ICONS } from "../game/constants";
import styles from "./TileCard.module.css";

interface TileCardProps {
  tile: Tile;
  selected?: boolean;
  hinted?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function TileCard({
  tile,
  selected = false,
  hinted = false,
  faceDown = false,
  onClick,
  compact = false,
}: TileCardProps) {
  if (faceDown) {
    return (
      <div
        className={`${styles.tile} ${styles.faceDown} ${compact ? styles.compact : ""}`}
        aria-label="뒷면 타일"
      >
        <span className={styles.backPattern}>이투시오</span>
      </div>
    );
  }

  const rankClass = styles[tile.rank.toLowerCase().replace(/_/g, "-")];

  return (
    <button
      type="button"
      className={`${styles.tile} ${rankClass} ${selected ? styles.selected : ""} ${hinted ? styles.hinted : ""} ${compact ? styles.compact : ""}`}
      onClick={onClick}
      aria-label={`${RANK_LABELS[tile.rank]} ${tile.number}`}
      aria-pressed={selected}
    >
      <span className={styles.icon}>{RANK_ICONS[tile.rank]}</span>
      <span className={styles.rank}>{RANK_LABELS[tile.rank]}</span>
      <span className={styles.number}>{tile.number}</span>
    </button>
  );
}
