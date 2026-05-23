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
const OPENSEA_SLUGS = ["the-10k-squad-350905768", "the-10k-squad", "10k-squad"];

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

// ── On-chain holder count (Multicall3) ───────────────────────────────────────
let holderCache: { count: number; ts: number } | null = null;
const HOLDER_CACHE_TTL = 10 * 60 * 1000;
let holderScanRunning = false;

async function scanHolders(): Promise<void> {
  if (holderScanRunning) return;
  holderScanRunning = true;
  const owners = new Set<string>();
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
          owners.add((r.result as string).toLowerCase());
        }
      }
    }
    holderCache = { count: owners.size, ts: Date.now() };
  } catch (e) {
    if (owners.size > 100) holderCache = { count: owners.size, ts: Date.now() };
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

// ── OpenSea stats ─────────────────────────────────────────────────────────────
async function tryOpenSea(): Promise<NftStats | null> {
  const apiKey = process.env.OPENSEA_API_KEY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-API-KEY"] = apiKey;

  for (const slug of OPENSEA_SLUGS) {
    try {
      const res = await fetch(
        `https://api.opensea.io/api/v2/collections/${slug}/stats`,
        { headers, signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) continue;
      const json: any = await res.json();
      const total = json.total ?? json;
      const intervals: any[] = json.intervals ?? [];
      const interval1d = intervals.find((i: any) => i.interval === "one_day");
      const interval7d = intervals.find((i: any) => i.interval === "seven_day");

      const rawFloor = total.floor_price ?? null;
      const floorPrice = rawFloor !== null && rawFloor > 0 ? rawFloor : null;

      const monPerEth = await getMonPerEth();
      const toMon = (v: number | null) =>
        v !== null && v > 0 ? Math.round(v * monPerEth) : v;

      maybeRefreshHolders();
      // Prefer on-chain scan result; fall back to OpenSea
      const numOwners = holderCache?.count ?? total.num_owners ?? null;

      return {
        floorPrice,
        floorPriceSymbol: "MON",
        totalVolume: toMon(total.volume ?? null),
        totalSales: total.sales ?? null,
        numOwners,
        numListed: null,
        volume24h: toMon(interval1d?.volume ?? null),
        volume7d: toMon(interval7d?.volume ?? null),
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

async function fetchRecentSales(): Promise<NftSale[]> {
  const apiKey = process.env.OPENSEA_API_KEY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-API-KEY"] = apiKey;

  for (const slug of OPENSEA_SLUGS) {
    try {
      const url = `https://api.opensea.io/api/v2/events/collection/${slug}?event_type=sale&limit=20`;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
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

        // Convert to MON if the price is in ETH
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

  const stats = await tryOpenSea();

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
