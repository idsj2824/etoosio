import type { Combination } from "../game/types";
import { getCombinationLabel } from "../game/combination";
import { TileCard } from "./TileCard";
import styles from "./PlayedCombination.module.css";

interface PlayedCombinationProps {
  combination: Combination | null;
  playedBy?: string;
}

export function PlayedCombination({
  combination,
  playedBy,
}: PlayedCombinationProps) {
  if (!combination) {
    return (
      <div className={styles.empty}>
        <p>바닥이 비어 있습니다</p>
        <p className={styles.sub}>선 플레이어가 조합을 낼 차례입니다</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        {getCombinationLabel(combination)}
        {playedBy && <span className={styles.player}> — {playedBy}</span>}
      </div>
      <div className={styles.tiles}>
        {combination.tiles.map((tile) => (
          <TileCard key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
}
