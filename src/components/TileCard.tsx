import type { Tile } from "../game/types";
import { RANK_LABELS } from "../game/constants";
import styles from "./TileCard.module.css";

interface TileCardProps {
  tile: Tile;
  selected?: boolean;
  hinted?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

export function TileCard({
  tile,
  selected = false,
  hinted = false,
  faceDown = false,
  onClick,
  compact = false,
  className = '',
}: TileCardProps) {
  if (faceDown) {
    return (
      <div
        className={`${styles.tile} ${styles.faceDown} ${compact ? styles.compact : ""} ${className}`}
        aria-label="뒷면 타일"
      >
        <div className={styles.cardInner}>
          <div className={styles.backBadge}>
            <span className={styles.backIcon}>🏢</span>
            <span className={styles.backText}>이투시오</span>
          </div>
        </div>
      </div>
    );
  }

  const rankClass = styles[tile.rank.toLowerCase().replace(/_/g, "-")];

  const TileComponent = onClick ? 'button' : 'div';
  const buttonProps = onClick ? {
    type: 'button' as const,
    onClick,
    'aria-label': `${RANK_LABELS[tile.rank]} ${tile.number}`,
    'aria-pressed': selected,
  } : {};

  return (
    <TileComponent
      className={`${styles.tile} ${rankClass} ${selected ? styles.selected : ""} ${hinted ? styles.hinted : ""} ${compact ? styles.compact : ""} ${className}`}
      {...buttonProps}
    >
      <div className={styles.topCap} />
      <div className={styles.cardHeader}>
        <span className={styles.rank}>{RANK_LABELS[tile.rank]}</span>
      </div>
      <div className={styles.cardNumber}>
        <span className={styles.number}>{tile.number}</span>
      </div>
    </TileComponent>
  );
}
