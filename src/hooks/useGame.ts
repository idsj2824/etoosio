import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  createInitialState,
  gameReducer,
  getHumanPlayStatus,
} from "../game/reducer";
import { chooseComputerMove } from "../game/ai";
import { loadGame, hasSavedGame, saveGame } from "../game/storage";
import type { GameState } from "../game/types";

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const computerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedGameExists = hasSavedGame();

  const continueGame = useCallback(() => {
    const saved = loadGame();
    if (saved) {
      dispatch({ type: "CONTINUE_GAME", state: saved as GameState });
    }
  }, []);

  useEffect(() => {
    if (state.phase !== "playing") return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.type !== "computer") return;

    const delay = 600 + Math.random() * 400;

    computerTimerRef.current = setTimeout(() => {
      const move = chooseComputerMove(
        currentPlayer.hand,
        state.currentCombination,
        state
      );
      dispatch({ type: "COMPUTER_MOVE", combination: move });
    }, delay);

    return () => {
      if (computerTimerRef.current) {
        clearTimeout(computerTimerRef.current);
      }
    };
  }, [
    state.phase,
    state.currentPlayerIndex,
    state.currentCombination,
    state.consecutivePasses,
    state.isNewLead,
    state.players,
  ]);

  useEffect(() => {
    if (state.phase === "playing" || state.phase === "roundEnd") {
      saveGame(state);
    }
  }, [state]);

  const playStatus = getHumanPlayStatus(state);

  return {
    state,
    dispatch,
    savedGameExists,
    continueGame,
    playStatus,
  };
}
