import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Camera, MessageCircle, Bell, User, Compass,
  Trophy, Globe, Palette, Shield, Wallet,
  ExternalLink, CheckCircle, Film, MessageSquare,
  Home, Search, Play, Settings,
} from "lucide-react";

const FEATURES = [
  { Icon: Home,           label: "Home Feed",           desc: "Personalized feed of posts from people you follow. Like, comment, and share." },
  { Icon: Camera,         label: "Posts & Stories",     desc: "Share photos and videos. Stories expire after 24 hours." },
  { Icon: Film,           label: "Flows",               desc: "Full-screen short video feed. Swipe to discover creators." },
  { Icon: MessageSquare,  label: "Chirps",              desc: "Short text posts up to 280 chars. Quick thoughts, reactions, rechirps." },
  { Icon: Search,         label: "Explore",             desc: "Trending posts, featured creators, hashtags, and Monad events." },
  { Icon: MessageCircle,  label: "Direct Messages",     desc: "Private 1-on-1 conversations with any squad member." },
  { Icon: Bell,           label: "Notifications",       desc: "Real-time alerts for likes, comments, follows, and mentions." },
  { Icon: User,           label: "Profiles",            desc: "Custom bio, banner, avatar, links, and NFT showcase on your profile." },
  { Icon: Trophy,         label: "Live Contests",       desc: "Contest announcements and countdown timers. Enter from the landing page." },
  { Icon: Globe,          label: "NFT Activity",        desc: "Real-time 10K Squad sales, floor price, holder stats, and recent trades." },
  { Icon: Play,           label: "Video Calls",         desc: "Live video calls powered by Stream. Start a call from any conversation." },
  { Icon: Wallet,         label: "My NFTs",             desc: "Connect your wallet in your profile to view your 10K Squad NFTs." },
  { Icon: Palette,        label: "Themes",              desc: "Switch between dark and light mode in Settings." },
  { Icon: Shield,         label: "Holder Verification", desc: "EVM wallet verification on sign-up confirms your 10K Squad holding." },
];

const PAGES = [
  { path: "/home",          label: "Home",           desc: "Your main feed — posts from people you follow" },
  { path: "/explore",       label: "Explore",        desc: "Discover trending content and creators" },
  { path: "/flows",         label: "Flows",          desc: "Short video feed — swipe through content" },
  { path: "/chirps",        label: "Chirps",         desc: "Twitter-style short text posts and replies" },
  { path: "/messages",      label: "Messages",       desc: "Private DMs with other members" },
  { path: "/notifications", label: "Notifications",  desc: "All your likes, comments, and follows" },
  { path: "/upload",        label: "Upload",         desc: "Share a photo, video, or story" },
  { path: "/settings",      label: "Settings",       desc: "Profile, theme, notification settings" },
];

const PERKS = [
  { label: "Magma",     boost: "15% Points Boost",         color: "text-orange-400", bg: "rgba(249,115,22,0.12)" },
  { label: "Neverland", boost: "20% Pearls Boost",         color: "text-blue-400",   bg: "rgba(59,130,246,0.12)" },
  { label: "Kintsu",    boost: "25% Points Boost",         color: "text-yellow-400", bg: "rgba(234,179,8,0.12)"  },
  { label: "Pingu",     boost: "30% Boost + 2nd Referral", color: "text-cyan-400",   bg: "rgba(6,182,212,0.12)"  },
  { label: "Bean",      boost: "20% Points Boost",         color: "text-pink-400",   bg: "rgba(236,72,153,0.12)" },
  { label: "Sherpa",    boost: "Vault Deposit Boost",       color: "text-emerald-400",bg: "rgba(16,185,129,0.12)" },
  { label: "Haha",      boost: "10% Karma Boost",          color: "text-purple-400", bg: "rgba(147,51,234,0.12)" },
  { label: "Fluffle",   boost: "15 Free Raffle Tickets",   color: "text-rose-400",   bg: "rgba(244,63,94,0.12)"  },
  { label: "Cultverse", boost: "20% Gem Boost",            color: "text-violet-400", bg: "rgba(139,92,246,0.12)" },
];

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  const [tab, setTab] = useState<"about" | "guide" | "nft">("about");

  return (
    <AnimatePresence>
      <motion.div
        key="about-backdrop"
        className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          key="about-panel"
          className="relative w-full max-w-sm md:max-w-xl lg:max-w-2xl mx-auto my-8 rounded-3xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "#0f0a1a", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Banner */}
          <div className="relative w-full h-44 overflow-hidden">
            <img
              src="/nft-banner.png"
              alt="10K Squad"
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 30%" }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,10,26,0) 30%, rgba(15,10,26,1))" }} />
            <div className="absolute bottom-4 left-5 flex items-center gap-3">
              <img src="/logo.png" alt="Squawk" className="w-10 h-10 rounded-2xl shadow-lg ring-2 ring-purple-500/40" />
              <div>
                <div className="text-white font-black text-xl leading-none">Squawk</div>
                <div className="text-white/50 text-xs mt-0.5">The Social Home of the 10K Squad</div>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-white/8 px-6 pt-4 gap-1">
            {(["about", "guide", "nft"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  tab === t
                    ? "text-purple-300 border-b-2 border-purple-400 -mb-px bg-purple-500/10"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "about" ? "About" : t === "guide" ? "How to Use" : "10K NFT"}
              </button>
            ))}
          </div>

          <div className="px-6 pb-8 space-y-8 pt-6">

            {/* ── ABOUT TAB ── */}
            {tab === "about" && (
              <>
                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">What is Squawk?</h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Squawk is a <span className="text-white font-semibold">Twitter/Instagram-style social platform</span> built exclusively for the <span className="text-white font-semibold">10K Squad NFT</span> community and the broader <span className="text-white font-semibold">Monad</span> ecosystem. Post, share Flows, send Chirps, DM, explore trending content, and stay on top of every contest and Monad drop — all in one place.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Posts", "Stories", "Flows", "Chirps", "DMs", "Explore", "Notifications", "Profiles", "Contests", "NFT Activity", "Live Video", "My NFTs"].map(t => (
                      <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-purple-300 border border-purple-500/30" style={{ background: "rgba(147,51,234,0.1)" }}>{t}</span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Verification & Access</h3>
                  <div className="space-y-2.5">
                    {[
                      { icon: "👀", title: "Visit as Guest", desc: "Browse the landing page, see NFT stats, contests, and recent sales. No account needed — just click 'Visit as Guest' in the navbar." },
                      { icon: "🦜", title: "Verify to Join", desc: "Click 'Enter the Grid' or 'Join Now' to open the NFT verification modal. Paste your EVM wallet address — we scan on-chain to confirm your 10K Squad holdings." },
                      { icon: "✅", title: "Holder Access", desc: "If you hold a 10K Squad NFT, you'll see your NFTs in a carousel and can create your account right away." },
                      { icon: "❌", title: "Non-Holder", desc: "No 10K Squad NFTs? You'll get a link to buy one on OpenSea, or can still browse as a guest." },
                    ].map(s => (
                      <div key={s.title} className="flex gap-3 p-3 rounded-2xl border border-white/6" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <span className="text-xl shrink-0">{s.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-white/90">{s.title}</div>
                          <div className="text-[11px] text-white/50 leading-relaxed mt-0.5">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Platform Features</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {FEATURES.map(f => (
                      <div key={f.label} className="flex items-start gap-2.5 p-3 rounded-2xl border border-white/6" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(147,51,234,0.15)", border: "1px solid rgba(147,51,234,0.3)" }}>
                          <f.Icon className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white/90 leading-snug">{f.label}</div>
                          <div className="text-[10px] text-white/45 leading-snug mt-0.5">{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/8 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-white/40">App</span><span className="text-white/80 font-semibold">Squawk</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Version</span><span className="text-white/80 font-semibold">1.0.0</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Network</span><span className="text-white/80 font-semibold">Monad</span></div>
                    <div className="flex justify-between"><span className="text-white/40">NFT Supply</span><span className="text-white/80 font-semibold">3,333</span></div>
                    <div className="flex justify-between col-span-2"><span className="text-white/40">Contact</span><a href="mailto:squawk069@gmail.com" className="text-purple-400 hover:underline">squawk069@gmail.com</a></div>
                  </div>
                </section>

                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {[
                    { label: "@the10kSquad", href: "https://x.com/the10ksquad" },
                    { label: "Discord", href: "https://discord.gg/the10ksquad" },
                    { label: "My Talking Squad", href: "https://my-talking-squad.vercel.app/" },
                    { label: "OpenSea", href: "https://opensea.io/collection/the-10k-squad-350905768" },
                    { label: "10K Hub", href: "https://www.the10ksquadhub.com" },
                  ].map(l => (
                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/12 text-[11px] text-white/60 hover:text-white hover:border-white/30 transition-all"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      {l.label} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>

                <p className="text-center text-[10px] text-white/25">Made with love for the 10K Squad community on Monad</p>
              </>
            )}

            {/* ── HOW TO USE TAB ── */}
            {tab === "guide" && (
              <>
                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Getting Started</h3>
                  <div className="space-y-3">
                    {[
                      { n: "1", title: "Verify your NFT", desc: "Click 'Enter the Grid' on the landing page. Paste your EVM wallet — we check if you hold a 10K Squad NFT on Monad.", badge: "Required" },
                      { n: "2", title: "Create your account", desc: "Once verified, sign up with email or social login via Clerk. Fast and secure.", badge: "Sign up" },
                      { n: "3", title: "Set up your profile", desc: "Add your avatar, banner, bio, and links. Go to your profile → click 'Edit Profile'.", badge: "Profile" },
                      { n: "4", title: "Start posting", desc: "Hit the '+' button on mobile or use the sidebar to upload posts, stories, and flows.", badge: "Post" },
                      { n: "5", title: "Connect with the squad", desc: "Follow creators, like posts, leave comments, send DMs. Use Explore to find new people.", badge: "Social" },
                    ].map(s => (
                      <div key={s.n} className="flex gap-3 items-start p-3 rounded-2xl border border-white/6" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white" style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}>{s.n}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-bold text-white/90">{s.title}</div>
                            <span className="text-[9px] font-bold text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/30" style={{ background: "rgba(147,51,234,0.1)" }}>{s.badge}</span>
                          </div>
                          <div className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Pages & Navigation</h3>
                  <div className="space-y-1.5">
                    {PAGES.map(p => (
                      <div key={p.path} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/6" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <code className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg shrink-0">{p.path}</code>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-white/80">{p.label}</span>
                          <span className="text-[10px] text-white/40 ml-2">{p.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Content Types</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { emoji: "🖼️", title: "Posts", desc: "Photos & videos with captions and hashtags. Appear in Home and Explore feeds." },
                      { emoji: "⏱️", title: "Stories", desc: "24-hour ephemeral content. Shown as circles at the top of Home." },
                      { emoji: "🎬", title: "Flows", desc: "Short full-screen videos. Dedicated swipe feed at /flows." },
                      { emoji: "💬", title: "Chirps", desc: "280-char text posts. Reply, rechirp, and like. Like Twitter." },
                    ].map(c => (
                      <div key={c.title} className="p-3 rounded-2xl border border-white/6" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="text-xl mb-1.5">{c.emoji}</div>
                        <div className="text-xs font-bold text-white/90">{c.title}</div>
                        <div className="text-[10px] text-white/45 mt-0.5 leading-relaxed">{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">My NFTs Tab</h3>
                  <div className="space-y-2 text-sm text-white/60 leading-relaxed">
                    <p>Go to your <span className="text-white font-semibold">Profile</span> and click the <span className="text-white font-semibold">🦜 My NFTs</span> tab.</p>
                    <p>Paste your EVM wallet address and hit <span className="text-white font-semibold">Verify</span> to see all your 10K Squad NFTs displayed in a grid with links to OpenSea.</p>
                    <p className="text-[11px] text-white/35">Your wallet address is saved locally for convenience. It is never stored on our servers.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Tips</h3>
                  <div className="space-y-2">
                    {[
                      "Use hashtags in posts and chirps to appear in Explore searches",
                      "Story rings glow pink when a user has an active story",
                      "Double-tap a post image to quickly like it",
                      "Your profile shows Posts, Flow, Chirps, and My NFTs tabs",
                      "Enable push notifications in Settings to never miss an alert",
                      "Visitors can view profiles but see a disabled Follow button",
                    ].map((tip, i) => (
                      <div key={i} className="flex gap-2 items-start text-[11px] text-white/55">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ── 10K NFT TAB ── */}
            {tab === "nft" && (
              <>
                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">The 10K Squad NFT</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="relative rounded-2xl overflow-hidden aspect-video">
                      <img src="/opengraph.jpg" alt="Squawk" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-end p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}>
                        <span className="text-white text-xs font-bold">Squawk Platform</span>
                      </div>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden aspect-video">
                      <img src="/squad-nft-avatar.png" alt="10K Squad NFT" className="w-full h-full object-cover object-center" />
                      <div className="absolute inset-0 flex items-end p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}>
                        <span className="text-white text-xs font-bold">10K Squad NFT</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    <span className="text-white font-semibold">10K Squad</span> is a <span className="text-white font-semibold">3,333-piece</span> hand-drawn NFT collection on <span className="text-white font-semibold">Monad</span> — one of the most active and tight-knit communities in the ecosystem. Each NFT is a unique parrot with custom traits. Holders unlock boosts, perks, exclusive access across partner protocols, and now — Squawk.
                  </p>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Collection Stats</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Total Supply", value: "3,333" },
                      { label: "Chain", value: "Monad" },
                      { label: "Type", value: "ERC-721" },
                      { label: "Hand-drawn", value: "1/1s" },
                      { label: "Marketplace", value: "OpenSea" },
                      { label: "Community", value: "Active 🔥" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-2.5 text-center border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="text-sm font-black text-white">{s.value}</div>
                        <div className="text-[9px] text-white/40 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Holder Ecosystem Perks</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {PERKS.map(p => (
                      <div key={p.label} className="rounded-2xl p-3 border border-white/6 text-center" style={{ background: p.bg }}>
                        <div className={`text-[11px] font-black ${p.color}`}>{p.label}</div>
                        <div className="text-[9px] text-white/50 mt-0.5 leading-snug">{p.boost}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-white/35 text-center">Perks apply to verified 10K Squad holders across Monad partner protocols</p>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">How to Get a 10K Squad NFT</h3>
                  <div className="space-y-2.5">
                    {[
                      { n: "1", title: "Get a Monad wallet", desc: "Use MetaMask, Rabby, or any EVM wallet. Connect to Monad network (Chain ID: 143, RPC: rpc.monad.xyz)." },
                      { n: "2", title: "Get MON tokens", desc: "Acquire MON (Monad's native token) to buy the NFT and cover gas fees." },
                      { n: "3", title: "Visit OpenSea", desc: "Go to the 10K Squad collection on OpenSea. Buy at floor price or make an offer." },
                      { n: "4", title: "Verify on Squawk", desc: "Come back to Squawk, click 'Enter the Grid', paste your wallet address, and join the community!" },
                    ].map(s => (
                      <div key={s.n} className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white mt-0.5" style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}>{s.n}</div>
                        <div>
                          <div className="text-xs font-bold text-white/90">{s.title}</div>
                          <div className="text-[10px] text-white/50 leading-relaxed">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {[
                    { label: "OpenSea Collection", href: "https://opensea.io/collection/the-10k-squad-350905768" },
                    { label: "@the10kSquad", href: "https://x.com/the10ksquad" },
                    { label: "Discord", href: "https://discord.gg/the10ksquad" },
                    { label: "10K Hub", href: "https://www.the10ksquadhub.com" },
                  ].map(l => (
                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/12 text-[11px] text-white/60 hover:text-white hover:border-white/30 transition-all"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      {l.label} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>

                <p className="text-center text-[10px] text-white/25">WAGM — We're All Gonna Monad 🦜</p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useAboutModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    show: () => setOpen(true),
    hide: () => setOpen(false),
    modal: open ? <AboutModal onClose={() => setOpen(false)} /> : null,
  };
}
