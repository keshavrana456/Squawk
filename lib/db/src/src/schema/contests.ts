import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const contestTweetsTable = pgTable("contest_tweets", {
  id: serial("id").primaryKey(),
  tweetId: text("tweet_id").notNull().unique(),
  text: text("text").notNull(),
  authorHandle: text("author_handle").notNull().default("the10kSquad"),
  authorName: text("author_name").notNull().default("The 10k Squad"),
  mediaUrl: text("media_url"),
  tweetUrl: text("tweet_url").notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }).notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export type ContestTweet = typeof contestTweetsTable.$inferSelect;
