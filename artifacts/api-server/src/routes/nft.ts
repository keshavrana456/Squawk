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

const TOTAL_SUPPLY = 3333;

// Correct slug for the 10K Squad on OpenSea (Monad chain)
const OPENSEA_SLUGS = ["the-10k-squad-350905768", "the-10k-squad", "10k-squad", "10ksquad"];

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

      // Always display in MON (Monad native token)
      const floorPriceSymbol = "MON";

      return {
        floorPrice,
        floorPriceSymbol,
        totalVolume: total.volume ?? null,
        totalSales: total.sales ?? null,
        numOwners: total.num_owners ?? null,
        numListed: null,
        volume24h: interval1d?.volume ?? null,
        volume7d: interval7d?.volume ?? null,
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

router.get("/nft/stats", async (_req, res): Promise<void> => {
  // Serve cache if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    res.json(cache.data);
    return;
  }

  // Try OpenSea
  const stats = await tryOpenSea();

  // If all external fetches failed, return nulls with static facts
  const result: NftStats = stats ?? {
    floorPrice: null,
    floorPriceSymbol: "MON",
    totalVolume: null,
    totalSales: null,
    numOwners: null,
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
