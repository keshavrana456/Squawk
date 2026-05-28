import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import nft1 from "@assets/image_1780004688839.png";
import nft2 from "@assets/image_1780004697327.png";
import nft3 from "@assets/image_1780004704530.png";
import nft4 from "@assets/image_1780004711858.png";
import nft5 from "@assets/image_1780004718820.png";

const NFTS = [nft1, nft2, nft3, nft4, nft5];

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 6000),
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
              className="absolute w-[30vw] h-[30vw] rounded-3xl overflow-hidden border-2 border-[#ff2d92]/40 shadow-[0_0_60px_rgba(255,45,146,0.4)] bg-[#0e0723]"
              initial={{ 
                x: `${offset * 50}vw`, 
                z: -1000 + Math.abs(offset) * 200, 
                rotateY: offset * -25,
                opacity: 0,
                y: 100
              }}
              animate={phase >= 1 ? {
                x: `${offset * 25}vw`,
                z: -400 + Math.abs(offset) * -150,
                rotateY: offset * -20,
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
              <img src={nft} className="w-full h-full object-cover" alt={`NFT ${i+1}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              
              {/* Holographic reflection effect */}
              <motion.div 
                className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)'
                }}
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
              />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="absolute bottom-[8vh] z-30 flex flex-col items-center"
        initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
        animate={phase >= 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 50, filter: 'blur(10px)' }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-[7vw] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d92] to-[#7c3aed] uppercase tracking-[0.05em] drop-shadow-[0_5px_15px_rgba(255,45,146,0.5)] leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          10K SQUAD NFTs
        </h2>
      </motion.div>
    </motion.div>
  );
}