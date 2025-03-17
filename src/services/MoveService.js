import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "../models/Constants";

// Обновленные направления движения для турецких шашек (горизонталь и вертикаль)
// Для шашек игрока направления вверх и по горизонтали
const playerDirections = [
  [-1, 0], // вверх
  [0, -1], // влево
  [0, 1], // вправо
];

// Для шашек бота направления вниз и по горизонтали
const botDirections = [
  [1, 0], // вниз
  [0, -1], // влево
  [0, 1], // вправо
];

// Все направления для дамок (включая диагонали)
const kingDirections = [
  [-1, 0], // вверх
  [1, 0], // вниз
  [0, -1], // влево
  [0, 1], // вправо
  [-1, -1], // диагональ верх-влево
  [-1, 1], // диагональ верх-право
  [1, -1], // диагональ вниз-влево
  [1, 1], // диагональ вниз-право
];

export const getValidMoves = (board, row, col) => {
  const piece = board[row][col];
  const moves = [];
  const captures = [];

  // Проверяем, что это реальная фигура
  if (piece === EMPTY) return { moves, captures };

  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  const isKing = piece === PLAYER_KING || piece === BOT_KING;

  // Выбираем направления движения в зависимости от типа фигуры
  const moveDirections = isKing
    ? kingDirections
    : isPlayer
    ? playerDirections
    : botDirections;

  // Проверяем обычные ходы
  moveDirections.forEach(([rowDir, colDir]) => {
    // Для дамок - многошаговые ходы
    if (isKing) {
      let distance = 1;
      while (true) {
        const newRow = row + rowDir * distance;
        const newCol = col + colDir * distance;

        // Проверка выхода за границы доски
        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE
        ) {
          break;
        }

        if (board[newRow][newCol] === EMPTY) {
          moves.push({ row: newRow, col: newCol });
          distance++;
        } else {
          break;
        }
      }
    } else {
      // Для обычных шашек - ход на 1 клетку
      const newRow = row + rowDir;
      const newCol = col + colDir;

      // Проверка выхода за границы доски
      if (
        newRow < 0 ||
        newRow >= BOARD_SIZE ||
        newCol < 0 ||
        newCol >= BOARD_SIZE
      ) {
        return;
      }

      if (board[newRow][newCol] === EMPTY) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  });

  // Проверяем возможные взятия
  findAllCaptures(board, row, col, captures);

  return { moves, captures };
};

export const findAllCaptures = (board, row, col, captures = []) => {
  const piece = board[row][col];
  if (piece === EMPTY) return captures;

  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  const isKing = piece === PLAYER_KING || piece === BOT_KING;

  // Используем все направления для захвата, так как в турецких шашках
  // можно брать во всех направлениях, даже если обычные шашки ходят только вперед
  const captureDirections = kingDirections;

  captureDirections.forEach(([rowDir, colDir]) => {
    // Для дамок - многошаговые взятия
    if (isKing) {
      let distance = 1;
      let foundEnemy = false;
      let enemyRow = -1;
      let enemyCol = -1;

      while (true) {
        const newRow = row + rowDir * distance;
        const newCol = col + colDir * distance;

        // Проверка выхода за границы доски
        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE
        ) {
          break;
        }

        const targetPiece = board[newRow][newCol];

        // Если нашли пустую клетку и до этого был враг
        if (targetPiece === EMPTY && foundEnemy) {
          captures.push({
            row: newRow,
            col: newCol,
            captured: [{ row: enemyRow, col: enemyCol }],
          });
          break;
        }

        // Если встретили фигуру
        if (targetPiece !== EMPTY) {
          // Если это первая встреченная фигура и она вражеская
          if (
            !foundEnemy &&
            ((isPlayer && (targetPiece === BOT || targetPiece === BOT_KING)) ||
              (!isPlayer &&
                (targetPiece === PLAYER || targetPiece === PLAYER_KING)))
          ) {
            foundEnemy = true;
            enemyRow = newRow;
            enemyCol = newCol;
          } else {
            // Если встретили вторую фигуру или свою - завершаем поиск
            break;
          }
        }

        distance++;
      }
    } else {
      // Для обычных шашек - взятие через одну клетку
      const enemyRow = row + rowDir;
      const enemyCol = col + colDir;

      // Проверка выхода за границы доски
      if (
        enemyRow < 0 ||
        enemyRow >= BOARD_SIZE ||
        enemyCol < 0 ||
        enemyCol >= BOARD_SIZE
      ) {
        return;
      }

      const enemyPiece = board[enemyRow][enemyCol];
      const isEnemy =
        (isPlayer && (enemyPiece === BOT || enemyPiece === BOT_KING)) ||
        (!isPlayer && (enemyPiece === PLAYER || enemyPiece === PLAYER_KING));

      if (isEnemy) {
        const landingRow = enemyRow + rowDir;
        const landingCol = enemyCol + colDir;

        // Проверка выхода за границы доски и пустого места для приземления
        if (
          landingRow >= 0 &&
          landingRow < BOARD_SIZE &&
          landingCol >= 0 &&
          landingCol < BOARD_SIZE &&
          board[landingRow][landingCol] === EMPTY
        ) {
          captures.push({
            row: landingRow,
            col: landingCol,
            captured: [{ row: enemyRow, col: enemyCol }],
          });
        }
      }
    }
  });

  return captures;
};

export const executeMove = (
  board,
  fromRow,
  fromCol,
  toRow,
  toCol,
  captured = []
) => {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[fromRow][fromCol];

  // Перемещение фигуры
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = EMPTY;

  // Удаление взятых фигур
  captured.forEach(({ row, col }) => {
    newBoard[row][col] = EMPTY;
  });

  // Проверка на превращение в дамку
  if (piece === PLAYER && toRow === 0) {
    newBoard[toRow][toCol] = PLAYER_KING;
  } else if (piece === BOT && toRow === BOARD_SIZE - 1) {
    newBoard[toRow][toCol] = BOT_KING;
  }

  return newBoard;
};

// Метод для проверки множественных взятий
export const getMultiCapture = (board, row, col) => {
  const captures = [];
  findAllCaptures(board, row, col, captures);
  return captures.length > 0 ? captures : null;
};
