import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import birdImg from "@assets/MAIN_BODY_1779543929049.png";
import introBg from "@assets/intro_bg_1779543965947.png";

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Chaotic Background */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.5, opacity: 0, rotate: 10 }}
        animate={{ scale: 1, opacity: 0.4, rotate: 0 }}
        transition={{ duration: 5, ease: "easeOut" }}
      >
        <img src={introBg} alt="" className="w-full h-full object-cover" />
      </motion.div>

      {/* Main Mascot */}
      <motion.div
        className="absolute z-20 flex items-center justify-center"
        initial={{ y: '100vh', scale: 0.5 }}
        animate={phase >= 1 ? { y: 0, scale: 1.2 } : { y: '100vh', scale: 0.5 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      >
        <img src={birdImg} alt="Mascot" className="h-[70vh] object-contain drop-shadow-[0_0_50px_rgba(244,114,182,1)]" />
      </motion.div>

      {/* Giant Kinetic Type */}
      <motion.h1 
        className="absolute z-30 text-[25vw] font-black text-white/90 mix-blend-overlay"
        style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        initial={{ scale: 4, opacity: 0 }}
        animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 4, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        SQUAWK
      </motion.h1>

      <motion.h1 
        className="absolute z-10 text-[25vw] font-black text-transparent -webkit-text-stroke-2 stroke-[#f472b6]"
        style={{ WebkitTextStroke: '2px #f472b6', fontFamily: 'Bebas Neue, sans-serif' }}
        initial={{ scale: 4, opacity: 0 }}
        animate={phase >= 2 ? { scale: 1.05, opacity: 0.5 } : { scale: 4, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.1 }}
      >
        SQUAWK
      </motion.h1>

      {/* Tagline */}
      <motion.div
        className="absolute bottom-[15vh] z-40 bg-black/50 backdrop-blur-md px-[4vw] py-[2vw] rounded-full border border-[#f472b6]/50"
        initial={{ y: 50, opacity: 0 }}
        animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-[3vw] font-bold text-white tracking-widest uppercase">
          Join the Squad. Live the Feed.
        </p>
      </motion.div>

      {/* Pulse overlay */}
      {phase >= 2 && (
        <motion.div 
          className="absolute inset-0 bg-[#f472b6] mix-blend-screen pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}