import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  createInitialState,
  gameReducer,
  getHumanPlayStatus,
} from "../game/reducer";
import { chooseComputerMove } from "../game/ai";
import {
  loadGame,
  hasSavedGame,
  saveGame,
  loadUserProfile,
  saveUserProfile,
} from "../game/storage";
import {
  getAIDifficultyByLevel,
  calculateEarnedExp,
  applyExpToProfile,
  type UserProfile,
  type ExpGainResult,
} from "../game/level";
import type { GameState } from "../game/types";

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const computerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 유저 프로필 상태
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile());
  const [lastExpResult, setLastExpResult] = useState<ExpGainResult | null>(null);
  const [isSaveCodeModalOpen, setIsSaveCodeModalOpen] = useState(false);
  const processedGameEndRef = useRef<boolean>(false);

  const savedGameExists = hasSavedGame();

  const continueGame = useCallback(() => {
    const saved = loadGame();
    if (saved) {
      dispatch({ type: "CONTINUE_GAME", state: saved as GameState });
    }
  }, []);

  // 컴퓨터 턴 처리
  useEffect(() => {
    if (state.phase !== "playing") return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.type !== "computer") return;

    const delay = 600 + Math.random() * 400;
    const aiDifficulty = getAIDifficultyByLevel(userProfile.level).difficulty;

    computerTimerRef.current = setTimeout(() => {
      const move = chooseComputerMove(
        currentPlayer.hand,
        state.currentCombination,
        state,
        aiDifficulty
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
    userProfile.level,
  ]);

  // 게임 저장
  useEffect(() => {
    if (state.phase === "playing" || state.phase === "roundEnd") {
      saveGame(state);
    }
  }, [state]);

  // 게임 종료 시 경험치 부여 및 레벨 처리
  useEffect(() => {
    if (state.phase === "gameEnd") {
      if (processedGameEndRef.current) return;
      processedGameEndRef.current = true;

      // 순위 계산
      const rankings = Object.entries(state.cumulativeScores)
        .map(([id, score]) => ({ id, score }))
        .sort((a, b) => b.score - a.score);

      const humanRankIndex = rankings.findIndex((r) => r.id === "human");
      const rankPosition = humanRankIndex !== -1 ? humanRankIndex + 1 : state.players.length;
      const isWin = rankPosition === 1;

      const expBreakdown = calculateEarnedExp(
        rankPosition,
        state.playerCount
      );

      const { updatedProfile, result } = applyExpToProfile(
        userProfile,
        expBreakdown.totalEarnedExp,
        isWin
      );

      result.baseExp = expBreakdown.baseExp;
      result.rankBonusExp = expBreakdown.rankBonusExp;
      result.combinationBonusExp = expBreakdown.combinationBonusExp;

      setUserProfile(updatedProfile);
      saveUserProfile(updatedProfile);
      setLastExpResult(result);
    } else if (state.phase === "playing") {
      processedGameEndRef.current = false;
    }
  }, [state.phase, state.cumulativeScores, state.playerCount, userProfile]);

  const handleUpdateProfile = useCallback((newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
  }, []);

  const closeLevelUpModal = useCallback(() => {
    setLastExpResult(null);
  }, []);

  const playStatus = getHumanPlayStatus(state);

  return {
    state,
    dispatch,
    savedGameExists,
    continueGame,
    playStatus,
    userProfile,
    lastExpResult,
    isSaveCodeModalOpen,
    setIsSaveCodeModalOpen,
    handleUpdateProfile,
    closeLevelUpModal,
  };
}
