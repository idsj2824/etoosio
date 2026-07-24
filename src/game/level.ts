export interface UserProfile {
  level: number;
  exp: number;
  totalGames: number;
  wins: number;
  topScore: number;
  updatedAt: number;
}

export interface ExpGainResult {
  baseExp: number;
  rankBonusExp: number;
  combinationBonusExp: number;
  totalEarnedExp: number;
  oldLevel: number;
  newLevel: number;
  oldExp: number;
  newExp: number;
  leveledUp: boolean;
  promotedRank: boolean;
  oldRankTitle: string;
  newRankTitle: string;
}

export type AIDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export const DEFAULT_USER_PROFILE: UserProfile = {
  level: 1,
  exp: 0,
  totalGames: 0,
  wins: 0,
  topScore: 0,
  updatedAt: Date.now(),
};

/**
 * 레벨업에 필요한 총 경험치 계산
 * N레벨에서 (N+1)레벨로 가는데 필요한 경험치: 100 * N^1.25 (반올림)
 */
export function getRequiredExpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.25));
}

/**
 * 직급 칭호 계산 (레벨 기준)
 */
export function getRankTitle(level: number): string {
  if (level <= 2) return "인턴";
  if (level <= 5) return "신입 사원";
  if (level <= 9) return "주임";
  if (level <= 14) return "대리";
  if (level <= 20) return "과장";
  if (level <= 27) return "차장";
  if (level <= 35) return "부장";
  if (level <= 45) return "이사";
  if (level <= 56) return "상무";
  if (level <= 68) return "전무";
  if (level <= 85) return "대표이사 (CEO)";
  return "회장님 (Chairman)";
}

/**
 * 직급 뱃지 색상 (CSS 클래스 또는 헥사 코드)
 */
export function getRankColor(level: number): { bg: string; text: string; border: string } {
  if (level <= 2) return { bg: "#e2e8f0", text: "#475569", border: "#cbd5e1" }; // 인턴 (회색)
  if (level <= 5) return { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" }; // 신입사원 (연파랑)
  if (level <= 9) return { bg: "#dcfce7", text: "#166534", border: "#86efac" }; // 주임 (초록)
  if (level <= 14) return { bg: "#fef9c3", text: "#854d0e", border: "#fde047" }; // 대리 (노랑)
  if (level <= 20) return { bg: "#ffedd5", text: "#9a3412", border: "#fdba74" }; // 과장 (주황)
  if (level <= 27) return { bg: "#fae8ff", text: "#86198f", border: "#f5d0fe" }; // 차장 (보라)
  if (level <= 35) return { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" }; // 부장 (핑크)
  if (level <= 45) return { bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" }; // 이사 (남색)
  if (level <= 56) return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" }; // 상무 (빨강)
  if (level <= 68) return { bg: "#fef3c7", text: "#b45309", border: "#fcd34d" }; // 전무 (골드)
  if (level <= 85) return { bg: "linear-gradient(135deg, #fbbf24, #f59e0b)", text: "#78350f", border: "#f59e0b" }; // CEO (황금)
  return { bg: "linear-gradient(135deg, #a855f7, #6366f1)", text: "#ffffff", border: "#818cf8" }; // 회장님 (플래티넘/영롱)
}

/**
 * 유저 레벨에 기반한 AI 난이도 레벨 및 텍스트
 */
export function getAIDifficultyByLevel(level: number): { difficulty: AIDifficulty; name: string; description: string } {
  if (level <= 5) {
    return {
      difficulty: "BEGINNER",
      name: "초급 (인턴 수준)",
      description: "AI가 간혹 조심스럽게 플레이하며 서툰 모습을 보입니다.",
    };
  }
  if (level <= 15) {
    return {
      difficulty: "INTERMEDIATE",
      name: "중급 (대리/과장 수준)",
      description: "AI가 손패 털기에 최선의 조합으로 정석 플레이를 펼칩니다.",
    };
  }
  if (level <= 30) {
    return {
      difficulty: "ADVANCED",
      name: "상급 (부장/이사 수준)",
      description: "AI가 상대방 손패를 견제하며 선(Turn)을 능숙하게 가져옵니다.",
    };
  }
  return {
    difficulty: "EXPERT",
    name: "최상급 (회장님 수준)",
    description: "AI가 최단 경로 손패 털기 및 철저한 카운팅으로 플레이합니다.",
  };
}

/**
 * 경험치 계산 함수
 */
export function calculateEarnedExp(
  rankPosition: number, // 1등 = 1, 2등 = 2...
  _totalPlayers: number = 5,
  playedSpecialCombinations: boolean = false
): { baseExp: number; rankBonusExp: number; combinationBonusExp: number; totalEarnedExp: number } {
  const baseExp = 50; // 기본 완주 경험치

  // 순위 보너스
  let rankBonusExp = 0;
  if (rankPosition === 1) rankBonusExp = 150;
  else if (rankPosition === 2) rankBonusExp = 80;
  else if (rankPosition === 3) rankBonusExp = 40;
  else rankBonusExp = 20;

  // 특수 족보 보너스 (스트레이트 플러시, 포카드 등)
  const combinationBonusExp = playedSpecialCombinations ? 30 : 0;

  const totalEarnedExp = baseExp + rankBonusExp + combinationBonusExp;

  return {
    baseExp,
    rankBonusExp,
    combinationBonusExp,
    totalEarnedExp,
  };
}

/**
 * 프로필에 경험치를 추가하고 레벨업 여부를 판별
 */
export function applyExpToProfile(profile: UserProfile, expEarned: number, isWin: boolean): { updatedProfile: UserProfile; result: ExpGainResult } {
  const oldLevel = profile.level;
  const oldExp = profile.exp;
  const oldRankTitle = getRankTitle(oldLevel);

  let newExp = oldExp + expEarned;
  let newLevel = oldLevel;
  let req = getRequiredExpForLevel(newLevel);

  while (newExp >= req) {
    newExp -= req;
    newLevel++;
    req = getRequiredExpForLevel(newLevel);
  }

  const newRankTitle = getRankTitle(newLevel);

  const updatedProfile: UserProfile = {
    ...profile,
    level: newLevel,
    exp: newExp,
    totalGames: profile.totalGames + 1,
    wins: profile.wins + (isWin ? 1 : 0),
    updatedAt: Date.now(),
  };

  const result: ExpGainResult = {
    baseExp: 0,
    rankBonusExp: 0,
    combinationBonusExp: 0,
    totalEarnedExp: expEarned,
    oldLevel,
    newLevel,
    oldExp,
    newExp,
    leveledUp: newLevel > oldLevel,
    promotedRank: oldRankTitle !== newRankTitle,
    oldRankTitle,
    newRankTitle,
  };

  return { updatedProfile, result };
}

/**
 * 프로필 세이브 코드 생성 (Export)
 * 세이브 코드는 base64로 암호화된 JSON 문자열 ("ETOOS-" 접두사)
 */
export function exportSaveCode(profile: UserProfile): string {
  try {
    const data = {
      l: profile.level,
      e: profile.exp,
      g: profile.totalGames,
      w: profile.wins,
      t: profile.topScore,
      u: profile.updatedAt,
    };
    const jsonStr = JSON.stringify(data);
    const b64 = btoa(encodeURIComponent(jsonStr));
    return `ETOOS-${b64}`;
  } catch {
    return "";
  }
}

/**
 * 프로필 세이브 코드 읽기 (Import)
 */
export function importSaveCode(codeString: string): UserProfile | null {
  try {
    const trimmed = codeString.trim();
    if (!trimmed.startsWith("ETOOS-")) return null;
    const b64 = trimmed.substring(6);
    const jsonStr = decodeURIComponent(atob(b64));
    const parsed = JSON.parse(jsonStr);

    if (
      typeof parsed.l !== "number" ||
      typeof parsed.e !== "number" ||
      parsed.l < 1 ||
      parsed.e < 0
    ) {
      return null;
    }

    return {
      level: parsed.l,
      exp: parsed.e,
      totalGames: typeof parsed.g === "number" ? parsed.g : 0,
      wins: typeof parsed.w === "number" ? parsed.w : 0,
      topScore: typeof parsed.t === "number" ? parsed.t : 0,
      updatedAt: typeof parsed.u === "number" ? parsed.u : Date.now(),
    };
  } catch {
    return null;
  }
}
