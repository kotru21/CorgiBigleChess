import React, { createContext, useContext, useState } from "react";
import { createInitialBoard } from "../services/BoardService";
import { GAME_MODES } from "../models/Constants";

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [board, setBoard] = useState(createInitialBoard());
  const [gameMode, setGameMode] = useState(GAME_MODES.CLASSIC);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameMessage, setGameMessage] = useState(
    "Ваш ход! Вы играете за Биглей."
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // контекст для всех компонентов
  const value = {
    board,
    setBoard,
    gameMode,
    setGameMode,
    playerTurn,
    setPlayerTurn,
    selectedPiece,
    setSelectedPiece,
    validMoves,
    setValidMoves,
    gameOver,
    setGameOver,
    gameMessage,
    setGameMessage,
    isFullscreen,
    setIsFullscreen,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
