import { useState, useEffect } from "react";

export function useFullscreen(containerId) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Определяем API полноэкранного режима в зависимости от браузера
  const fullscreenAPI = {
    enter: (element) => {
      if (element.requestFullscreen) return element.requestFullscreen();
      else if (element.webkitRequestFullscreen)
        return element.webkitRequestFullscreen();
      else if (element.mozRequestFullScreen)
        return element.mozRequestFullScreen();
      else if (element.msRequestFullscreen)
        return element.msRequestFullscreen();
    },
    exit: () => {
      if (document.exitFullscreen) return document.exitFullscreen();
      else if (document.webkitExitFullscreen)
        return document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen)
        return document.mozCancelFullScreen();
      else if (document.msExitFullscreen) return document.msExitFullscreen();
    },
    isActive: () =>
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement,
  };

  // Функция переключения полноэкранного режима
  const toggleFullscreen = async () => {
    try {
      const container = document.getElementById(containerId);

      if (!fullscreenAPI.isActive()) {
        await fullscreenAPI.enter(container);
        setIsFullscreen(true);
      } else {
        await fullscreenAPI.exit();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Ошибка полноэкранного режима:", err);
    }
  };

  // Слушатель события изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!fullscreenAPI.isActive());
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  return { isFullscreen, toggleFullscreen };
}
