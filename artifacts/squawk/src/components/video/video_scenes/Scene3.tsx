import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import nft1 from "@assets/image_1780004688839.png";

const LEADERBOARD = [
  { rank: 1, wallet: "0x4f3a...d891", nfts: 47, label: "👑 Whale" },
  { rank: 2, wallet: "0x7c2b...f432", nfts: 31, label: "💎 Diamond" },
  { rank: 3, wallet: "0xa1d9...3c7e", nfts: 28, label: "🔥 OG" },
  { rank: 4, wallet: "0x2e8f...9b1c", nfts: 19, label: "" },
  { rank: 5, wallet: "0x6a3c...7e2d", nfts: 14, label: "" },
];

export function Scene3() {
  const [phase, setPhase] = useState(0);
  const [countVal, setCountVal] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (phase < 2) return;
    let frame = 0;
    const total = 60;
    const target = 3000;
    const iv = setInterval(() => {
      frame++;
      setCountVal(Math.round((frame / total) * target));
      if (frame >= total) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [phase]);

  return (
    <motion.div
      className="absolute inset-0 flex z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, x: '100vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left panel — NFT image + stats */}
      <div className="w-[42%] h-full flex flex-col items-center justify-center pl-[4vw] pr-[2vw] gap-[3vh]">
        <motion.div
          className="w-full z-20 text-left"
          initial={{ opacity: 0, y: -30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-[4.5vw] font-bold text-white uppercase tracking-[0.05em] leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            LIVE SALES <span className="text-[#00b4ff]">TRACKING</span>
          </h2>
        </motion.div>

        {/* NFT Image */}
        <motion.div
          className="relative w-[22vw] h-[22vw] rounded-2xl overflow-hidden border border-[#ff2d92]/50 shadow-[0_0_60px_rgba(255,45,146,0.4)]"
          initial={{ opacity: 0, scale: 0.7, rotateY: -30 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.7, rotateY: -30 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <img src={nft1} alt="10K Squad NFT" className="w-full h-full object-cover" />
          {/* Holographic shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-[#ff2d92]/20 via-transparent to-[#00b4ff]/20 mix-blend-screen"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-[1.5vw] bg-gradient-to-t from-black/90 to-transparent">
            <p className="text-[1.2vw] text-white/60 font-mono">#0042 · 10K Squad</p>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="flex gap-[2vw] w-full">
          {[
            { label: "FLOOR PRICE", value: "2.5K MON", color: "#ff2d92" },
            { label: "PRICE TRACK", value: `${countVal.toLocaleString()} MON`, color: "#00b4ff" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 p-[1.5vw] rounded-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 40 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.15 }}
              style={{ boxShadow: `0 0 30px ${stat.color}22` }}
            >
              <motion.div
                className="absolute -inset-[100%] from-transparent to-transparent"
                style={{ background: `linear-gradient(to bottom, transparent, ${stat.color}18, transparent)` }}
                animate={{ y: ['-200%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
              />
              <p className="text-[1vw] text-white/40 font-mono tracking-widest uppercase mb-[0.5vh]">{stat.label}</p>
              <p className="text-[2vw] font-bold leading-none" style={{ color: stat.color, fontFamily: "'Bebas Neue', sans-serif" }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right panel — leaderboard */}
      <div className="w-[58%] h-full flex flex-col justify-center pr-[5vw] pl-[2vw] gap-[2vh]">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="text-[3vw] font-bold text-white uppercase tracking-[0.1em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            HOLDER <span className="text-[#7c3aed]">LEADERBOARD</span>
          </h3>
          <p className="text-[1.1vw] text-white/40 font-mono tracking-widest mt-[0.5vh]">RANKED BY NFT HOLDINGS</p>
        </motion.div>

        <div className="flex flex-col gap-[1.5vh]">
          {LEADERBOARD.map((entry, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-[2vw] bg-black/50 backdrop-blur-xl border rounded-xl px-[2vw] py-[1.5vh] relative overflow-hidden"
              style={{ borderColor: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.1)' }}
              initial={{ opacity: 0, x: 60 }}
              animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.1 }}
            >
              {i < 3 && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: i === 0 ? 'linear-gradient(90deg, rgba(255,215,0,0.06), transparent)' : i === 1 ? 'linear-gradient(90deg, rgba(192,192,192,0.06), transparent)' : 'linear-gradient(90deg, rgba(205,127,50,0.06), transparent)' }}
                />
              )}
              {/* Rank */}
              <span className="text-[2.5vw] font-bold w-[3vw] text-center shrink-0" style={{
                fontFamily: "'Bebas Neue', sans-serif",
                color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.4)',
              }}>
                {entry.rank}
              </span>
              {/* Mini avatar */}
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-gradient-to-br from-[#ff2d92] to-[#7c3aed] shrink-0 flex items-center justify-center">
                <span className="text-[1vw] text-white font-bold">{entry.wallet.slice(2, 4).toUpperCase()}</span>
              </div>
              {/* Wallet */}
              <span className="text-[1.3vw] text-white/70 font-mono flex-1 truncate">{entry.wallet}</span>
              {/* Label */}
              {entry.label && (
                <span className="text-[1vw] text-white/50 shrink-0">{entry.label}</span>
              )}
              {/* NFT count */}
              <div className="flex items-center gap-[0.5vw] shrink-0">
                <span className="text-[1.8vw] font-bold text-[#ff2d92]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{entry.nfts}</span>
                <span className="text-[1vw] text-white/40 font-mono">NFTs</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
