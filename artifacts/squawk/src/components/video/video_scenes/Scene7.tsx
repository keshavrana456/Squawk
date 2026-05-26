import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import nftBird1 from "@assets/nff4drvstf8ttxj4ogjy_1779544045621.jpg";
import nftBird2 from "@assets/nff4drvstf8ttxj4ogjy_1779543899848.jpg";

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2500),
      setTimeout(() => setPhase(5), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)' }}
      animate={{ opacity: 1, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#fbbf24]/20 via-black to-black z-0"></div>

      {/* Hero Title */}
      <motion.div
        className="absolute top-[8vh] z-30 flex flex-col items-center"
        initial={{ y: -50, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 }}
      >
        <h2 className="text-[6vw] font-black text-[#fbbf24] leading-none tracking-widest uppercase shadow-black drop-shadow-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          10K SQUAD NFTs
        </h2>
        <p className="text-[2vw] text-white/80 font-bold tracking-widest">LIVE ON MONAD</p>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        className="absolute top-[25vh] z-20 flex gap-[4vw] bg-black/60 border border-[#fbbf24]/30 px-[4vw] py-[1vw] rounded-full backdrop-blur-md"
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 150 }}
      >
         <div className="text-center">
            <p className="text-[1vw] text-[#fbbf24] uppercase">Floor</p>
            <p className="text-[2.5vw] font-bold text-white">4.2 MON</p>
         </div>
         <div className="w-px bg-white/20"></div>
         <div className="text-center">
            <p className="text-[1vw] text-[#fbbf24] uppercase">Vol</p>
            <p className="text-[2.5vw] font-bold text-white">128K MON</p>
         </div>
         <div className="w-px bg-white/20"></div>
         <div className="text-center">
            <p className="text-[1vw] text-[#fbbf24] uppercase">Holders</p>
            <p className="text-[2.5vw] font-bold text-white">4,892</p>
         </div>
      </motion.div>

      {/* 3D Rotating NFT Cards */}
      <div className="absolute top-[45vh] w-full flex justify-center gap-[5vw] perspective-1000 z-20">
        <motion.div
          className="w-[25vw] aspect-square rounded-[2vw] border-4 border-[#fbbf24] shadow-[0_0_50px_rgba(251,191,36,0.4)] overflow-hidden relative bg-black"
          initial={{ rotateY: -90, x: -100, opacity: 0 }}
          animate={phase >= 3 ? { rotateY: 15, x: 0, opacity: 1 } : { rotateY: -90, x: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <img src={nftBird1} className="w-full h-full object-cover" alt="" />
          <div className="absolute bottom-0 w-full bg-black/80 backdrop-blur p-[1vw] flex justify-between items-center">
             <span className="font-bold text-[1.5vw] text-white">#8842</span>
             <span className="text-[#fbbf24] font-bold text-[1.2vw]">Rank 12</span>
          </div>
        </motion.div>

        <motion.div
          className="w-[25vw] aspect-square rounded-[2vw] border-4 border-[#fbbf24] shadow-[0_0_50px_rgba(251,191,36,0.4)] overflow-hidden relative bg-black"
          initial={{ rotateY: 90, x: 100, opacity: 0 }}
          animate={phase >= 3 ? { rotateY: -15, x: 0, opacity: 1 } : { rotateY: 90, x: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.2 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <img src={nftBird2} className="w-full h-full object-cover" alt="" />
          <div className="absolute bottom-0 w-full bg-black/80 backdrop-blur p-[1vw] flex justify-between items-center">
             <span className="font-bold text-[1.5vw] text-white">#2104</span>
             <span className="text-[#fbbf24] font-bold text-[1.2vw]">Rank 89</span>
          </div>
        </motion.div>
      </div>

      {/* Mint Particle Explosion */}
      {phase >= 4 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
           {[...Array(20)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute w-[2vw] h-[2vw] bg-[#fbbf24] clip-polygon-star"
               style={{
                 clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
               }}
               initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
               animate={{ 
                 scale: [0, 1.5, 0],
                 x: Math.cos(i * 18 * Math.PI / 180) * 600,
                 y: Math.sin(i * 18 * Math.PI / 180) * 600,
                 rotate: 360
               }}
               transition={{ duration: 1.5, ease: "easeOut" }}
             />
           ))}
        </div>
      )}

    </motion.div>
  );
}