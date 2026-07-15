import { RANKS } from "./constants";
import type { Tile } from "./types";
import { getMaxNumber, getTilesPerPlayer } from "./constants";

export function createDeck(playerCount: number): Tile[] {
  const maxNumber = getMaxNumber(playerCount);
  const deck: Tile[] = [];
  let idCounter = 0;

  for (const rank of RANKS) {
    for (let num = 1; num <= maxNumber; num++) {
      deck.push({
        id: `tile-${idCounter++}`,
        number: num,
        rank,
      });
    }
  }

  return deck;
}

export function shuffleDeck(deck: Tile[]): Tile[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => {
    const numDiff =
      getNumberStrength(a.number) - getNumberStrength(b.number);
    if (numDiff !== 0) return numDiff;
    return getRankStrength(a.rank) - getRankStrength(b.rank);
  });
}

export function sortTilesByRank(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => {
    const rankDiff = getRankStrength(a.rank) - getRankStrength(b.rank);
    if (rankDiff !== 0) return rankDiff;
    return getNumberStrength(a.number) - getNumberStrength(b.number);
  });
}

function getNumberStrength(num: number): number {
  const order = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 1, 2];
  return order.indexOf(num);
}

function getRankStrength(rank: string): number {
  const order = ["EMPLOYEE", "ASSISTANT_MANAGER", "MANAGER", "DIRECTOR"];
  return order.indexOf(rank);
}

export function dealTiles(
  deck: Tile[],
  playerCount: number
): Tile[][] {
  const tilesPerPlayer = getTilesPerPlayer(playerCount);
  const hands: Tile[][] = [];

  for (let i = 0; i < playerCount; i++) {
    hands.push(deck.slice(i * tilesPerPlayer, (i + 1) * tilesPerPlayer));
  }

  return hands;
}

export function findStartingPlayerIndex(hands: Tile[][]): number {
  for (let i = 0; i < hands.length; i++) {
    const hasEmployee3 = hands[i].some(
      (t) => t.rank === "EMPLOYEE" && t.number === 3
    );
    if (hasEmployee3) return i;
  }
  return 0;
}
