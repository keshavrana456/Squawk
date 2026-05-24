import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 1100),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const words = ["POST.", "MINT.", "FLEX."];

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: "-100vh", transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] } }}
      transition={{ duration: 0.4 }}
    >
      {/* Deep purple bg */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #0d0618 0%, #1a0830 40%, #0d0618 100%)" }} />

      {/* Animated grid */}
      <motion.div
        className="absolute inset-0 opacity-8"
        style={{
          backgroundImage: "linear-gradient(rgba(139,92,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.4) 1px, transparent 1px)",
          backgroundSize: "80px 80px"
        }}
        animate={{ backgroundPosition: ["0px 0px", "80px 80px"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Community art floating */}
      <motion.img
        src={`${BASE}assets/community.jpg`}
        className="absolute object-cover rounded-2xl"
        style={{
          width: "32vw", height: "42vh",
          right: "6vw", top: "12vh",
          filter: "brightness(0.7) saturate(1.3)",
          border: "2px solid rgba(233,30,140,0.4)",
          boxShadow: "0 0 60px rgba(233,30,140,0.3)"
        }}
        initial={{ x: "50vw", rotateY: 25, opacity: 0 }}
        animate={phase >= 2 ? { x: 0, rotateY: 0, opacity: 1 } : { x: "50vw", rotateY: 25, opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 16 }}
      />

      {/* Main body character */}
      <motion.img
        src={`${BASE}assets/main-body.png`}
        className="absolute object-contain"
        style={{
          width: "22vw", height: "55vh",
          right: "24vw", bottom: "2vh",
          filter: "drop-shadow(0 0 30px rgba(139,92,246,0.5))"
        }}
        initial={{ y: "20vh", opacity: 0 }}
        animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: "20vh", opacity: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.1 }}
      />

      {/* Left side content */}
      <div className="absolute left-[6vw] top-[20vh] z-10">
        {/* "THE GRID" label */}
        <motion.div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(10px, 1.2vw, 15px)",
            color: "#e91e8c",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: "1.5vh"
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          ◆ The Feed
        </motion.div>

        {/* Big words stagger */}
        <div>
          {words.map((word, i) => (
            <motion.div
              key={word}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(48px, 9vw, 110px)",
                lineHeight: 0.92,
                color: i === 1 ? "#e91e8c" : "#fff",
                letterSpacing: "-0.01em",
                textShadow: i === 1 ? "0 0 40px rgba(233,30,140,0.7)" : "none"
              }}
              initial={{ x: -80, opacity: 0, skewX: -8 }}
              animate={phase >= 2 ? { x: 0, opacity: 1, skewX: 0 } : { x: -80, opacity: 0, skewX: -8 }}
              transition={{ type: "spring", stiffness: 280, damping: 22, delay: phase >= 2 ? i * 0.12 : 0 }}
            >
              {word}
            </motion.div>
          ))}
        </div>

        {/* Sub text */}
        <motion.p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(11px, 1.4vw, 17px)",
            color: "rgba(255,255,255,0.55)",
            maxWidth: "30vw",
            lineHeight: 1.5,
            marginTop: "2vh"
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          Share your world. Mint your moments.<br />Every post is a potential NFT.
        </motion.p>

        {/* NFT badge */}
        <motion.div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6em",
            marginTop: "2.5vh",
            background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(233,30,140,0.2))",
            border: "1px solid rgba(245,158,11,0.5)",
            borderRadius: "100px",
            padding: "0.5em 1.4em",
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(10px, 1.1vw, 14px)",
            color: "#f59e0b"
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={phase >= 4 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span>⬡</span> NFT Minting Built In
        </motion.div>
      </div>
    </motion.div>
  );
}
