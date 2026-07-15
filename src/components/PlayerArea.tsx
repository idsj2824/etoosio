import type { Player } from "../game/types";
import { TileCard } from "./TileCard";
import styles from "./PlayerArea.module.css";

interface PlayerAreaProps {
  player: Player;
  isCurrentTurn: boolean;
  position: "top" | "left" | "right" | "bottom";
}

export function PlayerArea({
  player,
  isCurrentTurn,
  position,
}: PlayerAreaProps) {
  const isHuman = player.type === "human";

  return (
    <div
      className={`${styles.player} ${styles[position]} ${isCurrentTurn ? styles.active : ""}`}
    >
      <div className={styles.header}>
        <span className={styles.name}>{player.name}</span>
        <span className={styles.count}>{player.hand.length}장</span>
        {isCurrentTurn && <span className={styles.turnBadge}>차례</span>}
      </div>
      {!isHuman && (
        <div className={styles.tiles}>
          {player.hand.map((tile) => (
            <TileCard key={tile.id} tile={tile} faceDown compact />
          ))}
        </div>
      )}
    </div>
  );
}
