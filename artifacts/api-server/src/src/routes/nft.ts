import { Router, type IRouter } from "express";
import { createPublicClient, http, defineChain } from "viem";

const router: IRouter = Router();

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

let cache: { data: NftStats; timestamp: number } | null = null;
const CACHE_TTL = 8_000;

const TOTAL_SUPPLY = 3333;
const CONTRACT = "0x818030837e8350ba63e64d7dc01a547fa73c8279" as const;
const OPENSEA_SLUGS = ["the-10k-squad-350905768", "the-10k-squad", "10k-squad", "the-10k-squad-monad"];
const ME_CHAIN = "monad-mainnet";

// ── Monad viem client ────────────────────────────────────────────────────────
const monad = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.monad.xyz"] } },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    },
  },
});

const viemClient = createPublicClient({ chain: monad, transport: http() });

const ownerOfAbi = [
  {
    name: "ownerOf",
    type: "function" as const,
    inputs: [{ name: "tokenId", type: "uint256" as const }],
    outputs: [{ name: "", type: "address" as const }],
    stateMutability: "view" as const,
  },
];

// ── On-chain holder count + leaderboard (Multicall3) ────────────────────────
interface HolderEntry {
  address: string;
  count: number;
}

let holderCache: { count: number; ts: number } | null = null;
let holderLeaderboardCache: { data: HolderEntry[]; ts: number } | null = null;
const HOLDER_CACHE_TTL = 10 * 60 * 1000;
let holderScanRunning = false;

async function scanHolders(): Promise<void> {
  if (holderScanRunning) return;
  holderScanRunning = true;
  const ownerCounts = new Map<string, number>();
  const BATCH = 200;

  try {
    for (let start = 1; start <= TOTAL_SUPPLY; start += BATCH) {
      const ids: number[] = [];
      for (let i = start; i < Math.min(start + BATCH, TOTAL_SUPPLY + 1); i++) {
        ids.push(i);
      }
      const contracts = ids.map((id) => ({
        address: CONTRACT,
        abi: ownerOfAbi,
        functionName: "ownerOf" as const,
        args: [BigInt(id)] as [bigint],
      }));
      const results = await viemClient.multicall({ contracts, allowFailure: true });
      for (const r of results) {
        if (r.status === "success" && r.result) {
          const addr = (r.result as string).toLowerCase();
          ownerCounts.set(addr, (ownerCounts.get(addr) ?? 0) + 1);
        }
      }
    }
    const sorted: HolderEntry[] = Array.from(ownerCounts.entries())
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count);

    holderCache = { count: ownerCounts.size, ts: Date.now() };
    holderLeaderboardCache = { data: sorted, ts: Date.now() };
  } catch (e) {
    if (ownerCounts.size > 100) {
      const sorted: HolderEntry[] = Array.from(ownerCounts.entries())
        .map(([address, count]) => ({ address, count }))
        .sort((a, b) => b.count - a.count);
      holderCache = { count: ownerCounts.size, ts: Date.now() };
      holderLeaderboardCache = { data: sorted, ts: Date.now() };
    }
  } finally {
    holderScanRunning = false;
  }
}

// Start scan on boot
scanHolders().catch(() => {});

function maybeRefreshHolders(): void {
  if (!holderScanRunning && (!holderCache || Date.now() - holderCache.ts > HOLDER_CACHE_TTL)) {
    scanHolders().catch(() => {});
  }
}

// ── MON/ETH rate ─────────────────────────────────────────────────────────────
let monRateCache: { monPerEth: number; ts: number } | null = null;
const RATE_TTL = 60_000;

async function getMonPerEth(): Promise<number> {
  if (monRateCache && Date.now() - monRateCache.ts < RATE_TTL) return monRateCache.monPerEth;
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=monad&vs_currencies=eth",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error("bad");
    const json: any = await res.json();
    const ethPerMon: number = json?.monad?.eth;
    if (!ethPerMon || ethPerMon <= 0) throw new Error("bad rate");
    const monPerEth = 1 / ethPerMon;
    monRateCache = { monPerEth, ts: Date.now() };
    return monPerEth;
  } catch {
    return monRateCache?.monPerEth ?? 79_000;
  }
}

// ── Magic Eden (Reservoir) stats — primary Monad marketplace ─────────────────
async function tryMagicEden(): Promise<NftStats | null> {
  try {
    const meApiKey = process.env.MAGIC_EDEN_API_KEY;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (meApiKey) headers["Authorization"] = `Bearer ${meApiKey}`;

    // Reservoir-protocol endpoint proxied through Magic Eden
    const url = `https://api-mainnet.magiceden.dev/v3/rtp/${ME_CHAIN}/collections/v7?id=${CONTRACT}&includeTopBid=false`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(7000) });
    if (!res.ok) throw new Error(`ME ${res.status}`);
    const json: any = await res.json();
    const col = (json.collections ?? json)[0] ?? json;
    if (!col) throw new Error("no collection");

    const floorAsk = col.floorAsk ?? col.floor_ask ?? {};
    const rawFloor: number | null = floorAsk?.price?.amount?.native ?? col.floorSalePrice ?? null;
    const floorSymbol: string = floorAsk?.price?.currency?.symbol ?? "MON";

    const volume = col.volume ?? {};
    const vol24h: number | null = volume["1day"] ?? null;
    const vol7d: number | null  = volume["7day"]  ?? null;
    const volAll: number | null = volume["allTime"] ?? col.totalVolume ?? null;
    const salesCount: number | null = col.salesCount?.["allTime"] ?? col.onSaleCount ?? null;

    maybeRefreshHolders();
    const numOwners: number | null = holderCache?.count ?? col.ownerCount ?? null;

    return {
      floorPrice: rawFloor !== null && rawFloor > 0 ? rawFloor : null,
      floorPriceSymbol: floorSymbol,
      totalVolume: volAll !== null && volAll > 0 ? Math.round(volAll) : null,
      totalSales: salesCount,
      numOwners,
      numListed: col.onSaleCount ?? null,
      volume24h: vol24h !== null && vol24h > 0 ? Math.round(vol24h) : null,
      volume7d: vol7d !== null && vol7d > 0 ? Math.round(vol7d) : null,
      totalSupply: TOTAL_SUPPLY,
      source: "magiceden",
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

// ── OpenSea stats ─────────────────────────────────────────────────────────────
async function tryOpenSea(): Promise<NftStats | null> {
  const apiKey = process.env.OPENSEA_API_KEY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-API-KEY"] = apiKey;

  for (const slug of OPENSEA_SLUGS) {
    try {
      const res = await fetch(
        `https://api.opensea.io/api/v2/collections/${slug}/stats`,
        { headers, signal: AbortSignal.timeout(7000) }
      );
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) break; // no key, stop trying
        continue;
      }
      const json: any = await res.json();
      const total = json.total ?? json;
      const intervals: any[] = json.intervals ?? [];
      const interval1d = intervals.find((i: any) => i.interval === "one_day");
      const interval7d = intervals.find((i: any) => i.interval === "seven_day");

      const rawFloor = total.floor_price ?? null;
      const floorPrice = rawFloor !== null && rawFloor > 0 ? rawFloor : null;
      const floorSymbol: string = total.floor_price_symbol ?? "MON";

      const monPerEth = await getMonPerEth();
      const toMon = (v: number | null, sym?: string) => {
        if (v === null || v <= 0) return v;
        // Convert from ETH to MON only if symbol is ETH
        if (sym === "ETH" || (!sym && v < 1000)) return Math.round(v * monPerEth);
        return Math.round(v);
      };

      maybeRefreshHolders();
      const numOwners = holderCache?.count ?? total.num_owners ?? null;

      return {
        floorPrice: floorPrice !== null ? toMon(floorPrice, floorSymbol) : null,
        floorPriceSymbol: "MON",
        totalVolume: toMon(total.volume ?? null, "ETH"),
        totalSales: total.sales ?? null,
        numOwners,
        numListed: null,
        volume24h: toMon(interval1d?.volume ?? null, "ETH"),
        volume7d: toMon(interval7d?.volume ?? null, "ETH"),
        totalSupply: TOTAL_SUPPLY,
        source: `opensea:${slug}`,
        fetchedAt: Date.now(),
      };
    } catch {
      // try next slug
    }
  }
  return null;
}

// ── Recent Sales ──────────────────────────────────────────────────────────────
interface NftSale {
  id: string;
  tokenId: string;
  name: string;
  imageUrl: string | null;
  priceRaw: string;
  priceFormatted: string;
  symbol: string;
  seller: string;
  buyer: string;
  txHash: string | null;
  openseaUrl: string | null;
  timestamp: number;
}

let salesCache: { data: NftSale[]; timestamp: number } | null = null;
const SALES_CACHE_TTL = 30_000;

function shortAddr(addr: string): string {
  if (!addr) return "Unknown";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

// ── Magic Eden recent sales (primary) ────────────────────────────────────────
async function fetchSalesViaMagicEden(): Promise<NftSale[]> {
  try {
    const meApiKey = process.env.MAGIC_EDEN_API_KEY;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (meApiKey) headers["Authorization"] = `Bearer ${meApiKey}`;

    const url = `https://api-mainnet.magiceden.dev/v3/rtp/${ME_CHAIN}/sales/v4?contract=${CONTRACT}&limit=20&sortBy=time&sortDirection=desc`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`ME sales ${res.status}`);
    const json: any = await res.json();
    const events: any[] = json.sales ?? [];
    if (!events.length) throw new Error("empty");

    const sales: NftSale[] = events.map((ev: any) => {
      const token = ev.token ?? {};
      const priceData = ev.price ?? {};
      const nativeAmt: number = priceData.amount?.native ?? 0;
      const sym: string = priceData.currency?.symbol ?? "MON";

      const priceFormatted = nativeAmt > 0
        ? nativeAmt.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + sym
        : "—";

      const tokenId = token.tokenId ?? "?";
      const name = token.name ?? `Squad #${tokenId}`;
      const imageUrl = token.image ?? null;
      const meUrl = `https://magiceden.io/item-details/monad/${CONTRACT}/${tokenId}`;

      return {
        id: `me-${ev.id ?? ev.txHash ?? tokenId}-${tokenId}`,
        tokenId: String(tokenId),
        name,
        imageUrl,
        priceRaw: String(nativeAmt),
        priceFormatted,
        symbol: sym,
        seller: shortAddr(ev.from ?? ""),
        buyer: shortAddr(ev.to ?? ""),
        txHash: ev.txHash ?? null,
        openseaUrl: meUrl,
        timestamp: (ev.timestamp ?? 0) * 1000,
      };
    });

    return sales.filter(s => s.timestamp > 0).sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

// ── OpenSea recent sales (fallback) ──────────────────────────────────────────
async function fetchSalesViaOpenSea(): Promise<NftSale[]> {
  const apiKey = process.env.OPENSEA_API_KEY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-API-KEY"] = apiKey;

  for (const slug of OPENSEA_SLUGS) {
    try {
      const url = `https://api.opensea.io/api/v2/events/collection/${slug}?event_type=sale&limit=20`;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) break;
        continue;
      }
      const json: any = await res.json();
      const events: any[] = json.asset_events ?? [];
      if (!events.length) continue;

      const monPerEth = await getMonPerEth();

      const sales: NftSale[] = events.map((ev: any) => {
        const nft = ev.nft ?? {};
        const payment = ev.payment ?? {};
        const rawQty = BigInt(payment.quantity ?? "0");
        const decimals = payment.decimals ?? 18;
        const priceFloat = Number(rawQty) / Math.pow(10, decimals);
        const sym: string = payment.symbol ?? "ETH";

        let displayPrice = priceFloat;
        let displaySym = sym;
        if (sym === "ETH" && priceFloat > 0) {
          displayPrice = Math.round(priceFloat * monPerEth);
          displaySym = "MON";
        }

        const priceFormatted = displayPrice > 0
          ? displayPrice.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + displaySym
          : "—";

        const tokenId = nft.identifier ?? ev.id ?? "?";
        const name = nft.name ?? `Squad #${tokenId}`;
        const imageUrl = nft.display_image_url ?? nft.image_url ?? null;
        const openseaUrl = nft.opensea_url ?? `https://opensea.io/assets/monad/${CONTRACT}/${tokenId}`;

        return {
          id: `${slug}-${ev.transaction ?? ev.event_timestamp}-${tokenId}`,
          tokenId: String(tokenId),
          name,
          imageUrl,
          priceRaw: String(rawQty),
          priceFormatted,
          symbol: displaySym,
          seller: shortAddr(ev.seller ?? ""),
          buyer: shortAddr(ev.buyer ?? ""),
          txHash: ev.transaction ?? null,
          openseaUrl,
          timestamp: (ev.event_timestamp ?? 0) * 1000,
        };
      });

      return sales.filter(s => s.timestamp > 0).sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      // try next slug
    }
  }
  return [];
}

async function fetchRecentSales(): Promise<NftSale[]> {
  const meSales = await fetchSalesViaMagicEden();
  if (meSales.length > 0) return meSales;
  return fetchSalesViaOpenSea();
}

// GET /nft/holders — top holders leaderboard
router.get("/nft/holders", async (req, res): Promise<void> => {
  maybeRefreshHolders();

  if (!holderLeaderboardCache) {
    res.json({ status: "scanning", data: [] });
    return;
  }

  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  res.json({
    status: "ready",
    scannedAt: holderLeaderboardCache.ts,
    totalHolders: holderCache?.count ?? holderLeaderboardCache.data.length,
    data: holderLeaderboardCache.data.slice(0, limit),
  });
});

// GET /nft/sales
router.get("/nft/sales", async (_req, res): Promise<void> => {
  if (salesCache && Date.now() - salesCache.timestamp < SALES_CACHE_TTL) {
    res.json(salesCache.data);
    return;
  }
  const data = await fetchRecentSales();
  salesCache = { data, timestamp: Date.now() };
  res.json(data);
});

// ── Route ─────────────────────────────────────────────────────────────────────
router.get("/nft/stats", async (_req, res): Promise<void> => {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    res.json(cache.data);
    return;
  }

  const stats = (await tryMagicEden()) ?? (await tryOpenSea());

  const result: NftStats = stats ?? {
    floorPrice: null,
    floorPriceSymbol: "MON",
    totalVolume: null,
    totalSales: null,
    numOwners: holderCache?.count ?? null,
    numListed: null,
    volume24h: null,
    volume7d: null,
    totalSupply: TOTAL_SUPPLY,
    source: null,
    fetchedAt: Date.now(),
  };

  cache = { data: result, timestamp: Date.now() };
  res.json(result);
});

export default router;
