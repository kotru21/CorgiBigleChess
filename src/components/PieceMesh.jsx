import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import React from "react";

// Предзагрузка моделей
useGLTF.preload("/models/corgi.glb");
useGLTF.preload("/models/crown.glb");

export function PieceMesh({ type, position, isKing, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Загружаем модели
  const corgi = useGLTF("/models/corgi.glb");
  const crown = useGLTF("/models/crown.glb");

  // Анимация при наведении
  useFrame(() => {
    if (hovered && meshRef.current) {
      meshRef.current.rotation.y += 0.02;
    }
  });

  // Выводим в консоль структуру моделей для отладки
  console.log("Corgi model structure:", corgi);
  console.log("Crown model structure:", crown);

  return (
    <group
      position={position}
      ref={meshRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}>
      {/* Фигура - используем всю сцену целиком */}
      {corgi.scene && (
        <primitive
          object={type === "corgi" ? corgi.scene.clone() : corgi.scene.clone()}
          scale={1}
          position={[0, 0, 0]}
          castShadow
        />
      )}

      {/* Корона для королей */}
      {isKing && crown.scene && (
        <primitive
          object={crown.scene.clone()}
          position={[0, 0.5, 0]}
          scale={0.2}
          castShadow
        />
      )}

      {/* Подсветка при наведении */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={hovered ? 0.5 : 0}
        color={type === "corgi" ? "#FFA500" : "#FFD700"}
      />
    </group>
  );
}
