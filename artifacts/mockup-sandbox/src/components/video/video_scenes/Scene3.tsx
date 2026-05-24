import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 400),
      setTimeout(() => setPhase(3), 900),
      setTimeout(() => setPhase(4), 1600),
      setTimeout(() => setPhase(5), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const features = [
    { label: "REELS", color: "#e91e8c", desc: "Short-form video" },
    { label: "STORIES", color: "#8b5cf6", desc: "Ephemeral moments" },
    { label: "CHIRPS", color: "#06b6d4", desc: "Quick takes" },
  ];

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)" }}
      animate={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
      exit={{ clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)", transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] } }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Party video background */}
      <video
        src={`${BASE}assets/party.mp4`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.25) saturate(1.6) hue-rotate(280deg)" }}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Color overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,6,24,0.88) 0%, rgba(139,92,246,0.2) 60%, rgba(233,30,140,0.2) 100%)" }} />

      {/* Diagonal accent bars */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: `${15 + i * 28}vh`,
            left: 0,
            right: 0,
            height: "1px",
            background: `linear-gradient(90deg, transparent, rgba(${i === 0 ? "233,30,140" : i === 1 ? "139,92,246" : "6,182,212"},0.4), transparent)`,
          }}
          initial={{ scaleX: 0 }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8, delay: i * 0.15 }}
        />
      ))}

      {/* Left headline */}
      <div className="absolute left-[6vw] top-[15vh] z-10">
        <motion.div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(10px, 1.2vw, 14px)",
            color: "#e91e8c",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: "1.5vh"
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          ◆ Content & Reach
        </motion.div>

        <motion.div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(50px, 10vw, 120px)",
            lineHeight: 0.88,
            color: "#fff",
          }}
          initial={{ y: 60, opacity: 0 }}
          animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          GO
        </motion.div>
        <motion.div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(50px, 10vw, 120px)",
            lineHeight: 0.88,
            background: "linear-gradient(90deg, #e91e8c, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          initial={{ y: 60, opacity: 0 }}
          animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.08 }}
        >
          VIRAL
        </motion.div>
      </div>

      {/* Feature cards stagger from right */}
      <div className="absolute right-[6vw] top-[10vh] flex flex-col gap-[2.5vh] z-10">
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${f.color}55`,
              borderLeft: `3px solid ${f.color}`,
              borderRadius: "12px",
              padding: "2vh 2.5vw",
              backdropFilter: "blur(12px)",
              minWidth: "24vw"
            }}
            initial={{ x: 80, opacity: 0 }}
            animate={phase >= 3 ? { x: 0, opacity: 1 } : { x: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: phase >= 3 ? i * 0.14 : 0 }}
          >
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(22px, 3.5vw, 44px)", color: f.color, letterSpacing: "0.05em" }}>
              {f.label}
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(10px, 1.1vw, 14px)", color: "rgba(255,255,255,0.55)", marginTop: "0.3em" }}>
              {f.desc}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Animated stat counter */}
      <motion.div
        className="absolute bottom-[10vh] left-[6vw]"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(30px, 6vw, 75px)",
          color: "#fff",
          lineHeight: 1
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={phase >= 4 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
        transition={{ type: "spring", stiffness: 250, damping: 18 }}
      >
        <span style={{ color: "#e91e8c" }}>10K</span> CREATORS.<br />ONE GRID.
      </motion.div>
    </motion.div>
  );
}
