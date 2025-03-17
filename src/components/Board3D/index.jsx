import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PieceMesh } from "./PieceMesh";
import React from "react";
import { EMPTY } from "../../models/Constants";

export function Board3D({ board, onPieceSelect, selectedPiece, validMoves }) {
  const [hoveredSquare, setHoveredSquare] = useState(null);

  // Рендер клеток доски
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

        // Определяем цвет клетки
        let color = isEven ? "#553311" : "#8B4513";
        if (isSelected) color = "#66BB66";
        else if (isValidMove) color = "#6699FF";
        else if (isHovered && !isEven) color = "#AA6633";

        squares.push(
          <mesh
            key={`${row}-${col}`}
            position={[row - 3.5, -0.099, col - 3.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={() => (isValidMove ? onPieceSelect(row, col) : null)}
            onPointerOver={() => setHoveredSquare({ row, col })}
            onPointerOut={() => setHoveredSquare(null)}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={color}
              metalness={0.1}
              roughness={0.8}
              transparent={isValidMove}
              opacity={isValidMove ? 0.8 : 1}
            />
          </mesh>
        );
      }
    }

    return squares;
  };

  return (
    <Canvas shadows camera={{ position: [0, 5, 5], fov: 50 }}>
      <PerspectiveCamera makeDefault position={[0, 5, 5]} />
      <OrbitControls
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 4}
      />

      {/* Освещение */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />

      {/* Основа доски */}
      <group>
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <boxGeometry args={[8.2, 0.2, 8.2]} />
          <meshStandardMaterial
            color="#4A3728"
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>
        {renderBoardSquares()}
      </group>

      {/* Фигуры */}
      <Suspense fallback={null}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (cell === EMPTY) return null;

            // Определяем тип фигуры и является ли она королем
            const type = cell.includes("beagle") ? "beagle" : "corgi";
            const isKing = cell.includes("-king");

            return (
              <PieceMesh
                key={`piece-${rowIndex}-${colIndex}`}
                type={type}
                isKing={isKing}
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
