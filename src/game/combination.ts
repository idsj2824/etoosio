import {
  FIVE_CARD_TYPE_RANK,
  NUMBER_STRENGTH,
  RANK_STRENGTH,
  STRAIGHT_ORDER,
  getMaxNumber,
  getWrapStraightEnd,
} from "./constants";
import type { Combination, CombinationType, Tile } from "./types";

export function getNumberStrengthValue(num: number): number {
  return NUMBER_STRENGTH[num] ?? -1;
}

export function getRankStrengthValue(rank: string): number {
  return RANK_STRENGTH[rank as keyof typeof RANK_STRENGTH] ?? -1;
}

export function compareTiles(a: Tile, b: Tile): number {
  const numDiff = getNumberStrengthValue(a.number) - getNumberStrengthValue(b.number);
  if (numDiff !== 0) return numDiff;
  return getRankStrengthValue(a.rank) - getRankStrengthValue(b.rank);
}

export function evaluateCombination(
  tiles: Tile[],
  playerCount: number
): Combination {
  const count = tiles.length;

  if (count === 0) {
    return { type: "INVALID", tiles, strength: [] };
  }

  if (count === 1) {
    return evaluateSingle(tiles);
  }

  if (count === 2) {
    return evaluatePair(tiles);
  }

  if (count === 3) {
    return evaluateTriple(tiles);
  }

  if (count === 4) {
    return { type: "INVALID", tiles, strength: [] };
  }

  if (count === 5) {
    return evaluateFiveCard(tiles, playerCount);
  }

  return { type: "INVALID", tiles, strength: [] };
}

function evaluateSingle(tiles: Tile[]): Combination {
  const tile = tiles[0];
  return {
    type: "SINGLE",
    tiles,
    strength: [
      getNumberStrengthValue(tile.number),
      getRankStrengthValue(tile.rank),
    ],
  };
}

function evaluatePair(tiles: Tile[]): Combination {
  if (tiles[0].number !== tiles[1].number) {
    return { type: "INVALID", tiles, strength: [] };
  }

  const sorted = [...tiles].sort(
    (a, b) => getRankStrengthValue(b.rank) - getRankStrengthValue(a.rank)
  );

  return {
    type: "PAIR",
    tiles,
    strength: [
      getNumberStrengthValue(tiles[0].number),
      getRankStrengthValue(sorted[0].rank),
      getRankStrengthValue(sorted[1].rank),
    ],
  };
}

function evaluateTriple(tiles: Tile[]): Combination {
  if (
    tiles[0].number !== tiles[1].number ||
    tiles[1].number !== tiles[2].number
  ) {
    return { type: "INVALID", tiles, strength: [] };
  }

  const sorted = [...tiles].sort(
    (a, b) => getRankStrengthValue(b.rank) - getRankStrengthValue(a.rank)
  );

  return {
    type: "TRIPLE",
    tiles,
    strength: [
      getNumberStrengthValue(tiles[0].number),
      getRankStrengthValue(sorted[0].rank),
      getRankStrengthValue(sorted[1].rank),
      getRankStrengthValue(sorted[2].rank),
    ],
  };
}

function evaluateFiveCard(tiles: Tile[], playerCount: number): Combination {
  const straightFlush = detectStraightFlush(tiles, playerCount);
  if (straightFlush) return straightFlush;

  const fourOfAKind = detectFourOfAKind(tiles);
  if (fourOfAKind) return fourOfAKind;

  const fullHouse = detectFullHouse(tiles);
  if (fullHouse) return fullHouse;

  const flush = detectFlush(tiles);
  if (flush) return flush;

  const straight = detectStraight(tiles, playerCount);
  if (straight) return straight;

  return { type: "INVALID", tiles, strength: [] };
}

function detectStraightFlush(
  tiles: Tile[],
  playerCount: number
): Combination | null {
  const allSameRank = tiles.every((t) => t.rank === tiles[0].rank);
  if (!allSameRank) return null;

  const straight = detectStraight(tiles, playerCount);
  if (!straight || straight.type !== "STRAIGHT") return null;

  return {
    type: "STRAIGHT_FLUSH",
    tiles,
    strength: [
      FIVE_CARD_TYPE_RANK.STRAIGHT_FLUSH,
      ...straight.strength,
    ],
  };
}

function detectFourOfAKind(tiles: Tile[]): Combination | null {
  const byNumber = groupByNumber(tiles);
  const quadEntry = Object.entries(byNumber).find(([, ts]) => ts.length === 4);

  if (!quadEntry) return null;

  const quadNum = parseInt(quadEntry[0], 10);
  return {
    type: "FOUR_OF_A_KIND",
    tiles,
    strength: [
      FIVE_CARD_TYPE_RANK.FOUR_OF_A_KIND,
      getNumberStrengthValue(quadNum),
    ],
  };
}

function detectFullHouse(tiles: Tile[]): Combination | null {
  const byNumber = groupByNumber(tiles);
  const groups = Object.entries(byNumber).map(([num, ts]) => ({
    num: parseInt(num, 10),
    count: ts.length,
  }));

  const triple = groups.find((g) => g.count === 3);
  const pair = groups.find((g) => g.count === 2);

  if (!triple || !pair) return null;

  return {
    type: "FULL_HOUSE",
    tiles,
    strength: [
      FIVE_CARD_TYPE_RANK.FULL_HOUSE,
      getNumberStrengthValue(triple.num),
    ],
  };
}

function detectFlush(tiles: Tile[]): Combination | null {
  const allSameRank = tiles.every((t) => t.rank === tiles[0].rank);
  if (!allSameRank) return null;

  const sorted = [...tiles].sort(
    (a, b) => getNumberStrengthValue(b.number) - getNumberStrengthValue(a.number)
  );

  const strength: number[] = [FIVE_CARD_TYPE_RANK.FLUSH];
  for (const t of sorted) {
    strength.push(getNumberStrengthValue(t.number));
  }
  strength.push(getRankStrengthValue(tiles[0].rank));

  return { type: "FLUSH", tiles, strength };
}

function detectStraight(tiles: Tile[], playerCount: number): Combination | null {
  if (tiles.some((t) => t.number === 2)) return null;

  const numbers = tiles.map((t) => t.number).sort((a, b) => a - b);
  const uniqueNumbers = [...new Set(numbers)];

  if (uniqueNumbers.length !== 5) return null;

  const maxNum = getMaxNumber(playerCount);
  const validStraightNumbers: number[] = STRAIGHT_ORDER.filter(
    (n) => n <= maxNum || n === 1
  );

  const wrapStraight = getWrapStraightEnd(playerCount);
  const isWrap = arraysEqual(
    [...uniqueNumbers].sort((a, b) => a - b),
    [...wrapStraight].sort((a, b) => a - b)
  );

  if (isWrap) {
    return buildStraightStrength(tiles, wrapStraight, playerCount);
  }

  const indices = uniqueNumbers.map((n) => validStraightNumbers.indexOf(n));
  if (indices.some((i) => i === -1)) return null;

  indices.sort((a, b) => a - b);
  const isConsecutive = indices.every(
    (val, i) => i === 0 || val === indices[i - 1] + 1
  );

  if (!isConsecutive) return null;

  const straightSequence = indices.map((i) => validStraightNumbers[i]);
  return buildStraightStrength(tiles, straightSequence, playerCount);
}

function buildStraightStrength(
  tiles: Tile[],
  sequence: number[],
  _playerCount: number
): Combination {
  const sortedByStrength = [...sequence].sort(
    (a, b) => getNumberStrengthValue(b) - getNumberStrengthValue(a)
  );
  const topNumber = sortedByStrength[0];

  const topTile = tiles
    .filter((t) => t.number === topNumber)
    .sort((a, b) => getRankStrengthValue(b.rank) - getRankStrengthValue(a.rank))[0];

  const strength: number[] = [
    FIVE_CARD_TYPE_RANK.STRAIGHT,
    getNumberStrengthValue(topNumber),
    getRankStrengthValue(topTile.rank),
  ];

  for (const num of sortedByStrength) {
    const tileForNum = tiles
      .filter((t) => t.number === num)
      .sort((a, b) => getRankStrengthValue(b.rank) - getRankStrengthValue(a.rank))[0];
    strength.push(getRankStrengthValue(tileForNum.rank));
  }

  return { type: "STRAIGHT", tiles, strength };
}

function groupByNumber(tiles: Tile[]): Record<number, Tile[]> {
  const groups: Record<number, Tile[]> = {};
  for (const tile of tiles) {
    if (!groups[tile.number]) groups[tile.number] = [];
    groups[tile.number].push(tile);
  }
  return groups;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

export function getCombinationLabel(combination: Combination): string {
  if (combination.type === "INVALID") return "유효하지 않은 조합";

  const labels: Record<CombinationType, string> = {
    SINGLE: "싱글",
    PAIR: "페어",
    TRIPLE: "트리플",
    STRAIGHT: "스트레이트",
    FLUSH: "플러시",
    FULL_HOUSE: "풀하우스",
    FOUR_OF_A_KIND: "포카드",
    STRAIGHT_FLUSH: "스트레이트 플러시",
    INVALID: "유효하지 않은 조합",
  };

  return labels[combination.type];
}

export function getCombinationDescription(combination: Combination): string {
  const label = getCombinationLabel(combination);
  if (combination.type === "SINGLE") {
    const t = combination.tiles[0];
    return `${label} (${getRankLabel(t.rank)} ${t.number})`;
  }
  if (combination.type === "PAIR" || combination.type === "TRIPLE") {
    return `${label} (숫자 ${combination.tiles[0].number})`;
  }
  return label;
}

function getRankLabel(rank: string): string {
  const labels: Record<string, string> = {
    EMPLOYEE: "사원",
    ASSISTANT_MANAGER: "대리",
    MANAGER: "과장",
    DIRECTOR: "부장",
  };
  return labels[rank] ?? rank;
}
