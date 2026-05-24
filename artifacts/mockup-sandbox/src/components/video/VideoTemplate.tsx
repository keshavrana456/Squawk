import { motion, AnimatePresence } from "framer-motion";
import { useVideoPlayer } from "@/lib/video";
import { Scene1 } from "./video_scenes/Scene1";
import { Scene2 } from "./video_scenes/Scene2";
import { Scene3 } from "./video_scenes/Scene3";
import { Scene4 } from "./video_scenes/Scene4";
import { Scene5 } from "./video_scenes/Scene5";

const SCENE_DURATIONS = {
  intro: 5000,
  theGrid: 8000,
  goViral: 8000,
  ownIt: 7000,
  joinSquad: 6000,
};

const sceneOrbs = [
  { x: "48vw", y: "42vh", scale: 2.8, opacity: 0.6, color: "#e91e8c" },
  { x: "10vw", y: "12vh", scale: 1.2, opacity: 0.5, color: "#8b5cf6" },
  { x: "72vw", y: "55vh", scale: 1.6, opacity: 0.4, color: "#e91e8c" },
  { x: "22vw", y: "68vh", scale: 0.9, opacity: 0.55, color: "#f59e0b" },
  { x: "55vw", y: "22vh", scale: 2.0, opacity: 0.45, color: "#8b5cf6" },
];

const accentLinePos = [
  { left: "20%", width: "55%", top: "50%", opacity: 0.9 },
  { left: "5%", width: "88%", top: "10%", opacity: 0.7 },
  { left: "50%", width: "30%", top: "85%", opacity: 0.6 },
  { left: "30%", width: "65%", top: "30%", opacity: 0.8 },
  { left: "10%", width: "45%", top: "65%", opacity: 0.9 },
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });
  const orb = sceneOrbs[currentScene];
  const line = accentLinePos[currentScene];

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "#0d0618", fontFamily: "'Bebas Neue', 'Inter', sans-serif" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      {/* Persistent animated bg gradient */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(233,30,140,0.08) 0%, transparent 70%)", top: "0", left: "0" }}
        animate={{ x: ["0vw", "40vw", "10vw"], y: ["0vh", "30vh", "10vh"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "45vw", height: "45vw", background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)", bottom: "0", right: "0" }}
        animate={{ x: ["0vw", "-30vw", "-5vw"], y: ["0vh", "-20vh", "-8vh"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Persistent midground orb — transforms with currentScene */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "18vw", height: "18vw", filter: "blur(60px)" }}
        animate={{
          left: orb.x,
          top: orb.y,
          scale: orb.scale,
          opacity: orb.opacity,
          background: `radial-gradient(circle, ${orb.color}55 0%, transparent 70%)`,
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Persistent accent line */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ height: "2px", background: "linear-gradient(90deg, transparent, #e91e8c, #8b5cf6, transparent)" }}
        animate={{
          left: line.left,
          width: line.width,
          top: line.top,
          opacity: line.opacity,
        }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Floating corner particles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${6 + i * 3}px`,
            height: `${6 + i * 3}px`,
            background: i % 2 === 0 ? "rgba(233,30,140,0.5)" : "rgba(139,92,246,0.4)",
            left: `${15 + i * 22}vw`,
            top: `${8 + i * 15}vh`,
          }}
          animate={{
            y: [0, -18, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{ duration: 3 + i * 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
        />
      ))}

      {/* Scene foreground — AnimatePresence handles mount/unmount */}
      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="intro" />}
        {currentScene === 1 && <Scene2 key="theGrid" />}
        {currentScene === 2 && <Scene3 key="goViral" />}
        {currentScene === 3 && <Scene4 key="ownIt" />}
        {currentScene === 4 && <Scene5 key="joinSquad" />}
      </AnimatePresence>
    </div>
  );
}
