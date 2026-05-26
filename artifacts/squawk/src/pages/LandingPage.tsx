import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { Palette, Link2, Gamepad2, Camera, Zap, Heart, Trophy, Globe, Gift, Users, TrendingUp, Star, ArrowRight, ExternalLink, Crown, RefreshCw } from "lucide-react";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

function OngoingContest() {
  const rewards = [
    { emoji: "🎟️", label: "Fluffle Raffle", value: "15 Free Tickets", sub: "per holder — auto-applied" },
    { emoji: "🏅", label: "GTD Whitelist", value: "8+ Projects", sub: "Monad mainnet launches" },
    { emoji: "⚡", label: "Magma Boost", value: "+15% Points", sub: "DeFi protocol rewards" },
    { emoji: "🌊", label: "Neverland Boost", value: "+20% Pearls", sub: "auto-applied to holders" },
    { emoji: "🐧", label: "Pingu Boost", value: "+30% Points", sub: "2nd-tier referral access" },
    { emoji: "💎", label: "Cultverse", value: "+20% Gems", sub: "priority access & raffles" },
  ];

  return (
    <motion.section
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
                ACTIVE NOW
              </span>
              <span className="text-xs text-white/30">Updated via @the10kSquad</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">Squad Rewards Season</h2>
            <p className="text-muted-foreground mt-1 text-sm max-w-lg">
              Hold a 10K Squad NFT and every reward below is automatically applied to your wallet. No manual entries — just hold and earn.
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
            Latest on X
          </a>
        </div>

        {/* Main contest card */}
        <div
          className="relative rounded-3xl p-6 md:p-8 mb-8 overflow-hidden border"
          style={{
            background: "linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(147,51,234,0.12) 50%, rgba(14,7,25,0.6) 100%)",
            borderColor: "rgba(236,72,153,0.3)",
            boxShadow: "0 0 60px rgba(236,72,153,0.08) inset",
          }}
        >
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(236,72,153,0.12)" }} />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-2xl pointer-events-none" style={{ background: "rgba(147,51,234,0.1)" }} />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border border-yellow-400/30" style={{ background: "rgba(251,191,36,0.1)" }}>
                  🏆
                </div>
                <div>
                  <div className="text-xs font-bold text-yellow-400 tracking-widest uppercase mb-1">Featured Contest</div>
                  <div className="text-xl md:text-2xl font-black text-white">Fluffle Raffle</div>
                  <div className="text-sm text-white/50">Ongoing · Auto-entry for all holders</div>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="px-4 py-2 rounded-2xl border border-white/10 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-2xl font-black text-white">15</div>
                  <div className="text-xs text-white/40">Free Tickets</div>
                </div>
                <div className="px-4 py-2 rounded-2xl border border-white/10 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-2xl font-black text-white">8+</div>
                  <div className="text-xs text-white/40">WL Spots</div>
                </div>
                <div className="px-4 py-2 rounded-2xl border border-white/10 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-2xl font-black text-white">3,333</div>
                  <div className="text-xs text-white/40">Eligible NFTs</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 p-4 mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📋</span>
                <div>
                  <div className="text-sm font-bold text-white mb-1">How to enter</div>
                  <div className="text-sm text-white/55 leading-relaxed">
                    Hold any 10K Squad NFT in your connected wallet. Raffle tickets (15 per NFT) are automatically counted — equivalent to 15 hours of contribution credit. Additional boosts apply if your NFT has the Kintsu trait (+25% points on Kintsu protocol).
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/35">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              Diamond Wings status unlocked for top contributors and creators in the ecosystem
            </div>
          </div>
        </div>

        {/* Reward cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {rewards.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-2xl border border-white/10 p-5 flex flex-col gap-2 hover:border-pink-500/30 transition-all hover:-translate-y-0.5"
              style={{ background: "rgba(88,28,135,0.1)" }}
            >
              <div className="text-2xl">{r.emoji}</div>
              <div className="text-xs text-white/40 font-medium uppercase tracking-wide">{r.label}</div>
              <div className="text-lg font-black text-white">{r.value}</div>
              <div className="text-xs text-white/40">{r.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-400 shrink-0" />
            <p className="text-sm text-white/60">
              New contests and drops announced on <span className="text-white font-semibold">@the10kSquad</span> — follow for the latest giveaways and Monad mainnet whitelist announcements.
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
          <Link
            href="/sign-up"
            className="px-5 py-1.5 rounded-full text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_4px_rgba(219,39,119,0.4)]"
            style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
          >
            Join Now
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
            A Living Ecosystem
            <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #f472b6, #c084fc, #818cf8)" }}>
              For Collectors, Traders & Creators
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

      {/* ── Live NFT Sales Feed ──────────────────────────────────────── */}
      <LiveSalesFeed />

      {/* ── Top Holders Leaderboard ──────────────────────────────────── */}
      <TopHolders />

      {/* ── Ongoing Contest ──────────────────────────────────────────── */}
      <OngoingContest />

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
              { Icon: Camera, title: "Share Moments", desc: "Post photos and videos. Add stories that disappear in 24 hours. Your feed stays fresh and alive." },
              { Icon: Zap, title: "Flow — Short Videos", desc: "Swipe through full-screen video content from the community. Like, comment and discover new creators." },
              { Icon: Heart, title: "10K Squad Home", desc: "Squawk is built for the 10K Squad community. Connect, post, and stay ahead of every Monad drop." },
            ].map(f => (
              <div key={f.title} className="rounded-3xl border border-white/10 p-8 flex flex-col gap-4" style={{ background: "rgba(88,28,135,0.12)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(147,51,234,0.2))", border: "1px solid rgba(236,72,153,0.25)" }}>
                  <f.Icon className="w-6 h-6 text-purple-400" />
                </div>
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
    </div>
  );
}
