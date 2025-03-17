import { useEffect } from "react";
import { useGame } from "../contexts/GameContext.jsx";
import { getBestMove } from "../services/AIservice";
import { movePiece, checkGameStatus } from "../services/BoardService";
import { PLAYER, BOT, GAME_MODES } from "../models/Constants";

export function useBotAI() {
  const {
    board,
    setBoard,
    playerTurn,
    setPlayerTurn,
    gameOver,
    setGameOver,
    setGameMessage,
    gameMode,
  } = useGame();

  // Логика хода бота
  const makeBotMove = () => {
    // Если игра окончена или ход игрока, не делаем ничего
    if (gameOver || playerTurn) return;

    // Устанавливаем задержку для хода бота в зависимости от режима
    const delay = gameMode === GAME_MODES.TURBO ? 300 : 1000;

    setTimeout(() => {
      // Определяем сложность (глубину поиска) в зависимости от режима
      const depth = gameMode === GAME_MODES.TURBO ? 4 : 3;

      // Находим лучший ход
      const bestMove = getBestMove(board, depth); // Изменено с findBestMove на getBestMove

      if (bestMove) {
        // Выполняем ход
        const newBoard = movePiece(
          board,
          bestMove.fromRow,
          bestMove.fromCol,
          bestMove.toRow,
          bestMove.toCol
        );

        setBoard(newBoard);
        setPlayerTurn(true);
        setGameMessage("Ваш ход!");

        // Проверяем состояние игры после хода бота
        const gameStatus = checkGameStatus(newBoard);
        if (gameStatus) {
          handleGameOver(gameStatus);
        }
      } else {
        // Если ботом не найден ход, это означает, что игрок победил
        handleGameOver(PLAYER);
      }
    }, delay);
  };

  const handleGameOver = (winner) => {
    setGameOver(true);
    setGameMessage(
      winner === PLAYER
        ? "Вы победили! Бигли одержали верх над корги!"
        : "Вы проиграли! Корги оказались хитрее!"
    );
  };

  // Запускаем ход бота каждый раз, когда ход переходит к нему
  useEffect(() => {
    if (!playerTurn && !gameOver) {
      makeBotMove();
    }
  }, [playerTurn, gameOver, board]);

  return { makeBotMove };
}
