import React, { useEffect, useState } from "react";
import { Board3D } from "./Board3D";
import { useGame } from "../contexts/GameContext.jsx";
import { getValidMoves, executeMove } from "../services/MoveService";
import {
  movePiece,
  checkGameStatus,
  createInitialBoard,
} from "../services/BoardService";
import { PLAYER, BOT, PLAYER_KING, BOT_KING } from "../models/Constants";
import { useBotAI } from "../hooks/useBotAI"; // Добавляем импорт хука для бота

export function GameBoard({ onReturnToMenu }) {
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

  // Подключаем AI бота
  const { makeBotMove } = useBotAI();

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
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Статус игры */}
      <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-md text-white font-medium">
        {gameMessage}
      </div>

      {/* Кнопка возврата в меню - теперь использует переданную функцию */}
      <button
        onClick={onReturnToMenu}
        className="absolute top-2 right-2 z-10 px-3 py-1 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-md text-white transition-colors">
        Меню
      </button>

      {/* Игровая подсказка */}
      {playerTurn && !gameOver && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-md text-white text-sm">
          {selectedPiece ? "Выберите поле для хода" : "Выберите бигля для хода"}
        </div>
      )}

      {/* Доска на весь экран */}
      <div className="w-full h-full">
        <Board3D
          board={board}
          onPieceSelect={handlePieceSelect}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
        />
      </div>

      {/* Показ статуса окончания игры */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl text-center max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4 text-white">
              {gameMessage}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Сброс игры и начало новой
                  const newBoard = createInitialBoard();
                  setBoard(newBoard);
                  setGameOver(false);
                  setPlayerTurn(true);
                  setGameMessage("Новая игра! Ваш ход!");
                  setSelectedPiece(null);
                  setValidMoves([]);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg hover:from-purple-600 hover:to-blue-600 transition-colors">
                Новая игра
              </button>
              <button
                onClick={onReturnToMenu}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-lg shadow-lg hover:from-gray-600 hover:to-gray-800 transition-colors">
                В меню
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
