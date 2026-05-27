import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { Palette, Link2, Gamepad2, Camera, Zap, Heart, Trophy, Globe, Gift, Users, TrendingUp, Star, ArrowRight, ExternalLink, Crown, RefreshCw, Info } from "lucide-react";
import { useAboutModal } from "@/components/AboutModal";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CONTEST_END = new Date("2026-05-31T12:00:00Z");

function useContestCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = CONTEST_END.getTime() - Date.now();
    if (diff <= 0) return null;
    const totalSecs = Math.floor(diff / 1000);
    return {
      days: Math.floor(totalSecs / 86400),
      hours: Math.floor((totalSecs % 86400) / 3600),
      minutes: Math.floor((totalSecs % 3600) / 60),
      seconds: totalSecs % 60,
    };
  });

  useEffect(() => {
    const tick = () => {
      const diff = CONTEST_END.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      const totalSecs = Math.floor(diff / 1000);
      setTimeLeft({
        days: Math.floor(totalSecs / 86400),
        hours: Math.floor((totalSecs % 86400) / 3600),
        minutes: Math.floor((totalSecs % 3600) / 60),
        seconds: totalSecs % 60,
      });
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

interface NftSale {
  id: string;
  tokenId: string;
  name: string;
  imageUrl: string | null;
  priceFormatted: string;
  symbol: string;
  seller: string;
  buyer: string;
  txHash: string | null;
  openseaUrl: string | null;
  timestamp: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SaleCard({ sale, index }: { sale: NftSale; index: number }) {
  return (
    <motion.a
      href={sale.openseaUrl ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 hover:border-pink-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(236,72,153,0.2)] cursor-pointer flex-shrink-0 w-48"
      style={{ background: "linear-gradient(160deg, rgba(88,28,135,0.25) 0%, rgba(14,7,25,0.6) 100%)" }}
    >
      {/* NFT Image */}
      <div className="relative w-full aspect-square bg-white/5 overflow-hidden">
        {sale.imageUrl ? (
          <img
            src={sale.imageUrl}
            alt={sale.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🦜</div>
        )}
        {/* Price badge */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold text-white backdrop-blur-md"
          style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.85), rgba(147,51,234,0.85))" }}>
          {sale.priceFormatted}
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3.5 h-3.5 text-white/70" />
        </div>
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="text-[13px] font-bold text-white truncate">{sale.name}</div>
        <div className="flex items-center gap-1 text-[10px] text-white/40">
          <span className="truncate">{sale.seller}</span>
          <ArrowRight className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{sale.buyer}</span>
        </div>
        <div className="text-[10px] text-white/30">{timeAgo(sale.timestamp)}</div>
      </div>

      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
        style={{ boxShadow: "inset 0 0 30px rgba(236,72,153,0.08)" }} />
    </motion.a>
  );
}

function LiveSalesFeed() {
  const [sales, setSales] = useState<NftSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSaleIds, setNewSaleIds] = useState<Set<string>>(new Set());
  const prevIds = useRef<Set<string>>(new Set());

  const fetchSales = useCallback(async (isRefresh = false) => {
    try {
      const res = await fetch(`${BASE}/api/nft/sales`);
      if (!res.ok) return;
      const data: NftSale[] = await res.json();
      if (isRefresh) {
        const incoming = new Set(data.map(s => s.id));
        const newOnes = new Set([...incoming].filter(id => !prevIds.current.has(id)));
        if (newOnes.size > 0) setNewSaleIds(newOnes);
        setTimeout(() => setNewSaleIds(new Set()), 3000);
      }
      prevIds.current = new Set(data.map(s => s.id));
      setSales(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales(false);
    const interval = setInterval(() => fetchSales(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchSales]);

  if (!loading && sales.length === 0) return null;

  return (
    <motion.section
      id="recent-sales"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="px-4 md:px-12 py-16 z-10"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Live</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">Recent Sales</h2>
            <p className="text-muted-foreground text-sm mt-1">Latest 10K Squad trades on OpenSea · refreshes every 30s</p>
          </div>
          <a
            href="https://opensea.io/collection/the-10k-squad-350905768"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all text-sm font-medium"
          >
            View all on OpenSea <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Scrollable card strip */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 rounded-2xl border border-white/10 overflow-hidden animate-pulse" style={{ background: "rgba(88,28,135,0.15)" }}>
                <div className="aspect-square bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-full" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-4" style={{ width: "max-content" }}>
              {sales.map((sale, i) => (
                <div key={sale.id} className="relative">
                  {newSaleIds.has(sale.id) && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 3 }}
                      className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
                    >
                      NEW
                    </motion.div>
                  )}
                  <SaleCard sale={sale} index={i} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile view-all link */}
        <div className="mt-4 flex md:hidden justify-center">
          <a
            href="https://opensea.io/collection/the-10k-squad-350905768"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-pink-400 transition-colors font-medium"
          >
            View all on OpenSea <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.section>
  );
}

// ── Top Holders Leaderboard ──────────────────────────────────────────────────
interface HolderEntry {
  address: string;
  count: number;
}

interface HoldersResponse {
  status: "ready" | "scanning";
  scannedAt?: number;
  totalHolders?: number;
  data: HolderEntry[];
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function shortAddr(addr: string): string {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className="text-lg leading-none">{MEDAL[rank]}</span>;
  }
  return (
    <span className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold text-white/50 bg-white/8 border border-white/10">
      {rank}
    </span>
  );
}

function TopHolders() {
  const [holders, setHolders] = useState<HolderEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "scanning" | "ready">("loading");
  const [scannedAt, setScannedAt] = useState<number | null>(null);
  const [totalHolders, setTotalHolders] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetch25 = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/nft/holders?limit=25`);
      if (!res.ok) return;
      const json: HoldersResponse = await res.json();
      setStatus(json.status === "ready" ? "ready" : "scanning");
      setHolders(json.data ?? []);
      if (json.scannedAt) setScannedAt(json.scannedAt);
      if (json.totalHolders) setTotalHolders(json.totalHolders);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetch25();
    // Re-poll every 60s so we pick up fresh scan results
    const id = setInterval(fetch25, 60_000);
    return () => clearInterval(id);
  }, [fetch25]);

  const display = showAll ? holders : holders.slice(0, 10);

  return (
    <motion.section
      id="top-holders"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="px-4 md:px-12 py-16 z-10"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">On-Chain</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">Top Holders</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Wallets ranked by 10K Squad NFTs held · live multicall data
            </p>
          </div>
          {scannedAt && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-white/30 mt-1">
              <RefreshCw className="w-3 h-3" />
              <span>Scanned {Math.round((Date.now() - scannedAt) / 60000)}m ago</span>
            </div>
          )}
        </div>

        {/* Scanning state */}
        {status === "scanning" && holders.length === 0 && (
          <div className="rounded-2xl border border-white/10 p-10 text-center" style={{ background: "rgba(88,28,135,0.15)" }}>
            <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60 text-sm">Scanning all 3,333 tokens on-chain…</p>
            <p className="text-white/30 text-xs mt-1">This takes a minute on first load</p>
          </div>
        )}

        {/* Loading skeleton */}
        {status === "loading" && (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl border border-white/8 animate-pulse" style={{ background: "rgba(88,28,135,0.12)" }} />
            ))}
          </div>
        )}

        {/* Leaderboard table */}
        {holders.length > 0 && (
          <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(14,7,25,0.5)" }}>
            {display.map((h, idx) => {
              const rank = idx + 1;
              const pct = Math.round((h.count / (totalHolders ? Math.max(...holders.map(x => x.count)) : h.count)) * 100);
              return (
                <motion.div
                  key={h.address}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  className={`flex items-center gap-4 px-5 py-3.5 border-b border-white/6 last:border-b-0 group hover:bg-white/3 transition-colors ${rank <= 3 ? "bg-yellow-400/4" : ""}`}
                >
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <RankBadge rank={rank} />
                  </div>

                  {/* Address + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <a
                        href={`https://monadexplorer.com/address/${h.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-white/80 hover:text-pink-400 transition-colors group-hover:text-white"
                      >
                        {shortAddr(h.address)}
                      </a>
                      <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.03 + 0.2 }}
                        className="h-full rounded-full"
                        style={{
                          background: rank === 1
                            ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                            : rank === 2
                            ? "linear-gradient(90deg, #94a3b8, #64748b)"
                            : rank === 3
                            ? "linear-gradient(90deg, #cd7c4c, #a05b2e)"
                            : "linear-gradient(90deg, #ec4899, #9333ea)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Count */}
                  <div className="text-right shrink-0">
                    <span className={`text-lg font-black ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-300" : rank === 3 ? "text-amber-600" : "text-white"}`}>
                      {h.count}
                    </span>
                    <span className="text-xs text-white/30 ml-1">NFTs</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Show more / less */}
        {holders.length > 10 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAll(v => !v)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm font-medium"
            >
              {showAll ? "Show less" : `Show top 25 holders`}
            </button>
          </div>
        )}

        {/* Footer note */}
        {status === "ready" && totalHolders && (
          <p className="text-center text-xs text-white/25 mt-5">
            {totalHolders.toLocaleString()} unique wallets · read via Multicall3 on Monad
          </p>
        )}
      </div>
    </motion.section>
  );
}

interface ContestTweet {
  id: number;
  tweetId: string;
  text: string;
  authorHandle: string;
  authorName: string;
  mediaUrl: string | null;
  tweetUrl: string;
  postedAt: string;
}

function useContestFeed() {
  const [tweets, setTweets] = useState<ContestTweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE}/api/contests`);
        if (!res.ok) return;
        const data = await res.json();
        setTweets(data.tweets ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return { tweets, loading };
}

function OngoingContest() {
  const contestCountdown = useContestCountdown();
  const { tweets, loading } = useContestFeed();
  return (
    <motion.section
      id="contests"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="px-4 md:px-12 py-16 z-10"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-red-400 border border-red-500/40" style={{ background: "rgba(239,68,68,0.1)" }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE NOW
              </span>
              <span className="text-xs text-white/30">via @the10kSquad</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">Squad Contests</h2>
            <p className="text-muted-foreground mt-1 text-sm max-w-lg">
              10K Squad runs real contests with real prizes — $MON, NFTs, and more. Holders only.
            </p>
          </div>
          <a
            href="https://x.com/the10ksquad"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]"
            style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
          >
            <ExternalLink className="w-4 h-4" />
            Follow on X
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── TRADING CONTEST — ACTIVE ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0 }}
            className="relative rounded-3xl overflow-hidden border flex flex-col"
            style={{
              background: "linear-gradient(135deg, rgba(236,72,153,0.10) 0%, rgba(147,51,234,0.14) 60%, rgba(14,7,25,0.7) 100%)",
              borderColor: "rgba(236,72,153,0.35)",
              boxShadow: "0 0 50px rgba(236,72,153,0.08) inset",
            }}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(236,72,153,0.14)" }} />

            {/* Banner image */}
            <div className="relative w-full h-40 overflow-hidden">
              <img
                src="https://pbs.twimg.com/media/HJKe7j7WUAAXbZM.jpg"
                alt="Squad Trading Contest"
                className="w-full h-full object-cover object-top opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold text-red-400 border border-red-500/50" style={{ background: "rgba(0,0,0,0.6)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {contestCountdown ? "LIVE — ENDS MAY 31" : "ENDED"}
              </div>
            </div>

            <div className="relative z-10 p-6 flex flex-col flex-1">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">🏆</div>
                <div>
                  <div className="text-xs font-bold text-yellow-400 tracking-widest uppercase mb-0.5">Trading Contest</div>
                  <div className="text-xl font-black text-white leading-tight">Squad Trading Contest</div>
                  <div className="text-xs text-white/45 mt-0.5">May 25 – 31, 2026 · 12:00 UTC</div>
                </div>
              </div>

              {/* Countdown Timer */}
              {contestCountdown ? (
                <div className="rounded-2xl border border-pink-500/20 p-3 mb-4" style={{ background: "rgba(236,72,153,0.06)" }}>
                  <div className="text-[10px] font-bold text-pink-400/70 uppercase tracking-widest mb-2 text-center">Time Remaining</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: contestCountdown.days, label: "Days" },
                      { value: contestCountdown.hours, label: "Hrs" },
                      { value: contestCountdown.minutes, label: "Min" },
                      { value: contestCountdown.seconds, label: "Sec" },
                    ].map(({ value, label }) => (
                      <div key={label} className="flex flex-col items-center rounded-xl py-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                        <span className="text-xl font-black text-white tabular-nums leading-none">
                          {String(value).padStart(2, "0")}
                        </span>
                        <span className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mt-0.5">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 p-3 mb-4 text-center text-sm text-white/40 font-semibold">
                  Contest has ended
                </div>
              )}

              <p className="text-sm text-white/55 leading-relaxed mb-4">
                Celebrating over <span className="text-white font-semibold">1 million volume on OpenSea</span>. Trade, profit, accumulate — open to current holders and new members alike.
              </p>

              {/* Prize */}
              <div className="rounded-2xl border border-yellow-400/20 p-3 mb-4 flex items-center gap-3" style={{ background: "rgba(251,191,36,0.06)" }}>
                <span className="text-2xl">🎁</span>
                <div>
                  <div className="text-sm font-black text-white">Prize Pool</div>
                  <div className="text-xs text-yellow-300 font-semibold">20 × The 10K Squad NFTs</div>
                  <div className="text-[11px] text-white/35">Winners drawn live in Discord VC</div>
                </div>
              </div>

              {/* Steps */}
              <div className="rounded-2xl border border-white/8 p-4 mb-5 space-y-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="text-xs font-bold text-white/60 uppercase tracking-wide mb-2">How to enter (holders)</div>
                {[
                  "Sell 1 NFT for profit at floor price",
                  "Buy 1 NFT from the floor (direct only, no offers)",
                  "HODL that NFT unlisted until May 31",
                  "Fill out the entry form",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/55">
                    <span className="w-4 h-4 rounded-full bg-pink-500/20 text-pink-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-auto">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScLuEZjRRaHKdAlpIJK-vo53pvozIFydhir-syB4xhwsdr9wg/viewform?usp=header"
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                  style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
                >
                  Enter Now ↗
                </a>
                <a
                  href="https://x.com/the10kSquad/status/2055284732938666165"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Post
                </a>
              </div>
            </div>
          </motion.div>

          {/* ── CODING CONTEST — EXTENDED / ACTIVE ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="relative rounded-3xl overflow-hidden border flex flex-col"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(147,51,234,0.16) 60%, rgba(14,7,25,0.7) 100%)",
              borderColor: "rgba(99,102,241,0.45)",
              boxShadow: "0 0 50px rgba(99,102,241,0.08) inset",
            }}
          >
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(99,102,241,0.18)" }} />

            {/* Banner image */}
            <div className="relative w-full h-40 overflow-hidden">
              <img
                src="https://pbs.twimg.com/media/HGrY5DiXYAA8IES.jpg"
                alt="Squad Coding Contest"
                className="w-full h-full object-cover object-top opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold text-indigo-300 border border-indigo-500/50" style={{ background: "rgba(0,0,0,0.6)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                EXTENDED — SUBMIT BY MAY 29
              </div>
            </div>

            <div className="relative z-10 p-6 flex flex-col flex-1">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">💻</div>
                <div>
                  <div className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-0.5">Coding Contest</div>
                  <div className="text-xl font-black text-white leading-tight">Squad Coding Contest</div>
                  <div className="text-xs text-white/45 mt-0.5">Apr 24 – May 29, 2026 · Extended!</div>
                </div>
              </div>

              <p className="text-sm text-white/55 leading-relaxed mb-4">
                Build anything using the 10K Squad parrots — a game, app, page, or anything fun. Extended due to <span className="text-white font-semibold">so many amazing submissions</span>. Holders only.
              </p>

              {/* Schedule */}
              <div className="rounded-2xl border border-indigo-400/20 p-3 mb-4 space-y-2" style={{ background: "rgba(99,102,241,0.07)" }}>
                <div className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest mb-1">Live Judging Schedule</div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">R1</span>
                  <div>
                    <div className="text-white/80 font-semibold">Round 1 — May 30 · 13:00 UTC</div>
                    <div className="text-white/40">10 finalists selected · Discord stage</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[10px]">🏆</span>
                  <div>
                    <div className="text-white/80 font-semibold">Final Round — May 31 · 13:00 UTC</div>
                    <div className="text-white/40">Winner chosen from top 10 · Discord stage</div>
                  </div>
                </div>
              </div>

              {/* Prize breakdown */}
              <div className="rounded-2xl border border-indigo-400/15 p-4 mb-4 space-y-1.5" style={{ background: "rgba(99,102,241,0.06)" }}>
                <div className="text-xs font-bold text-white/60 uppercase tracking-wide mb-2">Prize Pool</div>
                {[
                  { place: "🥇", prize: "10,000 $MON + 5 NFTs" },
                  { place: "🥈", prize: "4,000 $MON + 4 NFTs" },
                  { place: "🥉", prize: "3,000 $MON + 3 NFTs" },
                  { place: "4th", prize: "2,000 $MON + 2 NFTs" },
                  { place: "5th", prize: "1,000 $MON + 1 NFT" },
                ].map((p) => (
                  <div key={p.place} className="flex items-center justify-between text-xs">
                    <span className="text-white/50">{p.place}</span>
                    <span className="text-white/80 font-semibold">{p.prize}</span>
                  </div>
                ))}
              </div>

              {/* Rules */}
              <div className="rounded-2xl border border-white/8 p-4 mb-5 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="text-xs font-bold text-white/60 uppercase tracking-wide mb-2">How to enter</div>
                {[
                  "Build anything with 10K Squad parrots",
                  "Test it with friends and make sure it works",
                  "Post on X and tag @the10kSquad",
                  "Post your X link in the 10K Discord",
                  "Must be a holder to enter",
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/55">
                    <span className="text-indigo-400 font-bold shrink-0">·</span>
                    {rule}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-auto">
                <a
                  href="https://x.com/the10kSquad/status/2055284732938666165"
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  style={{ background: "linear-gradient(135deg, #6366f1, #9333ea)" }}
                >
                  View Extension Post ↗
                </a>
                <a
                  href="https://x.com/the10kSquad/status/2047687465587069000"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Original
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Live from X feed ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 rounded-3xl border border-white/10 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-bold text-white/80">Live from @the10kSquad</span>
              <span className="text-xs text-white/35">· auto-updates every 5 min</span>
            </div>
            <a href="https://x.com/the10ksquad" target="_blank" rel="noopener noreferrer"
              className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Follow ↗
            </a>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
            </div>
          ) : tweets.length === 0 ? (
            <div className="text-center py-8 text-sm text-white/30">
              No contest updates fetched yet — check back shortly.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {tweets.map((tweet) => (
                <a
                  key={tweet.tweetId}
                  href={tweet.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 p-4 hover:bg-white/[0.03] transition-colors group"
                >
                  <img
                    src="https://pbs.twimg.com/profile_images/1954851397649711104/evoBVFM0_200x200.jpg"
                    alt="10k Squad"
                    className="w-8 h-8 rounded-full shrink-0 mt-0.5 ring-1 ring-purple-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white/80">{tweet.authorName}</span>
                      <span className="text-[10px] text-white/35">@{tweet.authorHandle}</span>
                      <span className="text-[10px] text-white/25 ml-auto shrink-0">{timeAgo(new Date(tweet.postedAt).getTime())}</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                      {tweet.text}
                    </p>
                    {tweet.mediaUrl && (
                      <img
                        src={tweet.mediaUrl}
                        alt="contest media"
                        className="mt-2 rounded-xl w-full max-h-40 object-cover opacity-70"
                      />
                    )}
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-1" />
                </a>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-400 shrink-0" />
            <p className="text-sm text-white/60">
              New contests announced on <span className="text-white font-semibold">@the10kSquad</span> — follow for the latest drops, prizes, and Monad events.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <a href="https://x.com/the10ksquad" target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm font-medium">
              @the10kSquad ↗
            </a>
            <a href="https://discord.gg/the10ksquad" target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm font-medium">
              Discord ↗
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

interface NftStats {
  floorPrice: number | null;
  floorPriceSymbol: string | null;
  totalVolume: number | null;
  totalSales: number | null;
  numOwners: number | null;
  numListed: number | null;
  volume24h: number | null;
  volume7d: number | null;
  totalSupply: number;
  source: string | null;
  fetchedAt: number;
}

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPrice(n: number | null, symbol: string | null): string {
  if (n === null || n === 0) return "Not Listed";
  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol ?? "MON"}`;
}

function fmtVolume(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "0 MON";
  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatted} MON`;
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

function SectionNav({ onAbout }: { onAbout: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = [
    { label: "Live Squad Contests", href: "#contests", emoji: "🏆" },
    { label: "About the 10K Squad NFTs", href: "#about-10k", emoji: "🎨" },
    { label: "Holder Rewards Hub", href: "#holder-rewards", emoji: "💎" },
    { label: "Built for Culture", href: "#built-for-culture", emoji: "⚡" },
    { label: "About Squawk", href: null, emoji: "ℹ️", onClick: onAbout },
    { label: "Must Try", href: "#must-try", emoji: "⭐" },
  ];

  const handleClick = (href: string | null, onClick?: () => void) => {
    if (onClick) { onClick(); return; }
    if (href) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  return (
    <div className="relative z-10 py-6">
      <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest text-center mb-4">Jump to section</p>
      <div className="relative flex items-center gap-2 px-4">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-white/15 text-white/50 hover:text-white hover:border-white/35 hover:bg-white/8 transition-all text-sm font-bold select-none"
          aria-label="Scroll left"
        >
          ‹
        </button>

        {/* Scrollable strip */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none z-10"
            style={{ background: "linear-gradient(to right, rgba(5,0,15,0.9) 0%, transparent 100%)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none z-10"
            style={{ background: "linear-gradient(to left, rgba(5,0,15,0.9) 0%, transparent 100%)" }} />
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar px-3 py-1">
            {items.map((item, i) => {
              const glows = [
                "hover:border-pink-500/70 hover:shadow-[0_0_12px_rgba(236,72,153,0.45)]",
                "hover:border-fuchsia-500/70 hover:shadow-[0_0_12px_rgba(217,70,239,0.45)]",
                "hover:border-cyan-400/70 hover:shadow-[0_0_12px_rgba(34,211,238,0.45)]",
                "hover:border-violet-500/70 hover:shadow-[0_0_12px_rgba(139,92,246,0.45)]",
                "hover:border-indigo-400/70 hover:shadow-[0_0_12px_rgba(99,102,241,0.45)]",
                "hover:border-amber-400/70 hover:shadow-[0_0_12px_rgba(251,191,36,0.45)]",
              ];
              return (
                <button
                  key={item.label}
                  onClick={() => handleClick(item.href, item.onClick)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-transparent text-white/55 hover:text-white active:scale-95 transition-all duration-200 text-xs font-medium whitespace-nowrap shrink-0 ${glows[i % glows.length]}`}
                >
                  <span className="text-sm leading-none">{item.emoji}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-white/15 text-white/50 hover:text-white hover:border-white/35 hover:bg-white/8 transition-all text-sm font-bold select-none"
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const about = useAboutModal();
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

  const totalSupply = stats?.totalSupply ?? 3333;

  const statCards = [
    {
      label: "Floor Price",
      value: fmtPrice(stats?.floorPrice ?? null, stats?.floorPriceSymbol ?? null),
      sub: "via OpenSea",
    },
    {
      label: "Total Volume",
      value: fmtVolume(stats?.totalVolume ?? null),
      sub: "all-time",
    },
    {
      label: "Total Holders",
      value: fmt(stats?.numOwners ?? null),
      sub: "unique wallets",
    },
    {
      label: "Total Supply",
      value: totalSupply.toLocaleString(),
      sub: "hand-drawn 1/1s",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden flex flex-col relative dark">

      {/* ── Fixed transparent navbar ─────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 backdrop-blur-md border-b border-white/8" style={{ background: "rgba(14,7,25,0.55)" }}>
        <img src={`${BASE}/logo.png`} alt="Squawk" className="h-9 w-auto" />
        <div className="flex gap-3 items-center">
          <Link
            href="/sign-in"
            className="px-5 py-1.5 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all"
          >
            Sign In
          </Link>
          <Link href="/sign-up" className="liquid-btn group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-full px-6 text-sm font-bold text-white transition-all duration-300 hover:scale-105 shadow-[0_4px_20px_rgba(236,72,153,0.4)]">
            <span className="liquid-blob absolute inset-0" style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }} />
            <span className="relative z-10">Join Now</span>
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pb-20 z-10 min-h-screen overflow-hidden pt-16">

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
          className="max-w-4xl mx-auto relative z-10 mt-8"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 leading-tight text-white drop-shadow-xl">
            <span className="block whitespace-nowrap">Connect. Trade. Create.</span>
            <span className="block bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #f472b6, #c084fc, #818cf8)" }}>
              Squawk.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto font-light drop-shadow-md">
            Squawk is the social home of the 10K Squad — where creators and the Monad community collide.
          </p>

          <Link href="/sign-up">
            <button
              className="liquid-btn group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full px-12 font-black text-white text-xl transition-all duration-300 hover:scale-105 shadow-[0_8px_40px_rgba(236,72,153,0.55)] hover:shadow-[0_12px_55px_rgba(147,51,234,0.7)]"
              data-testid="button-get-started"
            >
              <span className="liquid-blob absolute inset-0" style={{ background: "linear-gradient(135deg, #ec4899 0%, #9333ea 50%, #6366f1 100%)" }} />
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Enter the Grid
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </button>
          </Link>

          <div className="mt-5 flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-sm font-medium text-white/60 backdrop-blur-sm">
              <LiveDot live={hasLiveData} />
              {hasLiveData ? "Live stats · updates every 10s" : "The new social grid is live on Monad"}
            </div>
          </div>

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

      {/* ── Section Navigation Strip ─────────────────────────────────── */}
      <SectionNav onAbout={about.show} />

      {/* ── Live NFT Sales Feed ──────────────────────────────────────── */}
      <LiveSalesFeed />

      {/* ── Top Holders Leaderboard ──────────────────────────────────── */}
      <TopHolders />

      {/* ── Ongoing Contest ──────────────────────────────────────────── */}
      <OngoingContest />

      {/* ── About the 10K Squad ──────────────────────────────────────── */}
      <motion.section
        id="about-10k"
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
                Icon: Palette,
                title: "Hand-Drawn, Every 1/1",
                desc: "3,333 unique NFTs crafted by 3 lead artists and 7 guest artists over 11 months — all created live in VC sessions. Every single piece is one-of-a-kind.",
              },
              {
                Icon: Link2,
                title: "Built on Monad",
                desc: "Living on Monad Mainnet — 10,000 TPS, 0.8s finality, near-zero gas. Drops process without congestion. Trade on OpenSea.",
              },
              {
                Icon: Gamepad2,
                title: "Holder Rewards Hub",
                desc: "GTD whitelist for 8+ Monad mainnet projects. Earn XP by holding, play mini-games at the10ksquadhub.com, and unlock exclusive collab drops with Monad Nomads, Fantasy Top & more.",
              },
            ].map(f => (
              <div key={f.title} className="rounded-3xl border border-white/10 p-8 flex flex-col gap-4" style={{ background: "rgba(88,28,135,0.12)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(147,51,234,0.2))", border: "1px solid rgba(236,72,153,0.25)" }}>
                  <f.Icon className="w-6 h-6 text-pink-400" />
                </div>
                <div className="text-xl font-bold text-white">{f.title}</div>
                <div className="text-muted-foreground text-[15px] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Holder Benefits ──────────────────────────────────────────── */}
      <motion.section
        id="holder-rewards"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-12 py-16 z-10"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-2">Holder Rewards Hub</h2>
          <p className="text-muted-foreground text-center mb-10 text-sm">Exclusive ecosystem boosts for every 10K Squad NFT holder</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                Icon: TrendingUp,
                color: "text-orange-400",
                bg: "rgba(249,115,22,0.12)",
                border: "rgba(249,115,22,0.25)",
                title: "Magma — 15% Points Boost",
                desc: "The biggest bonus possible, exclusive to 10K Squad holders. Automatically applied to your Magma points balance.",
              },
              {
                Icon: Star,
                color: "text-blue-400",
                bg: "rgba(59,130,246,0.12)",
                border: "rgba(59,130,246,0.25)",
                title: "Neverland — 20% Pearls Boost",
                desc: "20% boost on Pearls earned in Neverland. Holding a 10K Squad NFT supercharges your Neverland rewards.",
              },
              {
                Icon: Trophy,
                color: "text-yellow-400",
                bg: "rgba(234,179,8,0.12)",
                border: "rgba(234,179,8,0.25)",
                title: "Kintsu — 25% Points Boost",
                desc: "25% boost on Points for holders with a Kintsu trait NFT. Stack your rewards across the Monad ecosystem.",
              },
              {
                Icon: Globe,
                color: "text-cyan-400",
                bg: "rgba(6,182,212,0.12)",
                border: "rgba(6,182,212,0.25)",
                title: "Pingu — 30% Boost + 2nd-Tier Referral",
                desc: "30% boost on Points plus access to the 2nd Tier Referral Programme. One of the highest multipliers in the Monad ecosystem.",
              },
              {
                Icon: Gift,
                color: "text-pink-400",
                bg: "rgba(236,72,153,0.12)",
                border: "rgba(236,72,153,0.25)",
                title: "Bean — 20% Points Boost",
                desc: "20% boost on Bean Points for 10K Squad holders. Compound your on-chain earnings automatically.",
              },
              {
                Icon: Zap,
                color: "text-emerald-400",
                bg: "rgba(16,185,129,0.12)",
                border: "rgba(16,185,129,0.25)",
                title: "Sherpa — Vault Deposit Boost",
                desc: "Boost for Points at Vault deposits — exclusive for 5+ 10K Squad NFT holders. Maximise your Sherpa rewards with multiple NFTs.",
              },
              {
                Icon: Heart,
                color: "text-purple-400",
                bg: "rgba(147,51,234,0.12)",
                border: "rgba(147,51,234,0.25)",
                title: "Haha Wallet — 10% Karma Boost",
                desc: "10% boost on Karma earned in Haha Wallet. Every squad holder gets this bonus applied to their account.",
              },
              {
                Icon: Users,
                color: "text-rose-400",
                bg: "rgba(244,63,94,0.12)",
                border: "rgba(244,63,94,0.25)",
                title: "Fluffle — 15 Free Raffle Tickets",
                desc: "15 free raffle tickets (worth 15 hours of work) upon Pass purchase while holding a 10K NFT. Enter Fluffle raffles for free.",
              },
              {
                Icon: Gamepad2,
                color: "text-violet-400",
                bg: "rgba(139,92,246,0.12)",
                border: "rgba(139,92,246,0.25)",
                title: "Cultverse — 20% Permanent Gem Boost",
                desc: "20% permanent Gem Boost plus priority access, exclusive raffles, and future perks in the Cultverse ecosystem.",
              },
            ].map(b => (
              <div
                key={b.title}
                className="rounded-3xl border border-white/10 p-7 flex flex-col gap-4"
                style={{ background: b.bg }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: b.bg, border: `1px solid ${b.border}` }}
                >
                  <b.Icon className={`w-5 h-5 ${b.color}`} />
                </div>
                <div className="text-[17px] font-bold text-white leading-snug">{b.title}</div>
                <div className="text-muted-foreground text-[14px] leading-relaxed">{b.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 p-6 text-center" style={{ background: "rgba(88,28,135,0.15)" }}>
            <div className="text-white font-bold text-lg mb-1">✦ More is coming soon!</div>
            <p className="text-muted-foreground text-sm">New ecosystem partnerships and holder perks are added regularly. Hold a 10K Squad NFT to unlock all future rewards automatically.</p>
          </div>

          <p className="text-center text-muted-foreground text-xs mt-6">
            Always verify the latest perks via{" "}
            <a href="https://discord.gg/the10ksquad" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Discord</a>
            {" "}and{" "}
            <a href="https://x.com/the10ksquad" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">@the10kSquad on X</a>
          </p>
        </div>
      </motion.section>

      {/* ── App Features ─────────────────────────────────────────────── */}
      <motion.section
        id="built-for-culture"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-12 py-16 z-10"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Built for the culture</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">Every feature on Squawk is designed around how the 10K Squad actually lives online — fast, social, and always close to the drop.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              {
                Icon: Camera,
                title: "Posts & Stories",
                desc: "Share photos and videos with the squad. Stories disappear in 24 hours — keep the timeline fresh and alive.",
                tag: "Core",
              },
              {
                Icon: Zap,
                title: "Flow — Reels",
                desc: "Full-screen short video feed. Swipe, like, comment, and discover new creators from the Monad community.",
                tag: "Core",
              },
              {
                Icon: Heart,
                title: "Chirps",
                desc: "280-character short posts — quick thoughts, reactions, alpha drops. Fire off a chirp and see who replies.",
                tag: "Core",
              },
              {
                Icon: Palette,
                title: "Explore",
                desc: "Trending posts, top creators, and Monad events — all surfaced in one clean discovery feed.",
                tag: "Discover",
              },
              {
                Icon: Link2,
                title: "Direct Messages",
                desc: "Private one-on-one conversations. DM any squad member directly from their profile.",
                tag: "Social",
              },
              {
                Icon: Trophy,
                title: "Contests & Live Feed",
                desc: "Active trading and coding contests with live countdown timers. Contest tweets auto-fetched from @the10kSquad.",
                tag: "Events",
              },
            ].map(f => (
              <div key={f.title} className="rounded-3xl border border-white/10 p-7 flex flex-col gap-4 group hover:border-purple-500/30 transition-all" style={{ background: "rgba(88,28,135,0.10)" }}>
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(147,51,234,0.2))", border: "1px solid rgba(236,72,153,0.25)" }}>
                    <f.Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full text-purple-300/70 border border-purple-500/20" style={{ background: "rgba(147,51,234,0.1)" }}>{f.tag}</span>
                </div>
                <div className="text-lg font-bold text-white group-hover:text-purple-200 transition-colors">{f.title}</div>
                <div className="text-muted-foreground text-[14px] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Must Try ─────────────────────────────────────────────────── */}
      <motion.section
        id="must-try"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-4 md:px-12 py-4 pb-16 z-10"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-7">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <h2 className="text-2xl md:text-3xl font-black text-white">Must Try</h2>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-yellow-300/80 border border-yellow-500/25" style={{ background: "rgba(234,179,8,0.1)" }}>From the Squad</span>
          </div>

          <div className="flex flex-col gap-5">
            {/* My Talking Squad */}
            <a
              href="https://my-talking-squad.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col md:flex-row overflow-hidden rounded-3xl border border-white/10 hover:border-purple-400/40 transition-all hover:shadow-[0_0_40px_rgba(147,51,234,0.15)]"
              style={{ background: "rgba(88,28,135,0.12)" }}
            >
              <div className="relative md:w-64 lg:w-80 shrink-0 overflow-hidden" style={{ minHeight: "220px" }}>
                <img
                  src="/promo-bestie.png"
                  alt="My Talking Squad"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  style={{ minHeight: "220px" }}
                />
                <div className="absolute inset-0 md:hidden" style={{ background: "linear-gradient(to top, rgba(15,10,26,0.95) 0%, transparent 60%)" }} />
              </div>
              <div className="flex-1 flex flex-col justify-center p-7 md:p-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-pink-300/80 border border-pink-500/25" style={{ background: "rgba(236,72,153,0.1)" }}>AI · 10K Squad</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-green-300/80 border border-green-500/25" style={{ background: "rgba(16,185,129,0.1)" }}>Free to play</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">My Talking Squad</h3>
                <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 max-w-lg">
                  Chat and interact with your favourite 10K Squad NFT characters — brought to life as AI companions. Each character has a unique personality, voice, and backstory. Your squad, now talking back.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  {["AI Companions", "10K Characters", "Chat & Play", "Free"].map(t => (
                    <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/12 text-white/60" style={{ background: "rgba(255,255,255,0.05)" }}>{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white text-sm transition-all group-hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
                  >
                    Try it now <ArrowRight className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-white/35">my-talking-squad.vercel.app</span>
                </div>
              </div>
            </a>

            {/* 10K Squad Contra */}
            <a
              href="https://10ksquad-contra.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col md:flex-row overflow-hidden rounded-3xl border border-white/10 hover:border-pink-400/40 transition-all hover:shadow-[0_0_40px_rgba(236,72,153,0.15)]"
              style={{ background: "rgba(88,28,135,0.12)" }}
            >
              <div className="relative md:w-64 lg:w-80 shrink-0 overflow-hidden" style={{ minHeight: "220px" }}>
                <img
                  src="/contra-game.png"
                  alt="10K Squad Contra"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  style={{ minHeight: "220px" }}
                />
                <div className="absolute inset-0 md:hidden" style={{ background: "linear-gradient(to top, rgba(15,10,26,0.95) 0%, transparent 60%)" }} />
              </div>
              <div className="flex-1 flex flex-col justify-center p-7 md:p-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-yellow-300/80 border border-yellow-500/25" style={{ background: "rgba(234,179,8,0.1)" }}>Game · 10K Squad</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-green-300/80 border border-green-500/25" style={{ background: "rgba(16,185,129,0.1)" }}>Free to play</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">10K Squad Contra</h3>
                <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 max-w-lg">
                  A squad-themed action game built by the community. Fight through the levels with your favourite 10K Squad NFT characters. Pure fun — straight from the squad.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  {["Action Game", "10K Characters", "Browser Game", "Free"].map(t => (
                    <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/12 text-white/60" style={{ background: "rgba(255,255,255,0.05)" }}>{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white text-sm transition-all group-hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
                  >
                    Play now <ArrowRight className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-white/35">10ksquad-contra.vercel.app</span>
                </div>
              </div>
            </a>
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
            { label: "OpenSea", href: "https://opensea.io/collection/the-10k-squad-350905768" },
            { label: "10K Hub", href: "https://www.the10ksquadhub.com" },
            { label: "@the10kSquad", href: "https://x.com/the10ksquad" },
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
          <button className="liquid-btn group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full px-12 font-black text-white text-xl transition-all duration-300 hover:scale-105 shadow-[0_8px_40px_rgba(236,72,153,0.55)] hover:shadow-[0_12px_55px_rgba(147,51,234,0.7)]">
            <span className="liquid-blob absolute inset-0" style={{ background: "linear-gradient(135deg, #ec4899 0%, #9333ea 50%, #6366f1 100%)" }} />
            <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
              Create your Squawk
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </span>
          </button>
        </Link>
      </motion.section>

      <div className="h-8" />

      {about.modal}
    </div>
  );
}
