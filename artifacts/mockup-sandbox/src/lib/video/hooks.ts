import { useEffect, useRef, useState } from "react";

type SceneDurations = Record<string, number>;

interface VideoPlayerResult {
  currentScene: number;
}

export function useVideoPlayer({ durations }: { durations: SceneDurations }): VideoPlayerResult {
  const [currentScene, setCurrentScene] = useState(0);
  const keys = Object.keys(durations);
  const totalScenes = keys.length;
  const hasRecorded = useRef(false);
  const sceneRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (window as any).startRecording?.();

    let elapsed = 0;
    const totalDuration = Object.values(durations).reduce((a, b) => a + b, 0);

    function advance(sceneIndex: number) {
      sceneRef.current = sceneIndex;
      setCurrentScene(sceneIndex);
      const key = keys[sceneIndex];
      const dur = durations[key];
      timerRef.current = setTimeout(() => {
        const next = sceneIndex + 1;
        if (next < totalScenes) {
          advance(next);
        } else {
          if (!hasRecorded.current) {
            hasRecorded.current = true;
            (window as any).stopRecording?.();
          }
          advance(0);
        }
      }, dur);
    }

    const startTimer = setTimeout(() => {
      advance(0);
    }, 0);

    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { currentScene };
}
