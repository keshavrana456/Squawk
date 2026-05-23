import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import birdImg from "@assets/MAIN_BODY_1779543929049.png";
import squadLogo from "@assets/my_talking_squad_png_for_intro_1779543965946.png";
import introBg from "@assets/intro_bg_1779543965947.png";

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      transition={{ duration: 0.8 }}
    >
      {/* Background sweep */}
      <motion.div 
        className="absolute inset-0"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: '-10%', opacity: 0.6 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <img src={introBg} alt="" className="w-full h-full object-cover" />
      </motion.div>

      <div className="absolute inset-0 bg-[#0a0010]/60"></div>

      <div className="relative z-20 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -15 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0, opacity: 0, rotate: -15 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative w-[40vw] max-w-xl"
        >
          <img src={squadLogo} alt="My Talking Squad" className="w-full h-auto drop-shadow-2xl" />
        </motion.div>

        <motion.div
          initial={{ y: '100vh', opacity: 0, scale: 0.5 }}
          animate={phase >= 2 ? { y: '5vh', opacity: 1, scale: 1 } : { y: '100vh', opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          className="absolute z-30"
        >
          <img src={birdImg} alt="Mascot" className="h-[60vh] object-contain drop-shadow-[0_20px_50px_rgba(244,114,182,0.5)]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={phase >= 3 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 20, filter: 'blur(10px)' }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-[-15vh] w-[80vw] text-center"
        >
          <p className="text-[3vw] font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] to-[#a855f7]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            A Living Ecosystem For Collectors, Traders & Creators
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}