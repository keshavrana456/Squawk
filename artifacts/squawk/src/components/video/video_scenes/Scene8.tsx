import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import squadLogo from "@assets/my_talking_squad_png_for_intro_1779543965946.png";

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Giant Background Text Sweep */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none mix-blend-screen opacity-20"
        initial={{ scale: 2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 4, ease: "easeOut" }}
      >
         <h1 className="text-[40vw] font-black text-[#f472b6] leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
           SQUAD
         </h1>
      </motion.div>

      {/* Main Logo */}
      <motion.div
        className="relative z-20 w-[45vw] max-w-2xl mb-[8vh]"
        initial={{ scale: 0, rotate: -20, opacity: 0 }}
        animate={phase >= 1 ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, rotate: -20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 15 }}
      >
        <img src={squadLogo} alt="My Talking Squad" className="w-full h-auto drop-shadow-[0_0_80px_rgba(236,72,153,0.8)]" />
      </motion.div>

      {/* Call to Action Text */}
      <motion.div
        className="relative z-30 flex flex-col items-center gap-[2vh]"
        initial={{ y: 50, opacity: 0 }}
        animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-[5vw] font-bold text-white uppercase tracking-[0.2em]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          JOIN THE GRID.
        </h2>
        <h2 className="text-[6vw] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#9333ea] uppercase tracking-[0.1em]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          BE THE SQUAD.
        </h2>
      </motion.div>

      {/* Fake Button (Visual Only) */}
      <motion.div
        className="relative z-40 mt-[8vh]"
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 3 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="bg-white text-black px-[4vw] py-[1.5vw] rounded-full font-bold text-[2vw] uppercase tracking-wider flex items-center gap-[1vw]">
           <span>ENTER APP</span>
           <span className="text-[1.5vw]">→</span>
        </div>
      </motion.div>

    </motion.div>
  );
}