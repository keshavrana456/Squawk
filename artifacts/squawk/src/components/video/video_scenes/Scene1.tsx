import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, filter: 'blur(10px) brightness(2)' }}
      animate={{ opacity: 1, filter: 'blur(0px) brightness(1)' }}
      exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px) brightness(0.5)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Scanline overlay */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none opacity-10 mix-blend-overlay"
        animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
        transition={{ duration: 0.15, repeat: Infinity, repeatType: 'reverse' }}
        style={{
          backgroundImage: 'linear-gradient(transparent 50%, rgba(255,255,255,0.6) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Center content */}
      <div className="relative z-20 flex flex-col items-center">
        {/* SQUAWK — baby pink gradient, no logo */}
        <div className="relative">
          <motion.h1
            className="text-[13vw] font-bold uppercase tracking-[0.15em] leading-none"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              background: 'linear-gradient(135deg, #ffb3d4 0%, #ff6ab2 35%, #ff2d92 60%, #ff8ec7 85%, #ffd6ea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            initial={{ opacity: 0, y: 60, filter: 'blur(12px)' }}
            animate={phase >= 1 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 60, filter: 'blur(12px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            SQUAWK
          </motion.h1>

          {/* Chromatic aberration glitch layers */}
          {phase >= 1 && phase < 3 && (
            <>
              <motion.h1
                className="absolute top-0 left-[4px] text-[13vw] font-bold text-red-400 uppercase tracking-[0.15em] leading-none mix-blend-screen pointer-events-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                animate={{ x: [0, -6, 4, -2, 0], opacity: [0, 0.7, 0.1, 0.8, 0] }}
                transition={{ duration: 0.35, repeat: Infinity, repeatType: 'mirror', repeatDelay: 1.8 }}
              >
                SQUAWK
              </motion.h1>
              <motion.h1
                className="absolute top-0 -left-[4px] text-[13vw] font-bold text-cyan-400 uppercase tracking-[0.15em] leading-none mix-blend-screen pointer-events-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                animate={{ x: [0, 6, -4, 2, 0], opacity: [0, 0.7, 0.1, 0.8, 0] }}
                transition={{ duration: 0.35, repeat: Infinity, repeatType: 'mirror', repeatDelay: 1.8, delay: 0.08 }}
              >
                SQUAWK
              </motion.h1>
            </>
          )}
        </div>

        {/* Tagline text */}
        <motion.p
          className="text-[2.2vw] text-white/60 mt-[2vh] tracking-[0.4em] uppercase font-light text-center"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          THE INTERNET MOVES FAST
        </motion.p>
        <motion.p
          className="text-[2.2vw] text-[#ff2d92] mt-[0.5vh] tracking-[0.4em] uppercase font-bold text-center"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        >
          CULTURE MOVES FASTER
        </motion.p>
      </div>

      {/* Bottom subheading */}
      <motion.div
        className="absolute bottom-[6vh] left-0 right-0 flex justify-center z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <p
          className="text-[1.6vw] tracking-[0.35em] uppercase text-white/45 font-medium text-center"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          SOCIAL HOME FOR 10K SQUAD COMMUNITY
        </p>
      </motion.div>
    </motion.div>
  );
}
