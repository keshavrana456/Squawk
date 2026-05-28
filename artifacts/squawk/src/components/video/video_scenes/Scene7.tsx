import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import contestImg from "@assets/image_1780004787902.png";

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(30px)', scale: 1.5 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center w-full h-full z-20 justify-center">
        
        <motion.div
          className="mb-[6vh] text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-[7vw] font-bold text-white uppercase tracking-widest drop-shadow-[0_5px_15px_rgba(220,20,60,0.6)]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            LIVE CONTEST <span className="text-[#dc143c]">TRACKING</span>
          </h2>
        </motion.div>

        <motion.div
          className="w-[70vw] h-[25vw] rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(220,20,60,0.4)] border-4 border-[#dc143c]/50 relative"
          initial={{ rotateX: 90, opacity: 0, y: 50 }}
          animate={phase >= 1 ? { rotateX: 0, opacity: 1, y: 0 } : { rotateX: 90, opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
          style={{ transformStyle: 'preserve-3d', perspective: 1200 }}
        >
          <img src={contestImg} className="w-full h-full object-cover" alt="Contest Banner" />
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        <motion.div
          className="mt-[6vh] bg-[#dc143c]/20 border border-[#dc143c] px-[4vw] py-[2vh] rounded-full backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <h3 className="text-[3vw] font-bold text-white uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            WIN EXCLUSIVE NFT REWARDS
          </h3>
        </motion.div>
      </div>
    </motion.div>
  );
}