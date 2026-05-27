import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import contestImg from "@assets/image_1779878393550.png";

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, scale: 1.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, x: '-100vw' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-[90vw] h-[80vh] items-center justify-between">
        <div className="w-1/2 relative z-20 flex justify-center">
          <motion.div
            className="w-[30vw] h-[40vw] rounded-2xl overflow-hidden border-4 border-[#06b6d4] shadow-[0_0_60px_rgba(6,182,212,0.5)]"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={phase >= 1 ? { rotateY: 10, opacity: 1 } : { rotateY: -90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
          >
            <img src={contestImg} className="w-full h-full object-cover" alt="Contest Poster" />
          </motion.div>
        </div>

        <div className="w-1/2 flex flex-col justify-center gap-[3vh] relative z-20 pl-[5vw]">
          <motion.div className="overflow-hidden">
            <motion.h2 
              className="text-[7vw] font-bold text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 uppercase leading-none tracking-widest"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              initial={{ y: '100%' }}
              animate={phase >= 2 ? { y: '0%' } : { y: '100%' }}
              transition={{ duration: 0.6 }}
            >
              Compete.<br/>Win.<br/>Dominate.
            </motion.h2>
          </motion.div>

          <motion.div
            className="flex gap-[2vw]"
            initial={{ opacity: 0, x: 50 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-black/60 border border-cyan-500/50 rounded-xl p-[1.5vw] text-center backdrop-blur-md w-[12vw]">
              <span className="text-[2.5vw] font-black text-cyan-400">10K</span>
              <p className="text-[1vw] text-white/60 uppercase tracking-widest mt-1">Prize Pool</p>
            </div>
            <div className="bg-black/60 border border-pink-500/50 rounded-xl p-[1.5vw] text-center backdrop-blur-md w-[12vw]">
              <span className="text-[2.5vw] font-black text-pink-400">24H</span>
              <p className="text-[1vw] text-white/60 uppercase tracking-widest mt-1">Remaining</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
