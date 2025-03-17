import { useState, useEffect } from "react";

export function usePieceAnimations(isSelected) {
  const [targetHeight, setTargetHeight] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(0);

  // Изменение высоты при выборе фигуры
  useEffect(() => {
    setTargetHeight(isSelected ? 0.3 : 0);
  }, [isSelected]);

  // Плавное изменение высоты
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setCurrentHeight((prev) => prev + (targetHeight - prev) * 0.1);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [targetHeight, currentHeight]);

  return { currentHeight, animateHeight: setTargetHeight };
}
