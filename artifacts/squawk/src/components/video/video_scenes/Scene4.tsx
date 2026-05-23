import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import birdImg from "@assets/MAIN_BODY_1779543929049.png";

const CHIRPS = [
  "@pinkbird_nft just minted for 2.4 ETH 🔥 squad stays winning",
  "my 10K squad is my ride or die fr fr",
  "flow feed is INSANE today, someone call an ambulance",
  "#MonadSzn who's holding?"
];

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2 
        className="absolute top-[8vh] text-[8vw] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50"
        style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        Chirp what's real.
      </motion.h2>

      <div className="w-[60vw] max-w-4xl mt-[10vh] flex flex-col gap-[2vw]">
        {CHIRPS.map((chirp, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-[2vw] bg-[#a855f7]/10 border border-[#a855f7]/30 p-[2vw] rounded-2xl backdrop-blur-md"
            initial={{ opacity: 0, x: -100, rotateX: 45 }}
            animate={phase >= 2 ? { opacity: 1, x: 0, rotateX: 0 } : { opacity: 0, x: -100, rotateX: 45 }}
            transition={{ type: 'spring', stiffness: 100, damping: 12, delay: i * 0.3 }}
          >
            <motion.div 
              className="w-[4vw] h-[4vw] bg-[#f472b6] rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
              animate={phase >= 2 ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5, delay: i * 0.3 + 0.2 }}
            >
              <img src={birdImg} alt="" className="w-[150%] h-[150%] object-cover -translate-y-2" />
            </motion.div>
            <p className="text-[2vw] font-medium text-white/90">
              {chirp.split(' ').map((word, j) => (
                <span key={j} className={word.startsWith('#') || word.startsWith('@') ? "text-[#f472b6]" : ""}>
                  {word}{" "}
                </span>
              ))}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}