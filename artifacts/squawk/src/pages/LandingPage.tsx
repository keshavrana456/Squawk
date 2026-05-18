import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import SquawkBot from "@/components/SquawkBot";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface NftStats {
  floorPrice: number | null;
  floorPriceSymbol: string | null;
  totalVolume: number | null;
  numOwners: number | null;
  numListed: number | null;
  totalSupply: number;
  source: string | null;
  fetchedAt: number;
}

function fmt(n: number | null, decimals = 2): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

function fmtPrice(n: number | null, symbol: string | null): string {
  if (n === null) return "—";
  return `${n.toFixed(4)} ${symbol ?? "ETH"}`;
}

function LiveDot({ live }: { live: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`w-1.5 h-1.5 rounded-full ${live ? "bg-green-400 animate-pulse" : "bg-white/20"}`}
      />
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  updating: boolean;
}

function StatCard({ label, value, sub, updating }: StatCardProps) {
  return (
    <div
      className="rounded-2xl border border-white/10 p-4 text-center backdrop-blur-md relative overflow-hidden"
      style={{ background: "rgba(88,28,135,0.2)" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.3 }}
          className={`text-xl md:text-2xl font-black text-white mb-0.5 transition-all ${updating ? "opacity-60" : ""}`}
        >
          {value}
        </motion.div>
      </AnimatePresence>
      <div className="text-xs text-white/50 font-medium">{label}</div>
      {sub && <div className="text-[10px] text-white/30 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function LandingPage() {
  const [stats, setStats] = useState<NftStats | null>(null);
  const [updating, setUpdating] = useState(false);
  const [hasLiveData, setHasLiveData] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setUpdating(true);
    try {
      const res = await fetch(`${BASE}/api/nft/stats`);
      if (!res.ok) return;
      const data: NftStats = await res.json();
      setStats(data);
      if (data.source) setHasLiveData(true);
    } catch {
      // silently ignore — keep showing last known data
    } finally {
      if (isRefresh) setTimeout(() => setUpdating(false), 400);
    }
  }, []);

  useEffect(() => {
    fetchStats(false);
    const interval = setInterval(() => fetchStats(true), 10_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const statCards = [
    {
      label: "Floor Price",
      value: fmtPrice(stats?.floorPrice ?? null, stats?.floorPriceSymbol ?? null),
      sub: "via OpenSea",
    },
    {
      label: "Total Supply",
      value: "10,000",
      sub: "hand-drawn 1/1",
    },
    {
      label: "Owners",
      value: fmt(stats?.numOwners ?? null, 0),
      sub: "unique holders",
    },
    {
      label: "Listed",
      value: fmt(stats?.numListed ?? null, 0),
      sub: "for sale now",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden flex flex-col relative dark">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="w-full flex items-center justify-between p-6 md:px-12 relative z-20 bg-transparent">
        <img src={`${BASE}/logo.png`} alt="Squawk" className="h-10 w-auto" />
        <div className="flex gap-4 items-center">
          <Link href="/sign-in" className="px-6 py-2 rounded-full font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors">
            Log In
          </Link>
          <Link href="/sign-up" className="px-6 py-2 rounded-full font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_24px_4px_rgba(219,39,119,0.35)]" style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}>
            Join Now
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-8 pb-20 z-10 min-h-[88vh] overflow-hidden">

        <div className="absolute inset-0 z-0">
          <img
            src={`${BASE}/nft-banner.png`}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ opacity: 0.18 }}
            aria-hidden="true"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(14,7,25,0.55) 0%, rgba(14,7,25,0.3) 40%, rgba(14,7,25,0.7) 100%)" }} />
        </div>

        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-purple-800/25 blur-[130px]" />
          <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-700/20 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-sm font-medium mb-8 text-white/70 backdrop-blur-sm">
            <LiveDot live={hasLiveData} />
            {hasLiveData ? "Live stats · updates every 10s" : "The new social grid is live on Monad"}
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 leading-tight text-white drop-shadow-xl">
            Culture at{" "}
            <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #f472b6, #c084fc, #818cf8)" }}>
              light speed.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto font-light drop-shadow-md">
            Squawk is the social home of the 10K Squad — where creators and the Monad community collide.
          </p>

          <Link href="/sign-up">
            <button
              className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full px-8 font-bold text-white text-lg transition-all duration-300 hover:scale-105 shadow-2xl shadow-pink-900/50"
              style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
              data-testid="button-get-started"
            >
              Enter the Grid
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2 transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </Link>

          {/* Live NFT Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-16 max-w-2xl mx-auto"
          >
            {statCards.map(s => (
              <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} updating={updating} />
            ))}
          </motion.div>

          {/* Source attribution */}
          {hasLiveData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-[11px] text-white/25 flex items-center justify-center gap-1.5"
            >
              <span className="w-1 h-1 rounded-full bg-green-400/60" />
              Live data from OpenSea · Monad chain
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── About the 10K Squad ──────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-12 py-16 z-10"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-2">About the 10K Squad</h2>
          <p className="text-muted-foreground text-center mb-10 text-sm">Your portal through the Monad Ecosystem</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎨",
                title: "Hand-Drawn, Every 1/1",
                desc: "10,000 unique NFTs crafted by 3 lead artists and 7 guest artists over 11 months — all created live in VC sessions. Every single piece is one-of-a-kind.",
              },
              {
                icon: "⛓️",
                title: "Built on Monad",
                desc: "Living on Monad Mainnet — 10,000 TPS, 0.8s finality, near-zero gas. Drops process without congestion. Trade on Magic Eden.",
              },
              {
                icon: "🎮",
                title: "Holder Rewards Hub",
                desc: "Earn points automatically just by holding. Play memory games, speed challenges and mini-games at the10ksquadhub.com. GTD whitelist for 8 Monad projects.",
              },
            ].map(f => (
              <div key={f.title} className="rounded-3xl border border-white/10 p-8 flex flex-col gap-4" style={{ background: "rgba(88,28,135,0.12)" }}>
                <div className="text-4xl">{f.icon}</div>
                <div className="text-xl font-bold text-white">{f.title}</div>
                <div className="text-muted-foreground text-[15px] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── App Features ─────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-12 py-16 z-10"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12">Built for the culture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "📸", title: "Share Moments", desc: "Post photos and videos. Add stories that disappear in 24 hours. Your feed stays fresh and alive." },
              { icon: "⚡", title: "Flow — Short Videos", desc: "Swipe through full-screen video content from the community. Like, comment and discover new creators." },
              { icon: "💜", title: "10K Squad Home", desc: "Squawk is built for the 10K Squad community. Connect, post, and stay ahead of every Monad drop." },
            ].map(f => (
              <div key={f.title} className="rounded-3xl border border-white/10 p-8 flex flex-col gap-4" style={{ background: "rgba(88,28,135,0.12)" }}>
                <div className="text-4xl">{f.icon}</div>
                <div className="text-xl font-bold text-white">{f.title}</div>
                <div className="text-muted-foreground text-[15px] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Links ────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-12 py-12 z-10"
      >
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-4">
          {[
            { label: "Magic Eden", href: "https://magiceden.us/launchpad/monad/the_10k_squad" },
            { label: "10K Hub", href: "https://www.the10ksquadhub.com" },
            { label: "@the10kSquad", href: "https://x.com/the10ksquad" },
            { label: "OpenSea", href: "https://opensea.io/collection/the-10k-squad" },
          ].map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm font-medium backdrop-blur-sm"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </motion.section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-12 py-20 text-center z-10"
      >
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready to join the grid?</h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">Sign up in seconds and step into the Monad community.</p>
        <Link href="/sign-up">
          <button
            className="inline-flex h-14 items-center gap-2 rounded-full px-10 font-bold text-white text-lg transition-all hover:scale-105 shadow-2xl shadow-pink-900/50"
            style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
          >
            Create your Squawk
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </Link>
      </motion.section>

      <div className="h-8" />
      <SquawkBot />
    </div>
  );
}
