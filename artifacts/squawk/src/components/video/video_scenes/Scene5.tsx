import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import img1 from "@assets/image_1779535208719.png";
import img2 from "@assets/image_1779537958506.png";

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600), // First message
      setTimeout(() => setPhase(3), 1200), // Typing indicator
      setTimeout(() => setPhase(4), 2200), // Second message replies
      setTimeout(() => setPhase(5), 3300),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: '100vw' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute top-[10vh] right-[5vw] z-30 text-right">
        <motion.h2 
          className="text-[8vw] font-black text-transparent bg-clip-text bg-gradient-to-l from-purple-500 to-pink-500 uppercase leading-none"
          style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          initial={{ opacity: 0, x: 50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 0.5 }}
        >
          DMs & CALLS
        </motion.h2>
        <motion.p
           initial={{ opacity: 0 }}
           animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
           className="text-[2vw] text-white/80 font-medium"
        >
           Real-time connection.
        </motion.p>
      </div>

      {/* Chat UI Mockup */}
      <motion.div 
        className="relative w-[50vw] h-[60vh] bg-[#1a0b2e]/90 border border-purple-500/30 rounded-[2vw] shadow-[0_0_80px_rgba(168,85,247,0.3)] backdrop-blur-xl overflow-hidden mt-[10vh] -ml-[20vw]"
        initial={{ y: '50vh', opacity: 0, rotate: -5 }}
        animate={phase >= 1 ? { y: 0, opacity: 1, rotate: 0 } : { y: '50vh', opacity: 0, rotate: -5 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        {/* Header */}
        <div className="h-[8vh] border-b border-white/10 flex items-center justify-between px-[2vw] bg-black/40">
          <div className="flex items-center gap-[1vw]">
            <div className="w-[3vw] h-[3vw] rounded-full overflow-hidden">
               <img src={img1} className="w-full h-full object-cover" alt="" />
            </div>
            <div>
              <p className="font-bold text-[1.4vw] text-white">Squad Boss</p>
              <p className="text-[1vw] text-green-400">Online</p>
            </div>
          </div>
          {/* Call Icons */}
          <div className="flex gap-[1vw]">
            <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-white/10 flex items-center justify-center text-[1.2vw]">📞</div>
            <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/50 text-[1.2vw]">📹</div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="p-[2vw] flex flex-col gap-[2vw]">
          
          {/* Incoming Message */}
          <motion.div 
            className="flex items-end gap-[1vw]"
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={phase >= 2 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="w-[2.5vw] h-[2.5vw] rounded-full overflow-hidden shrink-0">
               <img src={img1} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="bg-white/10 text-white p-[1.5vw] rounded-[1.5vw] rounded-bl-none max-w-[70%]">
              <p className="text-[1.4vw]">Yoo, did you see the floor price just sweep past 3 MONAD? 🤯</p>
            </div>
          </motion.div>

          {/* Typing Indicator */}
          <AnimatePresence>
            {phase >= 3 && phase < 4 && (
              <motion.div 
                className="flex items-end gap-[1vw] self-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <div className="bg-pink-600/50 text-white p-[1.2vw] rounded-[1.5vw] rounded-br-none flex items-center gap-[0.5vw]">
                  <motion.div className="w-[0.6vw] h-[0.6vw] bg-white rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-[0.6vw] h-[0.6vw] bg-white rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.div className="w-[0.6vw] h-[0.6vw] bg-white rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Outgoing Message */}
          <motion.div 
            className="flex items-end gap-[1vw] self-end"
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={phase >= 4 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-[1.5vw] rounded-[1.5vw] rounded-br-none max-w-[80%] shadow-lg">
              <p className="text-[1.4vw]">Insane. I'm holding mine forever. Diamond wings. 💎🦅</p>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </motion.div>
  );
}