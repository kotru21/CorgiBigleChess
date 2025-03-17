import { BOARD_SIZE, BOT, PLAYER, EMPTY } from "../models/Constants";

export const createInitialBoard = () => {
  const board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(EMPTY));

  // Расстановка шашек бота (корги) - 16 шашек в два ряда
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = BOT;
    }
  }

  // Расстановка шашек игрока (бигли) - 16 шашек в два ряда
  for (let row = BOARD_SIZE - 2; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = PLAYER;
    }
  }

  return board;
};

export const movePiece = (board, fromRow, fromCol, toRow, toCol) => {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[fromRow][fromCol];

  // Перемещение фигуры
  newBoard[fromRow][fromCol] = EMPTY;
  newBoard[toRow][toCol] = piece;

  // Проверка на превращение в короля
  if (piece === PLAYER && toRow === 0) {
    newBoard[toRow][toCol] = PLAYER_KING;
  } else if (piece === BOT && toRow === BOARD_SIZE - 1) {
    newBoard[toRow][toCol] = BOT_KING;
  }

  // Если это прыжок, удаляем перепрыгнутую фигуру
  if (Math.abs(fromRow - toRow) === 2 || Math.abs(fromCol - toCol) === 2) {
    const jumpRow = (fromRow + toRow) / 2;
    const jumpCol = (fromCol + toCol) / 2;
    newBoard[jumpRow][jumpCol] = EMPTY;
  }

  return newBoard;
};

export const checkGameStatus = (board) => {
  let botPieces = 0;
  let playerPieces = 0;

  // Подсчёт фигур
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece === PLAYER || piece === PLAYER_KING) playerPieces++;
      if (piece === BOT || piece === BOT_KING) botPieces++;
    }
  }

  if (botPieces === 0) return PLAYER;
  if (playerPieces === 0) return BOT;

  return null;
};
