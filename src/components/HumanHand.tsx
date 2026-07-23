import type { Tile } from "../game/types";
import { evaluateCombination, getCombinationLabel } from "../game/combination";
import { TileCard } from "./TileCard";
import styles from "./HumanHand.module.css";

interface HumanHandProps {
  hand: Tile[];
  selectedIds: string[];
  hintIds: string[];
  playerCount: number;
  onSelect: (id: string) => void;
}

export function HumanHand({
  hand,
  selectedIds,
  hintIds,
  playerCount,
  onSelect,
}: HumanHandProps) {
  const selected = hand.filter((t) => selectedIds.includes(t.id));
  const evaluated =
    selected.length > 0
      ? evaluateCombination(selected, playerCount)
      : null;

  const compact = hand.length > 10;

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        {selected.length > 0 && evaluated && (
          <span
            className={`${styles.badge} ${
              evaluated.type === "INVALID"
                ? styles.invalid
                : styles.valid
            }`}
          >
            {evaluated.type === "INVALID"
              ? "유효하지 않은 조합입니다"
              : getCombinationLabel(evaluated)}
          </span>
        )}
        {selected.length === 0 && (
          <span className={styles.hint}>타일을 선택하세요</span>
        )}
      </div>
      <div className={`${styles.hand} ${compact ? styles.compactHand : ""}`}>
        {hand.map((tile) => (
          <TileCard
            key={tile.id}
            tile={tile}
            selected={selectedIds.includes(tile.id)}
            hinted={hintIds.includes(tile.id)}
            onClick={() => onSelect(tile.id)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
