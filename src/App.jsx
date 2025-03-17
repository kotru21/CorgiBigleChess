// src/App.jsx
import React, { useEffect, useState } from "react";
import { GameProvider } from "./contexts/GameContext";
import { GameBoard } from "./components/GameBoard";
import { GameHeader } from "./components/GameHeader";
import { GameControls } from "./components/GameControls";
import { ModeSelector } from "./components/ModeSelector";
import { GameInstructions } from "./components/GameInstructions";
import { useGame } from "./contexts/GameContext";
import { useBotAI } from "./hooks/useBotAI";
import { useFullscreen } from "./hooks/useFullscreen";

// Основной компонент-контейнер
const AppContainer = () => {
  const [showModeSelect, setShowModeSelect] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen(
    "chess-board-container"
  );
  const { gameOver, gameMessage } = useGame();
  const { makeBotMove } = useBotAI();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-screen
        bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 
        dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
        transition-colors duration-300">
      {/* Выбор режима */}
      {showModeSelect && (
        <ModeSelector onClose={() => setShowModeSelect(false)} />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Заголовок и управление */}
          {!isFullscreen && (
            <GameHeader
              onModeSelect={() => setShowModeSelect(true)}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              gameMessage={gameMessage}
            />
          )}

          {/* Игровая доска */}
          <GameBoard
            isFullscreen={isFullscreen}
            onExitFullscreen={toggleFullscreen}
          />

          {/* Дополнительные элементы */}
          {!isFullscreen && (
            <>
              {gameOver && <GameControls />}
              <GameInstructions />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Обертка с провайдером контекста
const App = () => {
  return (
    <GameProvider>
      <AppContainer />
    </GameProvider>
  );
};

export default App;
