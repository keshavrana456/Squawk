import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const STATS = [
  { label: "Floor Price", value: "4.2 ETH", prefix: "" },
  { label: "Total Volume", value: "12,450", prefix: "ETH " },
  { label: "Total Holders", value: "3,333", prefix: "" },
  { label: "Sales", value: "24,500+", prefix: "" }
];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, x: '100vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: '-100vh', scale: 0.9 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="grid grid-cols-2 gap-[3vw] w-[80vw] z-20">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            className="bg-[#1a0b38]/80 backdrop-blur-xl border border-[#f472b6]/30 p-[4vw] rounded-3xl flex flex-col justify-center relative overflow-hidden"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.15 }}
          >
            <motion.div 
              className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-[#8b5cf6]/20 to-transparent"
              animate={{ x: ['0%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
            />
            <h3 className="text-[2vw] text-white/50 font-medium tracking-wider mb-[1vh]">{stat.label}</h3>
            <div className="flex items-baseline gap-[1vw]">
              <span className="text-[1.5vw] text-[#f472b6] font-bold">{stat.prefix}</span>
              <span className="text-[5vw] font-bold text-white leading-none" style={{ fontFamily: "'Syncopate', sans-serif" }}>
                {stat.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-[8vh] z-20 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h2 className="text-[4vw] font-bold text-white tracking-[0.2em] uppercase">
          Track every move. <span className="text-[#f472b6]">Own the data.</span>
        </h2>
      </motion.div>
    </motion.div>
  );
}
