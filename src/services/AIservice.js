import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "../models/Constants";
import { getValidMoves, executeMove, findAllCaptures } from "./MoveService";

// Обновленная функция оценки для турецких шашек
export const evaluateBoard = (board) => {
  let score = 0;
  let botPieces = 0;
  let playerPieces = 0;
  let botKings = 0;
  let playerKings = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      if (piece === BOT) {
        botPieces++;
        // Стимулировать продвижение к превращению в дамку
        score += 10 + row;
        // Центральное положение ценнее для контроля доски
        const centerDistance = Math.abs(3.5 - col) + Math.abs(3.5 - row);
        score += (4 - centerDistance) / 2;
      } else if (piece === BOT_KING) {
        botKings++;
        score += 30; // Дамки ценнее в турецких шашках из-за их большей подвижности
        // Центральное положение для дамок еще важнее
        const centerDistance = Math.abs(3.5 - col) + Math.abs(3.5 - row);
        score += 5 - centerDistance;
      } else if (piece === PLAYER) {
        playerPieces++;
        score -= 10 + (BOARD_SIZE - 1 - row); // То же для фигур игрока
      } else if (piece === PLAYER_KING) {
        playerKings++;
        score -= 30;
      }
    }
  }

  // Дополнительные стратегические факторы

  // Преимущество при большем количестве фигур
  const pieceDifference = botPieces + botKings - (playerPieces + playerKings);
  score += pieceDifference * 5;

  // Бонус за наличие дамок
  score += botKings * 10;
  score -= playerKings * 10;

  // Если у противника не осталось ходов - это победа
  if (playerPieces + playerKings === 0) {
    score = 1000; // Большое положительное значение для победы
  }

  // Если у нас не осталось ходов - это поражение
  if (botPieces + botKings === 0) {
    score = -1000; // Большое отрицательное значение для поражения
  }

  return score;
};

// Получение всех возможных ходов для бота
export const getAllBotMoves = (board) => {
  const moves = [];
  const captures = [];

  // Проходим по всей доске
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      // Если это фигура бота
      if (piece === BOT || piece === BOT_KING) {
        const { moves: pieceMoves, captures: pieceCaptures } = getValidMoves(
          board,
          row,
          col
        );

        // Добавляем обычные ходы
        pieceMoves.forEach((move) => {
          moves.push({
            fromRow: row,
            fromCol: col,
            toRow: move.row,
            toCol: move.col,
            captured: [],
          });
        });

        // Добавляем взятия
        pieceCaptures.forEach((capture) => {
          captures.push({
            fromRow: row,
            fromCol: col,
            toRow: capture.row,
            toCol: capture.col,
            captured: capture.captured,
          });
        });
      }
    }
  }

  // Если есть взятия, возвращаем только их (правило обязательного взятия)
  return captures.length > 0 ? captures : moves;
};

// Алгоритм минимакс с альфа-бета отсечением
export const minimaxAlphaBeta = (board, depth, alpha, beta, isMaximizing) => {
  // Базовый случай - достигнута максимальная глубина или игра окончена
  if (depth === 0) {
    return { score: evaluateBoard(board) };
  }

  // Получаем все возможные ходы для текущего игрока
  const moves = isMaximizing ? getAllBotMoves(board) : getAllPlayerMoves(board);

  // Если нет ходов, это поражение
  if (moves.length === 0) {
    return { score: isMaximizing ? -1000 : 1000 };
  }

  let bestMove = null;

  if (isMaximizing) {
    let maxEval = -Infinity;

    for (const move of moves) {
      // Выполняем ход на временной доске
      const newBoard = executeMove(
        board,
        move.fromRow,
        move.fromCol,
        move.toRow,
        move.toCol,
        move.captured
      );

      // Рекурсивный вызов для следующего уровня
      const evalResult = minimaxAlphaBeta(
        newBoard,
        depth - 1,
        alpha,
        beta,
        false
      );

      // Обновляем лучший результат
      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = move;
      }

      // Альфа-бета отсечение
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) {
        break;
      }
    }

    return { move: bestMove, score: maxEval };
  } else {
    let minEval = Infinity;

    for (const move of moves) {
      // Выполняем ход на временной доске
      const newBoard = executeMove(
        board,
        move.fromRow,
        move.fromCol,
        move.toRow,
        move.toCol,
        move.captured
      );

      // Рекурсивный вызов для следующего уровня
      const evalResult = minimaxAlphaBeta(
        newBoard,
        depth - 1,
        alpha,
        beta,
        true
      );

      // Обновляем лучший результат
      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = move;
      }

      // Альфа-бета отсечение
      beta = Math.min(beta, minEval);
      if (beta <= alpha) {
        break;
      }
    }

    return { move: bestMove, score: minEval };
  }
};

// Получение всех возможных ходов для игрока (нужно для минимакса)
export const getAllPlayerMoves = (board) => {
  const moves = [];
  const captures = [];

  // Проходим по всей доске
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      // Если это фигура игрока
      if (piece === PLAYER || piece === PLAYER_KING) {
        const { moves: pieceMoves, captures: pieceCaptures } = getValidMoves(
          board,
          row,
          col
        );

        // Добавляем обычные ходы
        pieceMoves.forEach((move) => {
          moves.push({
            fromRow: row,
            fromCol: col,
            toRow: move.row,
            toCol: move.col,
            captured: [],
          });
        });

        // Добавляем взятия
        pieceCaptures.forEach((capture) => {
          captures.push({
            fromRow: row,
            fromCol: col,
            toRow: capture.row,
            toCol: capture.col,
            captured: capture.captured,
          });
        });
      }
    }
  }

  // Если есть взятия, возвращаем только их (правило обязательного взятия)
  return captures.length > 0 ? captures : moves;
};

export const getBestMove = (board, depth) => {
  const result = minimaxAlphaBeta(board, depth, -Infinity, Infinity, true);
  return result.move;
};
