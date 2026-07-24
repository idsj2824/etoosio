import { describe, it, expect } from "vitest";
import {
  getRequiredExpForLevel,
  getRankTitle,
  getAIDifficultyByLevel,
  calculateEarnedExp,
  applyExpToProfile,
  exportSaveCode,
  importSaveCode,
  DEFAULT_USER_PROFILE,
} from "../game/level";

describe("Level & Profile System", () => {
  it("should calculate rank title correctly based on level", () => {
    expect(getRankTitle(1)).toBe("인턴");
    expect(getRankTitle(2)).toBe("인턴");
    expect(getRankTitle(3)).toBe("신입 사원");
    expect(getRankTitle(5)).toBe("신입 사원");
    expect(getRankTitle(10)).toBe("대리");
    expect(getRankTitle(25)).toBe("차장");
    expect(getRankTitle(35)).toBe("부장");
    expect(getRankTitle(80)).toBe("대표이사 (CEO)");
    expect(getRankTitle(95)).toBe("회장님 (Chairman)");
  });

  it("should determine AI difficulty by user level", () => {
    expect(getAIDifficultyByLevel(1).difficulty).toBe("BEGINNER");
    expect(getAIDifficultyByLevel(5).difficulty).toBe("BEGINNER");
    expect(getAIDifficultyByLevel(10).difficulty).toBe("INTERMEDIATE");
    expect(getAIDifficultyByLevel(20).difficulty).toBe("ADVANCED");
    expect(getAIDifficultyByLevel(40).difficulty).toBe("EXPERT");
  });

  it("should calculate earned exp for rankings", () => {
    const firstPlace = calculateEarnedExp(1, 5);
    expect(firstPlace.rankBonusExp).toBe(150);
    expect(firstPlace.totalEarnedExp).toBe(200);

    const secondPlace = calculateEarnedExp(2, 5);
    expect(secondPlace.rankBonusExp).toBe(80);
    expect(secondPlace.totalEarnedExp).toBe(130);
  });

  it("should level up when exp exceeds required threshold", () => {
    const initial = { ...DEFAULT_USER_PROFILE, level: 1, exp: 0 };
    const reqExp = getRequiredExpForLevel(1);

    const { updatedProfile, result } = applyExpToProfile(initial, reqExp + 50, true);
    expect(result.leveledUp).toBe(true);
    expect(updatedProfile.level).toBe(2);
    expect(updatedProfile.exp).toBe(50);
    expect(updatedProfile.wins).toBe(1);
  });

  it("should export and import save code correctly", () => {
    const profile = {
      level: 15,
      exp: 240,
      totalGames: 12,
      wins: 8,
      topScore: 120,
      updatedAt: 1700000000000,
    };

    const saveCode = exportSaveCode(profile);
    expect(saveCode.startsWith("ETOOS-")).toBe(true);

    const imported = importSaveCode(saveCode);
    expect(imported).not.toBeNull();
    expect(imported?.level).toBe(15);
    expect(imported?.exp).toBe(240);
    expect(imported?.wins).toBe(8);
  });

  it("should return null for invalid save code", () => {
    expect(importSaveCode("INVALID-CODE")).toBeNull();
    expect(importSaveCode("ETOOS-invalidbase64!")).toBeNull();
  });
});
