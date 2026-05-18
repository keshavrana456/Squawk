import { Link } from "wouter";
import { motion } from "framer-motion";
import SquawkBot from "@/components/SquawkBot";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const NFT_STATS = [
  { label: "Total Supply", value: "10,000" },
  { label: "Unique Traits", value: "420+" },
  { label: "Holders", value: "3,812" },
  { label: "Floor Price", value: "0.45 ETH" },
];

const TRAITS = [
  { name: "Legendary", count: 150, color: "from-yellow-400 to-orange-500" },
  { name: "Epic", count: 850, color: "from-purple-400 to-pink-500" },
  { name: "Rare", count: 2000, color: "from-blue-400 to-cyan-500" },
  { name: "Common", count: 7000, color: "from-green-400 to-teal-500" },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden flex flex-col relative dark">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="w-full flex items-center justify-between p-6 md:px-12 relative z-20">
        <img src={`${BASE}/logo.png`} alt="Squawk" className="h-10 w-auto" />
        <div className="flex gap-4 items-center">
          <Link href="/sign-in" className="px-6 py-2 rounded-full font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors">
            Log In
          </Link>
          <Link href="/sign-up" className="px-6 py-2 rounded-full font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_24px_4px_rgba(219,39,119,0.35)]" style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}>
            Join Now
          </Link>
        </div>
      </nav>

      {/* ── Hero — NFT art as background ────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-8 pb-20 z-10 min-h-[88vh] overflow-hidden">

        {/* NFT banner as semi-transparent bg */}
        <div className="absolute inset-0 z-0">
          <img
            src={`${BASE}/nft-banner.png`}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ opacity: 0.18 }}
            aria-hidden="true"
          />
          {/* Dark gradient overlay so text stays readable */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(14,7,25,0.55) 0%, rgba(14,7,25,0.3) 40%, rgba(14,7,25,0.7) 100%)" }} />
        </div>

        {/* Ambient blobs on top of image */}
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
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            The new social grid is live
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 leading-tight text-white drop-shadow-xl">
            Culture at{" "}
            <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #f472b6, #c084fc, #818cf8)" }}>
              light speed.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto font-light drop-shadow-md">
            Squawk is where creators, communities, and culture collide.
            Fast, beautiful, and alive. Connect with the grid.
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

          {/* NFT Stats inside hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-16 max-w-2xl mx-auto"
          >
            {NFT_STATS.map(stat => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 p-4 text-center backdrop-blur-md"
                style={{ background: "rgba(88,28,135,0.2)" }}
              >
                <div className="text-2xl font-black text-white mb-0.5">{stat.value}</div>
                <div className="text-xs text-white/50 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Rarity Tiers ─────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-12 py-16 z-10"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-2">Rarity Tiers</h2>
          <p className="text-muted-foreground text-center mb-10 text-sm">Every 10K Squad bird has hand-crafted traits across 4 rarity tiers</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRAITS.map(t => (
              <div key={t.name} className="rounded-2xl border border-white/10 p-5 flex flex-col items-center gap-3" style={{ background: "rgba(88,28,135,0.12)" }}>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-black text-xs">{t.name[0]}</span>
                </div>
                <div className="text-white font-bold">{t.name}</div>
                <div className="text-muted-foreground text-sm">{t.count.toLocaleString()} birds</div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${t.color}`} style={{ width: `${(t.count / 10000) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Features ─────────────────────────────────────────────────── */}
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
              { icon: "📸", title: "Share Moments", desc: "Post photos and videos. Add stories that disappear in 24 hours. Go live with the grid." },
              { icon: "🐦", title: "10K Squad Perks", desc: "NFT holders unlock exclusive feeds, special badges, and priority features on Squawk." },
              { icon: "⚡", title: "Real-time Feed", desc: "Your feed updates in real-time. New posts surface instantly — never miss a drop." },
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

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-12 py-20 text-center z-10"
      >
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready to join the grid?</h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">Sign up in seconds. Your feed starts with 10 bot accounts so it's never empty.</p>
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
