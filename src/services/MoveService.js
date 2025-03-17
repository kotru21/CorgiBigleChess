import {
  BOARD_SIZE,
  PLAYER,
  BOT,
  PLAYER_KING,
  BOT_KING,
  EMPTY,
} from "../models/Constants";

export const isValidPosition = (row, col) => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};

export const calculateValidMoves = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];

  const isKing = piece === PLAYER_KING || piece === BOT_KING;
  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  let moves = [];
  let jumps = [];

  // Направления: вверх, вправо, вниз, влево
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  directions.forEach(([rowDir, colDir]) => {
    // Проверка обычного хода
    let newRow = row + rowDir;
    let newCol = col + colDir;

    if (isValidPosition(newRow, newCol) && board[newRow][newCol] === EMPTY) {
      if (isKing || (isPlayer && rowDir < 0) || (!isPlayer && rowDir > 0)) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    // Проверка прыжка
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

export const getAllPossibleMoves = (board, playerType) => {
  const pieces = [];
  const isPlayer = playerType === PLAYER;
  const pieceTypes = isPlayer ? [PLAYER, PLAYER_KING] : [BOT, BOT_KING];

  // Находим все фигуры указанного типа
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (pieceTypes.includes(board[row][col])) {
        pieces.push({ row, col });
      }
    }
  }

  // Вычисляем ходы
  let jumpsAvailable = false;
  let allMoves = [];

  pieces.forEach(({ row, col }) => {
    const moves = calculateValidMoves(board, row, col);

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

export const checkJumpExists = (board, isPlayerTurn) => {
  const playerType = isPlayerTurn ? PLAYER : BOT;
  const allMoves = getAllPossibleMoves(board, playerType);
  return allMoves.some((move) => move.isJump);
};
