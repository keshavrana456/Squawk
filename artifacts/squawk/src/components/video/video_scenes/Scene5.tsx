import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import nftBird from "@assets/nff4drvstf8ttxj4ogjy_1779544045621.jpg";

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000), // Mint animation starts
      setTimeout(() => setPhase(3), 3500), // Text appears
      setTimeout(() => setPhase(4), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: '-100vw' }}
      transition={{ duration: 0.8 }}
    >
      <div className="relative flex items-center justify-center w-full h-[60vh]">
        {/* NFT Card */}
        <motion.div
          className="relative w-[30vw] aspect-square rounded-[2vw] overflow-hidden bg-black shadow-2xl"
          initial={{ y: '50vh', rotateY: 45, scale: 0.5, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, rotateY: 0, scale: 1, opacity: 1 } : { y: '50vh', rotateY: 45, scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <img src={nftBird} alt="NFT" className="w-full h-full object-cover" />
          
          {/* Minting overlay / Golden Border */}
          <motion.div 
            className="absolute inset-0 border-[1vw] border-[#fbbf24] rounded-[2vw] pointer-events-none"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Info bar */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-[2vw] flex justify-between items-center"
            initial={{ y: '100%' }}
            animate={phase >= 1 ? { y: 0 } : { y: '100%' }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <div>
              <p className="text-[1.2vw] text-white/60 font-bold uppercase tracking-widest">10K Squad</p>
              <p className="text-[2vw] font-bold text-white">#4832</p>
            </div>
            <div className="text-right">
              <p className="text-[1.2vw] text-[#fbbf24] font-bold uppercase tracking-widest">Price</p>
              <p className="text-[2vw] font-bold text-white">2.4 MONAD</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Sparkles / Mint burst */}
        {phase >= 2 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-[1vw] h-[1vw] bg-[#fbbf24] rounded-full"
                initial={{ x: 0, y: 0, scale: 0 }}
                animate={{ 
                  x: Math.cos(i * 30 * Math.PI / 180) * 300, 
                  y: Math.sin(i * 30 * Math.PI / 180) * 300,
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            ))}
          </div>
        )}
      </div>

      <motion.div
        className="mt-[5vh] text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-[6vw] font-bold text-white leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Own your moment.
        </h2>
        <h2 className="text-[6vw] font-bold text-[#fbbf24] leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Mint on Monad.
        </h2>
      </motion.div>

    </motion.div>
  );
}