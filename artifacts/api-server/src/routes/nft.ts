import { Router, type IRouter } from "express";

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
const CACHE_TTL = 10_000;

// Possible slugs for the 10K Squad on OpenSea (Monad chain)
const OPENSEA_SLUGS = ["the-10k-squad", "10k-squad", "10ksquad", "the10ksquad"];

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
      const json = (await res.json()) as any;
      const total = json.total ?? json;
      const intervals: any[] = json.intervals ?? [];
      const interval1d = intervals.find((i: any) => i.interval === "one_day");
      const interval7d = intervals.find((i: any) => i.interval === "seven_day");

      // floor_price of 0 means no active listing — treat as null for display
      const rawFloor = total.floor_price ?? null;
      const floorPrice = (rawFloor !== null && rawFloor > 0) ? rawFloor : null;
      const rawSymbol = total.floor_price_symbol ?? "";
      const floorPriceSymbol = rawSymbol !== "" ? rawSymbol : "ETH";

      return {
        floorPrice,
        floorPriceSymbol,
        totalVolume: total.volume ?? null,
        totalSales: total.sales ?? null,
        numOwners: total.num_owners ?? null,
        numListed: null,
        volume24h: interval1d?.volume ?? null,
        volume7d: interval7d?.volume ?? null,
        totalSupply: 10000,
        source: `opensea:${slug}`,
        fetchedAt: Date.now(),
      };
    } catch {
      // try next slug
    }
  }
  return null;
}

// Magic Eden Monad API — try the EVM collections endpoint
async function tryMagicEden(): Promise<NftStats | null> {
  const endpoints = [
    // EVM / Monad mainnet format
    "https://api-mainnet.magiceden.us/v2/collections/the_10k_squad/stats",
    "https://api-mainnet.magiceden.us/collections/monad/the_10k_squad/stats",
    "https://api.magiceden.us/v2/collections/the_10k_squad/stats",
  ];

  const headers: Record<string, string> = { Accept: "application/json" };
  const meKey = process.env.MAGIC_EDEN_API_KEY;
  if (meKey) headers["Authorization"] = `Bearer ${meKey}`;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const json = (await res.json()) as any;
      return {
        floorPrice: json.floorPrice ?? json.floor_price ?? null,
        floorPriceSymbol: json.symbol ?? "MON",
        totalVolume: json.volumeAll ?? json.volume ?? null,
        totalSales: null,
        numOwners: json.owners ?? null,
        numListed: json.listedCount ?? null,
        volume24h: null,
        volume7d: null,
        totalSupply: 10000,
        source: "magiceden",
        fetchedAt: Date.now(),
      };
    } catch {
      // try next
    }
  }
  return null;
}

router.get("/nft/stats", async (_req, res): Promise<void> => {
  // Serve cache if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    res.json(cache.data);
    return;
  }

  // Try data sources in order
  let stats = await tryOpenSea();
  if (!stats) stats = await tryMagicEden();

  // If all external fetches failed, return nulls with static facts
  const result: NftStats = stats ?? {
    floorPrice: null,
    floorPriceSymbol: null,
    totalVolume: null,
    totalSales: null,
    numOwners: null,
    numListed: null,
    volume24h: null,
    volume7d: null,
    totalSupply: 10000,
    source: null,
    fetchedAt: Date.now(),
  };

  cache = { data: result, timestamp: Date.now() };
  res.json(result);
});

export default router;
