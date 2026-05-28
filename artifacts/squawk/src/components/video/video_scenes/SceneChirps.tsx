import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import nft2 from "@assets/image_1780004697327.png";
import nft3 from "@assets/image_1780004704530.png";
import nft4 from "@assets/image_1780004711858.png";
import nft5 from "@assets/image_1780004718820.png";

const CHIRPS = [
  {
    avatar: nft2,
    name: "MonadMaxi",
    handle: "@monad_maxi",
    time: "2m",
    text: "Just copped my 3rd 10K Squad NFT 🔥 Floor rising fast — get in before it's too late. WAGMI frens",
    likes: "2.4K",
    replies: "184",
    reposts: "631",
  },
  {
    avatar: nft3,
    name: "SquadKing",
    handle: "@squadking10k",
    time: "8m",
    text: "Squawk dropping FLOWS and it actually hits different. The vibe is immaculate rn 👑 Monad szn is here",
    likes: "1.9K",
    replies: "97",
    reposts: "412",
  },
  {
    avatar: nft4,
    name: "10KDegen",
    handle: "@10k_degen",
    time: "14m",
    text: "NFT floor at 3K MON and still climbing… holders eating. Squawk social is the move for the community 🚀",
    likes: "3.1K",
    replies: "229",
    reposts: "887",
  },
  {
    avatar: nft5,
    name: "CryptoSayan",
    handle: "@crypto_sayan",
    time: "21m",
    text: "Real talk — Squawk is what Twitter should've been for NFT communities. Built different 💯 #10KSquad",
    likes: "4.7K",
    replies: "351",
    reposts: "1.2K",
  },
];

export function SceneChirps() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 700),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, y: '60vh' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, filter: 'blur(20px)' }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Heading */}
      <motion.div
        className="absolute top-[6vh] z-30 flex items-center gap-[1.5vw]"
        initial={{ y: -40, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <div className="w-[1.5px] h-[5vh] bg-gradient-to-b from-transparent via-[#ff2d92] to-transparent" />
        <h2 className="text-[7vw] font-bold text-white uppercase tracking-widest text-center drop-shadow-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          CHIRPS <span className="text-[#ff2d92]">·</span> <span style={{
            background: 'linear-gradient(90deg, #ff2d92, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>LIVE FEED</span>
        </h2>
        <div className="w-[1.5px] h-[5vh] bg-gradient-to-b from-transparent via-[#7c3aed] to-transparent" />
      </motion.div>

      {/* Chirp cards — 2-column grid */}
      <div className="grid grid-cols-2 gap-[2vw] w-[88vw] mt-[14vh] z-20">
        {CHIRPS.map((chirp, i) => (
          <motion.div
            key={i}
            className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-[2vw] flex flex-col gap-[1.5vh] relative overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(255,45,146,0.08)' }}
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 100, damping: 18, delay: i * 0.12 }}
          >
            {/* Subtle top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff2d92]/50 to-transparent" />

            {/* Header row */}
            <div className="flex items-center gap-[1.2vw]">
              <div className="w-[3.5vw] h-[3.5vw] rounded-full overflow-hidden border border-[#ff2d92]/40 shrink-0">
                <img src={chirp.avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[1.3vw] font-bold text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{chirp.name}</span>
                <span className="text-[1vw] text-white/40 font-mono truncate">{chirp.handle} · {chirp.time} ago</span>
              </div>
              {/* Squawk bird icon */}
              <div className="shrink-0 w-[2vw] h-[2vw] rounded-full bg-gradient-to-br from-[#ff2d92] to-[#7c3aed] flex items-center justify-center">
                <span className="text-[0.9vw]">🐦</span>
              </div>
            </div>

            {/* Chirp text */}
            <p className="text-[1.3vw] text-white/85 leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {chirp.text}
            </p>

            {/* Action row */}
            <div className="flex items-center gap-[2vw] pt-[0.5vh] border-t border-white/5">
              {[
                { icon: '💬', count: chirp.replies },
                { icon: '🔁', count: chirp.reposts },
                { icon: '❤️', count: chirp.likes },
              ].map((action, j) => (
                <div key={j} className="flex items-center gap-[0.4vw]">
                  <span className="text-[1.1vw]">{action.icon}</span>
                  <span className="text-[1vw] text-white/40 font-mono">{action.count}</span>
                </div>
              ))}
              <div className="ml-auto">
                <span className="text-[1vw] text-[#ff2d92]/60 font-mono tracking-wider">SQUAWK</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
