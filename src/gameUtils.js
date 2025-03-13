import {
  BOARD_SIZE,
  PLAYER,
  BOT,
  PLAYER_KING,
  BOT_KING,
  EMPTY,
} from "./constants.js";
import { findForcedJumps, calculateValidMovesForBoard } from "./moveUtils.js";

/**
 * Checks game status for a given board.
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

  // Special case: one piece against one piece is a draw in Turkish checkers
  if (botPieces === 1 && playerPieces === 1) return "DRAW";

  // Check for stalemate (no available moves)
  const botMoves = getAllPossibleMoves(currentBoard, BOT);
  const playerMoves = getAllPossibleMoves(currentBoard, PLAYER);

  if (botMoves.length === 0) return PLAYER;
  if (playerMoves.length === 0) return BOT;

  return null;
};

/**
 * Gets all possible moves for a specified player on a given board.
 */
export const getAllPossibleMoves = (currentBoard, playerType) => {
  const isPlayer = playerType === PLAYER;

  // First check for forced jumps
  const jumps = findForcedJumps(currentBoard, isPlayer);

  if (jumps.length > 0) {
    // Find max captures
    const maxCaptures = jumps.reduce(
      (max, jump) => Math.max(max, jump.captures.length),
      0
    );

    // Return only jumps with max captures
    return jumps
      .filter((jump) => jump.captures.length === maxCaptures)
      .map((jump) => ({
        fromRow: jump.fromRow,
        fromCol: jump.fromCol,
        toRow: jump.toRow,
        toCol: jump.toCol,
        isJump: true,
        captures: jump.captures,
      }));
  }

  // If no jumps, find regular moves
  const pieces = [];
  const pieceTypes = isPlayer ? [PLAYER, PLAYER_KING] : [BOT, BOT_KING];

  // Find all pieces of the given type
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (pieceTypes.includes(currentBoard[row][col])) {
        pieces.push({ row, col });
      }
    }
  }

  // Calculate regular moves
  let allMoves = [];
  pieces.forEach(({ row, col }) => {
    const moves = calculateValidMovesForBoard(currentBoard, row, col);
    moves.forEach((move) => {
      allMoves.push({
        fromRow: row,
        fromCol: col,
        toRow: move.row,
        toCol: move.col,
        isJump: false,
      });
    });
  });

  return allMoves;
};

/**
 * Evaluates the current board state for the minimax algorithm.
 */
export const evaluateBoard = (currentBoard) => {
  let score = 0;

  // Material count and position
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = currentBoard[row][col];

      if (piece === BOT) {
        score += 10;
        // Bonus for advancement
        score += BOARD_SIZE - 1 - row;
        // Bonus for being near the king row
        if (row === BOARD_SIZE - 2) score += 3;
      } else if (piece === BOT_KING) {
        score += 20;
        // Kings want to be in the center for maximum mobility
        const centerDistanceRow = Math.abs(3.5 - row);
        const centerDistanceCol = Math.abs(3.5 - col);
        score += 5 - (centerDistanceRow + centerDistanceCol) / 2;
      } else if (piece === PLAYER) {
        score -= 10;
        // Bonus for advancement
        score -= row;
        // Bonus for being near the king row
        if (row === 1) score -= 3;
      } else if (piece === PLAYER_KING) {
        score -= 20;
        // Kings want to be in the center for maximum mobility
        const centerDistanceRow = Math.abs(3.5 - row);
        const centerDistanceCol = Math.abs(3.5 - col);
        score -= 5 - (centerDistanceRow + centerDistanceCol) / 2;
      }
    }
  }

  // Bonus for mobility
  const botMoves = getAllPossibleMoves(currentBoard, BOT).length;
  const playerMoves = getAllPossibleMoves(currentBoard, PLAYER).length;
  score += (botMoves - playerMoves) * 0.5;

  // Bonus for forcing jumps
  const botJumps = findForcedJumps(currentBoard, false).length;
  const playerJumps = findForcedJumps(currentBoard, true).length;
  score += botJumps * 2;
  score -= playerJumps * 2;

  return score;
};

/**
 * Minimax algorithm with alpha-beta pruning.
 */
export const minimax = (currentBoard, depth, alpha, beta, isMaximizing) => {
  if (depth === 0) {
    return evaluateBoard(currentBoard);
  }

  const gameStatus = checkGameStatusForBoard(currentBoard);
  if (gameStatus === BOT) return 1000 + depth; // Prefer winning sooner
  if (gameStatus === PLAYER) return -1000 - depth; // Avoid losing later
  if (gameStatus === "DRAW") return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    const botMoves = getAllPossibleMoves(currentBoard, BOT);

    for (const move of botMoves) {
      const newBoard = applyMove(currentBoard, move);
      const score = minimax(newBoard, depth - 1, alpha, beta, false);
      bestScore = Math.max(score, bestScore);
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    const playerMoves = getAllPossibleMoves(currentBoard, PLAYER);

    for (const move of playerMoves) {
      const newBoard = applyMove(currentBoard, move);
      const score = minimax(newBoard, depth - 1, alpha, beta, true);
      bestScore = Math.min(score, bestScore);
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return bestScore;
  }
};

/**
 * Applies a move to the board and returns the new board state.
 */
export const applyMove = (board, move) => {
  const { fromRow, fromCol, toRow, toCol, isJump, captures } = move;
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[fromRow][fromCol];

  // Move the piece
  newBoard[fromRow][fromCol] = EMPTY;

  // Check for promotion
  if (piece === PLAYER && toRow === 0) {
    newBoard[toRow][toCol] = PLAYER_KING;
  } else if (piece === BOT && toRow === BOARD_SIZE - 1) {
    newBoard[toRow][toCol] = BOT_KING;
  } else {
    newBoard[toRow][toCol] = piece;
  }

  // Remove captured pieces
  if (isJump && captures) {
    captures.forEach(({ row, col }) => {
      newBoard[row][col] = EMPTY;
    });
  }

  return newBoard;
};

/**
 * Finds the best move for the bot using the minimax algorithm.
 */
export const findBestMove = (currentBoard, depth) => {
  let bestMove = null;
  let bestScore = -Infinity;

  const botMoves = getAllPossibleMoves(currentBoard, BOT);

  if (botMoves.length === 0) return null;

  for (const move of botMoves) {
    const newBoard = applyMove(currentBoard, move);
    const moveScore = minimax(newBoard, depth - 1, -Infinity, Infinity, false);

    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = move;
    }
  }

  return bestMove;
};
