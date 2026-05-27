import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2500),
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
      {/* Intense Background Glow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-0"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <div className="w-[80vw] h-[80vw] bg-pink-600/30 rounded-full blur-[100px] mix-blend-screen" />
      </motion.div>

      <motion.div className="relative z-20 flex flex-col items-center justify-center">
        <motion.div className="overflow-hidden">
          <motion.h1
            className="text-[18vw] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-pink-500 uppercase tracking-tighter leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            initial={{ y: '100%', rotateX: 90 }}
            animate={phase >= 1 ? { y: '0%', rotateX: 0 } : { y: '100%', rotateX: 90 }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          >
            SQUAWK
          </motion.h1>
        </motion.div>

        <motion.div className="overflow-hidden mt-[2vh]">
          <motion.p
            className="text-[3vw] text-cyan-400 font-bold uppercase tracking-[0.4em]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            initial={{ y: '-100%', opacity: 0 }}
            animate={phase >= 2 ? { y: '0%', opacity: 1 } : { y: '-100%', opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            Enter the Ecosystem
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Floating particles specific to outro */}
      {phase >= 1 && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                left: '50%',
                top: '50%',
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * window.innerWidth,
                y: (Math.random() - 0.5) * window.innerHeight,
                scale: Math.random() * 2,
                opacity: 0,
              }}
              transition={{
                duration: Math.random() * 2 + 1.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
