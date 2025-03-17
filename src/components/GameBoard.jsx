import React, { useEffect, useState } from "react";
import { Board3D } from "./Board3D";
import { useGame } from "../contexts/GameContext.jsx";
import { getValidMoves, executeMove } from "../services/MoveService";
import { movePiece, checkGameStatus } from "../services/BoardService";
import { PLAYER, BOT, PLAYER_KING, BOT_KING } from "../models/Constants";

export function GameBoard({ isFullscreen, onExitFullscreen }) {
  const {
    board,
    setBoard,
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
  } = useGame();

  // Выбор фигуры или ход
  const handlePieceSelect = (row, col) => {
    // Если игра окончена, ничего не делаем
    if (gameOver) return;

    // Если не ход игрока, ничего не делаем
    if (!playerTurn) return;

    const piece = board[row][col];
    const isPlayerPiece = piece === PLAYER || piece === PLAYER_KING;

    // Если уже выбрана фигура, проверяем возможность хода
    if (selectedPiece) {
      // Проверяем, является ли выбранная клетка допустимым ходом
      const isValidMove = validMoves.some(
        (move) => move.row === row && move.col === col
      );

      if (isValidMove) {
        // Находим информацию о ходе (для определения взятых фигур)
        const moveInfo = validMoves.find(
          (move) => move.row === row && move.col === col
        );
        const captured = moveInfo.captured || [];

        // Выполняем ход с учетом взятых фигур
        const newBoard = executeMove(
          board,
          selectedPiece.row,
          selectedPiece.col,
          row,
          col,
          captured
        );

        setBoard(newBoard);

        // Проверяем, есть ли возможность для еще одного взятия той же фигурой
        if (captured.length > 0) {
          const { captures } = getValidMoves(newBoard, row, col);

          if (captures.length > 0) {
            setSelectedPiece({ row, col });
            setValidMoves(captures);
            return;
          }
        }

        // Сбрасываем выбор и передаем ход боту
        setSelectedPiece(null);
        setValidMoves([]);
        setPlayerTurn(false);
        setGameMessage("Ход корги...");

        // Проверяем состояние игры после хода игрока
        const gameStatus = checkGameStatus(newBoard);
        if (gameStatus) {
          handleGameOver(gameStatus);
        }
      } else if (isPlayerPiece) {
        // Если выбрана другая фигура игрока, выбираем ее
        const { moves, captures } = getValidMoves(board, row, col);
        setSelectedPiece({ row, col });

        // Если есть возможность взятия, показываем только взятия
        if (captures.length > 0) {
          setValidMoves(captures);
        } else {
          setValidMoves(moves);
        }
      } else {
        // Если выбрана пустая клетка или фигура бота, сбрасываем выбор
        setSelectedPiece(null);
        setValidMoves([]);
      }
    } else if (isPlayerPiece) {
      // Выбираем фигуру игрока
      const { moves, captures } = getValidMoves(board, row, col);
      setSelectedPiece({ row, col });

      // Если есть возможность взятия, показываем только взятия
      if (captures.length > 0) {
        setValidMoves(captures);
      } else {
        setValidMoves(moves);
      }
    }
  };

  const handleGameOver = (winner) => {
    setGameOver(true);
    setGameMessage(
      winner === PLAYER
        ? "Вы победили! Бигли одержали верх над корги!"
        : "Вы проиграли! Корги оказались хитрее!"
    );
  };

  return (
    <div
      id="chess-board-container"
      className={`
        flex items-center justify-center
        ${
          isFullscreen
            ? "fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 w-screen h-screen z-50"
            : "w-full"
        }
        transition-all duration-300
      `}>
      {/* Полноэкранный режим - кнопка выхода */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onExitFullscreen}
            className="px-4 py-2 bg-gray-800/80 text-white rounded-lg shadow-lg
                     hover:bg-gray-700/80 transition-colors">
            Выйти из полноэкранного режима
          </button>
        </div>
      )}

      {/* Полноэкранный режим - сообщение */}
      {isFullscreen && (
        <div className="absolute top-4 left-4 z-10">
          <div className="px-4 py-2 bg-gray-800/80 text-white rounded-lg shadow-lg">
            {gameMessage}
          </div>
        </div>
      )}

      {/* Доска */}
      <div
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
}
