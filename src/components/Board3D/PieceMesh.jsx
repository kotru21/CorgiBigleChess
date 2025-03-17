// src/components/Board3D/PieceMesh.jsx
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import React from "react";
import { usePieceAnimations } from "../../hooks/usePieceAnimations";
import { useGLTF } from "@react-three/drei";

export function PieceMesh({ type, position, isKing, onClick, isSelected }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { animateHeight, currentHeight } = usePieceAnimations(isSelected);

  // Загружаем 3D модели
  const { scene: modelScene } = useGLTF(`/models/${type}.glb`);
  const { scene: crownScene } = useGLTF("/models/crown.glb");

  // Анимация при наведении и выборе
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = currentHeight;

      if (hovered || isSelected) {
        groupRef.current.rotation.y += 0.02;
      }
    }
  });

  // Глубина теней зависит от статуса фигуры
  const shadowOpacity = isSelected ? 0.4 : hovered ? 0.3 : 0.2;

  // Масштаб для разных типов собак
  const scale = type === "corgi" ? 0.4 : 0.35;

  return (
    <group
      position={[position[0], position[1], position[2]]}
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered || isSelected ? scale * 1.1 : scale}>
      {/* Тень под фигурой */}
      <mesh
        position={[0, -0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial
          color="black"
          transparent={true}
          opacity={shadowOpacity}
        />
      </mesh>

      {/* Модель собаки */}
      <primitive
        scale={3}
        object={modelScene.clone()}
        position={[0, -0.1, 0]}
        castShadow
        receiveShadow
      />

      {/* Корона для королей */}
      {isKing && (
        <primitive
          object={crownScene.clone()}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 2, 0]}
          scale={0.03}
          castShadow
        />
      )}

      {/* Подсветка при наведении */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={hovered ? 0.5 : isSelected ? 0.7 : 0}
        color={type === "corgi" ? "#FFA500" : "#FFD700"}
        distance={1.2}
      />
    </group>
  );
}

// Предзагрузка моделей для оптимизации
useGLTF.preload("/models/beagle.glb");
useGLTF.preload("/models/corgi.glb");
useGLTF.preload("/models/crown.glb");
