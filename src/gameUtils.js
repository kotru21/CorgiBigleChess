import {
  BOARD_SIZE,
  PLAYER,
  BOT,
  PLAYER_KING,
  BOT_KING,
  EMPTY,
} from "./constants.js";

// Удаляем импорт calculateValidMovesForBoard, так как определяем её здесь
// import { calculateValidMovesForBoard } from "./moveUtils.js";

/**
 * Проверяет состояние игры (победа одного из игроков или отсутствие ходов) для заданной доски.
 */
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

  pieces.forEach(({ row, col }) => {
    const moves = calculateValidMovesForBoard(currentBoard, row, col);
    moves.forEach((move) => {
      if ("jumpRow" in move) {
        jumpsAvailable = true;
        allMoves.push({
          fromRow: row,
          fromCol: col,
          toRow: move.row,
          toCol: move.col,
          isJump: true,
          jumpRow: move.jumpRow,
          jumpCol: move.jumpCol,
        });
      } else if (!jumpsAvailable) {
        allMoves.push({
          fromRow: row,
          fromCol: col,
          toRow: move.row,
          toCol: move.col,
          isJump: false,
        });
      }
    });
  });

  return jumpsAvailable ? allMoves.filter((move) => move.isJump) : allMoves;
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
      const { fromRow, fromCol, toRow, toCol, isJump } = move;
      const piece = newBoard[fromRow][fromCol];
      // Применяем ход
      newBoard[fromRow][fromCol] = null;
      newBoard[toRow][toCol] = piece;
      if (piece === BOT && toRow === BOARD_SIZE - 1) {
        newBoard[toRow][toCol] = BOT_KING;
      }
      if (isJump) {
        const jumpRow = (fromRow + toRow) / 2;
        const jumpCol = (fromCol + toCol) / 2;
        newBoard[jumpRow][jumpCol] = null;
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
      const piece = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = null;
      newBoard[toRow][toCol] = piece;
      if (piece === PLAYER && toRow === 0) {
        newBoard[toRow][toCol] = PLAYER_KING;
      }
      if (isJump) {
        const jumpRow = (fromRow + toRow) / 2;
        const jumpCol = (fromCol + toCol) / 2;
        newBoard[jumpRow][jumpCol] = null;
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
  const botPieces = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (
        currentBoard[row][col] === BOT ||
        currentBoard[row][col] === BOT_KING
      ) {
        botPieces.push({ row, col });
      }
    }
  }
  let bestMove = null;
  let bestScore = -Infinity;
  let jumpsAvailable = false;
  let allPossibleMoves = [];

  for (const piece of botPieces) {
    const { row, col } = piece;
    const moves = calculateValidMovesForBoard(currentBoard, row, col);
    for (const move of moves) {
      if ("jumpRow" in move) {
        jumpsAvailable = true;
        allPossibleMoves.push({
          fromRow: row,
          fromCol: col,
          toRow: move.row,
          toCol: move.col,
          isJump: true,
          jumpRow: move.jumpRow,
          jumpCol: move.jumpCol,
        });
      } else if (!jumpsAvailable) {
        allPossibleMoves.push({
          fromRow: row,
          fromCol: col,
          toRow: move.row,
          toCol: move.col,
          isJump: false,
        });
      }
    }
  }
  if (jumpsAvailable) {
    allPossibleMoves = allPossibleMoves.filter((move) => move.isJump);
  }
  if (allPossibleMoves.length === 0) return null;

  for (const move of allPossibleMoves) {
    const { fromRow, fromCol, toRow, toCol, isJump } = move;
    const newBoard = currentBoard.map((row) => [...row]);
    const piece = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = null;
    newBoard[toRow][toCol] = piece;
    if (piece === BOT && toRow === BOARD_SIZE - 1) {
      newBoard[toRow][toCol] = BOT_KING;
    }
    if (isJump) {
      const jumpRow = (fromRow + toRow) / 2;
      const jumpCol = (fromCol + toCol) / 2;
      newBoard[jumpRow][jumpCol] = null;
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
  const piece = board[row][col];
  if (!piece) return [];

  const isKing = piece === PLAYER_KING || piece === BOT_KING;
  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  let moves = [];
  let jumps = [];

  // Direction vectors: up, right, down, left
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  directions.forEach(([rowDir, colDir]) => {
    let newRow = row + rowDir;
    let newCol = col + colDir;

    if (isValidPosition(newRow, newCol) && board[newRow][newCol] === EMPTY) {
      if (isKing || (isPlayer && rowDir < 0) || (!isPlayer && rowDir > 0)) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    // Check for jumps
    if (isValidPosition(newRow, newCol) && board[newRow][newCol]) {
      const jumpRow = newRow + rowDir;
      const jumpCol = newCol + colDir;
      if (
        isValidPosition(jumpRow, jumpCol) &&
        board[jumpRow][jumpCol] === EMPTY
      ) {
        const jumpedPiece = board[newRow][newCol];
        if (
          (isPlayer && (jumpedPiece === BOT || jumpedPiece === BOT_KING)) ||
          (!isPlayer && (jumpedPiece === PLAYER || jumpedPiece === PLAYER_KING))
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
  });

  return jumps.length > 0 ? jumps : moves;
};

/**
 * Проверяет, является ли позиция на доске допустимой.
 */
const isValidPosition = (row, col) => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};
