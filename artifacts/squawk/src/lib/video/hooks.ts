declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

import { useState, useEffect, useRef } from "react";

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const scenes = Object.keys(durations);
  const [currentScene, setCurrentScene] = useState(0);
  const hasRecordingStopped = useRef(false);

  useEffect(() => {
    window.startRecording?.();
  }, []);

  useEffect(() => {
    const duration = durations[scenes[currentScene]];
    const timer = setTimeout(() => {
      const nextScene = (currentScene + 1) % scenes.length;
      if (nextScene === 0 && !hasRecordingStopped.current) {
        hasRecordingStopped.current = true;
        window.stopRecording?.();
      }
      setCurrentScene(nextScene);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentScene]);

  return { currentScene };
}