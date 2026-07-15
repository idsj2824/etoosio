import type { Rank } from "./types";

export const GAME_NAME = "이투시오";
export const GAME_SUBTITLE = "먼저 퇴근할 사람은 누구?";
export const TOTAL_ROUNDS = 5;
export const STORAGE_KEY = "etoosio-save";

export const RANKS: Rank[] = [
  "EMPLOYEE",
  "ASSISTANT_MANAGER",
  "MANAGER",
  "DIRECTOR",
];

export const RANK_LABELS: Record<Rank, string> = {
  EMPLOYEE: "사원",
  ASSISTANT_MANAGER: "대리",
  MANAGER: "과장",
  DIRECTOR: "부장",
};

export const RANK_ICONS: Record<Rank, string> = {
  EMPLOYEE: "▣",
  ASSISTANT_MANAGER: "💼",
  MANAGER: "📊",
  DIRECTOR: "👔",
};

export const RANK_STRENGTH: Record<Rank, number> = {
  EMPLOYEE: 0,
  ASSISTANT_MANAGER: 1,
  MANAGER: 2,
  DIRECTOR: 3,
};

/** 숫자 강도: 3이 가장 낮고 2가 가장 높음 */
export const NUMBER_STRENGTH: Record<number, number> = {
  3: 0,
  4: 1,
  5: 2,
  6: 3,
  7: 4,
  8: 5,
  9: 6,
  10: 7,
  11: 8,
  12: 9,
  13: 10,
  14: 11,
  15: 12,
  1: 13,
  2: 14,
};

/** 스트레이트에서 숫자 순서 (2 제외) */
export const STRAIGHT_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 1] as const;

export const COMBINATION_TYPE_LABELS: Record<string, string> = {
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

export const FIVE_CARD_TYPE_RANK: Record<string, number> = {
  STRAIGHT: 1,
  FLUSH: 2,
  FULL_HOUSE: 3,
  FOUR_OF_A_KIND: 4,
  STRAIGHT_FLUSH: 5,
};

export const COMPUTER_NAMES = ["김대리", "박과장", "이부장", "최사원"];

export function getMaxNumber(playerCount: number): number {
  switch (playerCount) {
    case 3:
      return 9;
    case 4:
      return 13;
    case 5:
      return 15;
    default:
      return 15;
  }
}

export function getTilesPerPlayer(playerCount: number): number {
  switch (playerCount) {
    case 3:
      return 12;
    case 4:
      return 13;
    case 5:
      return 12;
    default:
      return 12;
  }
}

export function getWrapStraightEnd(playerCount: number): number[] {
  switch (playerCount) {
    case 3:
      return [6, 7, 8, 9, 1];
    case 4:
      return [10, 11, 12, 13, 1];
    case 5:
      return [12, 13, 14, 15, 1];
    default:
      return [12, 13, 14, 15, 1];
  }
}
