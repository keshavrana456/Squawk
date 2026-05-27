import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import introBg from "@assets/intro_bg_1779878199011.png";

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: phase >= 1 ? 0.6 : 0, scale: 1 }}
        transition={{ duration: 3, ease: 'easeOut' }}
      >
        <img src={introBg} className="w-full h-full object-cover mix-blend-luminosity" alt="Intro Background" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </motion.div>

      <div className="relative z-20 flex flex-col items-center text-center">
        <motion.div className="overflow-hidden">
          <motion.h1
            className="text-[6vw] text-white tracking-widest uppercase leading-none shadow-black drop-shadow-2xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            initial={{ y: '100%', opacity: 0 }}
            animate={phase >= 1 ? { y: '0%', opacity: 1 } : { y: '100%', opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            Built for Monad Culture
          </motion.h1>
        </motion.div>

        <motion.div className="overflow-hidden mt-4">
          <motion.h2
            className="text-[3vw] text-cyan-400 tracking-wider uppercase font-semibold"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            initial={{ y: '-100%', opacity: 0 }}
            animate={phase >= 2 ? { y: '0%', opacity: 1 } : { y: '-100%', opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            The Social Ecosystem of Monad
          </motion.h2>
        </motion.div>
      </div>
    </motion.div>
  );
}
