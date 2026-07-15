import { describe, it, expect } from "vitest";
import { createInitialState, gameReducer } from "../game/reducer";
import type { GameState } from "../game/types";

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    phase: "playing",
    playerCount: 3,
    players: [
      { id: "human", name: "나", type: "human", hand: [], isActive: true },
      { id: "cpu-0", name: "김대리", type: "computer", hand: [], isActive: true },
      { id: "cpu-1", name: "박과장", type: "computer", hand: [], isActive: true },
    ],
    currentPlayerIndex: 1,
    lastPlayedByIndex: 1,
    consecutivePasses: 0,
    isNewLead: false,
    currentCombination: {
      type: "SINGLE",
      tiles: [{ id: "t1", number: 5, rank: "EMPLOYEE" }],
      strength: [2, 0],
    },
    ...overrides,
  };
}

describe("게임 흐름", () => {
  it("모든 상대 패스 후 마지막 제출자가 선이 된다", () => {
    let state = makeMinimalState({
      currentPlayerIndex: 2,
      consecutivePasses: 1,
      lastPlayedByIndex: 1,
    });

    state = gameReducer(state, { type: "COMPUTER_MOVE", combination: null });

    expect(state.currentCombination).toBeNull();
    expect(state.isNewLead).toBe(true);
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.consecutivePasses).toBe(0);
  });

  it("새 선에서는 패스 불가", () => {
    const state = makeMinimalState({
      isNewLead: true,
      currentPlayerIndex: 0,
      currentCombination: null,
      lastPlayedByIndex: null,
    });

    const afterPass = gameReducer(state, { type: "PASS" });
    expect(afterPass.consecutivePasses).toBe(0);
  });

  it("4장 선택 시 플레이 불가", () => {
    const tiles = [3, 4, 5, 6].map((n, i) => ({
      id: `h${i}`,
      number: n,
      rank: "EMPLOYEE" as const,
    }));
    const state = makeMinimalState({
      currentPlayerIndex: 0,
      isNewLead: true,
      currentCombination: null,
      players: [
        { id: "human", name: "나", type: "human", hand: tiles, isActive: true },
        { id: "cpu-0", name: "김대리", type: "computer", hand: [], isActive: true },
        { id: "cpu-1", name: "박과장", type: "computer", hand: [], isActive: true },
      ],
      selectedTileIds: tiles.map((t) => t.id),
    });

    const after = gameReducer(state, { type: "PLAY_SELECTED" });
    expect(after.players[0].hand.length).toBe(4);
  });
});
