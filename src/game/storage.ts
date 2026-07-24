import type { GameState } from "./types";
import { DEFAULT_USER_PROFILE, type UserProfile } from "./level";

const STORAGE_KEY = "etoosio-save";
const PROFILE_KEY = "etoosio-user-profile";

export function saveGame(state: GameState): void {
  try {
    const saveData = {
      phase: state.phase,
      playerCount: state.playerCount,
      currentRound: state.currentRound,
      totalRounds: state.totalRounds,
      players: state.players,
      currentPlayerIndex: state.currentPlayerIndex,
      currentCombination: state.currentCombination,
      lastPlayedByIndex: state.lastPlayedByIndex,
      consecutivePasses: state.consecutivePasses,
      isNewLead: state.isNewLead,
      logs: state.logs,
      cumulativeScores: state.cumulativeScores,
      roundScores: state.roundScores,
      roundWinnerId: state.roundWinnerId,
      soundEnabled: state.soundEnabled,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  } catch {
    // localStorage unavailable
  }
}

export function loadGame(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<GameState>;
  } catch {
    return null;
  }
}

export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_USER_PROFILE };
    const parsed = JSON.parse(raw) as UserProfile;
    if (typeof parsed.level !== "number" || typeof parsed.exp !== "number") {
      return { ...DEFAULT_USER_PROFILE };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_USER_PROFILE };
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export { STORAGE_KEY, PROFILE_KEY };

