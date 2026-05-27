import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const NFTS = [
  'nft-banner.png',
  'squad-nft-avatar.png',
  'squad-bot.jpg',
  'opengraph.jpg',
  'promo-bestie.png'
];

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 8000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: '-100vw', filter: 'blur(20px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 flex items-center justify-center perspective-[1200px] z-10">
        {NFTS.map((nft, i) => {
          const offset = i - 2;
          return (
            <motion.div
              key={i}
              className="absolute w-[30vw] h-[30vw] rounded-2xl overflow-hidden border-2 border-[#f472b6]/30 shadow-[0_0_50px_rgba(244,114,182,0.3)] bg-[#0e0723]"
              initial={{ 
                x: `${offset * 40}vw`, 
                z: -800 + Math.abs(offset) * 200, 
                rotateY: offset * -20,
                opacity: 0,
                y: 100
              }}
              animate={phase >= 1 ? {
                x: `${offset * 25}vw`,
                z: -400 + Math.abs(offset) * -150,
                rotateY: offset * -25,
                opacity: 1,
                y: 0,
              } : {}}
              transition={{
                duration: 2,
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.15
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <img src={`${import.meta.env.BASE_URL}${nft}`} className="w-full h-full object-cover" alt={`NFT ${i+1}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="absolute bottom-[10vh] z-30 flex flex-col items-center"
        initial={{ opacity: 0, y: 50 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-[6vw] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] to-[#8b5cf6] uppercase tracking-[0.1em] drop-shadow-2xl" style={{ fontFamily: "'Syncopate', sans-serif" }}>
          10K SQUAD NFTs
        </h2>
        <div className="flex gap-[2vw] mt-[2vh]">
          {["Exclusive.", "Rare.", "Yours."].map((word, i) => (
            <motion.span 
              key={i}
              className="text-[2vw] font-medium text-white/80 tracking-widest"
              initial={{ opacity: 0, x: -20 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.8, delay: 2 + i * 0.3 }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
