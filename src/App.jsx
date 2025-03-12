import React, { useState, useEffect } from "react";
import beagleImg from "./assets/beagle.webp";
import beagleKingImg from "./assets/beagle-king.jpg";
import corgiImg from "./assets/corgi.webp";
import corgiKingImg from "./assets/corgi-king.jpg";

// Game constants
const BOARD_SIZE = 8;
const PLAYER = "beagle";
const BOT = "corgi";
const PLAYER_KING = "beagle-king";
const BOT_KING = "corgi-king";
const EMPTY = null;

// Добавим новые константы для режимов игры
const GAME_MODES = {
  CLASSIC: "classic",
  CRAZY_JUMPS: "crazy_jumps", // Прыжки через всю доску
  PARTY_MODE: "party_mode", // Случайные эффекты и повороты фигур
  TURBO: "turbo", // Ускоренный режим с быстрым ботом
};

// Initial board setup
const createInitialBoard = () => {
  const board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(EMPTY));

  // Расставляем шашки на 2-й и 3-й горизонталях для бота (корги)
  for (let row = 1; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = BOT;
    }
  }

  // Расставляем шашки на 6-й и 7-й горизонталях для игрока (бигли)
  for (let row = 6; row < 8; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = PLAYER;
    }
  }

  return board;
};

// Main game component
const App = () => {
  // Добавим новые состояния
  const [gameMode, setGameMode] = useState(GAME_MODES.CLASSIC);
  const [showModeSelect, setShowModeSelect] = useState(false);

  const [board, setBoard] = useState(createInitialBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [gameMessage, setGameMessage] = useState(
    "Ваш ход! Вы играете за Биглей."
  );
  const [validMoves, setValidMoves] = useState([]);
  const [jumpExists, setJumpExists] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if game is over
  useEffect(() => {
    const gameStatus = checkGameStatus();
    if (gameStatus) {
      setGameOver(true);
      setGameMessage(
        gameStatus === PLAYER
          ? "Вы победили! Бигли одержали победу!"
          : "Корги победили! Повезёт в следующий раз!"
      );
    }
  }, [board]);

  // Bot's turn
  useEffect(() => {
    if (!playerTurn && !gameOver) {
      setGameMessage("Корги думает...");

      // Устанавливаем задержку в зависимости от режима
      const delay = gameMode === GAME_MODES.TURBO ? 200 : 800;

      const botTimer = setTimeout(() => {
        makeBotMove();
      }, delay);

      return () => clearTimeout(botTimer);
    }
  }, [playerTurn, gameOver, gameMode]); // Добавляем gameMode в зависимости

  // Добавьте слушатель событий для изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);

      if (!isFS) {
        // Восстанавливаем стили только при выходе
        document.body.style.overflow = "";
        const board = document.getElementById("chess-board");
        if (board) {
          board.style = "";
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Добавляем слушатель для ориентации экрана
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen) {
        const board = document.getElementById("chess-board");
        const size = Math.min(
          window.innerHeight * 0.9,
          window.innerWidth * 0.9
        );
        board.style.width = `${size}px`;
        board.style.height = `${size}px`;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFullscreen]);

  // Check if any player has no valid moves left
  const checkGameStatus = () => {
    let botPieces = 0;
    let playerPieces = 0;

    // Count pieces
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === PLAYER || board[row][col] === PLAYER_KING) {
          playerPieces++;
        } else if (board[row][col] === BOT || board[row][col] === BOT_KING) {
          botPieces++;
        }
      }
    }

    if (botPieces === 0) return PLAYER;
    if (playerPieces === 0) return BOT;

    // Check if current player has valid moves
    const currentPlayer = playerTurn ? PLAYER : BOT;
    const hasValidMoves = checkForAnyValidMoves(currentPlayer);

    if (!hasValidMoves) {
      return playerTurn ? BOT : PLAYER;
    }

    return null;
  };

  // Check if any piece of the given type has valid moves
  const checkForAnyValidMoves = (pieceType) => {
    const isPlayer = pieceType === PLAYER;
    const currentPieces = [pieceType, isPlayer ? PLAYER_KING : BOT_KING];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (currentPieces.includes(board[row][col])) {
          const moves = calculateValidMoves(row, col);
          if (moves.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Добавим функцию для применения эффектов режима
  const applyModeEffects = (moves, currentMode) => {
    switch (currentMode) {
      case GAME_MODES.CRAZY_JUMPS:
        // Увеличиваем дальность прыжков
        return moves.map((move) => {
          if ("jumpRow" in move) {
            // Если это прыжок
            const rowDiff = move.row - move.jumpRow;
            const colDiff = move.col - move.jumpCol;

            // Увеличиваем дистанцию прыжка в 2 раза
            const newRow = Math.min(
              Math.max(0, move.row + rowDiff),
              BOARD_SIZE - 1
            );
            const newCol = Math.min(
              Math.max(0, move.col + colDiff),
              BOARD_SIZE - 1
            );

            return {
              ...move,
              row: newRow,
              col: newCol,
            };
          }
          return move;
        });

      case GAME_MODES.PARTY_MODE:
        // Добавляем случайные модификации к ходам
        return moves.map((move) => {
          if (Math.random() > 0.7) {
            // 30% шанс сумасшедшего хода
            const crazyMove = { ...move };
            // Случайное смещение в пределах доски
            crazyMove.row = Math.max(
              0,
              Math.min(
                BOARD_SIZE - 1,
                move.row + Math.floor(Math.random() * 3) - 1
              )
            );
            crazyMove.col = Math.max(
              0,
              Math.min(
                BOARD_SIZE - 1,
                move.col + Math.floor(Math.random() * 3) - 1
              )
            );
            return crazyMove;
          }
          return move;
        });
        document.querySelectorAll(".piece").forEach((piece) => {
          piece.classList.add("spin-piece");
        });
        return moves;

      case GAME_MODES.TURBO:
        return moves; // Просто возвращаем ходы, скорость обработаем в другом месте

      default:
        document.querySelectorAll(".piece").forEach((piece) => {
          piece.classList.remove("spin-piece", "party-mode");
        });
        return moves;
    }
  };

  // Calculate valid moves for a piece
  const calculateValidMoves = (row, col) => {
    const piece = board[row][col];
    if (!piece) return [];

    const isKing = piece === PLAYER_KING || piece === BOT_KING;
    const isPlayer = piece === PLAYER || piece === PLAYER_KING;

    let moves = [];
    let jumps = [];

    // Направления движения: вверх, вправо, вниз, влево
    const directions = [
      [-1, 0], // вверх
      [0, 1], // вправо
      [1, 0], // вниз
      [0, -1], // влево
    ];

    for (const [rowDir, colDir] of directions) {
      // Пропускаем ход назад для обычных шашек и взятие назад
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
        // Простые шашки могут ходить только вперед и в стороны
        if (!isKing && rowDir === (isPlayer ? 1 : -1)) {
          continue;
        }
        moves.push({ row: newRow, col: newCol });
      }

      // Проверяем взятие
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
          // Проверяем, что мы бьем фишку противника
          if (
            (isPlayer && (jumpedPiece === BOT || jumpedPiece === BOT_KING)) ||
            (!isPlayer &&
              (jumpedPiece === PLAYER || jumpedPiece === PLAYER_KING))
          ) {
            // Для простых шашек нельзя бить назад
            if (!isKing && rowDir === (isPlayer ? 1 : -1)) {
              continue;
            }
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

    // Если есть взятия, возвращаем только их
    return jumps.length > 0 ? jumps : moves;
  };

  // Check if any jump is available for the current player
  const checkForAnyJump = () => {
    const currentPieces = playerTurn ? [PLAYER, PLAYER_KING] : [BOT, BOT_KING];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (currentPieces.includes(board[row][col])) {
          const moves = calculateValidMoves(row, col);
          if (moves.length > 0 && "jumpRow" in moves[0]) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Handle piece selection
  const handlePieceSelect = (row, col) => {
    if (gameOver || !playerTurn) return;

    const piece = board[row][col];
    const isPlayerPiece = piece === PLAYER || piece === PLAYER_KING;

    if (isPlayerPiece) {
      const moves = calculateValidMoves(row, col);

      // Check if there's a mandatory jump
      const jumpAvailable = checkForAnyJump();

      if (jumpAvailable) {
        const hasJump = moves.some((move) => "jumpRow" in move);
        if (!hasJump) {
          setGameMessage("Вы должны сделать прыжок, если это возможно!");
          setValidMoves([]);
          setSelectedPiece(null);
          return;
        }
      }

      setSelectedPiece({ row, col });
      setValidMoves(moves);
      setJumpExists(jumpAvailable);
    } else if (selectedPiece) {
      // Try to move to this position
      const isValidMove = validMoves.some(
        (move) => move.row === row && move.col === col
      );

      if (isValidMove) {
        movePiece(selectedPiece.row, selectedPiece.col, row, col);
      }
    }
  };

  // Move a piece on the board
  const movePiece = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map((row) => [...row]);
    const piece = newBoard[fromRow][fromCol];

    // Определяем, совершается ли прыжок (с учетом горизонтальных ходов)
    const isJump =
      Math.abs(fromRow - toRow) === 2 || Math.abs(fromCol - toCol) === 2;

    // Перемещаем шашку
    newBoard[fromRow][fromCol] = EMPTY;
    newBoard[toRow][toCol] = piece;

    // Проверка на превращение в дамку
    if (piece === PLAYER && toRow === 0) {
      newBoard[toRow][toCol] = PLAYER_KING;
    } else if (piece === BOT && toRow === BOARD_SIZE - 1) {
      newBoard[toRow][toCol] = BOT_KING;
    }

    // Если это прыжок, удаляем перепрыгнутую шашку
    if (isJump) {
      const jumpRow = (fromRow + toRow) / 2;
      const jumpCol = (fromCol + toCol) / 2;
      newBoard[jumpRow][jumpCol] = EMPTY;

      // Проверка на множественные прыжки
      const moveInfo = validMoves.find(
        (move) => move.row === toRow && move.col === toCol
      );
      setBoard(newBoard);

      if (moveInfo && "jumpRow" in moveInfo) {
        const additionalJumps = calculateValidMoves(toRow, toCol).filter(
          (move) => "jumpRow" in move
        );

        if (additionalJumps.length > 0) {
          setSelectedPiece({ row: toRow, col: toCol });
          setValidMoves(additionalJumps);
          setGameMessage("Доступен множественный прыжок! Продолжайте прыгать.");
          return;
        }
      }
    }

    if (gameMode === GAME_MODES.PARTY_MODE) {
      // Добавляем случайные эффекты при ходах
      const effects = [
        "scale-150",
        "rotate-180",
        "skew-x-12",
        "blur-sm",
        "brightness-150",
        "contrast-200",
      ];
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];

      // Применяем эффект к фигуре
      const piece = document.querySelector(
        `[data-row="${toRow}"][data-col="${toCol}"]`
      );
      if (piece) {
        piece.classList.add(randomEffect);
        setTimeout(() => piece.classList.remove(randomEffect), 500);
      }
    }

    setBoard(newBoard);
    setSelectedPiece(null);
    setValidMoves([]);
    setPlayerTurn(false);
    setGameMessage("Корги думает...");
  };

  // Bot AI implementation (Minimax algorithm with alpha-beta pruning)
  const makeBotMove = () => {
    const DEPTH = 5; // Depth of search, higher = stronger but slower

    const botMove = findBestMove(board, DEPTH);
    if (botMove) {
      const { fromRow, fromCol, toRow, toCol, isJump } = botMove;

      const newBoard = board.map((row) => [...row]);
      const piece = newBoard[fromRow][fromCol];

      // Move the piece
      newBoard[fromRow][fromCol] = EMPTY;
      newBoard[toRow][toCol] = piece;

      // Check for king promotion
      if (piece === BOT && toRow === BOARD_SIZE - 1) {
        newBoard[toRow][toCol] = BOT_KING;
      }

      // If it's a jump, remove the jumped piece
      if (isJump) {
        const jumpRow = (fromRow + toRow) / 2;
        const jumpCol = (fromCol + toCol) / 2;
        newBoard[jumpRow][jumpCol] = EMPTY;
      }

      setBoard(newBoard);
      setGameMessage("Ваш ход! Вы играете за Биглей.");
      setPlayerTurn(true);
    } else {
      // No valid moves for bot
      setGameOver(true);
      setGameMessage("Вы победили! Бигли одержали победу!");
    }
  };

  // Find the best move using Minimax algorithm with alpha-beta pruning
  const findBestMove = (currentBoard, depth) => {
    const botPieces = [];

    // Find all bot pieces
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

    // Check if jumps are available
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

    // If jumps are available, filter out non-jumps
    if (jumpsAvailable) {
      allPossibleMoves = allPossibleMoves.filter((move) => move.isJump);
    }

    // If no moves are available, return null
    if (allPossibleMoves.length === 0) {
      return null;
    }

    // Evaluate each move with minimax
    for (const move of allPossibleMoves) {
      const { fromRow, fromCol, toRow, toCol, isJump } = move;

      // Apply move to get new board state
      const newBoard = currentBoard.map((row) => [...row]);
      const piece = newBoard[fromRow][fromCol];

      // Move the piece
      newBoard[fromRow][fromCol] = EMPTY;
      newBoard[toRow][toCol] = piece;

      // Check for king promotion
      if (piece === BOT && toRow === BOARD_SIZE - 1) {
        newBoard[toRow][toCol] = BOT_KING;
      }

      // If it's a jump, remove the jumped piece
      if (isJump) {
        const jumpRow = (fromRow + toRow) / 2;
        const jumpCol = (fromCol + toCol) / 2;
        newBoard[jumpRow][jumpCol] = EMPTY;
      }

      // Evaluate this move
      const moveScore = minimax(
        newBoard,
        depth - 1,
        -Infinity,
        Infinity,
        false
      );

      if (moveScore > bestScore) {
        bestScore = moveScore;
        bestMove = move;
      }
    }

    return bestMove;
  };

  // Minimax algorithm with alpha-beta pruning
  const minimax = (currentBoard, depth, alpha, beta, isMaximizing) => {
    // Terminal conditions
    if (depth === 0) {
      return evaluateBoard(currentBoard);
    }

    // Check if game is over
    const gameStatus = checkGameStatusForBoard(currentBoard);
    if (gameStatus) {
      return gameStatus === BOT ? 1000 : -1000;
    }

    if (isMaximizing) {
      // Bot's turn (maximizing)
      let bestScore = -Infinity;
      const botMoves = getAllPossibleMoves(currentBoard, BOT);

      for (const move of botMoves) {
        const { fromRow, fromCol, toRow, toCol, isJump } = move;

        // Apply move
        const newBoard = currentBoard.map((row) => [...row]);
        const piece = newBoard[fromRow][fromCol];

        newBoard[fromRow][fromCol] = EMPTY;
        newBoard[toRow][toCol] = piece;

        // Check for king promotion
        if (piece === BOT && toRow === BOARD_SIZE - 1) {
          newBoard[toRow][toCol] = BOT_KING;
        }

        // If it's a jump, remove the jumped piece
        if (isJump) {
          const jumpRow = (fromRow + toRow) / 2;
          const jumpCol = (fromCol + toCol) / 2;
          newBoard[jumpRow][jumpCol] = EMPTY;
        }

        const score = minimax(newBoard, depth - 1, alpha, beta, false);
        bestScore = Math.max(score, bestScore);
        alpha = Math.max(alpha, bestScore);

        if (beta <= alpha) {
          break; // Beta cutoff
        }
      }

      return bestScore;
    } else {
      // Player's turn (minimizing)
      let bestScore = Infinity;
      const playerMoves = getAllPossibleMoves(currentBoard, PLAYER);

      for (const move of playerMoves) {
        const { fromRow, fromCol, toRow, toCol, isJump } = move;

        // Apply move
        const newBoard = currentBoard.map((row) => [...row]);
        const piece = newBoard[fromRow][fromCol];

        newBoard[fromRow][fromCol] = EMPTY;
        newBoard[toRow][toCol] = piece;

        // Check for king promotion
        if (piece === PLAYER && toRow === 0) {
          newBoard[toRow][toCol] = PLAYER_KING;
        }

        // If it's a jump, remove the jumped piece
        if (isJump) {
          const jumpRow = (fromRow + toRow) / 2;
          const jumpCol = (fromCol + toCol) / 2;
          newBoard[jumpRow][jumpCol] = EMPTY;
        }

        const score = minimax(newBoard, depth - 1, alpha, beta, true);
        bestScore = Math.min(score, bestScore);
        beta = Math.min(beta, bestScore);

        if (beta <= alpha) {
          break; // Alpha cutoff
        }
      }

      return bestScore;
    }
  };

  // Get all possible moves for a player
  const getAllPossibleMoves = (currentBoard, playerType) => {
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

    let jumpsAvailable = false;
    let allMoves = [];

    // Get all possible moves for each piece
    for (const piece of pieces) {
      const { row, col } = piece;
      const moves = calculateValidMovesForBoard(currentBoard, row, col);

      for (const move of moves) {
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
      }
    }

    // If jumps are available, filter out non-jumps
    if (jumpsAvailable) {
      allMoves = allMoves.filter((move) => move.isJump);
    }

    return allMoves;
  };

  // Calculate valid moves for a piece on a specific board state
  const calculateValidMovesForBoard = (currentBoard, row, col) => {
    const piece = currentBoard[row][col];
    if (!piece) return [];

    const isKing = piece === PLAYER_KING || piece === BOT_KING;
    const isPlayer = piece === PLAYER || piece === PLAYER_KING;

    let moves = [];
    let jumps = [];

    // Направления движения: вверх, вправо, вниз, влево
    const directions = [
      [-1, 0], // вверх
      [0, 1], // вправо
      [1, 0], // вниз
      [0, -1], // влево
    ];

    for (const [rowDir, colDir] of directions) {
      // Пропускаем ход назад для обычных шашек
      if (
        !isKing &&
        ((isPlayer && rowDir === 1) || (!isPlayer && rowDir === -1))
      ) {
        continue;
      }

      const newRow = row + rowDir;
      const newCol = col + colDir;

      // Проверяем, находится ли ход в пределах доски
      if (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE
      ) {
        // Проверяем обычный ход
        if (currentBoard[newRow][newCol] === EMPTY) {
          moves.push({ row: newRow, col: newCol });
        }
        // Проверяем взятие
        else {
          const jumpRow = newRow + rowDir;
          const jumpCol = newCol + colDir;

          if (
            jumpRow >= 0 &&
            jumpRow < BOARD_SIZE &&
            jumpCol >= 0 &&
            jumpCol < BOARD_SIZE &&
            currentBoard[jumpRow][jumpCol] === EMPTY
          ) {
            const jumpedPiece = currentBoard[newRow][newCol];

            // Проверяем, что бьем фишку противника
            if (
              (isPlayer && (jumpedPiece === BOT || jumpedPiece === BOT_KING)) ||
              (!isPlayer &&
                (jumpedPiece === PLAYER || jumpedPiece === PLAYER_KING))
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
          let longRow = row + rowDir * distance;
          let longCol = col + colDir * distance;

          while (
            longRow >= 0 &&
            longRow < BOARD_SIZE &&
            longCol >= 0 &&
            longCol < BOARD_SIZE &&
            currentBoard[longRow][longCol] === EMPTY
          ) {
            moves.push({ row: longRow, col: longCol });
            distance++;
            longRow = row + rowDir * distance;
            longCol = col + colDir * distance;
          }
        }
      }
    }

    // Если есть взятия, возвращаем только их
    return jumps.length > 0 ? jumps : moves;
  };

  // Check if any player has no valid moves left for a specific board state
  const checkGameStatusForBoard = (currentBoard) => {
    let botPieces = 0;
    let playerPieces = 0;

    // Count pieces
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (
          currentBoard[row][col] === PLAYER ||
          currentBoard[row][col] === PLAYER_KING
        ) {
          playerPieces++;
        } else if (
          currentBoard[row][col] === BOT ||
          currentBoard[row][col] === BOT_KING
        ) {
          botPieces++;
        }
      }
    }

    if (botPieces === 0) return PLAYER;
    if (playerPieces === 0) return BOT;

    // Check if each player has valid moves
    const botMoves = getAllPossibleMoves(currentBoard, BOT);
    const playerMoves = getAllPossibleMoves(currentBoard, PLAYER);

    if (botMoves.length === 0) return PLAYER;
    if (playerMoves.length === 0) return BOT;

    return null;
  };

  // Evaluate the current board state for the minimax algorithm
  const evaluateBoard = (currentBoard) => {
    let score = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = currentBoard[row][col];

        if (piece === BOT) {
          score += 10;
          // Prioritize advancement toward king row
          score += row;
        } else if (piece === BOT_KING) {
          score += 20;
        } else if (piece === PLAYER) {
          score -= 10;
          // Prioritize advancement toward king row
          score -= BOARD_SIZE - 1 - row;
        } else if (piece === PLAYER_KING) {
          score -= 20;
        }

        // Prioritize control of the center
        if (piece === BOT || piece === BOT_KING) {
          const centerDistance = Math.abs(3.5 - col) + Math.abs(3.5 - row);
          score += (4 - centerDistance) / 2;
        }
      }
    }

    return score;
  };

  // Restart the game
  const restartGame = () => {
    setBoard(createInitialBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setPlayerTurn(true);
    setGameOver(false);
    setGameMessage("Ваш ход! Вы играете за Биглей.");
    setJumpExists(false);
  };

  // Упрощенный toggleFullscreen
  const toggleFullscreen = () => {
    const board = document.getElementById("chess-board-container");

    if (!isFullscreen && board) {
      try {
        if (board.requestFullscreen) {
          board.requestFullscreen();
        } else if (board.webkitRequestFullscreen) {
          board.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error("Ошибка перехода в полноэкранный режим:", err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      } catch (err) {
        console.error("Ошибка выхода из полноэкранного режима:", err);
      }
    }
  };

  // Обновленный renderBoard
  const renderBoard = () => {
    const squares = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const isBlack = (row + col) % 2 === 1;
        const piece = board[row][col];

        let squareClass = `
          aspect-square flex items-center justify-center relative 
          transform transition-all duration-200
          hover:shadow-inner cursor-pointer
          ${gameMode === GAME_MODES.PARTY_MODE ? "party-square" : ""}`;

        if (isBlack) {
          squareClass +=
            gameMode === GAME_MODES.PARTY_MODE
              ? ` bg-gradient-to-br from-${getRandomColor()} to-${getRandomColor()}`
              : " bg-gradient-to-br from-gray-700 to-gray-800";
        } else {
          squareClass +=
            gameMode === GAME_MODES.PARTY_MODE
              ? ` bg-gradient-to-br from-${getRandomColor()} to-${getRandomColor()}`
              : " bg-gradient-to-br from-gray-200 to-gray-300";
        }

        // Подсвечиваем выбранную шашку
        if (
          selectedPiece &&
          selectedPiece.row === row &&
          selectedPiece.col === col
        ) {
          squareClass += " ring-4 ring-yellow-400 shadow-lg scale-105";
        }

        // Если ход обязательный - подсвечиваем шашки игрока с доступными прыжками
        if (playerTurn && (piece === PLAYER || piece === PLAYER_KING)) {
          const movesForPiece = calculateValidMoves(row, col);
          if (movesForPiece.some((move) => move.jumpRow !== undefined)) {
            squareClass += " ring-4 ring-red-500";
          }
        }

        const isValidMove = validMoves.some(
          (move) => move.row === row && move.col === col
        );
        if (isValidMove) {
          squareClass +=
            " bg-gradient-to-br from-green-400 to-green-600 bg-opacity-70 animate-[validMove_1s_ease-in-out_infinite_alternate]";
        }

        squares.push(
          <div
            key={`${row}-${col}`}
            className={squareClass}
            onClick={() => handlePieceSelect(row, col)}>
            <div className="w-[80%] h-[80%]">{renderPiece(piece)}</div>
          </div>
        );
      }
    }

    return (
      <div
        id="chess-board-container"
        className={`
           flex items-center justify-center
          ${
            isFullscreen
              ? "fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 w-screen h-screen"
              : "w-full"
          }
          transition-colors duration-300
        `}>
        <div
          id="chess-board"
          className={`
            grid grid-cols-8 border-2 border-black
            ${
              isFullscreen
                ? "w-[min(90vh,90vw)] h-[min(90vh,90vw)]"
                : "w-full max-w-[600px] aspect-square"
            }
            shadow-2xl
            transition-all duration-300
          `}>
          {squares}
        </div>
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 
                     bg-white/10 hover:bg-white/20 
                     text-white rounded-lg
                     transition-all duration-200">
            <span className="text-2xl">×</span>
          </button>
        )}
      </div>
    );
  };

  // Добавим функцию для генерации случайных цветов
  const getRandomColor = () => {
    const colors = [
      "red",
      "blue",
      "green",
      "yellow",
      "purple",
      "pink",
      "orange",
      "teal",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Render a piece
  const renderPiece = (piece) => {
    if (!piece) return null;

    let pieceClass = `
      piece 
      w-full h-full rounded-full 
      flex items-center justify-center 
      transform transition-all duration-200 
      hover:scale-110 cursor-pointer 
      shadow-lg hover:shadow-xl
      animate-[pieceHover_0.2s_ease-in-out]
    `;

    if (gameMode === GAME_MODES.PARTY_MODE) {
      pieceClass += " party-mode";
      // Добавляем случайную задержку анимации для каждой фигуры
      const delay = Math.random() * 2;
      pieceClass += ` animate-delay-${Math.floor(delay)}`;
    }

    let imgSrc = null;

    switch (piece) {
      case PLAYER:
        pieceClass += " bg-gradient-to-br from-amber-200 to-amber-400";
        imgSrc = beagleImg;
        break;
      case PLAYER_KING:
        pieceClass +=
          " bg-gradient-to-br from-amber-300 to-amber-500 ring-4 ring-yellow-400";
        imgSrc = beagleKingImg;
        break;
      case BOT:
        pieceClass += " bg-gradient-to-br from-orange-200 to-orange-400";
        imgSrc = corgiImg;
        break;
      case BOT_KING:
        pieceClass +=
          " bg-gradient-to-br from-orange-300 to-orange-500 ring-4 ring-yellow-400";
        imgSrc = corgiKingImg;
        break;
      default:
        return null;
    }

    return (
      <div className={`${pieceClass} overflow-clip`}>
        <img
          src={imgSrc}
          alt={piece}
          className="w-[100%] h-[100%] object-cover drop-shadow-lg transform transition-transform duration-200"
          draggable="false"
        />
      </div>
    );
  };

  // Добавим компонент выбора режима
  const renderModeSelect = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full space-y-6 animate-[appear_0.3s_ease-out]">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
          Выберите режим игры
        </h2>

        <div className="space-y-4">
          <button
            onClick={() => {
              setGameMode(GAME_MODES.CLASSIC);
              setShowModeSelect(false);
              restartGame();
            }}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 
                     hover:from-blue-600 hover:to-purple-600 text-white rounded-xl
                     transform transition-all duration-200 hover:scale-105">
            🎮 Классический режим
          </button>

          <button
            onClick={() => {
              setGameMode(GAME_MODES.CRAZY_JUMPS);
              setShowModeSelect(false);
              restartGame();
            }}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 
                     hover:from-green-600 hover:to-teal-600 text-white rounded-xl
                     transform transition-all duration-200 hover:scale-105">
            🦘 Сумасшедшие прыжки
          </button>

          <button
            onClick={() => {
              setGameMode(GAME_MODES.PARTY_MODE);
              setShowModeSelect(false);
              restartGame();
            }}
            className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 
                     hover:from-pink-600 hover:to-purple-600 text-white rounded-xl
                     transform transition-all duration-200 hover:scale-105">
            🎉 Режим вечеринки
          </button>

          <button
            onClick={() => {
              setGameMode(GAME_MODES.TURBO);
              setShowModeSelect(false);
              restartGame();
            }}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 
                     hover:from-red-600 hover:to-orange-600 text-white rounded-xl
                     transform transition-all duration-200 hover:scale-105">
            ⚡ Турбо режим
          </button>
        </div>
      </div>
    </div>
  );

  // Оптимизируем стили для мобильных устройств
  const mainContainerClass = `
    flex flex-col items-center justify-center min-h-screen w-screen
    ${
      window.innerWidth < 768
        ? "bg-gray-100 dark:bg-gray-900"
        : "bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    }
  `;

  // Обновляем разметку в основном return
  return (
    <div
      className={`
      flex flex-col items-center justify-center min-h-screen w-screen
     bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
      transition-colors duration-300
      
    `}>
      {showModeSelect && renderModeSelect()}

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8 max-w-4xl mx-auto">
          {!isFullscreen && (
            /* Верхняя панель */
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
                  Корги против Биглей
                </h1>
                <div className="flex gap-4">
                  <button onClick={() => setShowModeSelect(true)}>
                    <span>{isFullscreen ? "Выйти" : "На весь экран"}</span>
                  </button>
                </div>
              </div>

              {/* Сообщение о состоянии игры */}
              <div className="mt-6 text-center min-h-16">
                <p
                  className="text-xl font-semibold animate-[messageSlide_0.5s_ease-out]  
                           bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                  {gameMessage}
                </p>
              </div>
            </div>
          )}

          {/* Игровая доска с рамкой */}
          <div className="relative group">
            <div
              className={`
              absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
              rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-1000
              ${isFullscreen ? "hidden" : ""}
            `}></div>
            <div
              id="chess-board"
              className={`
              relative rounded-xl shadow-xl overflow-hidden
              ${isFullscreen ? "" : "bg-white dark:bg-gray-800 p-4"}
            `}>
              {renderBoard()}
              {/* Кнопка выхода из полноэкранного режима */}
              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 
                           text-white rounded-lg shadow-lg backdrop-blur-sm
                           transform transition-all duration-200 hover:scale-105
                           flex items-center space-x-2 z-50">
                  <span>🔄</span>
                  <span>Выйти</span>
                </button>
              )}
            </div>
          </div>

          {!isFullscreen && (
            <>
              {/* Кнопка "Играть снова" */}
              {gameOver && (
                <div className="text-center">
                  <button
                    onClick={restartGame}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 
                             text-white text-xl font-semibold rounded-xl shadow-xl 
                             transform transition-all duration-200 hover:scale-105 
                             hover:shadow-2xl focus:outline-none focus:ring-2 
                             focus:ring-offset-2 focus:ring-green-500">
                    Начать новую игру
                  </button>
                </div>
              )}

              {/* Инструкции */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl p-8">
                <h2
                  className="text-2xl font-bold mb-6 text-center bg-gradient-to-r 
                             from-blue-600 to-purple-600 text-transparent bg-clip-text">
                  Как играть:
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-lg">
                      <span className="text-2xl">👆</span>
                      <p>Нажмите на вашего Бигля, чтобы выбрать его</p>
                    </div>
                    <div className="flex items-center gap-3 text-lg">
                      <span className="text-2xl">🎯</span>
                      <p>Нажмите на подсвеченную клетку для хода</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-lg">
                      <span className="text-2xl">🦘</span>
                      <p>Вы должны прыгать, если прыжок доступен</p>
                    </div>
                    <div className="flex items-center gap-3 text-lg">
                      <span className="text-2xl">👑</span>
                      <p>Короли могут ходить вперёд и назад</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
