import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => setPhase(5), 5500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, scale: 1.5, rotate: 5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, x: '-100vw' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-[85vw] h-[80vh] items-center justify-between">
        <div className="w-1/2 flex flex-col justify-center gap-[3vh] relative z-20">
          <motion.div className="overflow-hidden">
            <motion.h2 
              className="text-[9vw] font-bold text-white uppercase leading-none tracking-tight drop-shadow-2xl"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              initial={{ y: '100%' }}
              animate={phase >= 1 ? { y: '0%' } : { y: '100%' }}
              transition={{ duration: 0.8 }}
            >
              CONNECT IN
            </motion.h2>
            <motion.h2 
              className="text-[9vw] font-bold text-[#00b4ff] uppercase leading-none tracking-tight drop-shadow-[0_0_20px_rgba(0,180,255,0.6)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              initial={{ y: '100%' }}
              animate={phase >= 2 ? { y: '0%' } : { y: '100%' }}
              transition={{ duration: 0.8 }}
            >
              REAL TIME
            </motion.h2>
          </motion.div>
        </div>

        <div className="w-1/2 relative z-20 flex flex-col gap-[3vh] px-[4vw]">
          {/* Chat Bubble 1 */}
          <motion.div
            className="self-start bg-[#1a0b38] border border-[#7c3aed]/50 text-white p-[2vw] rounded-2xl rounded-tl-none max-w-[80%] shadow-[0_10px_30px_rgba(124,58,237,0.2)]"
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={phase >= 3 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -50, scale: 0.8 }}
            transition={{ type: 'spring', bounce: 0.4 }}
          >
            <p className="text-[1.8vw] font-medium">yo squad, calling in now 📞</p>
          </motion.div>

          {/* Chat Bubble 2 */}
          <motion.div
            className="self-end bg-gradient-to-r from-[#ff2d92] to-[#dc143c] text-white p-[2vw] rounded-2xl rounded-tr-none max-w-[80%] shadow-[0_10px_30px_rgba(255,45,146,0.3)]"
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={phase >= 4 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 50, scale: 0.8 }}
            transition={{ type: 'spring', bounce: 0.4 }}
          >
            <p className="text-[1.8vw] font-bold">LFG!!! 🚀</p>
          </motion.div>

          {/* Call UI mockup */}
          <motion.div
            className="self-center w-full mt-[4vh] bg-black/60 backdrop-blur-md rounded-full p-[1vw] flex items-center justify-between border border-white/10"
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex gap-[1vw] px-[2vw]">
              <div className="w-[3vw] h-[3vw] rounded-full bg-green-500/20 flex items-center justify-center border border-green-500">
                <div className="w-[1.5vw] h-[1.5vw] rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-white font-bold text-[1vw]">VOICE ACTIVE</span>
                <span className="text-white/50 text-[0.8vw]">4 in room</span>
              </div>
            </div>
            <div className="w-[4vw] h-[4vw] rounded-full bg-red-500 flex items-center justify-center mr-[1vw]">
               <span className="text-white font-bold text-[1.5vw]">X</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}