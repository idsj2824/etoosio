import { compareCombinations } from "./comparison";
import {
  findAllPlayableCombinations,
} from "./playableMoves";
import { getNumberStrengthValue } from "./combination";
import type { Combination, GameState, Tile } from "./types";

const STRONG_TYPES = new Set([
  "STRAIGHT_FLUSH",
  "FOUR_OF_A_KIND",
  "FULL_HOUSE",
]);

const HIGH_NUMBERS = new Set([1, 2]);

export function chooseComputerMove(
  hand: Tile[],
  currentCombination: Combination | null,
  gameState: GameState
): Combination | null {
  const { playerCount } = gameState;
  const allPlayable = findAllPlayableCombinations(
    hand,
    currentCombination,
    playerCount
  );

  if (allPlayable.length === 0) return null;

  const handCount = hand.length;
  const opponentsLowHand = gameState.players.some(
    (p) => p.type === "human" && p.hand.length <= 3 && p.hand.length > 0
  ) || gameState.players.some(
    (p) => p.type === "computer" && p.id !== gameState.players[gameState.currentPlayerIndex].id && p.hand.length <= 3 && p.hand.length > 0
  );

  if (handCount <= 2) {
    return findBestFinishingMove(allPlayable, hand);
  }

  if (!currentCombination) {
    return chooseLeadMove(hand, allPlayable, handCount, opponentsLowHand);
  }

  return chooseResponseMove(
    hand,
    allPlayable,
    currentCombination,
    handCount,
    opponentsLowHand
  );
}

function findBestFinishingMove(
  playable: Combination[],
  hand: Tile[]
): Combination {
  const maxTiles = Math.max(...playable.map((c) => c.tiles.length));
  const maxTileMoves = playable.filter((c) => c.tiles.length === maxTiles);

  if (maxTileMoves.some((c) => c.tiles.length === hand.length)) {
    return maxTileMoves.find((c) => c.tiles.length === hand.length)!;
  }

  return maxTileMoves.reduce((best, cur) =>
    compareCombinations(cur, best) > 0 ? cur : best
  );
}

function chooseLeadMove(
  _hand: Tile[],
  playable: Combination[],
  handCount: number,
  aggressive: boolean
): Combination {
  if (handCount >= 8 && !aggressive) {
    const fiveCard = playable.filter((c) => c.tiles.length === 5);
    if (fiveCard.length > 0) {
      const safe = fiveCard.filter((c) => !isStrongCombo(c) && !usesHighCards(c));
      if (safe.length > 0) {
        return findWeakestInList(safe);
      }
    }
  }

  const singles = playable.filter((c) => c.type === "SINGLE");
  const safeSingles = singles.filter((c) => !usesHighCards(c));
  if (safeSingles.length > 0) {
    return findWeakestInList(safeSingles);
  }

  const nonStrong = playable.filter((c) => !isStrongCombo(c) && !usesHighCards(c));
  if (nonStrong.length > 0) {
    return findWeakestInList(nonStrong);
  }

  return findWeakestInList(playable);
}

function chooseResponseMove(
  _hand: Tile[],
  playable: Combination[],
  current: Combination,
  handCount: number,
  aggressive: boolean
): Combination | null {
  const weakest = findWeakestInList(playable);

  if (!aggressive && handCount > 4) {
    if (isStrongCombo(weakest) && hasWeakerAlternative(playable, weakest)) {
      const alternatives = playable.filter((c) => !isStrongCombo(c));
      if (alternatives.length > 0) {
        const alt = findWeakestInList(alternatives);
        if (Math.random() < 0.3) return null;
        return alt;
      }
      if (Math.random() < 0.5) return null;
    }

    if (usesHighCards(weakest) && hasNonHighAlternative(playable)) {
      const alt = findWeakestInList(
        playable.filter((c) => !usesHighCards(c))
      );
      if (Math.random() < 0.4) return null;
      return alt;
    }
  }

  if (handCount >= 6 && current.tiles.length < 5) {
    const fiveCard = playable.filter((c) => c.tiles.length === 5);
    if (fiveCard.length > 0 && (aggressive || handCount >= 8)) {
      const safe = fiveCard.filter((c) => !isStrongCombo(c));
      if (safe.length > 0) return findWeakestInList(safe);
      if (aggressive) return findWeakestInList(fiveCard);
    }
  }

  if (!aggressive && handCount > 6 && Math.random() < 0.15) {
    return null;
  }

  return weakest;
}

function findWeakestInList(combos: Combination[]): Combination {
  return combos.reduce((weakest, cur) =>
    compareCombinations(cur, weakest) < 0 ? cur : weakest
  );
}

function isStrongCombo(combo: Combination): boolean {
  return STRONG_TYPES.has(combo.type);
}

function usesHighCards(combo: Combination): boolean {
  return combo.tiles.some((t) => HIGH_NUMBERS.has(t.number));
}

function hasWeakerAlternative(
  playable: Combination[],
  weakest: Combination
): boolean {
  return playable.some(
    (c) => !isStrongCombo(c) && compareCombinations(c, weakest) > 0
  );
}

function hasNonHighAlternative(playable: Combination[]): boolean {
  return playable.some((c) => !usesHighCards(c));
}

export function getComboPriority(combo: Combination): number {
  let priority = combo.tiles.length * 10;
  if (isStrongCombo(combo)) priority += 50;
  if (usesHighCards(combo)) priority += 30;
  const avgStrength =
    combo.tiles.reduce((s, t) => s + getNumberStrengthValue(t.number), 0) /
    combo.tiles.length;
  priority += avgStrength;
  return priority;
}
