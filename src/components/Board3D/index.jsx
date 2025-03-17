import { Suspense, useState, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  useTexture,
} from "@react-three/drei";
import { PieceMesh } from "./PieceMesh";
import React from "react";
import { EMPTY } from "../../models/Constants";
import * as THREE from "three";

//компонент доски
function Board({ renderBoardSquares }) {
  // Загружаем текстуры дерева из локальных файлов
  const woodTextures = useTexture({
    map: "/textures/wood_color.png",
    normalMap: "/textures/wood_normal.png",
    roughnessMap: "/textures/wood_roughness.jpg",
  });

  // Настраиваем текстуру для повторения
  React.useEffect(() => {
    Object.values(woodTextures).forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
    });
  }, [woodTextures]);

  // Создаём материал с текстурой дерева
  const woodMaterial = new THREE.MeshStandardMaterial({
    ...woodTextures,
    roughness: 0.8,
    metalness: 0.1,
    color: "#8B5A2B",
  });

  return (
    <group>
      <mesh position={[0, -0.1, 4.25]} receiveShadow castShadow>
        <boxGeometry args={[9, 0.3, 0.5]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.1, -4.25]} receiveShadow castShadow>
        <boxGeometry args={[9, 0.3, 0.5]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[4.25, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.3, 9]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[-4.25, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.3, 9]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>

      {renderBoardSquares()}
    </group>
  );
}

function Renderer() {
  const { gl } = useThree();

  React.useEffect(() => {
    //настройки рендеринга
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.outputEncoding = THREE.sRGBEncoding;
  }, [gl]);

  return null;
}

// Упрощенное окружение
function SimpleEnvironment() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={15}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#f0f0ff" />
    </>
  );
}

export function Board3D({ board, onPieceSelect, selectedPiece, validMoves }) {
  const [hoveredSquare, setHoveredSquare] = useState(null);

  // Рендеринг клеток доски с чётким шахматным узором
  const renderBoardSquares = () => {
    const squares = [];

    // Загружаем текстуры для клеток
    const darkSquareTexture = useTexture("/textures/dark_square.jpg");
    const lightSquareTexture = useTexture("/textures/light_square.jpg");

    // Настройка текстур
    React.useEffect(() => {
      [darkSquareTexture, lightSquareTexture].forEach((texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
      });
    }, [darkSquareTexture, lightSquareTexture]);

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

        // Создаём материалы с текстурами
        const material = new THREE.MeshStandardMaterial({
          map: isEven ? lightSquareTexture : darkSquareTexture,
          color: isEven ? "#E8D0AA" : "#774936",
          roughness: 0.7,
          metalness: 0.05,
        });

        // Модификация материала для особых состояний
        if (isSelected) {
          material.color.set("#66BB66");
        } else if (isValidMove) {
          material.color.set("#6699FF");
          material.transparent = true;
          material.opacity = 0.9;
        } else if (isHovered) {
          if (isEven) {
            material.color.set("#F0DDB8");
          } else {
            material.color.set("#8A5A44");
          }
        }

        squares.push(
          <mesh
            key={`square-${row}-${col}`}
            position={[row - 3.5, -0.097, col - 3.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              if (isValidMove || board[row][col] !== EMPTY) {
                onPieceSelect(row, col);
              }
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredSquare({ row, col });
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredSquare(null);
            }}>
            <planeGeometry args={[0.95, 0.95]} />
            <primitive object={material} attach="material" />
          </mesh>
        );

        // Добавляем тонкую рамку вокруг клетки для улучшения шашечного вида
        squares.push(
          <mesh
            key={`border-${row}-${col}`}
            position={[row - 3.5, -0.096, col - 3.5]}
            rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial
              color={isEven ? "#774936" : "#E8D0AA"}
              opacity={0.3}
              transparent
            />
          </mesh>
        );
      }
    }

    return squares;
  };

  // рендеринг сцены
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]} // ограничиваем максимальный DPR для производительности
      performance={{ min: 0.5 }} // разрешаем Three.js понижать качество при низкой производительности
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false, // повышает производительность
      }}>
      <PerspectiveCamera makeDefault position={[0, 5, 7]} fov={50} />
      <OrbitControls
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        maxDistance={12}
        minDistance={5}
      />

      <Renderer />
      <SimpleEnvironment />

      <Suspense fallback={null}>
        <Board renderBoardSquares={renderBoardSquares} />

        {/* тени */}
        <ContactShadows
          position={[0, -0.5, 0]}
          opacity={0.4}
          width={15}
          height={15}
          blur={1.5}
          far={4.5}
          resolution={256}
        />

        {/* Фигуры */}
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

      <Environment preset="sunset" intensity={0.2} />
    </Canvas>
  );
}
