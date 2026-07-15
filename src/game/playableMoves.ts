import { evaluateCombination } from "./combination";
import { compareCombinations } from "./comparison";
import type { Combination, Tile } from "./types";

export function canPlayCombination(
  selectedTiles: Tile[],
  currentCombination: Combination | null,
  playerCount: number
): boolean {
  const count = selectedTiles.length;

  if (count === 4) return false;
  if (![1, 2, 3, 5].includes(count)) return false;

  const evaluated = evaluateCombination(selectedTiles, playerCount);
  if (evaluated.type === "INVALID") return false;

  if (!currentCombination) return true;

  if (currentCombination.type === "INVALID") return true;

  if (selectedTiles.length !== currentCombination.tiles.length) return false;

  return compareCombinations(evaluated, currentCombination) > 0;
}

function getCombinationsOfSize(
  hand: Tile[],
  size: number
): Tile[][] {
  if (size === 1) return hand.map((t) => [t]);
  if (size > hand.length) return [];

  const results: Tile[][] = [];

  function combine(start: number, current: Tile[]) {
    if (current.length === size) {
      results.push([...current]);
      return;
    }
    for (let i = start; i <= hand.length - (size - current.length); i++) {
      current.push(hand[i]);
      combine(i + 1, current);
      current.pop();
    }
  }

  combine(0, []);
  return results;
}

export function findAllPlayableCombinations(
  hand: Tile[],
  currentCombination: Combination | null,
  playerCount: number
): Combination[] {
  const sizes = currentCombination
    ? [currentCombination.tiles.length]
    : [1, 2, 3, 5];

  const playable: Combination[] = [];
  const seen = new Set<string>();

  for (const size of sizes) {
    const combos = getCombinationsOfSize(hand, size);
    for (const tiles of combos) {
      const evaluated = evaluateCombination(tiles, playerCount);
      if (evaluated.type === "INVALID") continue;

      if (currentCombination) {
        if (compareCombinations(evaluated, currentCombination) <= 0) continue;
      }

      const key = tiles
        .map((t) => t.id)
        .sort()
        .join(",");
      if (seen.has(key)) continue;
      seen.add(key);

      playable.push(evaluated);
    }
  }

  return playable;
}

export function findWeakestPlayable(
  hand: Tile[],
  currentCombination: Combination | null,
  playerCount: number
): Combination | null {
  const all = findAllPlayableCombinations(hand, currentCombination, playerCount);
  if (all.length === 0) return null;

  return all.reduce((weakest, current) => {
    if (compareCombinations(current, weakest) < 0) return current;
    return weakest;
  });
}
