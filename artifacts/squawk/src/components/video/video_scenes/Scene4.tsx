import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import birdImg from "@assets/MAIN_BODY_1779543929049.png";
import img2 from "@assets/image_1779538798096.png";

const CHIRPS = [
  "@pinkbird just minted for 2.4 ETH 🔥 squad stays winning",
  "my 10K squad is my ride or die fr fr",
  "flow feed is INSANE today #MonadSzn"
];

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, y: '50vh' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2 
        className="absolute top-[10vh] left-[5vw] text-[8vw] font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 uppercase leading-none"
        style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        initial={{ opacity: 0, x: -50 }}
        animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
      >
        CHIRPS
      </motion.h2>

      {/* Main Chirp Feed Container */}
      <div className="w-[70vw] max-w-5xl mt-[15vh] flex flex-col gap-[1.5vw] relative z-20">
        
        {/* Highlighted Quote Chirp */}
        <motion.div
          className="bg-[#1a0b2e]/80 border-2 border-pink-500/50 p-[2vw] rounded-[2vw] backdrop-blur-xl shadow-[0_0_50px_rgba(236,72,153,0.2)]"
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        >
          <div className="flex items-center gap-[1vw] mb-[1vw]">
             <div className="w-[4vw] h-[4vw] bg-purple-600 rounded-full overflow-hidden">
                <img src={img2} className="w-full h-full object-cover" alt="" />
             </div>
             <div>
               <p className="font-bold text-[1.5vw] text-white">@alpha_caller</p>
               <p className="text-[1.2vw] text-white/50">2m ago</p>
             </div>
          </div>
          <p className="text-[2vw] font-medium text-white mb-[1.5vw] leading-tight">
            I've never seen a community move like this. The energy is unmatched.
          </p>

          {/* Quoted Chirp inside */}
          <div className="border border-white/20 rounded-[1vw] p-[1.5vw] bg-black/40">
             <div className="flex items-center gap-[1vw] mb-[0.5vw]">
               <div className="w-[2vw] h-[2vw] bg-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                  <img src={birdImg} className="w-[150%] h-[150%] object-cover -translate-y-1" alt="" />
               </div>
               <p className="font-bold text-[1.2vw] text-white">@squawk_official</p>
             </div>
             <p className="text-[1.5vw] text-white/80">We just crossed 100k active users on the Grid. We're just getting started.</p>
          </div>
        </motion.div>

        {/* Other Chirps */}
        {CHIRPS.map((chirp, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-[1.5vw] bg-white/5 border border-white/10 p-[1.5vw] rounded-2xl backdrop-blur-md"
            initial={{ opacity: 0, x: -100, rotateX: 45 }}
            animate={phase >= 2 ? { opacity: 1, x: 0, rotateX: 0 } : { opacity: 0, x: -100, rotateX: 45 }}
            transition={{ type: 'spring', stiffness: 100, damping: 12, delay: i * 0.15 + 0.2 }}
          >
            <motion.div 
              className="w-[3vw] h-[3vw] bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex-shrink-0"
              animate={phase >= 2 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 + 0.4 }}
            />
            <p className="text-[1.6vw] font-medium text-white/90">
              {chirp.split(' ').map((word, j) => (
                <span key={j} className={word.startsWith('#') || word.startsWith('@') ? "text-pink-400 font-bold" : ""}>
                  {word}{" "}
                </span>
              ))}
            </p>
          </motion.div>
        ))}
      </div>
      
      {/* Background trending hashtags */}
      {phase >= 1 && (
        <div className="absolute right-[-5vw] top-[10vh] w-[30vw] flex flex-col gap-[2vw] opacity-20 pointer-events-none transform rotate-[15deg]">
          <h3 className="text-[6vw] font-bold text-white whitespace-nowrap">#MONADSZN</h3>
          <h3 className="text-[6vw] font-bold text-white whitespace-nowrap">#10KSQUAD</h3>
          <h3 className="text-[6vw] font-bold text-white whitespace-nowrap">#SQUAWK</h3>
        </div>
      )}
    </motion.div>
  );
}