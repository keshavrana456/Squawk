import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const CHIRPS = [
  { user: "@monad_degen", text: "Monad season is loading.", likes: "4.2K", time: "1m" },
  { user: "@squad_alpha", text: "10K Squad going insane tonight.", likes: "12.8K", time: "3m" },
  { user: "@nft_whale", text: "Rare mint spotted.", likes: "8.9K", time: "5m" }
];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, x: -100, filter: 'blur(20px) hue-rotate(90deg)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px) hue-rotate(0deg)' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="flex w-[80vw] h-full items-center gap-[5vw]">
        {/* Left side text */}
        <div className="w-1/2 relative z-20">
          <motion.div className="overflow-hidden">
            <motion.h2 
              className="text-[8vw] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wider uppercase"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              initial={{ y: '100%' }}
              animate={phase >= 1 ? { y: '0%' } : { y: '100%' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              LIVE FEED
            </motion.h2>
          </motion.div>
        </div>

        {/* Right side chirp cards */}
        <div className="w-1/2 flex flex-col gap-[2vh] relative z-20">
          {CHIRPS.map((chirp, i) => (
            <motion.div
              key={i}
              className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 p-[2vw] rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)]"
              initial={{ opacity: 0, x: 100, rotateX: 45 }}
              animate={phase >= i + 2 ? { opacity: 1, x: 0, rotateX: 0 } : { opacity: 0, x: 100, rotateX: 45 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            >
              <div className="flex justify-between items-center mb-[1vh]">
                <span className="text-cyan-400 font-bold text-[1.2vw]">{chirp.user}</span>
                <span className="text-white/40 text-[1vw]">{chirp.time}</span>
              </div>
              <p className="text-white text-[1.8vw] font-medium leading-tight mb-[1.5vh]">
                {chirp.text}
              </p>
              <div className="flex gap-[1vw] items-center text-white/60">
                <span className="text-[1.2vw]">❤️</span>
                <span className="text-[1.2vw] font-bold">{chirp.likes}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
