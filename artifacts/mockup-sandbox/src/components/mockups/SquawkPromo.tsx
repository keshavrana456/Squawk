import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationFrame } from "framer-motion";

// ── Color palette ───────────────────────────────────────────────────────────
const PINK   = "#ec4899";
const PURPLE = "#c084fc";
const WHITE  = "#f9fafb";
const DIM    = "rgba(249,250,251,0.45)";
const BG     = "#08080f";

// ── Scene durations (ms) ────────────────────────────────────────────────────
const SCENES = [4200, 4500, 4200, 4500, 5000];
const TOTAL  = SCENES.reduce((a, b) => a + b, 0);

// ── Floating particle ────────────────────────────────────────────────────────
function Particle({ x, y, size, opacity, dur }: { x: string; y: string; size: number; opacity: number; dur: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: `radial-gradient(circle, ${PINK}, ${PURPLE})`, opacity }}
      animate={{ y: [0, -30, 0], opacity: [opacity, opacity * 0.4, opacity], scale: [1, 1.3, 1] }}
      transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ── Persistent animated particles layer ─────────────────────────────────────
const PARTICLES = [
  { x: "8%",  y: "15%", size: 6,  opacity: 0.6, dur: 4.1 },
  { x: "92%", y: "22%", size: 4,  opacity: 0.5, dur: 5.3 },
  { x: "15%", y: "78%", size: 8,  opacity: 0.4, dur: 3.8 },
  { x: "80%", y: "65%", size: 5,  opacity: 0.7, dur: 6.1 },
  { x: "50%", y: "5%",  size: 3,  opacity: 0.5, dur: 4.7 },
  { x: "35%", y: "90%", size: 7,  opacity: 0.3, dur: 5.5 },
  { x: "70%", y: "88%", size: 4,  opacity: 0.6, dur: 3.5 },
  { x: "5%",  y: "50%", size: 5,  opacity: 0.4, dur: 4.9 },
  { x: "95%", y: "48%", size: 6,  opacity: 0.5, dur: 6.3 },
  { x: "60%", y: "3%",  size: 3,  opacity: 0.7, dur: 3.2 },
];

// ── Per-character animated text ───────────────────────────────────────────────
function KineticText({ text, delay = 0, className = "", style = {} }: { text: string; delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={className} style={{ display: "inline-block", ...style }}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          style={{ display: "inline-block" }}
          initial={{ opacity: 0, y: 48, rotateX: -40, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 24, delay: delay + i * 0.045 }}
        >
          {ch === " " ? "\u00a0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

// ── Feature pill ─────────────────────────────────────────────────────────────
function Pill({ label, icon, delay }: { label: string; icon: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 300, damping: 22, delay }}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.3)",
        borderRadius: "999px", padding: "10px 22px",
        color: WHITE, fontSize: "1.05vw", fontWeight: 600, letterSpacing: "0.02em",
        backdropFilter: "blur(8px)",
      }}
    >
      <span style={{ fontSize: "1.3vw" }}>{icon}</span>
      {label}
    </motion.div>
  );
}

// ── Mock post card ─────────────────────────────────────────────────────────
function MockPost({ delay, hue, name, handle, text }: { delay: number; hue: number; name: string; handle: string; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay }}
      style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px", padding: "16px 20px", width: "100%",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `linear-gradient(135deg, hsl(${hue},80%,60%), hsl(${hue + 60},70%,50%))`,
          flexShrink: 0,
        }} />
        <div>
          <div style={{ color: WHITE, fontSize: "0.85vw", fontWeight: 700, lineHeight: 1.2 }}>{name}</div>
          <div style={{ color: DIM, fontSize: "0.7vw" }}>{handle}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: PINK, fontSize: "0.7vw" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span style={{ fontWeight: 600 }}>{Math.floor(Math.random() * 900 + 100)}</span>
        </div>
      </div>
      <p style={{ color: "rgba(249,250,251,0.75)", fontSize: "0.78vw", lineHeight: 1.5 }}>{text}</p>
    </motion.div>
  );
}

// ── Scene 0: Logo reveal ──────────────────────────────────────────────────
function SceneOpen() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Radial glow */}
      <motion.div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(192,132,252,0.18), transparent)`,
        }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Logo mark — stylized bird/check shape */}
      <motion.div
        style={{ marginBottom: "1.5vh", position: "relative" }}
        initial={{ scale: 0, rotate: -20 }}
        animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.1 }}
      >
        <svg width="5vw" height="5vw" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor={PINK} />
              <stop offset="1" stopColor={PURPLE} />
            </linearGradient>
          </defs>
          <path
            d="M10 42C22 28 38 20 56 18C48 26 44 34 46 44C36 40 24 44 16 56C12 52 10 48 10 42Z"
            fill="url(#logoGrad)"
          />
          <path
            d="M46 44C50 52 58 58 68 60C58 62 48 60 40 54C36 50 34 46 34 42C38 42 42 43 46 44Z"
            fill="url(#logoGrad)"
            opacity="0.7"
          />
        </svg>
        {/* Glow ring */}
        <motion.div
          style={{
            position: "absolute", inset: "-8px",
            borderRadius: "50%",
            border: `2px solid rgba(236,72,153,0.4)`,
            pointerEvents: "none",
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.div>

      {/* SQUAWK wordmark */}
      <div style={{ perspective: "600px" }}>
        {phase >= 2 && (
          <KineticText
            text="SQUAWK"
            className="squawk-logo-text"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "12vw",
              background: `linear-gradient(135deg, ${WHITE} 30%, ${PINK} 70%, ${PURPLE})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          />
        )}
      </div>

      {/* Tagline */}
      <motion.p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "1.4vw", color: DIM, letterSpacing: "0.25em",
          textTransform: "uppercase", marginTop: "1.5vh",
          fontWeight: 400,
        }}
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={phase >= 3 ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 16, filter: "blur(8px)" }}
        transition={{ duration: 0.6 }}
      >
        Where the Squad Lives
      </motion.p>

      {/* Accent line */}
      <motion.div
        style={{ height: "2px", background: `linear-gradient(90deg, transparent, ${PINK}, ${PURPLE}, transparent)`, marginTop: "2vh" }}
        initial={{ width: 0 }}
        animate={phase >= 3 ? { width: "20vw" } : { width: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.div>
  );
}

// ── Scene 1: Feed / Community ─────────────────────────────────────────────
function SceneFeed() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 400),
      setTimeout(() => setPhase(3), 900),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left — headline */}
      <div style={{ flex: "0 0 42%", padding: "0 0 0 7vw" }}>
        <motion.div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.85vw", color: PINK, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.5vh",
          }}
          initial={{ opacity: 0, y: -12 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.4 }}
        >
          Your Feed
        </motion.div>

        {phase >= 1 && (
          <div style={{ perspective: "500px" }}>
            <KineticText
              text="Real Posts."
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "6.5vw", letterSpacing: "0.02em",
                background: `linear-gradient(135deg, ${WHITE}, ${PINK})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                display: "block", lineHeight: 1,
              }}
            />
            <KineticText
              text="Real Community."
              delay={0.12}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "6.5vw", letterSpacing: "0.02em",
                background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                display: "block", lineHeight: 1,
              }}
            />
          </div>
        )}

        <motion.p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.1vw", color: DIM, marginTop: "2.5vh", lineHeight: 1.65,
            fontWeight: 400, maxWidth: "28vw",
          }}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={phase >= 2 ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.5 }}
        >
          Discover posts from the 10K Squad — art, memes, mints, and moments that matter.
        </motion.p>
      </div>

      {/* Right — mock posts */}
      <div style={{ flex: 1, padding: "0 6vw 0 3vw", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
        {phase >= 2 && (
          <MockPost delay={0} hue={330} name="Yuki.eth" handle="@yukimonad" text="Just minted my first 10K Squad piece. The community here is unreal 🔥" />
        )}
        {phase >= 2 && (
          <MockPost delay={0.18} hue={270} name="CryptoNova" handle="@cryptonova" text="GM Squad! Who's watching the Monad testnet launch today? Let's go 🚀" />
        )}
        {phase >= 3 && (
          <MockPost delay={0} hue={200} name="Pixel.ape" handle="@pixel_ape" text="New drops hitting the feed. Check my profile for the full collection." />
        )}
      </div>
    </motion.div>
  );
}

// ── Scene 2: Stories & Reels ──────────────────────────────────────────────
function SceneReels() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 1100),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const storyUsers = [
    { color: "#ec4899", label: "yuki.eth" },
    { color: "#c084fc", label: "nova" },
    { color: "#60a5fa", label: "ape.nft" },
    { color: "#34d399", label: "squad.x" },
    { color: "#f59e0b", label: "monad" },
  ];

  return (
    <motion.div
      style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Stories row */}
      <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "2.5vw" }}>
        {storyUsers.map((u, i) => (
          <motion.div
            key={i}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5vh" }}
            initial={{ opacity: 0, y: -20, scale: 0.7 }}
            animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -20, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, delay: i * 0.08 }}
          >
            <div style={{
              width: "5.5vw", height: "5.5vw", borderRadius: "50%",
              padding: "3px",
              background: `linear-gradient(135deg, ${PINK}, ${PURPLE})`,
              boxShadow: `0 0 16px 3px rgba(236,72,153,0.4)`,
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: `linear-gradient(135deg, ${u.color}cc, ${u.color}44)`,
                border: "2.5px solid #08080f",
              }} />
            </div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7vw", color: DIM }}>{u.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Center: big reel mockup */}
      <motion.div
        style={{
          width: "22vw", height: "38vh",
          background: "linear-gradient(160deg, rgba(236,72,153,0.15), rgba(192,132,252,0.12))",
          border: "1px solid rgba(236,72,153,0.25)",
          borderRadius: "24px", overflow: "hidden",
          backdropFilter: "blur(16px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          position: "relative",
          boxShadow: `0 0 60px 10px rgba(192,132,252,0.15)`,
        }}
        initial={{ scale: 0.7, rotateY: -30, opacity: 0 }}
        animate={phase >= 1 ? { scale: 1, rotateY: 0, opacity: 1 } : { scale: 0.7, rotateY: -30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.2 }}
      >
        {/* Animated gradient inside */}
        <motion.div
          style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(220deg, rgba(236,72,153,0.3) 0%, transparent 50%, rgba(192,132,252,0.3) 100%)`,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Play icon */}
        <motion.div
          style={{
            width: "5vw", height: "5vw", borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid rgba(255,255,255,0.2)",
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="2.5vw" height="2.5vw" viewBox="0 0 24 24" fill="white" style={{ marginLeft: "0.2vw" }}>
            <path d="M8 5v14l11-7z"/>
          </svg>
        </motion.div>
        {/* Reel tag */}
        <motion.div
          style={{
            position: "absolute", bottom: "12px", left: "12px", right: "12px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.75vw", fontWeight: 700, color: WHITE,
          }}
        >
          <div style={{ marginBottom: 4 }}>@yuki.eth · 24K views</div>
          <div style={{
            height: 3, borderRadius: 2,
            background: "rgba(255,255,255,0.2)",
            overflow: "hidden",
          }}>
            <motion.div
              style={{ height: "100%", background: `linear-gradient(90deg, ${PINK}, ${PURPLE})`, borderRadius: 2 }}
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Right: headline */}
      <div style={{ position: "absolute", right: "6vw", top: "50%", transform: "translateY(-50%)", maxWidth: "28vw" }}>
        {phase >= 2 && (
          <>
            <KineticText
              text="Stories."
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "6vw", letterSpacing: "0.03em",
                background: `linear-gradient(135deg, ${WHITE}, ${PINK})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                display: "block", lineHeight: 1,
              }}
            />
            <KineticText
              text="Reels."
              delay={0.1}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "6vw", letterSpacing: "0.03em",
                background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                display: "block", lineHeight: 1,
              }}
            />
            <KineticText
              text="Chirps."
              delay={0.2}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "6vw", letterSpacing: "0.03em",
                background: `linear-gradient(135deg, ${PINK}, ${WHITE})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                display: "block", lineHeight: 1,
              }}
            />
          </>
        )}
        <motion.p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.05vw", color: DIM, marginTop: "2vh", lineHeight: 1.65,
          }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          Short-form video, stories, and micro-posts — all in one place.
        </motion.p>
      </div>
    </motion.div>
  );
}

// ── Scene 3: NFT & Connect ────────────────────────────────────────────────
function SceneNFT() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1600),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const features = [
    { icon: "🎨", label: "Mint from Post" },
    { icon: "💬", label: "Direct Messages" },
    { icon: "🔔", label: "Notifications" },
    { icon: "🌐", label: "Explore Feed" },
  ];

  return (
    <motion.div
      style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.45 }}
    >
      {/* Left: NFT card */}
      <div style={{ flex: "0 0 50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          style={{
            width: "28vw", height: "32vh",
            background: "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(192,132,252,0.15))",
            border: "1px solid rgba(236,72,153,0.35)",
            borderRadius: "20px",
            padding: "2.5vh 2.5vw",
            backdropFilter: "blur(20px)",
            boxShadow: `0 0 50px 8px rgba(236,72,153,0.12), 0 0 80px 15px rgba(192,132,252,0.08)`,
            position: "relative", overflow: "hidden",
          }}
          initial={{ opacity: 0, rotateY: 20, scale: 0.88 }}
          animate={phase >= 1 ? { opacity: 1, rotateY: 0, scale: 1 } : { opacity: 0, rotateY: 20, scale: 0.88 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        >
          {/* Animated gradient wash */}
          <motion.div
            style={{
              position: "absolute", inset: 0,
              background: `conic-gradient(from 0deg at 50% 50%, ${PINK}22, ${PURPLE}22, transparent, ${PINK}22)`,
              pointerEvents: "none",
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.7vw", color: PINK, fontWeight: 700,
              letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1vh",
            }}>
              10K Squad NFT
            </div>
            {/* Mock NFT art placeholder */}
            <motion.div
              style={{
                width: "100%", height: "15vh",
                background: `linear-gradient(135deg, ${PINK}33, ${PURPLE}33, #60a5fa22)`,
                borderRadius: "10px", marginBottom: "1.5vh",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              animate={{ background: [`linear-gradient(135deg, ${PINK}33, ${PURPLE}33)`, `linear-gradient(225deg, ${PURPLE}33, ${PINK}33)`, `linear-gradient(135deg, ${PINK}33, ${PURPLE}33)`] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span style={{ fontSize: "3.5vw" }}>🐦</span>
            </motion.div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1vw", color: WHITE, fontWeight: 700 }}>Squawk #4209</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72vw", color: DIM }}>by yuki.eth</div>
              </div>
              <motion.div
                style={{
                  background: `linear-gradient(135deg, ${PINK}, ${PURPLE})`,
                  borderRadius: "999px", padding: "6px 16px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75vw", color: WHITE, fontWeight: 700,
                }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Mint Now
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right: features */}
      <div style={{ flex: 1, padding: "0 7vw 0 2vw" }}>
        {phase >= 2 && (
          <KineticText
            text="Own it."
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "7.5vw", letterSpacing: "0.03em",
              background: `linear-gradient(135deg, ${WHITE}, ${PINK})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              display: "block", lineHeight: 1, marginBottom: "3vh",
            }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}
              initial={{ opacity: 0, x: 30 }}
              animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.09 }}
            >
              <motion.span
                style={{ fontSize: "1.6vw" }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
              >
                {f.icon}
              </motion.span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.1vw", color: WHITE, fontWeight: 600 }}>
                {f.label}
              </span>
              <motion.div
                style={{ height: "1px", flex: 1, background: `linear-gradient(90deg, rgba(236,72,153,0.5), transparent)` }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.5, delay: phase >= 3 ? i * 0.09 + 0.2 : 0 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Scene 4: Closing lockup ───────────────────────────────────────────────
function SceneClose() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2800),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
    >
      {/* Giant gradient orb */}
      <motion.div
        style={{
          position: "absolute",
          width: "60vw", height: "60vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(192,132,252,0.18) 0%, rgba(236,72,153,0.1) 40%, transparent 70%)`,
          pointerEvents: "none",
        }}
        animate={{ scale: [1, 1.15, 1], rotate: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Tagline pills */}
      {phase >= 2 && (
        <div style={{ display: "flex", gap: "2vw", marginBottom: "4vh", flexWrap: "wrap", justifyContent: "center" }}>
          <Pill label="Post" icon="📸" delay={0} />
          <Pill label="Connect" icon="🤝" delay={0.1} />
          <Pill label="Own" icon="💎" delay={0.2} />
        </div>
      )}

      {/* Main logo */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0.3, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        style={{ textAlign: "center", position: "relative", zIndex: 2 }}
      >
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "15vw",
            background: `linear-gradient(135deg, ${WHITE} 0%, ${PINK} 50%, ${PURPLE} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.04em",
            lineHeight: 0.9,
            display: "block",
          }}
        >
          SQUAWK
        </span>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "1.5vw", color: DIM,
          letterSpacing: "0.22em", textTransform: "uppercase",
          marginTop: "2.5vh", fontWeight: 300,
          position: "relative", zIndex: 2,
        }}
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={phase >= 3 ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 20, filter: "blur(8px)" }}
        transition={{ duration: 0.7 }}
      >
        The 10K Squad Social Network
      </motion.p>

      {/* Horizontal rule */}
      <motion.div
        style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${PINK}, ${PURPLE}, transparent)`, marginTop: "3vh", position: "relative", zIndex: 2 }}
        initial={{ width: 0 }}
        animate={phase >= 4 ? { width: "30vw" } : { width: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Domain */}
      <motion.p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.9vw", color: "rgba(249,250,251,0.3)",
          marginTop: "1.5vh", letterSpacing: "0.08em",
          position: "relative", zIndex: 2,
        }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        squawk.app
      </motion.p>
    </motion.div>
  );
}

// ── Persistent cross-scene elements ─────────────────────────────────────────
const SCENE_SHAPES = [
  { x: "75vw", y: "10vh",  scale: 2.8, opacity: 0.5 },
  { x: "5vw",  y: "72vh",  scale: 1.2, opacity: 0.6 },
  { x: "88vw", y: "55vh",  scale: 1.8, opacity: 0.4 },
  { x: "40vw", y: "85vh",  scale: 1.0, opacity: 0.5 },
  { x: "20vw", y: "20vh",  scale: 1.4, opacity: 0.35 },
];

// ── Main video component ──────────────────────────────────────────────────
export default function SquawkPromo() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const elapsed = useRef(0);
  const lastTime = useRef<number | null>(null);

  useAnimationFrame((t) => {
    if (lastTime.current === null) { lastTime.current = t; return; }
    elapsed.current += t - lastTime.current;
    lastTime.current = t;

    const cycleDur = SCENES[sceneIdx];
    if (elapsed.current >= cycleDur) {
      elapsed.current = 0;
      setSceneIdx(i => (i + 1) % SCENES.length);
    }
  });

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />

      <div
        style={{
          width: "100vw", height: "100vh",
          background: BG,
          overflow: "hidden",
          position: "relative",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* ── Persistent background gradient ── */}
        <motion.div
          style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse 70% 60% at ${["75%", "20%", "50%", "80%", "50%"][sceneIdx]} ${["30%", "60%", "40%", "50%", "50%"][sceneIdx]}, rgba(192,132,252,0.1), transparent)`,
            transition: "background 1.2s ease",
          }}
        />

        {/* ── Ambient gradient blobs (persistent) ── */}
        <motion.div
          style={{
            position: "absolute",
            width: "40vw", height: "40vw",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(236,72,153,0.12), transparent)`,
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
          animate={{ x: ["-5vw", "45vw", "20vw", "60vw", "5vw"][sceneIdx], y: ["-5vh", "40vh", "20vh", "10vh", "30vh"][sceneIdx] }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          style={{
            position: "absolute",
            width: "30vw", height: "30vw",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(192,132,252,0.1), transparent)`,
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
          animate={{ x: ["80vw", "10vw", "60vw", "20vw", "70vw"][sceneIdx], y: ["60vh", "20vh", "70vh", "30vh", "20vh"][sceneIdx] }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* ── Floating particles ── */}
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

        {/* ── Persistent moving accent dot ── */}
        <motion.div
          style={{
            position: "absolute",
            width: "1.2vw", height: "1.2vw",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${PINK}, ${PURPLE})`,
            boxShadow: `0 0 20px 6px rgba(236,72,153,0.5)`,
          }}
          animate={{
            left: SCENE_SHAPES[sceneIdx].x,
            top:  SCENE_SHAPES[sceneIdx].y,
            scale: SCENE_SHAPES[sceneIdx].scale,
            opacity: SCENE_SHAPES[sceneIdx].opacity,
          }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* ── Persistent accent line (transforms across scenes) ── */}
        <motion.div
          style={{
            position: "absolute",
            height: "2px",
            background: `linear-gradient(90deg, ${PINK}88, ${PURPLE}88)`,
            transformOrigin: "left center",
          }}
          animate={{
            left: ["5vw", "60vw", "10vw", "45vw", "25vw"][sceneIdx],
            top:  ["92vh", "8vh", "88vh", "4vh", "95vh"][sceneIdx],
            width: ["30vw", "20vw", "25vw", "18vw", "40vw"][sceneIdx],
            opacity: [0.6, 0.4, 0.7, 0.5, 0.3][sceneIdx],
          }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* ── Grid texture overlay ── */}
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            backgroundImage: `linear-gradient(rgba(249,250,251,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(249,250,251,0.025) 1px, transparent 1px)`,
            backgroundSize: "4vw 4vw",
          }}
        />

        {/* ── Scene content ── */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <AnimatePresence mode="popLayout">
            {sceneIdx === 0 && <SceneOpen key="open" />}
            {sceneIdx === 1 && <SceneFeed key="feed" />}
            {sceneIdx === 2 && <SceneReels key="reels" />}
            {sceneIdx === 3 && <SceneNFT key="nft" />}
            {sceneIdx === 4 && <SceneClose key="close" />}
          </AnimatePresence>
        </div>

        {/* ── Scene progress dots ── */}
        <div style={{
          position: "absolute", bottom: "3vh", left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: "8px", zIndex: 10,
        }}>
          {SCENES.map((_, i) => (
            <motion.div
              key={i}
              style={{ height: "3px", borderRadius: "2px", background: i === sceneIdx ? `linear-gradient(90deg, ${PINK}, ${PURPLE})` : "rgba(255,255,255,0.18)" }}
              animate={{ width: i === sceneIdx ? "3vw" : "1.2vw", opacity: i === sceneIdx ? 1 : 0.4 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
