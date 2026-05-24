import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 1100),
      setTimeout(() => setPhase(4), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const traits = ["Your Identity", "Your Collection", "On-Chain"];

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.4 } }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, #1a0630 0%, #0d0618 60%, #0a0418 100%)" }} />

      {/* Gold shimmer orbs */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: "45vw", height: "45vw", background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)", top: "10vh", right: "-5vw" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ width: "30vw", height: "30vw", background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", bottom: "5vh", left: "5vw" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Community art as NFT card */}
      <motion.div
        className="absolute"
        style={{
          right: "6vw",
          top: "50%",
          transform: "translateY(-50%)",
          perspective: "1000px"
        }}
        initial={{ rotateY: -35, x: "20vw", opacity: 0 }}
        animate={phase >= 2 ? { rotateY: 6, x: 0, opacity: 1 } : { rotateY: -35, x: "20vw", opacity: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 16 }}
      >
        <div style={{ position: "relative", width: "28vw" }}>
          <img
            src={`${BASE}assets/community2.jpg`}
            style={{
              width: "100%",
              borderRadius: "20px",
              border: "2px solid rgba(245,158,11,0.5)",
              boxShadow: "0 0 80px rgba(245,158,11,0.25), 0 0 30px rgba(139,92,246,0.3)"
            }}
          />
          {/* NFT tag */}
          <motion.div
            style={{
              position: "absolute",
              bottom: "-2vh",
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #f59e0b, #e91e8c)",
              borderRadius: "100px",
              padding: "0.5em 1.8em",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(14px, 1.8vw, 22px)",
              color: "#fff",
              letterSpacing: "0.1em",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 20px rgba(245,158,11,0.4)"
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 3 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.2 }}
          >
            Monad NFT
          </motion.div>
        </div>
      </motion.div>

      {/* Left text content */}
      <div className="absolute left-[6vw] top-[50%]" style={{ transform: "translateY(-50%)" }}>
        <motion.div
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(10px, 1.2vw, 14px)", color: "#f59e0b", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "2vh" }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          ◆ Profiles & NFTs
        </motion.div>

        {traits.map((t, i) => (
          <motion.div
            key={t}
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: i === 2 ? "clamp(42px, 8.5vw, 105px)" : "clamp(38px, 7.5vw, 92px)",
              lineHeight: 0.9,
              color: i === 2 ? "#f59e0b" : "#fff",
              letterSpacing: "-0.01em",
              textShadow: i === 2 ? "0 0 40px rgba(245,158,11,0.6)" : "none"
            }}
            initial={{ x: -60, opacity: 0 }}
            animate={phase >= 2 ? { x: 0, opacity: 1 } : { x: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: phase >= 2 ? i * 0.1 : 0 }}
          >
            {t}{i < 2 ? "." : ""}
          </motion.div>
        ))}

        <motion.p
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(11px, 1.3vw, 16px)", color: "rgba(255,255,255,0.5)", maxWidth: "26vw", lineHeight: 1.55, marginTop: "2.5vh" }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          Build your profile. Showcase your NFTs.<br />Follow the squad. Own your presence.
        </motion.p>
      </div>
    </motion.div>
  );
}
