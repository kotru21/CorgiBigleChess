import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PieceMesh } from "./PieceMesh";
import React from "react";

export function Board3D({ board, onPieceSelect, disabled }) {
  // Создаем клетки доски
  const renderBoardSquares = () => {
    const squares = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const isEven = (i + j) % 2 === 0;
        squares.push(
          <mesh
            key={`${i}-${j}`}
            position={[i - 3.5, -0.1, j - 3.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={isEven ? "#553311" : "#8B4513"}
              metalness={0.1}
              roughness={0.8}
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
        enabled={!disabled}
        enableZoom={false}
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

      {/* Доска */}
      <group>
        {/* Основание доски */}
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <boxGeometry args={[8.2, 0.2, 8.2]} />
          <meshStandardMaterial
            color="#4A3728"
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>
        {/* Клетки доски */}
        {renderBoardSquares()}
      </group>

      {/* Фигуры */}
      <Suspense fallback={null}>
        {board.map((row, i) =>
          row.map((piece, j) => {
            if (!piece) return null;

            return (
              <PieceMesh
                key={`${i}-${j}`}
                type={piece.includes("corgi") ? "corgi" : "beagle"}
                isKing={piece.includes("king")}
                position={[i - 3.5, 0, j - 3.5]}
                onClick={() => onPieceSelect(i, j)}
              />
            );
          })
        )}
      </Suspense>
    </Canvas>
  );
}
