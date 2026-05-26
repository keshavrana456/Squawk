import { Router, type IRouter } from "express";
import { db, contestTweetsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

const TWITTER_HANDLE = "the10kSquad";
const POLL_INTERVAL_MS = 30 * 60 * 1000;

const CONTEST_KEYWORDS = [
  "contest", "giveaway", "prize", "prizes", "winner", "winners",
  "submit", "submission", "entry", "entries", "round", "finals",
];

const SEED_TWEET_IDS = [
  "2058882728905322586",
  "2055284732938666165",
  "2047687465587069000",
];

interface TweetData {
  tweetId: string;
  text: string;
  authorHandle: string;
  authorName: string;
  mediaUrl: string | null;
  tweetUrl: string;
  postedAt: Date;
}

function isContestRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return CONTEST_KEYWORDS.some((kw) => lower.includes(kw));
}

async function fetchTweetById(tweetId: string): Promise<TweetData | null> {
  try {
    const res = await fetch(
      `https://api.fxtwitter.com/${TWITTER_HANDLE}/status/${tweetId}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return null;
    const data = await res.json() as any;
    const tweet = data?.tweet;
    if (!tweet) return null;
    return {
      tweetId: String(tweet.id),
      text: tweet.text ?? "",
      authorHandle: tweet.author?.screen_name ?? TWITTER_HANDLE,
      authorName: tweet.author?.name ?? "The 10k Squad",
      mediaUrl:
        tweet.media?.photos?.[0]?.url ??
        tweet.media?.videos?.[0]?.thumbnail_url ??
        null,
      tweetUrl: tweet.url ?? `https://x.com/${TWITTER_HANDLE}/status/${tweetId}`,
      postedAt: new Date((tweet.created_timestamp ?? Date.now() / 1000) * 1000),
    };
  } catch {
    return null;
  }
}

async function fetchFromRSS(): Promise<TweetData[]> {
  const sources = [
    `https://rsshub.app/twitter/user/${TWITTER_HANDLE}`,
    `https://nitter.privacydev.net/${TWITTER_HANDLE}/rss`,
    `https://nitter.poast.org/${TWITTER_HANDLE}/rss`,
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      const tweets: TweetData[] = [];
      for (const [, itemXml] of items) {
        const titleMatch =
          itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ??
          itemXml.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
        const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const mediaMatch = itemXml.match(/url="(https?:\/\/[^"]*\.(?:jpg|png|webp|jpeg))/);
        if (!titleMatch || !linkMatch) continue;
        const text = titleMatch[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();
        if (!isContestRelated(text)) continue;
        const tweetUrl = linkMatch[1].trim();
        const idMatch = tweetUrl.match(/\/status\/(\d+)/);
        if (!idMatch) continue;
        tweets.push({
          tweetId: idMatch[1],
          text,
          authorHandle: TWITTER_HANDLE,
          authorName: "The 10k Squad",
          mediaUrl: mediaMatch?.[1] ?? null,
          tweetUrl,
          postedAt: dateMatch ? new Date(dateMatch[1]) : new Date(),
        });
      }
      if (tweets.length > 0) return tweets;
    } catch {
      continue;
    }
  }
  return [];
}

async function fetchFromTwitterAPI(): Promise<TweetData[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) return [];
  try {
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${TWITTER_HANDLE}`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) },
    );
    if (!userRes.ok) return [];
    const userData = await userRes.json() as any;
    const userId = userData?.data?.id;
    if (!userId) return [];
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=20&tweet.fields=created_at,text`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) },
    );
    if (!tweetsRes.ok) return [];
    const tweetsData = await tweetsRes.json() as any;
    return (tweetsData?.data ?? [])
      .filter((t: any) => isContestRelated(t.text ?? ""))
      .map((t: any) => ({
        tweetId: String(t.id),
        text: t.text,
        authorHandle: TWITTER_HANDLE,
        authorName: "The 10k Squad",
        mediaUrl: null,
        tweetUrl: `https://x.com/${TWITTER_HANDLE}/status/${t.id}`,
        postedAt: new Date(t.created_at),
      }));
  } catch {
    return [];
  }
}

async function upsertTweet(tweet: TweetData): Promise<void> {
  await db
    .insert(contestTweetsTable)
    .values({
      tweetId: tweet.tweetId,
      text: tweet.text,
      authorHandle: tweet.authorHandle,
      authorName: tweet.authorName,
      mediaUrl: tweet.mediaUrl ?? null,
      tweetUrl: tweet.tweetUrl,
      postedAt: tweet.postedAt,
    })
    .onConflictDoUpdate({
      target: contestTweetsTable.tweetId,
      set: { text: tweet.text, mediaUrl: tweet.mediaUrl ?? null, fetchedAt: new Date() },
    });
}

async function seedKnownTweets(): Promise<void> {
  for (const id of SEED_TWEET_IDS) {
    const tweet = await fetchTweetById(id);
    if (tweet) await upsertTweet(tweet);
  }
}

async function poll(): Promise<void> {
  try {
    const fromApi = await fetchFromTwitterAPI();
    if (fromApi.length > 0) {
      for (const t of fromApi) await upsertTweet(t);
      return;
    }
    const fromRSS = await fetchFromRSS();
    for (const t of fromRSS) await upsertTweet(t);
  } catch {
    // silently ignore
  }
}

setImmediate(async () => {
  await seedKnownTweets();
  setTimeout(poll, 10_000);
  setInterval(poll, POLL_INTERVAL_MS);
});

router.get("/contests", async (_req, res) => {
  try {
    const tweets = await db
      .select()
      .from(contestTweetsTable)
      .where(eq(contestTweetsTable.isActive, true))
      .orderBy(desc(contestTweetsTable.postedAt))
      .limit(20);
    res.json({ tweets });
  } catch {
    res.json({ tweets: [] });
  }
});

export default router;
