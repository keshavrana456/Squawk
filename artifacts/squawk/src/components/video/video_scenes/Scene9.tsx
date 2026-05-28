import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene9() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5500), // Hold
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(30px)' }}
      transition={{ duration: 1.5 }}
    >
      {/* Intense Background Glow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-0"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <div className="w-[80vw] h-[80vw] bg-[#ff2d92]/20 rounded-full blur-[120px] mix-blend-screen" />
      </motion.div>

      <motion.div className="relative z-20 flex flex-col items-center justify-center">
        
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
          transition={{ duration: 1 }}
          className="mb-[4vh]"
        >
          <h2 className="text-[3vw] font-bold text-white uppercase tracking-[0.3em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            SOCIAL HOME FOR 10K SQUAD
          </h2>
        </motion.div>

        <motion.div 
          className="overflow-hidden flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <img src={`${import.meta.env.BASE_URL}logo.png`} className="w-[20vw] h-auto object-contain mb-[2vh]" alt="Squawk" />
        </motion.div>

        <motion.div className="overflow-hidden mt-[4vh]">
          <motion.p
            className="text-[4vw] text-[#00b4ff] font-bold uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(0,180,255,0.5)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            initial={{ y: '100%', opacity: 0 }}
            animate={phase >= 3 ? { y: '0%', opacity: 1 } : { y: '100%', opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            Culture at light speed.
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Floating particles specific to outro */}
      {phase >= 1 && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 6 + 2 + 'px',
                height: Math.random() * 6 + 2 + 'px',
                left: '50%',
                top: '50%',
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: (Math.random() - 0.5) * window.innerHeight * 1.5,
                scale: Math.random() * 2,
                opacity: 0,
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                ease: "easeOut",
                repeat: Infinity
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}