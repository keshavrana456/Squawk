import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 8500),
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
      {/* Glitch lines */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-overlay"
        animate={{ 
          backgroundPosition: ['0% 0%', '0% 100%', '100% 0%', '100% 100%']
        }}
        transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse' }}
        style={{
          backgroundImage: 'linear-gradient(transparent 50%, rgba(255,255,255,0.5) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      <div className="relative z-20 flex flex-col items-center">
        <motion.div 
          className="w-[12vw] h-[12vw] mb-[4vh] relative"
          initial={{ opacity: 0, scale: 0, rotate: -45 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0, rotate: -45 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Squawk Logo" className="w-full h-full object-contain" />
          <motion.div 
            className="absolute inset-0 bg-[#f472b6] mix-blend-screen blur-[20px] -z-10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        <div className="relative">
          <motion.h1 
            className="text-[10vw] font-bold text-white uppercase tracking-[0.2em] leading-none"
            style={{ fontFamily: "'Syncopate', sans-serif" }}
            initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
            animate={phase >= 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 50, filter: 'blur(10px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            SQUAWK
          </motion.h1>
          
          {/* Chromatic aberration layers */}
          {phase >= 2 && phase < 4 && (
            <>
              <motion.h1 
                className="absolute top-0 left-[4px] text-[10vw] font-bold text-red-500 uppercase tracking-[0.2em] leading-none mix-blend-screen pointer-events-none"
                style={{ fontFamily: "'Syncopate', sans-serif" }}
                animate={{ x: [0, -5, 5, -2, 0], opacity: [0, 0.8, 0.2, 0.9, 0] }}
                transition={{ duration: 0.4, repeat: Infinity, repeatType: 'mirror', repeatDelay: 2 }}
              >
                SQUAWK
              </motion.h1>
              <motion.h1 
                className="absolute top-0 -left-[4px] text-[10vw] font-bold text-cyan-500 uppercase tracking-[0.2em] leading-none mix-blend-screen pointer-events-none"
                style={{ fontFamily: "'Syncopate', sans-serif" }}
                animate={{ x: [0, 5, -5, 2, 0], opacity: [0, 0.8, 0.2, 0.9, 0] }}
                transition={{ duration: 0.4, repeat: Infinity, repeatType: 'mirror', repeatDelay: 2, delay: 0.1 }}
              >
                SQUAWK
              </motion.h1>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
