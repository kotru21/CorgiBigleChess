import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import React from "react";

// Предзагрузка моделей
useGLTF.preload("/models/corgi.glb");
useGLTF.preload("/models/beagle.glb");
useGLTF.preload("/models/crown.glb");

export function PieceMesh({ type, position, isKing, onClick, isSelected }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [targetHeight, setTargetHeight] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(0);

  // Загружаем модели
  const corgiModel = useGLTF("/models/corgi.glb");
  const beagleModel = useGLTF("/models/beagle.glb");
  const crownModel = useGLTF("/models/crown.glb");

  // Выбираем нужную модель
  const model = type === "corgi" ? corgiModel : beagleModel;

  // Обработка выбора и наведения
  useEffect(() => {
    if (isSelected) {
      setTargetHeight(0.3); // Поднимаем выбранную фигуру
    } else {
      setTargetHeight(0);
    }
  }, [isSelected]);

  // Анимация парения и вращения
  useFrame(() => {
    if (groupRef.current) {
      // Плавное изменение высоты
      setCurrentHeight(currentHeight + (targetHeight - currentHeight) * 0.1);
      groupRef.current.position.y = currentHeight;

      // Вращение при наведении или выборе
      if (hovered || isSelected) {
        groupRef.current.rotation.y += 0.02;
      }
    }
  });

  // Глубина теней в зависимости от статуса фигуры
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

      {/* Фигура */}
      {model.scene && (
        <primitive
          object={model.scene.clone()}
          scale={type === "corgi" ? 0.8 : 0.8} // Масштаб для разных моделей
          position={[0, 0, 0]}
          rotation={[0, Math.PI, 0]} // Поворачиваем модель лицом к игроку
          castShadow
        />
      )}

      {/* Корона для королей */}
      {isKing && crownModel.scene && (
        <primitive
          object={crownModel.scene.clone()}
          position={[0, 0.4, 0]}
          scale={0.02}
          castShadow
        />
      )}

      {/* Подсветка при наведении или выборе */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={hovered ? 0.5 : isSelected ? 0.7 : 0}
        color={type === "corgi" ? "#FFA500" : "#FFD700"}
        distance={1.2}
      />
    </group>
  );
}
