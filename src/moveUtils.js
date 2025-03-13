import {
  BOARD_SIZE,
  PLAYER,
  BOT,
  PLAYER_KING,
  BOT_KING,
  EMPTY,
} from "./constants.js";

/**
 * Determines if a position is valid on the board.
 */
const isValidPosition = (row, col) => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};

/**
 * Calculates valid moves for a piece at the specified position.
 * According to Turkish checkers rules.
 */
export const calculateValidMoves = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];

  const isKing = piece === PLAYER_KING || piece === BOT_KING;
  const isPlayer = piece === PLAYER || piece === PLAYER_KING;

  // First check if there are any jumps available for any piece of the same type
  const forcedJumps = findForcedJumps(board, isPlayer);

  // If jumps are available, but not for this piece, return empty moves
  if (forcedJumps.length > 0) {
    const pieceJumps = forcedJumps.filter(
      (jump) => jump.fromRow === row && jump.fromCol === col
    );
    if (pieceJumps.length === 0) {
      return [];
    }

    // If this piece has jumps, return only those with maximum captures
    const maxCaptures = pieceJumps.reduce(
      (max, jump) => Math.max(max, jump.captures.length),
      0
    );

    return pieceJumps
      .filter((jump) => jump.captures.length === maxCaptures)
      .map((jump) => ({
        row: jump.toRow,
        col: jump.toCol,
        captures: jump.captures,
      }));
  }

  // If no jumps are available, calculate regular moves
  let moves = [];

  // Direction vectors: up, right, down, left
  const directions = [
    [-1, 0], // up
    [0, 1], // right
    [1, 0], // down
    [0, -1], // left
  ];

  // For regular pieces, restrict movement directions
  const allowedDirections = isKing
    ? directions
    : directions.filter(([rowDir, colDir]) => {
        // Regular pieces can move forward, left, and right (not backward)
        return !((!isPlayer && rowDir < 0) || (isPlayer && rowDir > 0));
      });

  // Calculate regular moves
  for (const [rowDir, colDir] of allowedDirections) {
    if (isKing) {
      // Kings can move any distance in straight lines
      let distance = 1;
      while (true) {
        const newRow = row + rowDir * distance;
        const newCol = col + colDir * distance;

        if (
          !isValidPosition(newRow, newCol) ||
          board[newRow][newCol] !== EMPTY
        ) {
          break;
        }

        moves.push({ row: newRow, col: newCol });
        distance++;
      }
    } else {
      // Regular pieces move one square
      const newRow = row + rowDir;
      const newCol = col + colDir;

      if (isValidPosition(newRow, newCol) && board[newRow][newCol] === EMPTY) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  return moves;
};

/**
 * Finds all possible jump sequences for a player.
 */
export const findForcedJumps = (board, isPlayer) => {
  const pieces = [];
  const pieceTypes = isPlayer ? [PLAYER, PLAYER_KING] : [BOT, BOT_KING];

  // Find all pieces of the given type
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (pieceTypes.includes(board[row][col])) {
        pieces.push({ row, col });
      }
    }
  }

  // Find all jump sequences for these pieces
  let allJumps = [];

  for (const { row, col } of pieces) {
    const jumps = findJumpsForPiece(board, row, col, []);
    allJumps = [...allJumps, ...jumps];
  }

  return allJumps;
};

/**
 * Find all possible jump sequences for a specific piece.
 */
export const findJumpsForPiece = (board, row, col, capturedPieces = []) => {
  const piece = board[row][col];
  if (!piece) return [];

  const isKing = piece === PLAYER_KING || piece === BOT_KING;
  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  const opponentPieces = isPlayer ? [BOT, BOT_KING] : [PLAYER, PLAYER_KING];

  // Direction vectors: up, right, down, left
  const directions = [
    [-1, 0], // up
    [0, 1], // right
    [1, 0], // down
    [0, -1], // left
  ];

  // For regular pieces, they can't jump backward
  const allowedDirections = isKing
    ? directions
    : directions.filter(([rowDir, colDir]) => {
        // Regular pieces can't jump backward
        return !((!isPlayer && rowDir < 0) || (isPlayer && rowDir > 0));
      });

  let jumps = [];

  for (const [rowDir, colDir] of allowedDirections) {
    if (isKing) {
      // Kings can jump over any distance
      let distance = 1;
      let foundOpponent = false;
      let opponentRow = -1;
      let opponentCol = -1;

      while (true) {
        const checkRow = row + rowDir * distance;
        const checkCol = col + colDir * distance;

        if (!isValidPosition(checkRow, checkCol)) {
          break;
        }

        const checkPiece = board[checkRow][checkCol];

        if (checkPiece === EMPTY) {
          if (foundOpponent) {
            // We found a potential landing spot after an opponent
            const jumpRow = checkRow;
            const jumpCol = checkCol;

            // Make sure we're not jumping over already captured pieces
            const isCaptured = capturedPieces.some(
              (cap) => cap.row === opponentRow && cap.col === opponentCol
            );

            if (!isCaptured) {
              // Create a new board to simulate the jump
              const newBoard = board.map((r) => [...r]);
              const newCaptured = [
                ...capturedPieces,
                { row: opponentRow, col: opponentCol },
              ];

              // Temporarily make the jump
              newBoard[row][col] = EMPTY;
              newBoard[opponentRow][opponentCol] = EMPTY; // Remove captured piece
              newBoard[jumpRow][jumpCol] = piece;

              // Look for additional jumps from the new position
              const continuedJumps = findJumpsForPiece(
                newBoard,
                jumpRow,
                jumpCol,
                newCaptured
              );

              if (continuedJumps.length > 0) {
                // Add continued jumps to our list
                jumps = [...jumps, ...continuedJumps];
              } else {
                // End of jump sequence
                jumps.push({
                  fromRow: row,
                  fromCol: col,
                  toRow: jumpRow,
                  toCol: jumpCol,
                  captures: newCaptured,
                });
              }
            }
          }
          distance++;
        } else if (opponentPieces.includes(checkPiece) && !foundOpponent) {
          // Found an opponent piece to potentially jump over
          foundOpponent = true;
          opponentRow = checkRow;
          opponentCol = checkCol;
          distance++;
        } else {
          // Either found a second opponent or own piece - can't jump
          break;
        }
      }
    } else {
      // Regular pieces jump one square at a time
      const opponentRow = row + rowDir;
      const opponentCol = col + colDir;
      const jumpRow = opponentRow + rowDir;
      const jumpCol = opponentCol + colDir;

      if (
        isValidPosition(opponentRow, opponentCol) &&
        isValidPosition(jumpRow, jumpCol) &&
        opponentPieces.includes(board[opponentRow][opponentCol]) &&
        board[jumpRow][jumpCol] === EMPTY
      ) {
        // Check if this piece is already captured
        const isCaptured = capturedPieces.some(
          (cap) => cap.row === opponentRow && cap.col === opponentCol
        );

        if (!isCaptured) {
          // Create a new board to simulate the jump
          const newBoard = board.map((r) => [...r]);
          const newCaptured = [
            ...capturedPieces,
            { row: opponentRow, col: opponentCol },
          ];

          // Temporarily make the jump
          newBoard[row][col] = EMPTY;
          newBoard[opponentRow][opponentCol] = EMPTY; // Remove captured piece
          newBoard[jumpRow][jumpCol] = piece;

          // Check if piece should be promoted
          const shouldPromote =
            (isPlayer && jumpRow === 0) ||
            (!isPlayer && jumpRow === BOARD_SIZE - 1);

          if (shouldPromote) {
            // If promotion happens, the turn ends
            jumps.push({
              fromRow: row,
              fromCol: col,
              toRow: jumpRow,
              toCol: jumpCol,
              captures: newCaptured,
              promote: true,
            });
          } else {
            // Look for additional jumps from the new position
            const continuedJumps = findJumpsForPiece(
              newBoard,
              jumpRow,
              jumpCol,
              newCaptured
            );

            if (continuedJumps.length > 0) {
              // Add continued jumps to our list
              jumps = [...jumps, ...continuedJumps];
            } else {
              // End of jump sequence
              jumps.push({
                fromRow: row,
                fromCol: col,
                toRow: jumpRow,
                toCol: jumpCol,
                captures: newCaptured,
              });
            }
          }
        }
      }
    }
  }

  return jumps;
};

/**
 * Wrapper function to calculate moves for a specific board configuration.
 */
export const calculateValidMovesForBoard = (board, row, col) => {
  return calculateValidMoves(board, row, col);
};
