import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(() => setPhase(5), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const letters = "SQUAWK".split("");

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(150% at 50% 50%)" }}
      exit={{ clipPath: "circle(0% at 50% 50%)", transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Intro background image */}
      <motion.img
        src={`${BASE}assets/intro-bg.png`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.45) saturate(1.4)" }}
        initial={{ scale: 1.15 }}
        animate={{ scale: phase >= 1 ? 1.0 : 1.15 }}
        transition={{ duration: 3, ease: "easeOut" }}
      />

      {/* Deep overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,6,24,0.85) 0%, rgba(139,92,246,0.25) 50%, rgba(233,30,140,0.3) 100%)" }} />

      {/* Grid lines overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "linear-gradient(rgba(233,30,140,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(233,30,140,0.6) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      {/* Character art */}
      <motion.img
        src={`${BASE}assets/squad-intro.png`}
        className="absolute bottom-0 right-[8vw] object-contain"
        style={{ height: "75vh", filter: "drop-shadow(0 0 40px rgba(233,30,140,0.6))" }}
        initial={{ x: "30vw", opacity: 0, scale: 0.85 }}
        animate={phase >= 1 ? { x: 0, opacity: 1, scale: 1 } : { x: "30vw", opacity: 0, scale: 0.85 }}
        exit={{ x: "30vw", opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 }}
      />

      {/* SQUAWK title - kinetic per-character */}
      <div className="absolute left-[6vw] top-[28vh] z-10">
        <div className="flex overflow-hidden">
          {letters.map((char, i) => (
            <motion.span
              key={i}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(60px, 13vw, 160px)",
                lineHeight: 0.85,
                display: "inline-block",
                color: "#fff",
                letterSpacing: "-0.02em",
                textShadow: "0 0 60px rgba(233,30,140,0.8)"
              }}
              initial={{ y: "110%", rotateX: -60, opacity: 0 }}
              animate={phase >= 2 ? { y: "0%", rotateX: 0, opacity: 1 } : { y: "110%", rotateX: -60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 22, delay: phase >= 2 ? i * 0.07 : 0 }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(12px, 1.8vw, 22px)", color: "rgba(255,255,255,0.75)", letterSpacing: "0.25em", textTransform: "uppercase", marginTop: "1.5vh" }}
          initial={{ opacity: 0, x: -30 }}
          animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          The Social Home of the 10K Squad
        </motion.p>

        {/* Pink accent line */}
        <motion.div
          style={{ height: "3px", background: "linear-gradient(90deg, #e91e8c, #8b5cf6, transparent)", marginTop: "1.5vh" }}
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: "70%" } : { width: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </div>

      {/* Community badges stagger in */}
      {["Collectors", "Traders", "Creators"].map((label, i) => (
        <motion.div
          key={label}
          className="absolute"
          style={{
            left: `${6 + i * 12}vw`,
            bottom: "8vh",
            background: "rgba(233,30,140,0.15)",
            border: "1px solid rgba(233,30,140,0.5)",
            borderRadius: "100px",
            padding: "0.4em 1.2em",
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(10px, 1.1vw, 14px)",
            color: "#fff",
            backdropFilter: "blur(8px)"
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: phase >= 4 ? i * 0.1 : 0 }}
        >
          {label}
        </motion.div>
      ))}
    </motion.div>
  );
}
