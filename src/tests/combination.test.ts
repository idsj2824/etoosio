import { describe, it, expect } from "vitest";
import {
  getNumberStrengthValue,
  compareTiles,
  evaluateCombination,
} from "../game/combination";
import { compareCombinations } from "../game/comparison";
import { canPlayCombination } from "../game/playableMoves";
import { calculateRoundScores, getTotalScoreSum } from "../game/scoring";
import type { Tile } from "../game/types";

function makeTile(number: number, rank: Tile["rank"], id?: string): Tile {
  return { id: id ?? `t-${number}-${rank}`, number, rank };
}

describe("숫자 강도", () => {
  it("2가 1보다 높다", () => {
    expect(getNumberStrengthValue(2)).toBeGreaterThan(
      getNumberStrengthValue(1)
    );
  });

  it("1이 15보다 높다", () => {
    expect(getNumberStrengthValue(1)).toBeGreaterThan(
      getNumberStrengthValue(15)
    );
  });

  it("3이 가장 낮다", () => {
    expect(getNumberStrengthValue(3)).toBeLessThan(
      getNumberStrengthValue(4)
    );
  });
});

describe("직급 강도", () => {
  it("같은 숫자에서 부장이 과장보다 높다", () => {
    const director = makeTile(8, "DIRECTOR");
    const manager = makeTile(8, "MANAGER");
    expect(compareTiles(director, manager)).toBeGreaterThan(0);
  });

  it("사원 9가 부장 8보다 높다", () => {
    const emp9 = makeTile(9, "EMPLOYEE");
    const dir8 = makeTile(8, "DIRECTOR");
    expect(compareTiles(emp9, dir8)).toBeGreaterThan(0);
  });
});

describe("페어 판정", () => {
  it("유효한 페어", () => {
    const tiles = [makeTile(7, "EMPLOYEE"), makeTile(7, "MANAGER")];
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("PAIR");
  });

  it("잘못된 페어", () => {
    const tiles = [makeTile(7, "EMPLOYEE"), makeTile(8, "EMPLOYEE")];
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("INVALID");
  });
});

describe("트리플 판정", () => {
  it("유효한 트리플", () => {
    const tiles = [
      makeTile(5, "EMPLOYEE"),
      makeTile(5, "MANAGER"),
      makeTile(5, "DIRECTOR"),
    ];
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("TRIPLE");
  });
});

describe("스트레이트 판정", () => {
  it("일반 스트레이트", () => {
    const ranks: Tile["rank"][] = ["EMPLOYEE", "ASSISTANT_MANAGER", "MANAGER", "DIRECTOR", "EMPLOYEE"];
    const tiles = [3, 4, 5, 6, 7].map((n, i) =>
      makeTile(n, ranks[i], `s${i}`)
    );
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("STRAIGHT");
  });

  it("5명 게임 12,13,14,15,1 스트레이트", () => {
    const ranks: Tile["rank"][] = ["EMPLOYEE", "ASSISTANT_MANAGER", "MANAGER", "DIRECTOR", "EMPLOYEE"];
    const tiles = [12, 13, 14, 15, 1].map((n, i) =>
      makeTile(n, ranks[i], `w${i}`)
    );
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("STRAIGHT");
  });

  it("13,14,15,1,2 무효", () => {
    const ranks: Tile["rank"][] = ["EMPLOYEE", "ASSISTANT_MANAGER", "MANAGER", "DIRECTOR", "EMPLOYEE"];
    const tiles = [13, 14, 15, 1, 2].map((n, i) =>
      makeTile(n, ranks[i], `x${i}`)
    );
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("INVALID");
  });

  it("숫자 2 포함 스트레이트 무효", () => {
    const ranks: Tile["rank"][] = ["EMPLOYEE", "ASSISTANT_MANAGER", "MANAGER", "DIRECTOR", "EMPLOYEE"];
    const tiles = [3, 4, 5, 6, 2].map((n, i) =>
      makeTile(n, ranks[i], `y${i}`)
    );
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("INVALID");
  });
});

describe("5장 조합", () => {
  it("플러시 판정", () => {
    const tiles = [3, 7, 9, 11, 15].map((n, i) =>
      makeTile(n, "DIRECTOR", `f${i}`)
    );
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("FLUSH");
  });

  it("풀하우스 판정", () => {
    const tiles = [
      makeTile(8, "EMPLOYEE"),
      makeTile(8, "MANAGER"),
      makeTile(8, "DIRECTOR"),
      makeTile(11, "EMPLOYEE"),
      makeTile(11, "ASSISTANT_MANAGER"),
    ];
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("FULL_HOUSE");
  });

  it("포카드 판정", () => {
    const tiles = [
      makeTile(6, "EMPLOYEE"),
      makeTile(6, "ASSISTANT_MANAGER"),
      makeTile(6, "MANAGER"),
      makeTile(6, "DIRECTOR"),
      makeTile(9, "EMPLOYEE"),
    ];
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("FOUR_OF_A_KIND");
  });

  it("스트레이트 플러시 판정", () => {
    const tiles = [8, 9, 10, 11, 12].map((n, i) =>
      makeTile(n, "MANAGER", `sf${i}`)
    );
    const combo = evaluateCombination(tiles, 5);
    expect(combo.type).toBe("STRAIGHT_FLUSH");
  });
});

describe("조합 비교", () => {
  it("서로 다른 종류 5장 조합 비교", () => {
    const ranks1: Tile["rank"][] = ["EMPLOYEE", "ASSISTANT_MANAGER", "MANAGER", "DIRECTOR", "EMPLOYEE"];
    const straight = evaluateCombination(
      [3, 4, 5, 6, 7].map((n, i) => makeTile(n, ranks1[i], `a${i}`)),
      5
    );
    const flush = evaluateCombination(
      [3, 7, 9, 11, 15].map((n, i) => makeTile(n, "DIRECTOR", `b${i}`)),
      5
    );
    expect(compareCombinations(flush, straight)).toBeGreaterThan(0);
  });

  it("같은 종류 세부 비교 - 싱글", () => {
    const a = evaluateCombination([makeTile(9, "EMPLOYEE")], 5);
    const b = evaluateCombination([makeTile(8, "DIRECTOR")], 5);
    expect(compareCombinations(a, b)).toBeGreaterThan(0);
  });
});

describe("제출 가능 여부", () => {
  it("장수가 다른 경우 제출 불가", () => {
    const current = evaluateCombination(
      [makeTile(5, "EMPLOYEE"), makeTile(5, "MANAGER")],
      5
    );
    const selected = [makeTile(7, "EMPLOYEE")];
    expect(canPlayCombination(selected, current, 5)).toBe(false);
  });

  it("이전보다 높은 조합은 제출 가능", () => {
    const current = evaluateCombination([makeTile(5, "EMPLOYEE")], 5);
    const selected = [makeTile(7, "EMPLOYEE")];
    expect(canPlayCombination(selected, current, 5)).toBe(true);
  });

  it("4장 선택 불가", () => {
    const tiles = [3, 4, 5, 6].map((n, i) => makeTile(n, "EMPLOYEE", `c${i}`));
    expect(canPlayCombination(tiles, null, 5)).toBe(false);
  });
});

describe("점수 계산", () => {
  it("점수 총합이 0", () => {
    const players = [
      { id: "a", name: "A", type: "human" as const, hand: [], isActive: true },
      { id: "b", name: "B", type: "computer" as const, hand: Array(1).fill(makeTile(3,"EMPLOYEE")), isActive: true },
      { id: "c", name: "C", type: "computer" as const, hand: Array(5).fill(makeTile(3,"EMPLOYEE")), isActive: true },
      { id: "d", name: "D", type: "computer" as const, hand: Array(6).fill(makeTile(3,"EMPLOYEE")), isActive: true },
      { id: "e", name: "E", type: "computer" as const, hand: Array(7).fill(makeTile(3,"EMPLOYEE")), isActive: true },
    ];
    const scores = calculateRoundScores(players);
    expect(getTotalScoreSum(scores)).toBe(0);
  });

  it("승자가 점수를 얻는다", () => {
    const players = [
      { id: "a", name: "A", type: "human" as const, hand: [], isActive: true },
      { id: "b", name: "B", type: "computer" as const, hand: [makeTile(3,"EMPLOYEE")], isActive: true },
    ];
    const scores = calculateRoundScores(players);
    const scoreA = scores.find((s) => s.playerId === "a")!;
    expect(scoreA.roundPoints).toBe(1);
  });
});
