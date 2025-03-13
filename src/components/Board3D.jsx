import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PieceMesh } from "./PieceMesh";
import { Environment } from "@react-three/drei";
import { Color } from "three";
import React from "react";
import { PLAYER, BOT, PLAYER_KING, BOT_KING, EMPTY } from "../constants.js";

export function Board3D({ board, onPieceSelect, selectedPiece, validMoves }) {
  const [hoveredSquare, setHoveredSquare] = useState(null);

  // Создаем клетки доски
  const renderBoardSquares = () => {
    const squares = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isEven = (row + col) % 2 === 0;
        const isSelected =
          selectedPiece &&
          selectedPiece.row === row &&
          selectedPiece.col === col;
        const isValidMove =
          validMoves &&
          validMoves.some((move) => move.row === row && move.col === col);
        const isHovered =
          hoveredSquare &&
          hoveredSquare.row === row &&
          hoveredSquare.col === col;

        // Enhanced color palette with better wood textures
        let color = isEven ? "#3D2314" : "#754C29";
        let emissive = new Color(0x000000);

        if (isSelected) {
          color = "#4CAF50";
          emissive = new Color(0x224422);
        } else if (isValidMove) {
          color = "#2196F3";
          emissive = new Color(0x112233);
        } else if (isHovered && !isEven) {
          color = "#8B5A2B";
        }

        squares.push(
          <mesh
            key={`${row}-${col}`}
            position={[row - 3.5, -0.099, col - 3.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={() =>
              isValidMove || board[row][col] !== EMPTY
                ? onPieceSelect(row, col)
                : null
            }
            onPointerOver={() => setHoveredSquare({ row, col })}
            onPointerOut={() => setHoveredSquare(null)}>
            <planeGeometry args={[0.95, 0.95]} />
            <meshPhysicalMaterial
              color={color}
              metalness={0.1}
              roughness={0.8}
              clearcoat={0.3}
              clearcoatRoughness={0.25}
              emissive={emissive}
              emissiveIntensity={0.3}
              transparent={isValidMove}
              opacity={isValidMove ? 0.9 : 1}
            />
          </mesh>
        );
      }
    }
    return squares;
  };

  // Преобразуем константы шашек в формат, понятный для PieceMesh
  const getPieceType = (piece) => {
    switch (piece) {
      case PLAYER:
        return { type: "beagle", isKing: false };
      case PLAYER_KING:
        return { type: "beagle", isKing: true };
      case BOT:
        return { type: "corgi", isKing: false };
      case BOT_KING:
        return { type: "corgi", isKing: true };
      default:
        return null;
    }
  };

  return (
    <Canvas shadows gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
      <PerspectiveCamera makeDefault position={[0, 5, 5]} />
      <OrbitControls
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 4}
      />

      {/* Освещение */}

      {/* Enhanced lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <spotLight
        position={[-5, 10, -2]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.8}
        castShadow
      />
      <hemisphereLight intensity={0.4} color="#ddeeff" groundColor="#472b0c" />
      {/* Доска */}
      <group>
        {/* Основание доски */}
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <boxGeometry args={[8.2, 0.2, 8.2]} />
          <meshStandardMaterial
            color="#4A3728"
            metalness={0.05}
            roughness={0.5}
          />
        </mesh>

        {/* Клетки доски */}
        {renderBoardSquares()}
      </group>
      <Environment preset="park" />
      {/* Фигуры */}
      <Suspense fallback={null}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (cell === EMPTY) return null;

            const pieceInfo = getPieceType(cell);
            if (!pieceInfo) return null;

            return (
              <PieceMesh
                key={`piece-${rowIndex}-${colIndex}`}
                type={pieceInfo.type}
                isKing={pieceInfo.isKing}
                position={[rowIndex - 3.5, 0, colIndex - 3.5]}
                onClick={() => onPieceSelect(rowIndex, colIndex)}
                isSelected={
                  selectedPiece &&
                  selectedPiece.row === rowIndex &&
                  selectedPiece.col === colIndex
                }
              />
            );
          })
        )}
      </Suspense>
    </Canvas>
  );
}
