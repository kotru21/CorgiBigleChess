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

// Initial board setup
const createInitialBoard = () => {
  const board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(EMPTY));

  // Place pieces
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = BOT;
      }
    }
  }

  for (let row = BOARD_SIZE - 3; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = PLAYER;
      }
    }
  }

  return board;
};

// Main game component
const App = () => {
  const [board, setBoard] = useState(createInitialBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [gameMessage, setGameMessage] = useState(
    "Ваш ход! Вы играете за Биглей."
  );
  const [validMoves, setValidMoves] = useState([]);
  const [jumpExists, setJumpExists] = useState(false);

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

      // Small delay to make the bot feel more natural
      const botTimer = setTimeout(() => {
        makeBotMove();
      }, 800);

      return () => clearTimeout(botTimer);
    }
  }, [playerTurn, gameOver]);

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

  // Calculate valid moves for a piece
  const calculateValidMoves = (row, col) => {
    const piece = board[row][col];

    if (!piece) return [];

    const isKing = piece === PLAYER_KING || piece === BOT_KING;
    const isPlayer = piece === PLAYER || piece === PLAYER_KING;

    let moves = [];
    let jumps = [];

    // Direction of movement based on piece type
    const directions = [];
    if (isPlayer || isKing) directions.push(-1); // Move up
    if (!isPlayer || isKing) directions.push(1); // Move down

    // Check each direction
    for (const rowDir of directions) {
      // Check left and right diagonal
      for (const colDir of [-1, 1]) {
        const newRow = row + rowDir;
        const newCol = col + colDir;

        // Check if the move is within bounds
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE
        ) {
          // Check if the space is empty (regular move)
          if (board[newRow][newCol] === EMPTY) {
            moves.push({ row: newRow, col: newCol });
          }
          // Check for jumps
          else {
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

              // Make sure we're jumping an opponent's piece
              if (
                (isPlayer &&
                  (jumpedPiece === BOT || jumpedPiece === BOT_KING)) ||
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
        }
      }
    }

    // If jumps exist, they are the only valid moves
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

    // Check if we're making a jump
    const isJump = Math.abs(fromRow - toRow) === 2;

    // Move the piece
    newBoard[fromRow][fromCol] = EMPTY;
    newBoard[toRow][toCol] = piece;

    // Check for king promotion
    if (piece === PLAYER && toRow === 0) {
      newBoard[toRow][toCol] = PLAYER_KING;
    } else if (piece === BOT && toRow === BOARD_SIZE - 1) {
      newBoard[toRow][toCol] = BOT_KING;
    }

    // If it's a jump, remove the jumped piece
    if (isJump) {
      const jumpRow = (fromRow + toRow) / 2;
      const jumpCol = (fromCol + toCol) / 2;
      newBoard[jumpRow][jumpCol] = EMPTY;

      // Check for multiple jumps
      const moveInfo = validMoves.find(
        (move) => move.row === toRow && move.col === toCol
      );
      setBoard(newBoard);

      if (moveInfo && "jumpRow" in moveInfo) {
        // Check if additional jumps are available
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

    // Direction of movement based on piece type
    const directions = [];
    if (isPlayer || isKing) directions.push(-1); // Move up
    if (!isPlayer || isKing) directions.push(1); // Move down

    // Check each direction
    for (const rowDir of directions) {
      // Check left and right diagonal
      for (const colDir of [-1, 1]) {
        const newRow = row + rowDir;
        const newCol = col + colDir;

        // Check if the move is within bounds
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE
        ) {
          // Check if the space is empty (regular move)
          if (currentBoard[newRow][newCol] === EMPTY) {
            moves.push({ row: newRow, col: newCol });
          }
          // Check for jumps
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

              // Make sure we're jumping an opponent's piece
              if (
                (isPlayer &&
                  (jumpedPiece === BOT || jumpedPiece === BOT_KING)) ||
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
        }
      }
    }

    // If jumps exist, they are the only valid moves
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

  // Render the board
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
        `;

        if (isBlack) {
          squareClass += " bg-gradient-to-br from-gray-700 to-gray-800";
        } else {
          squareClass += " bg-gradient-to-br from-gray-200 to-gray-300";
        }

        if (
          selectedPiece &&
          selectedPiece.row === row &&
          selectedPiece.col === col
        ) {
          squareClass += " ring-4 ring-yellow-400 shadow-lg scale-105";
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
      <div className="grid grid-cols-8 border-2 border-black w-full max-w-[600px] aspect-square">
        {squares}
      </div>
    );
  };

  // Render a piece
  const renderPiece = (piece) => {
    if (!piece) return null;

    let pieceClass = `
      w-full h-full rounded-full 
      flex items-center justify-center 
      transform transition-all duration-200 
      hover:scale-110 cursor-pointer 
      shadow-lg hover:shadow-xl
      animate-[pieceHover_0.2s_ease-in-out]
    `;

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
      <div className={pieceClass}>
        <img
          src={imgSrc}
          alt={piece}
          className="w-[90%] h-[90%] object-contain p-1 drop-shadow-lg transform transition-transform duration-200"
          draggable="false"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8 max-w-4xl mx-auto animate-[appear_0.5s_ease-out]">
          <div className="py-8">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-[messageSlide_0.5s_ease-out]">
                Корги против Биглей
              </h1>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 text-center transform transition-all duration-200 hover:shadow-xl">
                <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-white animate-[messageSlide_0.3s_ease-out]">
                  {gameMessage}
                </p>
              </div>

              <div className="flex justify-center items-center">
                <div className="w-full max-w-[600px] aspect-square">
                  {renderBoard()}
                </div>
              </div>

              {gameOver && (
                <div className="text-center py-4">
                  <button
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 
                           hover:from-blue-600 hover:to-purple-600 text-white text-xl 
                           font-semibold rounded-xl shadow-lg transform transition-all 
                           duration-200 hover:scale-105 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-blue-500"
                    onClick={restartGame}>
                    Играть снова
                  </button>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
                  Как играть:
                </h2>
                <div className="space-y-4">
                  <p className="text-lg text-center text-gray-700 dark:text-gray-300">
                    1. Нажмите на вашего Бигля, чтобы выбрать его
                  </p>
                  <p className="text-lg text-center text-gray-700 dark:text-gray-300">
                    2. Нажмите на подсвеченную клетку для хода
                  </p>
                  <p className="text-lg text-center text-gray-700 dark:text-gray-300">
                    3. Вы должны прыгать, если прыжок доступен
                  </p>
                  <p className="text-lg text-center text-gray-700 dark:text-gray-300">
                    4. Короли могут ходить вперёд и назад
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
