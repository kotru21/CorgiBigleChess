import { BOARD_SIZE, EMPTY, BOT, PLAYER } from "./constants.js";

export const createInitialBoard = () => {
  const board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(EMPTY));

  // Расставляем шашки на 2-й и 3-й горизонталях для бота (корги)
  for (let row = 1; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = BOT;
    }
  }

  // Расставляем шашки на 5-й и 6-й горизонталях для игрока (бигли)
  for (let row = 5; row < 7; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = PLAYER;
    }
  }

  return board;
};
