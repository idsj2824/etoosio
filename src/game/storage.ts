import type { GameState } from "./types";

const STORAGE_KEY = "etoosio-save";

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

export { STORAGE_KEY };
