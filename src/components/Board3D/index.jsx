import { Suspense, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  useTexture,
  Sky,
  Stars,
  useGLTF,
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

// Компонент для создания стилизованного облака из нескольких перекрывающихся плоскостей
function CloudPlane({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 0.7,
}) {
  // Создаем текстуру для облака
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    // Заполняем градиентом от белого к прозрачному
    const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.6)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Создаем несколько перекрывающихся плоскостей для облака */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial
          map={cloudTexture}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[2, 1, 1]} rotation={[0.2, 0.3, 0.1]}>
        <planeGeometry args={[8, 5]} />
        <meshBasicMaterial
          map={cloudTexture}
          transparent
          opacity={opacity * 0.8}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[-3, -0.5, 0.6]} rotation={[-0.1, -0.2, 0]}>
        <planeGeometry args={[7, 4]} />
        <meshBasicMaterial
          map={cloudTexture}
          transparent
          opacity={opacity * 0.7}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Объемные стилизованные облака с использованием группы сфер
function StylizedCloud({ position, scale = 1, intensity = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Главная большая сфера облака */}
      <mesh>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.9 * intensity}
          emissive="#ffffff"
          emissiveIntensity={0.05}
          roughness={1}
        />
      </mesh>

      {/* Дополнительные сферы для создания объемности */}
      <mesh position={[1.5, 0.5, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.85 * intensity}
          emissive="#ffffff"
          emissiveIntensity={0.03}
          roughness={1}
        />
      </mesh>

      <mesh position={[-1.7, 0.2, 0.4]}>
        <sphereGeometry args={[1.7, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.8 * intensity}
          emissive="#ffffff"
          emissiveIntensity={0.04}
          roughness={1}
        />
      </mesh>

      <mesh position={[0.3, -0.8, 0.7]}>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.75 * intensity}
          emissive="#ffffff"
          emissiveIntensity={0.02}
          roughness={1}
        />
      </mesh>

      <mesh position={[-0.5, 1.2, -0.3]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.7 * intensity}
          emissive="#ffffff"
          emissiveIntensity={0.02}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

// Создаем текстурированный ландшафт вместо плоской земли
function StylizedLandscape() {
  // Загружаем текстуры для земли
  const groundTexture = useTexture({
    map: "/textures/ground_color.jpg",
    normalMap: "/textures/ground_normal.jpg",
    roughnessMap: "/textures/ground_roughness.jpg",
    aoMap: "/textures/ground_ao.jpg",
  });

  // Конфигурируем текстуры
  React.useEffect(() => {
    Object.values(groundTexture).forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(30, 30);
    });
  }, [groundTexture]);

  return (
    <group position={[0, -40, 0]}>
      {/* Основная земля - большая сфера, создающая горизонт */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <sphereGeometry
          args={[500, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.5]}
        />
        <meshStandardMaterial
          {...groundTexture}
          color="#3a5e30"
          roughness={1}
          metalness={0.05}
        />
      </mesh>

      {/* Дальние холмы */}
      <mesh position={[30, 15, -120]} rotation={[-0.1, 0.3, 0]}>
        <boxGeometry args={[80, 30, 60]} />
        <meshStandardMaterial color="#2d4c2a" roughness={1} metalness={0} />
      </mesh>

      <mesh position={[-90, 20, -150]} rotation={[-0.05, -0.2, 0.1]}>
        <boxGeometry args={[120, 40, 80]} />
        <meshStandardMaterial color="#27442b" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

// Фон сцены с красивыми элементами
function SceneBackground() {
  return (
    <>
      {/* Небо */}
      <Sky
        distance={450000}
        sunPosition={[0, 0.5, -1]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={10}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Звезды для добавления атмосферы */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Объемные облака */}
      <StylizedCloud position={[-80, 10, -120]} scale={4} intensity={0.6} />
      <StylizedCloud position={[90, 25, -170]} scale={6} intensity={0.5} />
      <StylizedCloud position={[-40, 15, -140]} scale={5} intensity={0.55} />
      <StylizedCloud position={[60, 18, -130]} scale={4.5} intensity={0.5} />
      <StylizedCloud position={[0, 20, -160]} scale={5.5} intensity={0.45} />

      {/* Облака внизу сцены */}
      <StylizedCloud position={[0, -25, 0]} scale={8} intensity={0.25} />
      <StylizedCloud position={[-30, -23, 20]} scale={7} intensity={0.2} />
      <StylizedCloud position={[40, -22, -10]} scale={7.5} intensity={0.15} />
      <StylizedCloud position={[20, -26, 30]} scale={8.5} intensity={0.18} />
      <StylizedCloud position={[-50, -24, -15]} scale={9} intensity={0.2} />

      {/* Стилизованный ландшафт */}
      <StylizedLandscape />

      {/* Добавим туманную дымку для глубины сцены */}
      <fogExp2 attach="fog" color="#b9d5ff" density={0.008} />
    </>
  );
}

// Улучшенное освещение
function EnhancedLighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#e0e8ff" />
      <directionalLight
        position={[5, 15, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color="#fffaf0"
      />
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

      {/* Светильники по углам доски для подсветки */}
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
      <pointLight
        position={[-4, 1, 4]}
        intensity={0.4}
        color="#ffe8d0"
        distance={6}
      />
      <pointLight
        position={[4, 1, -4]}
        intensity={0.4}
        color="#ffe8d0"
        distance={6}
      />
    </>
  );
}

// Улучшенная функция для генерации процедурного шума
function createNoise() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Создаем градиентный шум
  const imageData = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      // Генерация более естественного шума
      const value =
        (Math.sin(x * 0.01) +
          Math.sin(y * 0.01) +
          Math.sin(x * 0.02 + y * 0.03) +
          Math.sin(y * 0.02 + x * 0.01)) *
          64 +
        128;

      imageData.data[i] = value;
      imageData.data[i + 1] = value;
      imageData.data[i + 2] = value;
      imageData.data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// Улучшенные стилизованные облака с объемным эффектом
function EnhancedStylizedCloud({ position, scale = 1, intensity = 1 }) {
  const noiseTexture = useMemo(() => createNoise(), []);

  return (
    <group position={position} scale={scale}>
      {/* Основная структура облака из нескольких перекрывающихся сфер */}
      {[...Array(7)].map((_, i) => {
        // Создаем псевдослучайные значения для каждого компонента облака
        const posOffset = [
          Math.sin(i * 3.14) * 1.5,
          Math.cos(i * 2.7) * 0.8,
          Math.sin(i * 1.5) * 0.7,
        ];
        const cloudSize = 1.2 + Math.sin(i * 2) * 0.7;
        const opacity = 0.65 + Math.sin(i * 3) * 0.2;

        return (
          <mesh key={i} position={posOffset}>
            <sphereGeometry args={[cloudSize, 24, 24]} />
            <meshStandardMaterial
              transparent
              opacity={opacity * intensity}
              color="#ffffff"
              map={noiseTexture}
              roughness={0.9}
              metalness={0.1}
              emissive="#ffffff"
              emissiveIntensity={0.05}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* Добавление внутреннего свечения для глубины */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.5 * intensity}
        color="#ffffff"
        distance={6}
      />
    </group>
  );
}

// Процедурно-генерируемый ландшафт с более реалистичной геометрией
function EnhancedLandscape() {
  // Константы для настройки генерации ландшафта
  const TERRAIN_SIZE = 1000;
  const TERRAIN_SEGMENTS = 128;
  const MAX_HEIGHT = 60;

  // Создаем процедурную геометрию ландшафта
  const terrainGeometryRef = useRef();

  // Загружаем и настраиваем текстуры
  const terrainTextures = useTexture({
    map: "/textures/ground_color.jpg",
    normalMap: "/textures/ground_normal.jpg",
    roughnessMap: "/textures/ground_roughness.jpg",
    displacementMap: "/textures/ground_height.jpg",
  });

  // Важно: мемоизируем генерацию ландшафта, чтобы она происходила только один раз
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );

    const vertices = geometry.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];

      // Используем разные частоты шума для создания более сложной поверхности
      const elevation =
        (Math.sin(x * 0.01) + Math.sin(z * 0.01)) * 10 +
        (Math.sin(x * 0.05 + z * 0.03) + Math.sin(z * 0.05 + x * 0.03)) * 5 +
        (Math.sin(x * 0.1 + z * 0.1) + Math.sin(z * 0.15 + x * 0.15)) * 2;

      // Добавляем высоту только если точка достаточно далеко от центра
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
  }, []); // Пустой массив зависимостей - вычисляется только один раз

  useEffect(() => {
    Object.values(terrainTextures).forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(40, 40);
    });
  }, [terrainTextures]);

  return (
    <group position={[0, -40, 0]}>
      {/* Основной ландшафт */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={terrainGeometry} attach="geometry" />
        <meshStandardMaterial
          {...terrainTextures}
          displacementScale={15}
          color="#3a5e30"
          roughness={1}
          metalness={0.1}
        />
      </mesh>

      {/* Горы вдали - используем useMemo для остальных элементов ландшафта */}
      {useMemo(
        () => (
          <group>
            {/* Первая гряда гор */}
            <mesh position={[30, 15, -120]} rotation={[-0.1, 0.3, 0]}>
              <coneGeometry args={[60, 70, 6, 2]} />
              <meshStandardMaterial
                color="#2d4c2a"
                roughness={0.9}
                metalness={0.1}
              />
            </mesh>

            {/* Вторая гряда гор */}
            <mesh position={[-90, 20, -150]} rotation={[-0.05, -0.2, 0.1]}>
              <coneGeometry args={[80, 90, 5, 2]} />
              <meshStandardMaterial
                color="#27442b"
                roughness={0.9}
                metalness={0.1}
              />
            </mesh>

            {/* Дополнительные горы для заполнения горизонта */}
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
          </group>
        ),
        []
      )}

      {/* Озеро */}
      <mesh position={[120, -32, 120]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[80, 32]} />
        <meshStandardMaterial
          color="#1e5484"
          roughness={0.1}
          metalness={0.6}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Лесистые холмы вокруг игрового пространства - генерируем с помощью useMemo */}
      {useMemo(
        () => (
          <>
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const radius = 60 + Math.random() * 40;
              const x = Math.cos(angle) * radius;
              const z = Math.sin(angle) * radius;
              const scale = 8 + Math.random() * 12;

              return (
                <group key={i} position={[x, -30, z]}>
                  {/* Холм */}
                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry
                      args={[scale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
                    />
                    <meshStandardMaterial
                      color="#2a4d25"
                      roughness={0.9}
                      metalness={0}
                    />
                  </mesh>

                  {/* Деревья на холме */}
                  {[...Array(Math.floor(3 + Math.random() * 5))].map((_, j) => {
                    const treeX = (Math.random() - 0.5) * scale * 0.8;
                    const treeZ = (Math.random() - 0.5) * scale * 0.8;
                    const treeHeight = 5 + Math.random() * 8;

                    return (
                      <group key={j} position={[treeX, scale * 0.5, treeZ]}>
                        {/* Ствол */}
                        <mesh position={[0, 0, 0]}>
                          <cylinderGeometry args={[0.5, 0.8, treeHeight, 6]} />
                          <meshStandardMaterial
                            color="#5c4033"
                            roughness={0.9}
                          />
                        </mesh>

                        {/* Крона */}
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
                  })}
                </group>
              );
            })}
          </>
        ),
        []
      )}
    </group>
  );
}

// Обновленный компонент фона сцены
function EnhancedSceneBackground() {
  // Мемоизируем распределение облаков для предотвращения изменений при перерисовке
  const cloudPositions = useMemo(() => {
    const positions = [];

    // Облака в небе
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
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
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
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
  }, []);

  return (
    <>
      {/* Небо с улучшенными параметрами */}
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

      {/* Звезды для добавления атмосферы */}
      <Stars
        radius={120}
        depth={60}
        count={4000}
        factor={5}
        saturation={0.2}
        fade
        speed={0.5}
      />

      {/* Улучшенные объемные облака с более реалистичным распределением */}
      {cloudPositions.map((cloud) => (
        <EnhancedStylizedCloud
          key={cloud.id}
          position={[cloud.x, cloud.y, cloud.z]}
          scale={cloud.scale}
          intensity={cloud.intensity}
        />
      ))}

      {/* Улучшенный ландшафт */}
      <EnhancedLandscape />

      {/* Улучшенный туман для глубины сцены */}
      <fogExp2 attach="fog" color="#b9d5ff" density={0.006} />
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

    return squares;
  };

  // рендеринг сцены
  return (
    <Canvas
      shadows
      dpr={window.devicePixelRatio}
      style={{
        width: "100vw",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        outline: "none",
      }}
      gl={{
        antialias: true,
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
      />

      <Renderer />

      <EnhancedLighting />

      {/* Заменяем SceneBackground на EnhancedSceneBackground */}
      <EnhancedSceneBackground />

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

// Нужно добавить useMemo, который мы используем в облаках
import { useMemo, useRef, useEffect } from "react";
