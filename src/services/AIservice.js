import {
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  BOARD_SIZE,
} from "../models/Constants";
import { calculateValidMoves, getAllPossibleMoves } from "./MoveService";
import { checkGameStatus, movePiece } from "./BoardService";

export const evaluateBoard = (board) => {
  let score = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      if (piece === BOT) score += 10 + row;
      else if (piece === BOT_KING) score += 20;
      else if (piece === PLAYER) score -= 10 + (BOARD_SIZE - 1 - row);
      else if (piece === PLAYER_KING) score -= 20;

      // Бонус за центральное положение
      if (piece === BOT || piece === BOT_KING) {
        const centerDistance = Math.abs(3.5 - col) + Math.abs(3.5 - row);
        score += (4 - centerDistance) / 2;
      }
    }
  }

  return score;
};

export const minimax = (board, depth, alpha, beta, isMaximizing) => {
  // Базовый случай: достигнута максимальная глубина или игра окончена
  if (depth === 0) {
    return evaluateBoard(board);
  }

  const gameStatus = checkGameStatus(board);
  if (gameStatus) {
    return gameStatus === BOT ? 1000 : -1000;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    const botMoves = getAllPossibleMoves(board, BOT);

    for (const move of botMoves) {
      const { fromRow, fromCol, toRow, toCol } = move;
      const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
      const score = minimax(newBoard, depth - 1, alpha, beta, false);

      bestScore = Math.max(score, bestScore);
      alpha = Math.max(alpha, bestScore);

      if (beta <= alpha) break; // Отсечение альфа-бета
    }

    return bestScore;
  } else {
    let bestScore = Infinity;
    const playerMoves = getAllPossibleMoves(board, PLAYER);

    for (const move of playerMoves) {
      const { fromRow, fromCol, toRow, toCol } = move;
      const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
      const score = minimax(newBoard, depth - 1, alpha, beta, true);

      bestScore = Math.min(score, bestScore);
      beta = Math.min(beta, bestScore);

      if (beta <= alpha) break; // Отсечение альфа-бета
    }

    return bestScore;
  }
};

export const findBestMove = (board, depth = 5) => {
  const allMoves = getAllPossibleMoves(board, BOT);

  // Если нет доступных ходов
  if (allMoves.length === 0) return null;

  let bestMove = null;
  let bestScore = -Infinity;

  for (const move of allMoves) {
    const { fromRow, fromCol, toRow, toCol } = move;
    const newBoard = movePiece(board, fromRow, fromCol, toRow, toCol);
    const moveScore = minimax(newBoard, depth - 1, -Infinity, Infinity, false);

    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = move;
    }
  }

  return bestMove;
};
