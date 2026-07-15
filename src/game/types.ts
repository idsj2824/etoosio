export type Rank = "EMPLOYEE" | "ASSISTANT_MANAGER" | "MANAGER" | "DIRECTOR";

export interface Tile {
  id: string;
  number: number;
  rank: Rank;
}

export type CombinationType =
  | "SINGLE"
  | "PAIR"
  | "TRIPLE"
  | "STRAIGHT"
  | "FLUSH"
  | "FULL_HOUSE"
  | "FOUR_OF_A_KIND"
  | "STRAIGHT_FLUSH"
  | "INVALID";

export interface Combination {
  type: CombinationType;
  tiles: Tile[];
  strength: number[];
}

export type PlayerType = "human" | "computer";

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  hand: Tile[];
  isActive: boolean;
}

export type GamePhase =
  | "menu"
  | "playing"
  | "roundEnd"
  | "gameEnd";

export interface GameLogEntry {
  id: string;
  message: string;
  timestamp: number;
}

export interface RoundScore {
  playerId: string;
  roundPoints: number;
  remainingTiles: number;
}

export interface GameState {
  phase: GamePhase;
  playerCount: number;
  currentRound: number;
  totalRounds: number;
  players: Player[];
  currentPlayerIndex: number;
  currentCombination: Combination | null;
  lastPlayedByIndex: number | null;
  consecutivePasses: number;
  isNewLead: boolean;
  logs: GameLogEntry[];
  cumulativeScores: Record<string, number>;
  roundScores: RoundScore[];
  roundWinnerId: string | null;
  soundEnabled: boolean;
  selectedTileIds: string[];
  hintTileIds: string[];
  playedTiles: Array<{ playerIndex: number; playerName: string; tiles: Tile[] }>;
}

export type GameAction =
  | { type: "START_GAME"; playerCount: number }
  | { type: "CONTINUE_GAME"; state: GameState }
  | { type: "SELECT_TILE"; tileId: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "PLAY_SELECTED" }
  | { type: "PASS" }
  | { type: "COMPUTER_MOVE"; combination: Combination | null }
  | { type: "SORT_HAND_BY_NUMBER" }
  | { type: "SORT_HAND_BY_RANK" }
  | { type: "SHOW_HINT" }
  | { type: "NEXT_ROUND" }
  | { type: "SAVE_GAME" }
  | { type: "TOGGLE_SOUND" }
  | { type: "GO_TO_MENU" }
  | { type: "OPEN_RULES" }
  | { type: "CLOSE_RULES" };
