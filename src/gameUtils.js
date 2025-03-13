import {
  BOARD_SIZE,
  PLAYER,
  BOT,
  PLAYER_KING,
  BOT_KING,
  EMPTY,
} from "./constants.js";

export const checkGameStatusForBoard = (currentBoard) => {
  let botPieces = 0,
    playerPieces = 0;

  // Count pieces
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = currentBoard[row][col];
      if (piece === PLAYER || piece === PLAYER_KING) playerPieces++;
      if (piece === BOT || piece === BOT_KING) botPieces++;
    }
  }

  // Check win conditions
  if (botPieces === 0) return PLAYER;
  if (playerPieces === 0) return BOT;

  // Check for available moves
  const botMoves = getAllPossibleMoves(currentBoard, BOT);
  const playerMoves = getAllPossibleMoves(currentBoard, PLAYER);
  if (botMoves.length === 0) return PLAYER;
  if (playerMoves.length === 0) return BOT;

  return null;
};

/**
 * Получает все возможные ходы для указанного игрока на заданной доске.
 */
export const getAllPossibleMoves = (currentBoard, playerType) => {
  const pieces = [];
  const isPlayer = playerType === PLAYER;
  const pieceTypes = isPlayer ? [PLAYER, PLAYER_KING] : [BOT, BOT_KING];

  // Find all pieces of the given type
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (pieceTypes.includes(currentBoard[row][col])) {
        pieces.push({ row, col });
      }
    }
  }

  // Calculate moves
  let jumpsAvailable = false;
  let allMoves = [];

  // First pass to check for jumps
  pieces.forEach(({ row, col }) => {
    const moves = calculateValidMovesForBoard(currentBoard, row, col);
    const jumpMoves = moves.filter((move) => "jumpRow" in move);

    if (jumpMoves.length > 0) {
      jumpsAvailable = true;
      jumpMoves.forEach((move) => {
        allMoves.push({
          fromRow: row,
          fromCol: col,
          toRow: move.row,
          toCol: move.col,
          isJump: true,
          jumpRow: move.jumpRow,
          jumpCol: move.jumpCol,
        });
      });
    }
  });

  // If no jumps, collect regular moves
  if (!jumpsAvailable) {
    pieces.forEach(({ row, col }) => {
      const moves = calculateValidMovesForBoard(currentBoard, row, col);
      const regularMoves = moves.filter((move) => !("jumpRow" in move));

      regularMoves.forEach((move) => {
        allMoves.push({
          fromRow: row,
          fromCol: col,
          toRow: move.row,
          toCol: move.col,
          isJump: false,
        });
      });
    });
  }

  return allMoves;
};

/**
 * Оценивает текущее состояние доски для алгоритма minimax.
 */
export const evaluateBoard = (currentBoard) => {
  let score = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = currentBoard[row][col];
      if (piece === BOT) score += 10 + row;
      else if (piece === BOT_KING) score += 20;
      else if (piece === PLAYER) score -= 10 + (BOARD_SIZE - 1 - row);
      else if (piece === PLAYER_KING) score -= 20;

      if (piece === BOT || piece === BOT_KING) {
        const centerDistance = Math.abs(3.5 - col) + Math.abs(3.5 - row);
        score += (4 - centerDistance) / 2;
      }
    }
  }
  return score;
};

/**
 * Алгоритм minimax с альфа-бета отсечением.
 */
export const minimax = (currentBoard, depth, alpha, beta, isMaximizing) => {
  if (depth === 0) {
    return evaluateBoard(currentBoard);
  }
  const gameStatus = checkGameStatusForBoard(currentBoard);
  if (gameStatus) {
    return gameStatus === BOT ? 1000 : -1000;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    const botMoves = getAllPossibleMoves(currentBoard, BOT);
    for (const move of botMoves) {
      const newBoard = currentBoard.map((row) => [...row]);
      const { fromRow, fromCol, toRow, toCol, isJump, jumpRow, jumpCol } = move;
      const piece = newBoard[fromRow][fromCol];
      // Применяем ход
      newBoard[fromRow][fromCol] = EMPTY;
      newBoard[toRow][toCol] = piece;
      if (piece === BOT && toRow === BOARD_SIZE - 1) {
        newBoard[toRow][toCol] = BOT_KING;
      }
      if (isJump && jumpRow !== undefined && jumpCol !== undefined) {
        newBoard[jumpRow][jumpCol] = EMPTY;
      }
      const score = minimax(newBoard, depth - 1, alpha, beta, false);
      bestScore = Math.max(score, bestScore);
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    const playerMoves = getAllPossibleMoves(currentBoard, PLAYER);
    for (const move of playerMoves) {
      const newBoard = currentBoard.map((row) => [...row]);
      const { fromRow, fromCol, toRow, toCol, isJump } = move;
      const jumpRow = move.jumpRow;
      const jumpCol = move.jumpCol;
      const piece = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = EMPTY;
      newBoard[toRow][toCol] = piece;
      if (piece === PLAYER && toRow === 0) {
        newBoard[toRow][toCol] = PLAYER_KING;
      }
      if (isJump && jumpRow !== undefined && jumpCol !== undefined) {
        newBoard[jumpRow][jumpCol] = EMPTY;
      }
      const score = minimax(newBoard, depth - 1, alpha, beta, true);
      bestScore = Math.min(score, bestScore);
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break;
    }
    return bestScore;
  }
};

/**
 * Находит лучший ход для бота с использованием алгоритма minimax.
 */
export const findBestMove = (currentBoard, depth) => {
  let bestMove = null;
  let bestScore = -Infinity;
  const possibleMoves = getAllPossibleMoves(currentBoard, BOT);

  if (possibleMoves.length === 0) return null;

  for (const move of possibleMoves) {
    const { fromRow, fromCol, toRow, toCol, isJump, jumpRow, jumpCol } = move;
    const newBoard = currentBoard.map((row) => [...row]);
    const piece = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = EMPTY;
    newBoard[toRow][toCol] = piece;
    if (piece === BOT && toRow === BOARD_SIZE - 1) {
      newBoard[toRow][toCol] = BOT_KING;
    }
    if (isJump && jumpRow !== undefined && jumpCol !== undefined) {
      newBoard[jumpRow][jumpCol] = EMPTY;
    }
    const moveScore = minimax(newBoard, depth - 1, -Infinity, Infinity, false);
    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = move;
    }
  }
  return bestMove;
};

/**
 * Вычисляет все возможные ходы для заданной фигуры на доске.
 */
export const calculateValidMovesForBoard = (board, row, col) => {
  // Проверка существования board и корректности координат
  if (!board || !board[row] || board[row][col] === undefined) return [];

  const piece = board[row][col];
  if (!piece || piece === EMPTY) return [];

  const isKing = piece === PLAYER_KING || piece === BOT_KING;
  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  let moves = [];
  let jumps = [];

  // Направления движения для турецких шашек (диагонали + ортогональные направления)
  // Турецкие шашки двигаются по диагонали и ортогонально
  const directions = [
    [-1, -1], // верхний левый
    [-1, 0], // верхний
    [-1, 1], // верхний правый
    [0, -1], // левый
    [0, 1], // правый
    [1, -1], // нижний левый
    [1, 0], // нижний
    [1, 1], // нижний правый
  ];

  directions.forEach(([rowDir, colDir]) => {
    const newRow = row + rowDir;
    const newCol = col + colDir;

    // Обычные ходы
    if (isValidPosition(newRow, newCol) && board[newRow][newCol] === EMPTY) {
      // Проверяем направление движения для обычных фигур
      if (isKing || (isPlayer && rowDir < 0) || (!isPlayer && rowDir > 0)) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    // Проверка на захваты (прыжки)
    if (isValidPosition(newRow, newCol) && board[newRow][newCol] !== EMPTY) {
      const jumpedPiece = board[newRow][newCol];
      if (jumpedPiece) {
        // Проверка на null или undefined
        const isOpponent =
          (isPlayer && (jumpedPiece === BOT || jumpedPiece === BOT_KING)) ||
          (!isPlayer &&
            (jumpedPiece === PLAYER || jumpedPiece === PLAYER_KING));

        if (isOpponent) {
          const jumpRow = newRow + rowDir;
          const jumpCol = newCol + colDir;

          if (
            isValidPosition(jumpRow, jumpCol) &&
            board[jumpRow][jumpCol] === EMPTY
          ) {
            jumps.push({
              row: jumpRow,
              col: jumpCol,
              jumpRow: newRow,
              jumpCol: newCol,
            });
          }
        }
      }
    }
  });

  // Если есть захваты, только они возвращаются
  return jumps.length > 0 ? jumps : moves;
};

/**
 * Проверяет, является ли позиция на доске допустимой.
 */
const isValidPosition = (row, col) => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};
