import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(() => setPhase(5), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        clipPath: "circle(0% at 50% 50%)",
        transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] }
      }}
      transition={{ duration: 0.5 }}
    >
      {/* Party video background */}
      <video
        src={`${BASE}assets/party.mp4`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.2) saturate(2) hue-rotate(270deg)" }}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Radial glow overlay */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(233,30,140,0.25) 0%, rgba(13,6,24,0.9) 70%)" }} />

      {/* Rotating ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "70vh",
          height: "70vh",
          border: "1px solid rgba(233,30,140,0.25)",
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%"
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "55vh",
          height: "55vh",
          border: "1px solid rgba(139,92,246,0.2)",
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%"
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* Squad characters on sides */}
      <motion.img
        src={`${BASE}assets/squad-intro.png`}
        className="absolute object-contain"
        style={{ height: "60vh", left: "-4vw", bottom: 0, filter: "drop-shadow(0 0 20px rgba(233,30,140,0.4))", opacity: 0.7 }}
        initial={{ x: "-15vw", opacity: 0 }}
        animate={phase >= 2 ? { x: 0, opacity: 0.7 } : { x: "-15vw", opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 18 }}
      />
      <motion.img
        src={`${BASE}assets/main-body.png`}
        className="absolute object-contain"
        style={{ height: "55vh", right: "-2vw", bottom: 0, filter: "drop-shadow(0 0 20px rgba(139,92,246,0.4))", opacity: 0.65 }}
        initial={{ x: "15vw", opacity: 0 }}
        animate={phase >= 2 ? { x: 0, opacity: 0.65 } : { x: "15vw", opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.1 }}
      />

      {/* Center logo + text */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.img
          src={`${BASE}assets/logo.png`}
          style={{ height: "clamp(40px, 8vh, 80px)", marginBottom: "2vh", filter: "drop-shadow(0 0 20px rgba(233,30,140,0.6))" }}
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, rotate: -30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 18 }}
        />

        <motion.div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(55px, 13vw, 160px)",
            lineHeight: 0.85,
            color: "#fff",
            letterSpacing: "-0.02em",
            textShadow: "0 0 80px rgba(233,30,140,0.6)"
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
        >
          SQUAWK
        </motion.div>

        <motion.div
          style={{
            height: "2px",
            background: "linear-gradient(90deg, transparent, #e91e8c, #8b5cf6, transparent)",
            width: "40vw",
            margin: "1.5vh 0"
          }}
          initial={{ scaleX: 0 }}
          animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />

        <motion.p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(12px, 1.8vw, 22px)",
            color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.2em",
            textTransform: "uppercase"
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6 }}
        >
          Join the Squad
        </motion.p>

        <motion.div
          style={{
            marginTop: "3vh",
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(11px, 1.4vw, 17px)",
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.12em"
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          squawk.app
        </motion.div>

        {/* Glow pulse on the logo text */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(233,30,140,0.15) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
