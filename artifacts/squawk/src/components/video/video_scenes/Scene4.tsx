import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import partyVideo from "@assets/party_1780004743615.mp4";

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden bg-black"
      initial={{ opacity: 0, clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video src={partyVideo} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
      </div>

      {/* Left content — NO overflow-hidden wrapper, just opacity+y slide */}
      <div className="absolute left-[8vw] z-20 flex flex-col justify-center h-full gap-[2vh]">
        <motion.h2
          className="text-[14vw] font-bold text-white uppercase leading-[0.9] tracking-tighter"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          FLOWS
        </motion.h2>

        <motion.div
          className="max-w-[38vw] flex flex-col gap-[0.8vh]"
          initial={{ opacity: 0, x: -40 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <p className="text-[2.4vw] text-white/80 font-medium leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Infinite scroll.</p>
          <p className="text-[2.4vw] text-[#ff2d92] font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Infinite vibes.</p>
        </motion.div>
      </div>

      {/* Right — Reel UI icons */}
      <motion.div
        className="absolute right-[8vw] bottom-[12vh] flex flex-col gap-[3vh] items-center z-20"
        initial={{ opacity: 0, x: 50 }}
        animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        {['❤️', '💬', '↗️'].map((icon, i) => (
          <motion.div
            key={i}
            className="w-[5vw] h-[5vw] rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          >
            <span className="text-[2vw]">{icon}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
