import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const CHIRPS = [
  { user: "@voidwalker", text: "gm squad, floor is moving 🚀", time: "2m" },
  { user: "@monadmax", text: "just copped my 3rd 10k nft, no looking back 💎", time: "5m" }
];

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, y: '100vh', scale: 1.2 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: '100vw', filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-[85vw] h-[80vh] gap-[5vw]">
        {/* Left: Feed Flow */}
        <div className="w-[45%] h-full flex flex-col gap-[3vh] relative z-20 justify-center">
          <motion.div
            className="w-full h-[50vh] bg-[#1a0b38] rounded-3xl border border-[#8b5cf6]/30 overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.2)]"
            initial={{ opacity: 0, x: -100 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <div className="p-[2vw] flex items-center gap-[1vw] border-b border-white/10">
              <div className="w-[3vw] h-[3vw] rounded-full bg-[#f472b6]/20" />
              <div>
                <div className="w-[10vw] h-[1vw] bg-white/20 rounded-full mb-[0.5vh]" />
                <div className="w-[5vw] h-[0.8vw] bg-white/10 rounded-full" />
              </div>
            </div>
            <div className="w-full h-full relative">
              <img src={`${import.meta.env.BASE_URL}nft-banner.png`} className="w-full h-full object-cover" alt="Post" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-[2vw] left-[2vw] right-[2vw] flex justify-between items-end">
                 <div className="w-[60%]">
                    <div className="w-full h-[1.5vw] bg-white/30 rounded-full mb-[1vh]" />
                    <div className="w-3/4 h-[1vw] bg-white/20 rounded-full" />
                 </div>
                 <div className="flex gap-[1vw]">
                    <div className="w-[3vw] h-[3vw] rounded-full bg-white/20 backdrop-blur-md" />
                    <div className="w-[3vw] h-[3vw] rounded-full bg-[#f472b6]/80 backdrop-blur-md" />
                 </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Chirps & Text */}
        <div className="w-[55%] flex flex-col justify-center gap-[4vh] z-20">
          <motion.div className="flex flex-col gap-[2vh]">
            {CHIRPS.map((chirp, i) => (
              <motion.div
                key={i}
                className="bg-black/60 backdrop-blur-xl border border-[#f472b6]/30 p-[2vw] rounded-2xl shadow-[0_0_30px_rgba(244,114,182,0.15)]"
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={phase >= 2 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 100, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 120, damping: 15, delay: i * 0.2 }}
              >
                <div className="flex justify-between items-center mb-[1.5vh]">
                  <span className="text-[#f472b6] font-bold text-[1.2vw]">{chirp.user}</span>
                  <span className="text-white/40 text-[1vw]">{chirp.time}</span>
                </div>
                <p className="text-white text-[1.8vw] font-medium leading-tight">
                  {chirp.text}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mt-[4vh]"
          >
            <h2 className="text-[5vw] font-bold text-white uppercase leading-none tracking-wider" style={{ fontFamily: "'Syncopate', sans-serif" }}>
              Your community.<br/>
              <span className="text-[#8b5cf6]">Your feed.</span>
            </h2>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
