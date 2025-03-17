// src/components/Board3D/PieceMesh.jsx
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import React from "react";
import { usePieceAnimations } from "../../hooks/usePieceAnimations";

export function PieceMesh({ type, position, isKing, onClick, isSelected }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { animateHeight, currentHeight } = usePieceAnimations(isSelected);

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

  return (
    <group
      position={[position[0], position[1], position[2]]}
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered || isSelected ? 1.1 : 1}>
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

      {/* Тело фигуры */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
        <meshStandardMaterial
          color={type === "corgi" ? "#FFA500" : "#FFD700"}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Детали фигуры в зависимости от типа */}
      {type === "corgi" ? (
        <mesh position={[0, 0.15, 0.2]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#FF8C00" />
        </mesh>
      ) : (
        <mesh position={[0, 0.15, 0.2]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#DAA520" />
        </mesh>
      )}

      {/* Корона для королей */}
      {isKing && (
        <group position={[0, 0.2, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.25, 0.3, 0.1, 32]} />
            <meshStandardMaterial
              color="#FFD700"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[
                0.15 * Math.cos((i * Math.PI) / 2),
                0.1,
                0.15 * Math.sin((i * Math.PI) / 2),
              ]}
              castShadow>
              <coneGeometry args={[0.06, 0.12, 4]} />
              <meshStandardMaterial
                color="#FFD700"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          ))}
        </group>
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
