import {
  createDeck,
  dealTiles,
  findStartingPlayerIndex,
  shuffleDeck,
  sortTiles,
  sortTilesByRank,
} from "./deck";
import { evaluateCombination, getCombinationDescription } from "./combination";
import { canPlayCombination } from "./playableMoves";
import { findWeakestPlayable } from "./playableMoves";
import { calculateRoundScores, applyRoundScores } from "./scoring";
import { clearSavedGame, saveGame } from "./storage";
import {
  COMPUTER_NAMES,
  TOTAL_ROUNDS,
  RANK_LABELS,
} from "./constants";
import type { GameState, GameAction, Player, GameLogEntry } from "./types";

let logCounter = 0;

function createLog(message: string): GameLogEntry {
  return {
    id: `log-${logCounter++}`,
    message,
    timestamp: Date.now(),
  };
}

function createPlayers(playerCount: number, hands: ReturnType<typeof dealTiles>): Player[] {
  const players: Player[] = [
    {
      id: "human",
      name: "나",
      type: "human",
      hand: hands[0],
      isActive: true,
    },
  ];

  const computerCount = playerCount - 1;
  const names = [...COMPUTER_NAMES].slice(0, computerCount);

  for (let i = 0; i < computerCount; i++) {
    players.push({
      id: `cpu-${i}`,
      name: names[i],
      type: "computer",
      hand: hands[i + 1],
      isActive: true,
    });
  }

  return players;
}

function getNextPlayerIndex(state: GameState, fromIndex: number): number {
  const { players } = state;
  let next = (fromIndex + 1) % players.length;
  let attempts = 0;
  while (players[next].hand.length === 0 && attempts < players.length) {
    next = (next + 1) % players.length;
    attempts++;
  }
  return next;
}

function advanceAfterPlay(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex];

  if (player.hand.length === 0) {
    const roundScores = calculateRoundScores(state.players);
    const cumulativeScores = applyRoundScores(
      state.cumulativeScores,
      roundScores
    );
    return {
      ...state,
      phase: "roundEnd",
      roundScores,
      cumulativeScores,
      roundWinnerId: player.id,
      logs: [
        ...state.logs,
        createLog(`${player.name}이(가) 모든 타일을 냈습니다! 라운드 종료!`),
      ],
      selectedTileIds: [],
      hintTileIds: [],
    };
  }

  const nextIndex = getNextPlayerIndex(state, playerIndex);

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    selectedTileIds: [],
    hintTileIds: [],
  };
}

function handlePass(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];

  if (state.isNewLead) {
    return state;
  }

  const newPasses = state.consecutivePasses + 1;
  const othersCount = state.players.filter((p) => p.hand.length > 0).length - 1;

  const logs = [
    ...state.logs,
    createLog(`${player.name}이(가) 패스했습니다.`),
  ];

  if (
    state.lastPlayedByIndex !== null &&
    newPasses >= othersCount
  ) {
    const leader = state.players[state.lastPlayedByIndex];
    return {
      ...state,
      currentCombination: null,
      consecutivePasses: 0,
      isNewLead: true,
      currentPlayerIndex: state.lastPlayedByIndex,
      // Keep played tiles on table (don't clear)
      logs: [
        ...logs,
        createLog(
          `모든 상대가 패스하여 ${leader.name}이(가) 새로운 선이 되었습니다.`
        ),
      ],
      selectedTileIds: [],
      hintTileIds: [],
    };
  }

  const nextIndex = getNextPlayerIndex(state, state.currentPlayerIndex);

  return {
    ...state,
    consecutivePasses: newPasses,
    currentPlayerIndex: nextIndex,
    logs,
    selectedTileIds: [],
    hintTileIds: [],
  };
}

function handlePlay(
  state: GameState,
  tiles: typeof state.players[0]["hand"],
  playerIndex: number
): GameState {
  const player = state.players[playerIndex];
  const combination = evaluateCombination(tiles, state.playerCount);

  if (combination.type === "INVALID") return state;

  if (
    state.currentCombination &&
    !canPlayCombination(tiles, state.currentCombination, state.playerCount)
  ) {
    return state;
  }

  if (state.isNewLead && tiles.length === 0) return state;

  const newHand = player.hand.filter(
    (t) => !tiles.some((pt) => pt.id === t.id)
  );

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: newHand } : p
  );

  // Add tiles to played tiles
  const newPlayedTiles = [
    ...(state.playedTiles || []),
    {
      playerIndex,
      playerName: player.name,
      tiles: [...tiles]
    }
  ];

  const desc = getCombinationDescription(combination);
  const newState: GameState = {
    ...state,
    players: newPlayers,
    currentCombination: combination,
    lastPlayedByIndex: playerIndex,
    consecutivePasses: 0,
    isNewLead: false,
    logs: [
      ...state.logs,
      createLog(`${player.name}이(가) ${desc}을(를) 냈습니다.`),
    ],
    selectedTileIds: [],
    hintTileIds: [],
    playedTiles: newPlayedTiles,
  };

  return advanceAfterPlay(newState, playerIndex);
}

export function createInitialState(): GameState {
  return {
    phase: "menu",
    playerCount: 5,
    currentRound: 1,
    totalRounds: TOTAL_ROUNDS,
    players: [],
    currentPlayerIndex: 0,
    currentCombination: null,
    lastPlayedByIndex: null,
    consecutivePasses: 0,
    isNewLead: true,
    logs: [],
    cumulativeScores: {},
    roundScores: [],
    roundWinnerId: null,
    soundEnabled: true,
    selectedTileIds: [],
    hintTileIds: [],
    playedTiles: [],
  };
}

export function startNewRound(state: GameState): GameState {
  const deck = shuffleDeck(createDeck(state.playerCount));
  const hands = dealTiles(deck, state.playerCount);
  const startIndex = findStartingPlayerIndex(hands);

  const players = createPlayers(state.playerCount, hands);
  const cumulativeScores = { ...state.cumulativeScores };
  for (const p of players) {
    if (!(p.id in cumulativeScores)) {
      cumulativeScores[p.id] = 0;
    }
  }

  return {
    ...state,
    phase: "playing",
    players,
    currentPlayerIndex: startIndex,
    currentCombination: null,
    lastPlayedByIndex: null,
    consecutivePasses: 0,
    isNewLead: true,
    logs: [
      createLog(`라운드 ${state.currentRound} 시작! ${players[startIndex].name}이(가) 선입니다.`),
    ],
    roundScores: [],
    roundWinnerId: null,
    cumulativeScores,
    selectedTileIds: [],
    hintTileIds: [],
    playedTiles: [],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      clearSavedGame();
      const playerCount = action.playerCount;
      const deck = shuffleDeck(createDeck(playerCount));
      const hands = dealTiles(deck, playerCount);
      const startIndex = findStartingPlayerIndex(hands);
      const players = createPlayers(playerCount, hands);
      const cumulativeScores: Record<string, number> = {};
      for (const p of players) {
        cumulativeScores[p.id] = 0;
      }

      const newState: GameState = {
        ...createInitialState(),
        phase: "playing",
        playerCount,
        players,
        currentPlayerIndex: startIndex,
        isNewLead: true,
        cumulativeScores,
        logs: [
          createLog(
            `게임 시작! ${players[startIndex].name}이(가) 사원 3을 가져 선입니다.`
          ),
        ],
      };
      saveGame(newState);
      return newState;
    }

    case "CONTINUE_GAME": {
      return {
        ...action.state,
        selectedTileIds: [],
        hintTileIds: [],
      };
    }

    case "SELECT_TILE": {
      if (state.phase !== "playing") return state;
      const human = state.players.find((p) => p.type === "human");
      if (!human || state.currentPlayerIndex !== state.players.indexOf(human)) {
        return state;
      }

      const id = action.tileId;
      const selected = state.selectedTileIds.includes(id)
        ? state.selectedTileIds.filter((sid) => sid !== id)
        : [...state.selectedTileIds, id];

      return {
        ...state,
        selectedTileIds: selected,
        hintTileIds: [],
      };
    }

    case "CLEAR_SELECTION":
      return { ...state, selectedTileIds: [], hintTileIds: [] };

    case "PLAY_SELECTED": {
      if (state.phase !== "playing") return state;
      const humanIndex = state.players.findIndex((p) => p.type === "human");
      if (humanIndex !== state.currentPlayerIndex) return state;

      const human = state.players[humanIndex];
      const selected = human.hand.filter((t) =>
        state.selectedTileIds.includes(t.id)
      );

      if (selected.length === 0) return state;
      if (selected.length === 4) return state;

      const newState = handlePlay(state, selected, humanIndex);
      saveGame(newState);
      return newState;
    }

    case "PASS": {
      if (state.phase !== "playing") return state;
      if (state.isNewLead) return state;

      const humanIndex = state.players.findIndex((p) => p.type === "human");
      if (humanIndex !== state.currentPlayerIndex) return state;

      const newState = handlePass(state);
      saveGame(newState);
      return newState;
    }

    case "COMPUTER_MOVE": {
      if (state.phase !== "playing") return state;
      const cpuIndex = state.currentPlayerIndex;
      const cpu = state.players[cpuIndex];
      if (cpu.type !== "computer") return state;

      if (action.combination) {
        const newState = handlePlay(state, action.combination.tiles, cpuIndex);
        saveGame(newState);
        return newState;
      }

      const newState = handlePass(state);
      saveGame(newState);
      return newState;
    }

    case "SORT_HAND_BY_NUMBER": {
      const humanIndex = state.players.findIndex((p) => p.type === "human");
      if (humanIndex === -1) return state;
      const newPlayers = state.players.map((p, i) =>
        i === humanIndex ? { ...p, hand: sortTiles(p.hand) } : p
      );
      return { ...state, players: newPlayers };
    }

    case "SORT_HAND_BY_RANK": {
      const humanIndex = state.players.findIndex((p) => p.type === "human");
      if (humanIndex === -1) return state;
      const newPlayers = state.players.map((p, i) =>
        i === humanIndex ? { ...p, hand: sortTilesByRank(p.hand) } : p
      );
      return { ...state, players: newPlayers };
    }

    case "SHOW_HINT": {
      if (state.phase !== "playing") return state;
      const humanIndex = state.players.findIndex((p) => p.type === "human");
      if (humanIndex !== state.currentPlayerIndex) return state;

      const human = state.players[humanIndex];
      const hint = findWeakestPlayable(
        human.hand,
        state.currentCombination,
        state.playerCount
      );

      if (!hint) return state;

      return {
        ...state,
        hintTileIds: hint.tiles.map((t) => t.id),
        selectedTileIds: hint.tiles.map((t) => t.id),
      };
    }

    case "NEXT_ROUND": {
      if (state.phase !== "roundEnd") return state;
      const nextRound = state.currentRound + 1;
      if (nextRound > state.totalRounds) {
        const finalState = { ...state, phase: "gameEnd" as const };
        clearSavedGame();
        return finalState;
      }
      const newState = startNewRound({
        ...state,
        currentRound: nextRound,
      });
      saveGame(newState);
      return newState;
    }

    case "SAVE_GAME":
      saveGame(state);
      return state;

    case "TOGGLE_SOUND":
      return { ...state, soundEnabled: !state.soundEnabled };

    case "GO_TO_MENU":
      return {
        ...createInitialState(),
        soundEnabled: state.soundEnabled,
        playerCount: state.playerCount,
      };

    default:
      return state;
  }
}

export function getHumanPlayStatus(
  state: GameState
): "idle" | "invalid" | "tooWeak" | "ready" | "mustPlay" {
  const humanIndex = state.players.findIndex((p) => p.type === "human");
  if (humanIndex !== state.currentPlayerIndex) return "idle";

  const human = state.players[humanIndex];
  const selected = human.hand.filter((t) =>
    state.selectedTileIds.includes(t.id)
  );

  if (selected.length === 0) {
    return state.isNewLead ? "mustPlay" : "idle";
  }

  if (selected.length === 4) return "invalid";

  const evaluated = evaluateCombination(selected, state.playerCount);
  if (evaluated.type === "INVALID") return "invalid";

  if (
    state.currentCombination &&
    !canPlayCombination(selected, state.currentCombination, state.playerCount)
  ) {
    return "tooWeak";
  }

  return "ready";
}

export function formatTile(tile: { rank: string; number: number }): string {
  return `${RANK_LABELS[tile.rank as keyof typeof RANK_LABELS]} ${tile.number}`;
}
