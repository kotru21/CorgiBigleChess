import { BOARD_SIZE, EMPTY, BOT, PLAYER } from "./constants.js";

export const createInitialBoard = () => {
  const board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(EMPTY));

  // Place pieces on 2nd and 3rd rows for bot (corgi)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = BOT;
    }
  }

  // Place pieces on 6th and 7th rows for player (beagle)
  for (let row = 6; row < 8; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = PLAYER;
    }
  }

  return board;
};
