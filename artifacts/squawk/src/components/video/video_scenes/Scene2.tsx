import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import birdImg from "@assets/MAIN_BODY_1779543929049.png";
import { Heart, MessageCircle, Share2 } from 'lucide-react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2500),
      setTimeout(() => setPhase(5), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Title */}
      <motion.h2 
        className="absolute top-[10vh] left-[10vw] text-[6vw] font-bold text-white drop-shadow-lg"
        style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        initial={{ x: -50, opacity: 0 }}
        animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        THE FEED
      </motion.h2>

      <div className="relative w-full h-full flex items-center justify-center">
        {/* Story ring */}
        <motion.div 
          className="absolute top-[15vh] right-[15vw] w-[12vw] h-[12vw] rounded-full border-[0.4vw] border-[#f472b6] p-1 shadow-[0_0_30px_rgba(244,114,182,0.6)]"
          initial={{ scale: 0, rotate: -90 }}
          animate={phase >= 2 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-[#8b5cf6]">
            <img src={birdImg} className="w-full h-full object-cover scale-150 -translate-y-4" alt="" />
          </div>
        </motion.div>

        {/* Floating Post Cards */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-[35vw] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-[2vw] shadow-2xl"
            initial={{ y: '100vh', opacity: 0, rotate: i * 5 - 10, x: i * 50 - 50 }}
            animate={phase >= 3 ? { 
              y: `${(i - 1) * 15}vh`, 
              opacity: 1 - Math.abs(i - 1) * 0.3,
              rotate: i * 2 - 2,
              x: `${(i - 1) * 10}vw`,
              scale: i === 1 ? 1.1 : 0.9,
              zIndex: 30 - Math.abs(i - 1)
            } : { y: '100vh', opacity: 0, rotate: i * 5 - 10, x: i * 50 - 50 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15, delay: i * 0.2 }}
          >
            <div className="flex items-center gap-[1vw] mb-[1.5vw]">
              <div className="w-[3vw] h-[3vw] rounded-full bg-gradient-to-tr from-[#f472b6] to-[#a855f7]"></div>
              <div className="flex flex-col">
                <span className="font-bold text-[1.2vw]">Squad Member #{i + 1}</span>
                <span className="text-white/50 text-[1vw]">@squad_{i + 1}</span>
              </div>
            </div>
            <p className="text-[1.4vw] mb-[2vw]">Just vibing in the Monad ecosystem today. LFG! 🚀</p>
            
            {/* Interactions */}
            <div className="flex gap-[2vw] text-white/70">
              <motion.div 
                className="flex items-center gap-[0.5vw]"
                animate={phase >= 4 && i === 1 ? { color: '#f472b6', scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Heart className={`w-[1.5vw] h-[1.5vw] ${phase >= 4 && i === 1 ? 'fill-[#f472b6]' : ''}`} /> 
                <span className="text-[1vw]">{(124 + i * 42).toString()}</span>
              </motion.div>
              <div className="flex items-center gap-[0.5vw]">
                <MessageCircle className="w-[1.5vw] h-[1.5vw]" /> <span className="text-[1vw]">12</span>
              </div>
            </div>

            {/* Exploding likes effect */}
            {phase >= 4 && i === 1 && (
              <motion.div className="absolute bottom-[2vw] left-[2vw]">
                {[...Array(5)].map((_, j) => (
                  <motion.div
                    key={j}
                    className="absolute"
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 100, 
                      y: -Math.random() * 100 - 50, 
                      scale: Math.random() * 1.5 + 0.5,
                      opacity: 0 
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    <Heart className="fill-[#f472b6] text-[#f472b6] w-[2vw] h-[2vw]" />
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