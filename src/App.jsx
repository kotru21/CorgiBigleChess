// src/App.jsx
import React, { useState } from "react";
import { GameProvider } from "./contexts/GameContext";
import { GameBoard } from "./components/GameBoard";
import { MainMenu } from "./components/MainMenu";

// Основной компонент приложения
const App = () => {
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  const returnToMenu = () => {
    setGameStarted(false);
  };

  return (
    <GameProvider>
      {gameStarted ? (
        <GameBoard onReturnToMenu={returnToMenu} />
      ) : (
        <MainMenu onStartGame={startGame} />
      )}
    </GameProvider>
  );
};

export default App;
