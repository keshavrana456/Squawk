import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Generate random symbols for the encrypted effect
  const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!<>~";
  const [scramble, setScramble] = useState("************************");

  useEffect(() => {
    if (phase < 2) return;
    const target = "AN ENTIRELY NEW WAY TO EARN...";
    let iteration = 0;
    const interval = setInterval(() => {
      setScramble(target.split("").map((char, index) => {
        if(index < iteration) {
          return target[index];
        }
        return symbols[Math.floor(Math.random() * symbols.length)];
      }).join(""));
      
      if(iteration >= target.length){ 
        clearInterval(interval);
      }
      iteration += 1/3; 
    }, 30);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 1.5 }}
    >
      <div className="absolute inset-0 bg-black z-0 pointer-events-none" />
      
      <motion.div 
        className="absolute w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] z-0 mix-blend-overlay opacity-30"
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <motion.div
        className="z-20 text-center flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 1.2 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.2 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <h2 className="text-[5vw] font-mono font-bold text-[#00b4ff] tracking-[0.2em] shadow-black drop-shadow-[0_0_10px_rgba(0,180,255,0.8)]">
          {phase >= 2 ? scramble : "************************"}
        </h2>
        
        <motion.div
          className="mt-[4vh] text-[#7c3aed] text-[2vw] font-mono uppercase tracking-[1em]"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          [ REDACTED ]
        </motion.div>
      </motion.div>
    </motion.div>
  );
}