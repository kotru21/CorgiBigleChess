import {
  BOARD_SIZE,
  PLAYER,
  BOT,
  PLAYER_KING,
  BOT_KING,
  EMPTY,
} from "./constants.js";

/**
 * Вычисляет допустимые ходы для фигуры на указанной позиции в переданной доске.
 * Если доступны прыжки (взятия), возвращаются только они.
 */
export const calculateValidMoves = (row, col) => {
  const piece = board[row][col];
  if (!piece) return [];

  const isKing = piece === PLAYER_KING || piece === BOT_KING;
  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  let moves = [];
  let jumps = [];

  // Направления движения: вверх, вправо, вниз, влево
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  for (const [rowDir, colDir] of directions) {
    // Для простых шашек запрещаем ход назад (для игрока – вниз, для бота – вверх)
    if (
      !isKing &&
      ((isPlayer && rowDir === 1) || (!isPlayer && rowDir === -1))
    ) {
      continue;
    }

    let newRow = row + rowDir;
    let newCol = col + colDir;

    // Проверяем обычный ход
    if (
      newRow >= 0 &&
      newRow < BOARD_SIZE &&
      newCol >= 0 &&
      newCol < BOARD_SIZE &&
      board[newRow][newCol] === EMPTY
    ) {
      moves.push({ row: newRow, col: newCol });
    }

    // Проверяем возможность взятия (прыжка)
    if (
      newRow >= 0 &&
      newRow < BOARD_SIZE &&
      newCol >= 0 &&
      newCol < BOARD_SIZE &&
      board[newRow][newCol] !== EMPTY
    ) {
      const jumpRow = newRow + rowDir;
      const jumpCol = newCol + colDir;

      if (
        jumpRow >= 0 &&
        jumpRow < BOARD_SIZE &&
        jumpCol >= 0 &&
        jumpCol < BOARD_SIZE &&
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

    // Для дамок добавляем ходы на несколько клеток
    if (isKing) {
      let distance = 2;
      newRow = row + rowDir * distance;
      newCol = col + colDir * distance;
      while (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE &&
        board[newRow][newCol] === EMPTY
      ) {
        moves.push({ row: newRow, col: newCol });
        distance++;
        newRow = row + rowDir * distance;
        newCol = col + colDir * distance;
      }
    }
  }

  // Если доступны прыжки, возвращаем только их
  return jumps.length > 0 ? jumps : moves;
};

/**
 * Функция-обёртка для вычисления ходов на заданной доске.
 * Используется для унификации вызовов.
 */
export const calculateValidMovesForBoard = (board, row, col) => {
  return calculateValidMoves(board, row, col);
};
