import React, { useState, useEffect } from "react";

import { createInitialBoard } from "./boardUtils.js"; // Импортируем функцию
import {
  GAME_MODES,
  PLAYER,
  BOT,
  PLAYER_KING,
  BOT_KING,
  EMPTY,
  BOARD_SIZE,
} from "./constants.js";

import { findBestMove } from "./gameUtils.js";
import { Board3D } from "./components/Board3D";

// Main game component
const App = () => {
  const [board, setBoard] = useState(createInitialBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [gameMessage, setGameMessage] = useState(
    "Ваш ход! Вы играете за Биглей."
  );
  const [validMoves, setValidMoves] = useState([]);
  const [jumpExists, setJumpExists] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if game is over
  useEffect(() => {
    const gameStatus = checkGameStatus();
    if (gameStatus) {
      setGameOver(true);
      setGameMessage(
        gameStatus === PLAYER
          ? "Вы победили! Бигли одержали победу!"
          : "Корги победили! Повезёт в следующий раз!"
      );
    }
  }, [board]);

  // Добавьте слушатель событий для изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);

      if (!isFS) {
        // Восстанавливаем стили только при выходе
        document.body.style.overflow = "";
        const board = document.getElementById("chess-board");
        if (board) {
          board.style = "";
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Добавляем слушатель для ориентации экрана
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen) {
        const board = document.getElementById("chess-board");
        const size = Math.min(
          window.innerHeight * 0.9,
          window.innerWidth * 0.9
        );
        board.style.width = `${size}px`;
        board.style.height = `${size}px`;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFullscreen]);

  // Check if any player has no valid moves left
  const checkGameStatus = () => {
    let botPieces = 0;
    let playerPieces = 0;

    // Count pieces
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === PLAYER || board[row][col] === PLAYER_KING) {
          playerPieces++;
        } else if (board[row][col] === BOT || board[row][col] === BOT_KING) {
          botPieces++;
        }
      }
    }

    if (botPieces === 0) return PLAYER;
    if (playerPieces === 0) return BOT;

    // Check if current player has valid moves
    const currentPlayer = playerTurn ? PLAYER : BOT;
    const hasValidMoves = checkForAnyValidMoves(currentPlayer);

    if (!hasValidMoves) {
      return playerTurn ? BOT : PLAYER;
    }

    return null;
  };

  // Check if any piece of the given type has valid moves
  const checkForAnyValidMoves = (pieceType) => {
    const isPlayer = pieceType === PLAYER;
    const currentPieces = [pieceType, isPlayer ? PLAYER_KING : BOT_KING];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (currentPieces.includes(board[row][col])) {
          const moves = calculateValidMoves(row, col);
          if (moves.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Calculate valid moves for a piece
  const calculateValidMoves = (row, col) => {
    const piece = board[row][col];
    if (!piece) return [];

    const isKing = piece === PLAYER_KING || piece === BOT_KING;
    const isPlayer = piece === PLAYER || piece === PLAYER_KING;

    let moves = [];
    let jumps = [];

    // Направления движения: вверх, вправо, вниз, влево
    const directions = [
      [-1, 0], // вверх
      [0, 1], // вправо
      [1, 0], // вниз
      [0, -1], // влево
    ];

    for (const [rowDir, colDir] of directions) {
      // Пропускаем ход назад для обычных шашек и взятие назад
      if (
        !isKing &&
        ((isPlayer && rowDir === 1) || (!isPlayer && rowDir === -1))
      ) {
        continue;
      }

      let newRow = row + rowDir;
      let newCol = col + colDir;

      // Проверяем обычный ход
      if (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE &&
        board[newRow][newCol] === EMPTY
      ) {
        // Простые шашки могут ходить только вперед и в стороны
        if (!isKing && rowDir === (isPlayer ? 1 : -1)) {
          continue;
        }
        moves.push({ row: newRow, col: newCol });
      }

      // Проверяем взятие
      if (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE &&
        board[newRow][newCol] !== EMPTY
      ) {
        const jumpRow = newRow + rowDir;
        const jumpCol = newCol + colDir;

        if (
          jumpRow >= 0 &&
          jumpRow < BOARD_SIZE &&
          jumpCol >= 0 &&
          jumpCol < BOARD_SIZE &&
          board[jumpRow][jumpCol] === EMPTY
        ) {
          const jumpedPiece = board[newRow][newCol];
          // Проверяем, что мы бьем фишку противника
          if (
            (isPlayer && (jumpedPiece === BOT || jumpedPiece === BOT_KING)) ||
            (!isPlayer &&
              (jumpedPiece === PLAYER || jumpedPiece === PLAYER_KING))
          ) {
            // Для простых шашек нельзя бить назад
            if (!isKing && rowDir === (isPlayer ? 1 : -1)) {
              continue;
            }
            jumps.push({
              row: jumpRow,
              col: jumpCol,
              jumpRow: newRow,
              jumpCol: newCol,
            });
          }
        }
      }

      // Для дамок добавляем ходы на несколько клеток
      if (isKing) {
        let distance = 2;
        newRow = row + rowDir * distance;
        newCol = col + colDir * distance;

        while (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          board[newRow][newCol] === EMPTY
        ) {
          moves.push({ row: newRow, col: newCol });
          distance++;
          newRow = row + rowDir * distance;
          newCol = col + colDir * distance;
        }
      }
    }

    // Если есть взятия, возвращаем только их
    return jumps.length > 0 ? jumps : moves;
  };

  // Check if any jump is available for the current player
  const checkForAnyJump = () => {
    const currentPieces = playerTurn ? [PLAYER, PLAYER_KING] : [BOT, BOT_KING];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (currentPieces.includes(board[row][col])) {
          const moves = calculateValidMoves(row, col);
          if (moves.length > 0 && "jumpRow" in moves[0]) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Handle piece selection
  const handlePieceSelect = (row, col) => {
    if (gameOver || !playerTurn) return;

    const piece = board[row][col];
    const isPlayerPiece = piece === PLAYER || piece === PLAYER_KING;

    if (isPlayerPiece) {
      const moves = calculateValidMoves(row, col);

      // Check if there's a mandatory jump
      const jumpAvailable = checkForAnyJump();

      if (jumpAvailable) {
        const hasJump = moves.some((move) => "jumpRow" in move);
        if (!hasJump) {
          setGameMessage("Вы должны сделать прыжок, если это возможно!");
          setValidMoves([]);
          setSelectedPiece(null);
          return;
        }
      }

      setSelectedPiece({ row, col });
      setValidMoves(moves);
      setJumpExists(jumpAvailable);
    } else if (selectedPiece) {
      // Try to move to this position
      const isValidMove = validMoves.some(
        (move) => move.row === row && move.col === col
      );

      if (isValidMove) {
        movePiece(selectedPiece.row, selectedPiece.col, row, col);
      }
    }
  };
  // Move a piece on the board
  const movePiece = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map((row) => [...row]);
    const piece = newBoard[fromRow][fromCol];

    // Определяем, совершается ли прыжок (с учетом горизонтальных ходов)
    const isJump =
      Math.abs(fromRow - toRow) === 2 || Math.abs(fromCol - toCol) === 2;

    // Перемещаем шашку
    newBoard[fromRow][fromCol] = EMPTY;
    newBoard[toRow][toCol] = piece;

    // Проверка на превращение в дамку
    if (piece === PLAYER && toRow === 0) {
      newBoard[toRow][toCol] = PLAYER_KING;
    } else if (piece === BOT && toRow === BOARD_SIZE - 1) {
      newBoard[toRow][toCol] = BOT_KING;
    }

    // Если это прыжок, удаляем перепрыгнутую шашку
    if (isJump) {
      const jumpRow = (fromRow + toRow) / 2;
      const jumpCol = (fromCol + toCol) / 2;
      newBoard[jumpRow][jumpCol] = EMPTY;

      // Проверка на множественные прыжки
      const moveInfo = validMoves.find(
        (move) => move.row === toRow && move.col === toCol
      );
      setBoard(newBoard);

      if (moveInfo && "jumpRow" in moveInfo) {
        const additionalJumps = calculateValidMoves(toRow, toCol).filter(
          (move) => "jumpRow" in move
        );

        if (additionalJumps.length > 0) {
          setSelectedPiece({ row: toRow, col: toCol });
          setValidMoves(additionalJumps);
          setGameMessage("Доступен множественный прыжок! Продолжайте прыгать.");
          return;
        }
      }
    }

    if (gameMode === GAME_MODES.PARTY_MODE) {
      // Добавляем случайные эффекты при ходах
      const effects = [
        "scale-150",
        "rotate-180",
        "skew-x-12",
        "blur-sm",
        "brightness-150",
        "contrast-200",
      ];
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];

      // Применяем эффект к фигуре
      const piece = document.querySelector(
        `[data-row="${toRow}"][data-col="${toCol}"]`
      );
      if (piece) {
        piece.classList.add(randomEffect);
        setTimeout(() => piece.classList.remove(randomEffect), 500);
      }
    }

    setBoard(newBoard);
    setSelectedPiece(null);
    setValidMoves([]);
    setPlayerTurn(false);
    setGameMessage("Корги думает...");
  };

  // Bot AI implementation (Minimax algorithm with alpha-beta pruning)
  const makeBotMove = () => {
    const DEPTH = 5; // Depth of search, higher = stronger but slower

    const botMove = findBestMove(board, DEPTH);
    if (botMove) {
      const { fromRow, fromCol, toRow, toCol, isJump } = botMove;

      const newBoard = board.map((row) => [...row]);
      const piece = newBoard[fromRow][fromCol];

      // Move the piece
      newBoard[fromRow][fromCol] = EMPTY;
      newBoard[toRow][toCol] = piece;

      // Check for king promotion
      if (piece === BOT && toRow === BOARD_SIZE - 1) {
        newBoard[toRow][toCol] = BOT_KING;
      }

      // If it's a jump, remove the jumped piece
      if (isJump) {
        const jumpRow = (fromRow + toRow) / 2;
        const jumpCol = (fromCol + toCol) / 2;
        newBoard[jumpRow][jumpCol] = EMPTY;
      }

      setBoard(newBoard);
      setGameMessage("Ваш ход! Вы играете за Биглей.");
      setPlayerTurn(true);
    } else {
      // No valid moves for bot
      setGameOver(true);
      setGameMessage("Вы победили! Бигли одержали победу!");
    }
  };

  // Restart the game
  const restartGame = () => {
    setBoard(createInitialBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setPlayerTurn(true);
    setGameOver(false);
    setGameMessage("Ваш ход! Вы играете за Биглей.");
    setJumpExists(false);
  };

  // Упрощенный toggleFullscreen
  const toggleFullscreen = async () => {
    const board = document.getElementById("chess-board-container");

    if (!document.fullscreenElement) {
      try {
        if (board.requestFullscreen) {
          await board.requestFullscreen();
        } else if (board.webkitRequestFullscreen) {
          await board.webkitRequestFullscreen();
        } else if (board.msRequestFullscreen) {
          await board.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error("Ошибка перехода в полноэкранный режим:", err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setIsFullscreen(false);
      } catch (err) {
        console.error("Ошибка выхода из полноэкранного режима:", err);
      }
    }
  };

  // Обновим renderBoard для использования 3D
  const renderBoard = () => {
    return (
      <div
        id="chess-board-container"
        className={`
          flex items-center justify-center
          ${
            isFullscreen
              ? "fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 w-screen h-screen"
              : "w-full"
          }
          transition-colors duration-300
        `}>
        <div
          id="chess-board"
          className={`
            ${
              isFullscreen
                ? "w-[min(90vh,90vw)] h-[min(90vh,90vw)]"
                : "w-full max-w-[600px] aspect-square"
            }
            shadow-2xl
            transition-all duration-300
          `}>
          <Board3D
            board={board}
            onPieceSelect={handlePieceSelect}
            selectedPiece={selectedPiece}
            validMoves={validMoves}
          />
        </div>
      </div>
    );
  };

  // Обновляем разметку в основном return
  return (
    <div
      className={`
      flex flex-col items-center justify-center min-h-screen w-screen
     bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
      transition-colors duration-300
      
    `}>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8 max-w-4xl mx-auto">
          {!isFullscreen && (
            /* Верхняя панель */
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
                  Корги против Биглей
                </h1>
                <div className="flex gap-4">
                  <button
                    onClick={toggleFullscreen}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 
                             text-white rounded-lg shadow-lg
                             transform transition-all duration-200 hover:scale-105">
                    {isFullscreen ? "Выйти" : "На весь экран"}
                  </button>
                </div>
              </div>

              {/* Сообщение о состоянии игры */}
              <div className="mt-6 text-center min-h-16">
                <p
                  className="text-xl font-semibold animate-[messageSlide_0.5s_ease-out]  
                           bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                  {gameMessage}
                </p>
              </div>
            </div>
          )}

          {/* Игровая доска с рамкой */}
          <div className="relative group">
            <div
              className={`
              absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
              rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-1000
              ${isFullscreen ? "hidden" : ""}
            `}></div>
            <div
              id="chess-board"
              className={`
              relative rounded-xl shadow-xl overflow-hidden
              ${isFullscreen ? "" : "bg-white dark:bg-gray-800 p-4"}
            `}>
              {renderBoard()}
              {/* Кнопка выхода из полноэкранного режима */}
              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 
                           text-white rounded-lg shadow-lg backdrop-blur-sm
                           transform transition-all duration-200 hover:scale-105
                           flex items-center space-x-2 z-50">
                  <span>🔄</span>
                  <span>Выйти</span>
                </button>
              )}
            </div>
          </div>

          {!isFullscreen && (
            <>
              {/* Кнопка "Играть снова" */}
              {gameOver && (
                <div className="text-center">
                  <button
                    onClick={restartGame}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 
                             text-white text-xl font-semibold rounded-xl shadow-xl 
                             transform transition-all duration-200 hover:scale-105 
                             hover:shadow-2xl focus:outline-none focus:ring-2 
                             focus:ring-offset-2 focus:ring-green-500">
                    Начать новую игру
                  </button>
                </div>
              )}

              {/* Инструкции */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl p-8">
                <h2
                  className="text-2xl font-bold mb-6 text-center bg-gradient-to-r 
                             from-blue-600 to-purple-600 text-transparent bg-clip-text">
                  Как играть:
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-lg">
                      <span className="text-2xl">👆</span>
                      <p>Нажмите на вашего Бигля, чтобы выбрать его</p>
                    </div>
                    <div className="flex items-center gap-3 text-lg">
                      <span className="text-2xl">🎯</span>
                      <p>Нажмите на подсвеченную клетку для хода</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-lg">
                      <span className="text-2xl">🦘</span>
                      <p>Вы должны прыгать, если прыжок доступен</p>
                    </div>
                    <div className="flex items-center gap-3 text-lg">
                      <span className="text-2xl">👑</span>
                      <p>Короли могут ходить вперёд и назад</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
