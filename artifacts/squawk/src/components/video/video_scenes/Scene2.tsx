import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import nft1 from "@assets/image_1779877992328.png";
import nft2 from "@assets/image_1779878042161.png";
import nft3 from "@assets/image_1779878054078.png";
import nft4 from "@assets/image_1779878087667.png";
import nft5 from "@assets/image_1779878100535.png";

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const nfts = [nft1, nft2, nft3, nft4, nft5];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.2 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 perspective-[1000px] flex items-center justify-center">
        {nfts.map((nft, i) => {
          const offset = i - 2;
          return (
            <motion.div
              key={i}
              className="absolute w-[20vw] h-[20vw] rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(236,72,153,0.4)]"
              initial={{ 
                x: `${offset * 30}vw`, 
                z: -500 + Math.abs(offset) * 100, 
                rotateY: offset * -15,
                opacity: 0,
                y: 100
              }}
              animate={phase >= 1 ? {
                x: `${offset * 22}vw`,
                z: -300 + Math.abs(offset) * -100,
                rotateY: offset * -25,
                opacity: 1,
                y: 0,
              } : {}}
              transition={{
                duration: 1.5,
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.1
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <img src={nft} className="w-full h-full object-cover" alt={`NFT ${i+1}`} />
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-pink-500/50">
                <span className="text-pink-400 text-[0.8vw] font-bold uppercase tracking-wider">Rare Mint</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="absolute bottom-[15vh] z-30"
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 1, type: 'spring' }}
      >
        <h2 className="text-[5vw] text-white tracking-widest uppercase drop-shadow-lg" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          Home of the <span className="text-pink-500">10K Squad</span>
        </h2>
      </motion.div>
    </motion.div>
  );
}
