import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  useTexture,
  Sky,
  Stars,
  AdaptiveDpr,
  PerformanceMonitor,
} from "@react-three/drei";
import { PieceMesh } from "./PieceMesh";
import React from "react";
import { EMPTY } from "../../models/Constants";
import * as THREE from "three";

// Хук для определения мобильного устройства
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768
      );
    };

    setIsMobile(checkIsMobile());

    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

// Компонент для настройки рендеринга в зависимости от производительности
function AdaptiveRenderer() {
  const { gl } = useThree();
  const [degraded, setDegraded] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Базовые настройки рендеринга
    gl.shadowMap.enabled = !isMobile;
    gl.shadowMap.type = isMobile
      ? THREE.BasicShadowMap
      : THREE.PCFSoftShadowMap;
    gl.outputEncoding = THREE.sRGBEncoding;

    // Дополнительные оптимизации для мобильных устройств
    if (isMobile) {
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }
  }, [gl, isMobile]);

  return (
    <PerformanceMonitor
      onDecline={() => {
        setDegraded(true);
      }}>
      {degraded && <AdaptiveDpr pixelated />}
    </PerformanceMonitor>
  );
}

// Оптимизированные компоненты для создания облаков и ландшафта
function OptimizedCloud({ position, scale = 1, intensity = 1, isMobile }) {
  // Создаем упрощенную геометрию для мобильных устройств
  const segments = isMobile ? 8 : 16;

  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[2, segments, segments]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.9 * intensity}
          emissive="#ffffff"
          emissiveIntensity={0.05}
          roughness={1}
        />
      </mesh>

      {/* Уменьшаем количество дополнительных сфер на мобильных */}
      {(!isMobile || Math.random() > 0.5) && (
        <mesh position={[1.5, 0.5, 0]}>
          <sphereGeometry args={[1.5, segments, segments]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.85 * intensity}
            emissive="#ffffff"
            emissiveIntensity={0.03}
            roughness={1}
          />
        </mesh>
      )}

      {(!isMobile || Math.random() > 0.7) && (
        <mesh position={[-1.7, 0.2, 0.4]}>
          <sphereGeometry args={[1.7, segments, segments]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.8 * intensity}
            emissive="#ffffff"
            emissiveIntensity={0.04}
            roughness={1}
          />
        </mesh>
      )}
    </group>
  );
}

// Оптимизированная функция для создания ландшафта
function OptimizedLandscape({ isMobile }) {
  // Упрощенная геометрия для мобильных устройств
  const TERRAIN_SIZE = 1000;
  const TERRAIN_SEGMENTS = isMobile ? 64 : 128;
  const MAX_HEIGHT = 60;

  // Загружаем и настраиваем текстуры
  const terrainTextures = useTexture({
    map: "/textures/ground_color.jpg",
    normalMap: "/textures/ground_normal.jpg",
    roughnessMap: "/textures/ground_roughness.jpg",
    // Не загружаем displacement карту на мобильных
    ...(isMobile ? {} : { displacementMap: "/textures/ground_height.jpg" }),
  });

  // Мемоизированная геометрия
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );

    const vertices = geometry.attributes.position.array;

    // Упрощенный алгоритм для мобильных
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];

      // Менее сложное вычисление высот для мобильных
      const elevation = isMobile
        ? (Math.sin(x * 0.01) + Math.sin(z * 0.01)) * 10
        : (Math.sin(x * 0.01) + Math.sin(z * 0.01)) * 10 +
          (Math.sin(x * 0.05 + z * 0.03) + Math.sin(z * 0.05 + x * 0.03)) * 5 +
          (Math.sin(x * 0.1 + z * 0.1) + Math.sin(z * 0.15 + x * 0.15)) * 2;

      const distanceFromCenter = Math.sqrt(x * x + z * z);
      if (distanceFromCenter > 60) {
        vertices[i + 1] =
          -40 +
          Math.min(elevation, MAX_HEIGHT) *
            Math.min(1, (distanceFromCenter - 60) / 100);
      } else {
        vertices[i + 1] = -40;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;
  }, [isMobile]);

  useEffect(() => {
    Object.values(terrainTextures).forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      // Меньше повторений текстур на мобильных для производительности
      texture.repeat.set(isMobile ? 20 : 40, isMobile ? 20 : 40);
    });
  }, [terrainTextures, isMobile]);

  return (
    <group position={[0, -40, 0]}>
      {/* Основной ландшафт */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={terrainGeometry} attach="geometry" />
        <meshStandardMaterial
          {...terrainTextures}
          displacementScale={isMobile ? 5 : 15}
          color="#3a5e30"
          roughness={1}
          metalness={0.1}
        />
      </mesh>

      {/* Горы вдали - уменьшаем количество для мобильных */}
      {useMemo(
        () => (
          <group>
            {/* Только основные горы для мобильных */}
            <mesh position={[30, 15, -120]} rotation={[-0.1, 0.3, 0]}>
              <coneGeometry
                args={[60, 70, isMobile ? 4 : 6, isMobile ? 1 : 2]}
              />
              <meshStandardMaterial
                color="#2d4c2a"
                roughness={0.9}
                metalness={0.1}
              />
            </mesh>

            <mesh position={[-90, 20, -150]} rotation={[-0.05, -0.2, 0.1]}>
              <coneGeometry
                args={[80, 90, isMobile ? 4 : 5, isMobile ? 1 : 2]}
              />
              <meshStandardMaterial
                color="#27442b"
                roughness={0.9}
                metalness={0.1}
              />
            </mesh>

            {/* Дополнительные горы только для десктопа */}
            {!isMobile && (
              <>
                <mesh position={[-40, 18, -180]} rotation={[0, 0.5, 0.1]}>
                  <coneGeometry args={[50, 60, 7, 2]} />
                  <meshStandardMaterial
                    color="#2a453b"
                    roughness={0.9}
                    metalness={0.1}
                  />
                </mesh>

                <mesh position={[80, 25, -200]} rotation={[0, -0.3, 0.05]}>
                  <coneGeometry args={[70, 80, 5, 2]} />
                  <meshStandardMaterial
                    color="#253c28"
                    roughness={0.9}
                    metalness={0.1}
                  />
                </mesh>
              </>
            )}
          </group>
        ),
        [isMobile]
      )}

      {/* Лесистые холмы - уменьшаем количество для мобильных */}
      {useMemo(
        () => (
          <>
            {[...Array(isMobile ? 6 : 12)].map((_, i) => {
              const angle = (i / (isMobile ? 6 : 12)) * Math.PI * 2;
              const radius = 60 + Math.random() * 40;
              const x = Math.cos(angle) * radius;
              const z = Math.sin(angle) * radius;
              const scale = 8 + Math.random() * 12;

              return (
                <group key={i} position={[x, -30, z]}>
                  {/* Холм */}
                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry
                      args={[
                        scale,
                        isMobile ? 8 : 16,
                        isMobile ? 8 : 16,
                        0,
                        Math.PI * 2,
                        0,
                        Math.PI / 2,
                      ]}
                    />
                    <meshStandardMaterial
                      color="#2a4d25"
                      roughness={0.9}
                      metalness={0}
                    />
                  </mesh>

                  {/* Деревья на холмах - только для десктопа */}
                  {!isMobile &&
                    [...Array(Math.floor(3 + Math.random() * 5))].map(
                      (_, j) => {
                        const treeX = (Math.random() - 0.5) * scale * 0.8;
                        const treeZ = (Math.random() - 0.5) * scale * 0.8;
                        const treeHeight = 5 + Math.random() * 8;

                        return (
                          <group key={j} position={[treeX, scale * 0.5, treeZ]}>
                            <mesh position={[0, 0, 0]}>
                              <cylinderGeometry
                                args={[0.5, 0.8, treeHeight, 6]}
                              />
                              <meshStandardMaterial
                                color="#5c4033"
                                roughness={0.9}
                              />
                            </mesh>
                            <mesh position={[0, treeHeight * 0.6, 0]}>
                              <coneGeometry
                                args={[treeHeight * 0.5, treeHeight, 8]}
                              />
                              <meshStandardMaterial
                                color="#1e3d14"
                                roughness={0.9}
                              />
                            </mesh>
                          </group>
                        );
                      }
                    )}
                </group>
              );
            })}
          </>
        ),
        [isMobile]
      )}
    </group>
  );
}

// Оптимизированный компонент фона сцены
function OptimizedSceneBackground() {
  const isMobile = useIsMobile();

  // Уменьшаем количество облаков для мобильных
  const cloudPositions = useMemo(() => {
    const positions = [];
    const skyCloudCount = isMobile ? 7 : 15;
    const bottomCloudCount = isMobile ? 4 : 8;

    // Облака в небе
    for (let i = 0; i < skyCloudCount; i++) {
      const angle = (i / skyCloudCount) * Math.PI * 2;
      const radius = 100 + Math.random() * 100;
      positions.push({
        x: Math.cos(angle) * radius,
        y: 10 + Math.random() * 30,
        z: Math.sin(angle) * radius,
        scale: 4 + Math.random() * 4,
        intensity: 0.4 + Math.random() * 0.3,
        id: `sky-${i}`,
      });
    }

    // Облака внизу
    for (let i = 0; i < bottomCloudCount; i++) {
      const angle = (i / bottomCloudCount) * Math.PI * 2;
      const radius = 40 + Math.random() * 30;
      positions.push({
        x: Math.cos(angle) * radius,
        y: -28,
        z: Math.sin(angle) * radius,
        scale: 7 + Math.random() * 3,
        intensity: 0.25,
        id: `bottom-${i}`,
      });
    }

    return positions;
  }, [isMobile]);

  return (
    <>
      {/* Небо с упрощенными параметрами для мобильных */}
      <Sky
        distance={450000}
        sunPosition={[0, 0.6, -1]}
        inclination={0.52}
        azimuth={0.25}
        turbidity={8}
        rayleigh={1.5}
        mieCoefficient={0.007}
        mieDirectionalG={0.85}
      />

      {/* Звезды - меньше для мобильных */}
      <Stars
        radius={120}
        depth={60}
        count={isMobile ? 2000 : 4000}
        factor={5}
        saturation={0.2}
        fade
        speed={0.5}
      />

      {/* Оптимизированные облака */}
      {cloudPositions.map((cloud) => (
        <OptimizedCloud
          key={cloud.id}
          position={[cloud.x, cloud.y, cloud.z]}
          scale={cloud.scale}
          intensity={cloud.intensity}
          isMobile={isMobile}
        />
      ))}

      {/* Оптимизированный ландшафт */}
      <OptimizedLandscape isMobile={isMobile} />

      {/* Улучшенный туман */}
      <fogExp2
        attach="fog"
        color="#b9d5ff"
        density={isMobile ? 0.008 : 0.006}
      />
    </>
  );
}

// Оптимизированное освещение
function OptimizedLighting() {
  const isMobile = useIsMobile();

  return (
    <>
      <ambientLight intensity={0.5} color="#e0e8ff" />
      <directionalLight
        position={[5, 15, 5]}
        intensity={1.2}
        castShadow={!isMobile}
        shadow-mapSize-width={isMobile ? 512 : 1024}
        shadow-mapSize-height={isMobile ? 512 : 1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color="#fffaf0"
      />

      {/* Дополнительное освещение только для десктопа */}
      {!isMobile && (
        <>
          <pointLight
            position={[-5, 5, -5]}
            intensity={0.5}
            color="#f0f0ff"
            distance={20}
          />
          <pointLight
            position={[5, 5, 5]}
            intensity={0.3}
            color="#ffe0c0"
            distance={15}
          />
        </>
      )}

      {/* Основные светильники по углам доски */}
      <pointLight
        position={[-4, 1, -4]}
        intensity={0.4}
        color="#ffe8d0"
        distance={6}
      />
      <pointLight
        position={[4, 1, 4]}
        intensity={0.4}
        color="#ffe8d0"
        distance={6}
      />
    </>
  );
}

export function Board3D({ board, onPieceSelect, selectedPiece, validMoves }) {
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const isMobile = useIsMobile();

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
          material.emissive = new THREE.Color("#224422");
          material.emissiveIntensity = 0.2;
        } else if (isValidMove) {
          material.color.set("#6699FF");
          material.emissive = new THREE.Color("#223366");
          material.emissiveIntensity = 0.2;
          material.transparent = true;
          material.opacity = 0.9;
        } else if (isHovered) {
          if (isEven) {
            material.color.set("#F0DDB8");
          } else {
            material.color.set("#8A5A44");
          }
          material.emissive = new THREE.Color("#222222");
          material.emissiveIntensity = 0.1;
        }

        squares.push(
          <mesh
            key={`square-${row}-${col}`}
            position={[row - 3.5, -0.097, col - 3.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow={!isMobile}
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

        // Добавляем рамку только для настольных устройств
        if (!isMobile) {
          squares.push(
            <mesh
              key={`border-${row}-${col}`}
              position={[row - 3.5, -0.096, col - 3.5]}
              rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                color={isEven ? "#774936" : "#E8D0AA"}
                opacity={0.2}
                transparent
              />
            </mesh>
          );
        }
      }
    }

    return squares;
  };

  // Компонент доски
  function Board({ renderBoardSquares }) {
    // Загружаем текстуры дерева
    const woodTextures = useTexture({
      map: "/textures/wood_color.png",
      // На мобильных устройствах не используем сложные текстуры
      ...(isMobile
        ? {}
        : {
            normalMap: "/textures/wood_normal.png",
            roughnessMap: "/textures/wood_roughness.jpg",
          }),
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
        <mesh
          position={[0, -0.1, 4.25]}
          receiveShadow={!isMobile}
          castShadow={!isMobile}>
          <boxGeometry args={[9, 0.3, 0.5]} />
          <primitive object={woodMaterial} attach="material" />
        </mesh>
        <mesh
          position={[0, -0.1, -4.25]}
          receiveShadow={!isMobile}
          castShadow={!isMobile}>
          <boxGeometry args={[9, 0.3, 0.5]} />
          <primitive object={woodMaterial} attach="material" />
        </mesh>
        <mesh
          position={[4.25, -0.1, 0]}
          receiveShadow={!isMobile}
          castShadow={!isMobile}>
          <boxGeometry args={[0.5, 0.3, 9]} />
          <primitive object={woodMaterial} attach="material" />
        </mesh>
        <mesh
          position={[-4.25, -0.1, 0]}
          receiveShadow={!isMobile}
          castShadow={!isMobile}>
          <boxGeometry args={[0.5, 0.3, 9]} />
          <primitive object={woodMaterial} attach="material" />
        </mesh>

        {renderBoardSquares()}
      </group>
    );
  }

  // Рендеринг сцены
  return (
    <Canvas
      shadows={!isMobile}
      dpr={isMobile ? [1, 1.5] : window.devicePixelRatio}
      style={{
        width: "100vw",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        outline: "none",
      }}
      gl={{
        antialias: !isMobile,
        powerPreference: "high-performance",
        alpha: false,
      }}>
      <PerspectiveCamera makeDefault position={[0, 5, 7]} fov={50} />
      <OrbitControls
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        maxDistance={12}
        minDistance={5}
        enableDamping={!isMobile} // Отключаем демпфирование на мобильных для производительности
      />

      <AdaptiveRenderer />

      <OptimizedLighting />

      {/* Используем оптимизированный фон сцены */}
      <OptimizedSceneBackground />

      <Suspense fallback={null}>
        <Board renderBoardSquares={renderBoardSquares} />

        {/* Тени только для настольных устройств */}
        {!isMobile && (
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.4}
            width={15}
            height={15}
            blur={1.5}
            far={4.5}
            resolution={256}
          />
        )}

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
                isMobile={isMobile}
              />
            );
          })
        )}
      </Suspense>

      <Environment preset="sunset" intensity={0.2} />
    </Canvas>
  );
}
