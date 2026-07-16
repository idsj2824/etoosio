import { useState, useCallback } from "react";
import { useGame } from "./hooks/useGame";
import { useSound } from "./hooks/useSound";
import { StartScreen } from "./components/StartScreen";
import { GameBoard } from "./components/GameBoard";
import { RulesModal } from "./components/RulesModal";
import { RoundResultModal } from "./components/RoundResultModal";
import { FinalResultScreen } from "./components/FinalResultScreen";
import { LobbyScreen } from "./components/LobbyScreen";
import { OnlineGameBoard } from "./components/OnlineGameBoard";
import { clearSavedGame } from "./game/storage";
import "./styles.css";

function App() {
  const { state, dispatch, savedGameExists, continueGame, playStatus } =
    useGame();
  const { play } = useSound(state.soundEnabled);
  const [showRules, setShowRules] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [onlineGameRoom, setOnlineGameRoom] = useState<{ roomId: string; players: any[]; gameState: any } | null>(null);

  const handleStart = useCallback(
    (playerCount: number) => {
      dispatch({ type: "START_GAME", playerCount });
    },
    [dispatch]
  );

  const handleSelectTile = useCallback(
    (id: string) => {
      dispatch({ type: "SELECT_TILE", tileId: id });
      play("select");
    },
    [dispatch, play]
  );

  const handlePlay = useCallback(() => {
    dispatch({ type: "PLAY_SELECTED" });
    play("play");
  }, [dispatch, play]);

  const handlePass = useCallback(() => {
    dispatch({ type: "PASS" });
    play("pass");
  }, [dispatch, play]);

  const handleNewGame = useCallback(
    (playerCount?: number) => {
      clearSavedGame();
      dispatch({
        type: "START_GAME",
        playerCount: playerCount ?? state.playerCount,
      });
    },
    [dispatch, state.playerCount]
  );

  const handleOnlinePlay = useCallback(() => {
    setShowLobby(true);
  }, []);

  const handleBackFromLobby = useCallback(() => {
    setShowLobby(false);
  }, []);

  const handleOnlineGameStart = useCallback((roomId: string, players: any[], gameState: any) => {
    setOnlineGameRoom({ roomId, players, gameState });
    setShowLobby(false);
  }, []);

  const handleBackFromOnlineGame = useCallback(() => {
    setOnlineGameRoom(null);
  }, []);

  if (onlineGameRoom) {
    return (
      <OnlineGameBoard
        roomId={onlineGameRoom.roomId}
        initialPlayers={onlineGameRoom.players}
        initialGameState={onlineGameRoom.gameState}
        onBack={handleBackFromOnlineGame}
      />
    );
  }

  if (state.phase === "menu") {
    if (showLobby) {
      return (
        <LobbyScreen
          onBack={handleBackFromLobby}
          onGameStart={handleOnlineGameStart}
        />
      );
    }
    return (
      <>
        <StartScreen
          savedGameExists={savedGameExists}
          onStart={handleStart}
          onContinue={continueGame}
          onShowRules={() => setShowRules(true)}
          onOnlinePlay={handleOnlinePlay}
        />
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </>
    );
  }

  if (state.phase === "gameEnd") {
    return (
      <FinalResultScreen
        state={state}
        onNewGame={() => handleNewGame()}
        onMenu={() => dispatch({ type: "GO_TO_MENU" })}
      />
    );
  }

  return (
    <>
      <GameBoard
        state={state}
        playStatus={playStatus}
        onSelectTile={handleSelectTile}
        onPlay={handlePlay}
        onPass={handlePass}
        onClear={() => dispatch({ type: "CLEAR_SELECTION" })}
        onHint={() => dispatch({ type: "SHOW_HINT" })}
        onSortNumber={() => dispatch({ type: "SORT_HAND_BY_NUMBER" })}
        onSortRank={() => dispatch({ type: "SORT_HAND_BY_RANK" })}
        onNewGame={() => handleNewGame()}
        onShowRules={() => setShowRules(true)}
        onToggleSound={() => dispatch({ type: "TOGGLE_SOUND" })}
        onSave={() => dispatch({ type: "SAVE_GAME" })}
        onMenu={() => dispatch({ type: "GO_TO_MENU" })}
      />
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {state.phase === "roundEnd" && (
        <RoundResultModal
          state={state}
          onNextRound={() => {
            play("win");
            dispatch({ type: "NEXT_ROUND" });
          }}
          onNewGame={() => handleNewGame()}
          onMenu={() => dispatch({ type: "GO_TO_MENU" })}
        />
      )}
    </>
  );
}

export default App;
