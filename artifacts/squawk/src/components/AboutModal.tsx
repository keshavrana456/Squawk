import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Camera, Zap, Heart, MessageCircle, Bell, User, Compass,
  Trophy, Globe, Gift, Star, Gamepad2, Users, TrendingUp,
  Mail, ExternalLink, Palette, Link2, Crown, Shield,
} from "lucide-react";

const FEATURES = [
  { Icon: Camera,         label: "Posts & Stories",   desc: "Share photos, videos, and 24-hour stories with the community." },
  { Icon: Zap,            label: "Flow — Reels",       desc: "Full-screen short video feed. Swipe, like, discover." },
  { Icon: MessageCircle,  label: "Chirps",             desc: "Short text posts (280 chars). Quick thoughts, instant reactions." },
  { Icon: Compass,        label: "Explore",            desc: "Discover trending posts, creators, and Monad events." },
  { Icon: Heart,          label: "Feed & Follow",      desc: "Personalised home feed from people you follow." },
  { Icon: MessageCircle,  label: "Direct Messages",    desc: "Private conversations with any squad member." },
  { Icon: Bell,           label: "Notifications",      desc: "Likes, comments, follows — all in one clean stream." },
  { Icon: User,           label: "Profiles",           desc: "Custom bio, banner, links, NFT showcase, and stats." },
  { Icon: Trophy,         label: "Contests",           desc: "Live contest tweets auto-fetched from @the10kSquad with countdown timers." },
  { Icon: Globe,          label: "NFT Activity",       desc: "Real-time 10K Squad sales — floor price, recent trades, and holder stats." },
  { Icon: Palette,        label: "Dark / Light Mode",  desc: "Switch between dark and light themes in Settings." },
  { Icon: Shield,         label: "Clerk Auth",         desc: "Secure sign-in with email or social. No wallet required." },
];

const PERKS = [
  { label: "Magma",    boost: "15% Points Boost",           color: "text-orange-400", bg: "rgba(249,115,22,0.12)" },
  { label: "Neverland",boost: "20% Pearls Boost",           color: "text-blue-400",   bg: "rgba(59,130,246,0.12)" },
  { label: "Kintsu",   boost: "25% Points Boost",           color: "text-yellow-400", bg: "rgba(234,179,8,0.12)"  },
  { label: "Pingu",    boost: "30% Boost + 2nd Referral",   color: "text-cyan-400",   bg: "rgba(6,182,212,0.12)"  },
  { label: "Bean",     boost: "20% Points Boost",           color: "text-pink-400",   bg: "rgba(236,72,153,0.12)" },
  { label: "Sherpa",   boost: "Vault Deposit Boost",        color: "text-emerald-400",bg: "rgba(16,185,129,0.12)" },
  { label: "Haha",     boost: "10% Karma Boost",            color: "text-purple-400", bg: "rgba(147,51,234,0.12)" },
  { label: "Fluffle",  boost: "15 Free Raffle Tickets",     color: "text-rose-400",   bg: "rgba(244,63,94,0.12)"  },
  { label: "Cultverse",boost: "20% Permanent Gem Boost",    color: "text-violet-400", bg: "rgba(139,92,246,0.12)" },
];

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="about-backdrop"
        className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      >
        <motion.div
          key="about-panel"
          className="relative w-full max-w-2xl mx-auto my-8 mx-4 rounded-3xl overflow-hidden shadow-2xl"
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

          {/* Banner image */}
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

          <div className="px-6 pb-8 space-y-8">

            {/* What is Squawk */}
            <section>
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">About</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Squawk is a Twitter/Instagram-style social platform built exclusively for the <span className="text-white font-semibold">10K Squad</span> NFT community and the broader <span className="text-white font-semibold">Monad</span> ecosystem. Post, share reels, send chirps, DM, explore trending content, and stay on top of every contest and Monad drop — all in one place.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Posts", "Stories", "Reels", "Chirps", "DMs", "Explore", "Notifications", "Profiles", "Contests", "NFT Activity"].map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-purple-300 border border-purple-500/30" style={{ background: "rgba(147,51,234,0.1)" }}>{t}</span>
                ))}
              </div>
            </section>

            {/* Community images */}
            <section>
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">The Community</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-2xl overflow-hidden aspect-video">
                  <img src="/opengraph.jpg" alt="Squawk" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-end p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}>
                    <span className="text-white text-xs font-bold">Squawk Platform</span>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-video">
                  <img src="/nft-banner.png" alt="10K Squad" className="w-full h-full object-cover" style={{ objectPosition: "center 30%" }} />
                  <div className="absolute inset-0 flex items-end p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}>
                    <span className="text-white text-xs font-bold">10K Squad NFT</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/50 leading-relaxed">
                10K Squad is a 10,000-piece NFT collection on <span className="text-white/70">Monad</span> — one of the most active communities in the ecosystem. Holders unlock boosts, perks, and exclusive access across Monad partner protocols.
              </p>
            </section>

            {/* Platform features */}
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

            {/* Holder Perks */}
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
              <p className="mt-2 text-[10px] text-white/35 text-center">All perks auto-applied to verified 10K Squad holders</p>
            </section>

            {/* How it works */}
            <section>
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">How It Works</h3>
              <div className="space-y-3">
                {[
                  { n: "1", title: "Sign up", desc: "Create your Squawk account in seconds — email or social login via Clerk." },
                  { n: "2", title: "Set up your profile", desc: "Add a photo, banner, bio, and links. Showcase your NFT." },
                  { n: "3", title: "Post & Connect", desc: "Share posts, stories, reels, and chirps. Follow the people you care about." },
                  { n: "4", title: "Stay in the loop", desc: "Contest alerts, NFT sales, and Monad drops — all live on your feed." },
                ].map(s => (
                  <div key={s.n} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white mt-0.5" style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}>{s.n}</div>
                    <div>
                      <div className="text-xs font-bold text-white/90">{s.title}</div>
                      <div className="text-[10px] text-white/50">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Info row */}
            <section className="rounded-2xl border border-white/8 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between"><span className="text-white/40">App</span><span className="text-white/80 font-semibold">Squawk</span></div>
                <div className="flex justify-between"><span className="text-white/40">Version</span><span className="text-white/80 font-semibold">1.0.0</span></div>
                <div className="flex justify-between"><span className="text-white/40">Network</span><span className="text-white/80 font-semibold">Monad</span></div>
                <div className="flex justify-between"><span className="text-white/40">NFT Supply</span><span className="text-white/80 font-semibold">3,333</span></div>
                <div className="flex justify-between col-span-2"><span className="text-white/40">Contact</span><a href="mailto:squawk069@gmail.com" className="text-purple-400 hover:underline">squawk069@gmail.com</a></div>
              </div>
            </section>

            {/* Links */}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {[
                { label: "@the10kSquad", href: "https://x.com/the10ksquad" },
                { label: "Discord", href: "https://discord.gg/the10ksquad" },
                { label: "My Talking Squad", href: "https://my-talking-squad.vercel.app/" },
                { label: "OpenSea", href: "https://opensea.io/collection/the-10k-squad-350905768" },
                { label: "10K Hub", href: "https://www.the10ksquadhub.com" },
                { label: "squawk069@gmail.com", href: "mailto:squawk069@gmail.com" },
              ].map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/12 text-[11px] text-white/60 hover:text-white hover:border-white/30 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  {l.label} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>

            <p className="text-center text-[10px] text-white/25">Made with love for the 10K Squad community on Monad</p>
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
