import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import birdImg from "@assets/MAIN_BODY_1779543929049.png";
import img1 from "@assets/image_1779535208719.png";
import img2 from "@assets/image_1779537958506.png";

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2500),
      setTimeout(() => setPhase(5), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: '-100vh', filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Title */}
      <motion.div
        className="absolute top-[10vh] left-[5vw] z-40"
        initial={{ x: -50, opacity: 0 }}
        animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-[8vw] font-bold text-white drop-shadow-lg uppercase leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          THE FEED
        </h2>
        <p className="text-[2vw] text-pink-400 font-bold tracking-widest uppercase">Stay connected.</p>
      </motion.div>

      <div className="relative w-full h-full flex items-center justify-center">
        {/* Story ring */}
        <motion.div 
          className="absolute top-[15vh] right-[10vw] w-[15vw] h-[15vw] rounded-full border-[0.4vw] border-pink-500 p-1 shadow-[0_0_40px_rgba(244,114,182,0.6)] z-20"
          initial={{ scale: 0, rotate: -90 }}
          animate={phase >= 2 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-purple-600">
            <img src={birdImg} className="w-full h-full object-cover scale-125 -translate-y-2" alt="" />
          </div>
          <div className="absolute -bottom-[2vw] left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[1vw] font-bold px-[1vw] py-[0.2vw] rounded-full">
            LIVE
          </div>
        </motion.div>

        {/* Floating Post Cards */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-[40vw] bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2vw] p-[1.5vw] shadow-2xl overflow-hidden"
            initial={{ y: '100vh', opacity: 0, rotate: i * 5 - 10, x: i * 50 - 50 }}
            animate={phase >= 3 ? { 
              y: `${(i - 1) * 10}vh`, 
              opacity: 1 - Math.abs(i - 1) * 0.3,
              rotate: i * 4 - 4,
              x: `${(i - 1) * 8}vw`,
              scale: i === 1 ? 1.1 : 0.85,
              zIndex: 30 - Math.abs(i - 1)
            } : { y: '100vh', opacity: 0, rotate: i * 5 - 10, x: i * 50 - 50 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15, delay: i * 0.2 }}
          >
            <div className="flex items-center justify-between mb-[1.5vw]">
               <div className="flex items-center gap-[1vw]">
                 <div className="w-[3.5vw] h-[3.5vw] rounded-full overflow-hidden border border-white/20">
                    <img src={i % 2 === 0 ? img1 : img2} className="w-full h-full object-cover" alt="" />
                 </div>
                 <div className="flex flex-col leading-tight">
                   <span className="font-bold text-[1.4vw] text-white">Squad Member #{i + 1}</span>
                   <span className="text-white/50 text-[1vw]">@squad_{i + 1}</span>
                 </div>
               </div>
               <span className="text-white/40 text-[1vw]">2h ago</span>
            </div>
            
            <div className="w-full aspect-[4/3] rounded-[1vw] overflow-hidden mb-[1vw] bg-purple-900/50">
               <img src={i % 2 === 0 ? img2 : img1} className="w-full h-full object-cover opacity-80" alt="" />
            </div>

            <p className="text-[1.4vw] mb-[1.5vw] text-white">Just vibing in the Monad ecosystem today. LFG! 🚀✨</p>
            
            {/* Interactions */}
            <div className="flex gap-[2vw] text-white/70 items-center">
              <motion.div 
                className="flex items-center gap-[0.5vw]"
                animate={phase >= 4 && i === 1 ? { color: '#f472b6', scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                <span className={`text-[1.8vw] ${phase >= 4 && i === 1 ? 'text-[#f472b6]' : ''}`}>❤️</span> 
                <span className={`text-[1.2vw] font-bold ${phase >= 4 && i === 1 ? 'text-[#f472b6]' : ''}`}>{(124 + i * 42).toString()}</span>
              </motion.div>
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[1.8vw]">💬</span> <span className="text-[1.2vw] font-bold">12</span>
              </div>
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[1.8vw]">🔗</span>
              </div>
            </div>

            {/* Exploding likes effect */}
            {phase >= 4 && i === 1 && (
              <motion.div className="absolute bottom-[2vw] left-[2vw] pointer-events-none">
                {[...Array(6)].map((_, j) => (
                  <motion.div
                    key={j}
                    className="absolute text-[2vw]"
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 150, 
                      y: -Math.random() * 150 - 50, 
                      scale: Math.random() * 1.5 + 0.5,
                      opacity: 0,
                      rotate: Math.random() * 90 - 45
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    ❤️
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}