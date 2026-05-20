import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const chirpsTable = pgTable("chirps", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  hashtags: text("hashtags").array().notNull().default([]),
  mentions: text("mentions").array().notNull().default([]),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  parentId: integer("parent_id"),
  rechirpOfId: integer("rechirp_of_id"),
  quoteOfId: integer("quote_of_id"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChirpSchema = createInsertSchema(chirpsTable).omit({
  id: true, createdAt: true, viewCount: true,
});
export type InsertChirp = z.infer<typeof insertChirpSchema>;
export type Chirp = typeof chirpsTable.$inferSelect;

export const chirpLikesTable = pgTable("chirp_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  chirpId: integer("chirp_id").notNull().references(() => chirpsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chirpSavesTable = pgTable("chirp_saves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  chirpId: integer("chirp_id").notNull().references(() => chirpsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chirpCommentsTable = pgTable("chirp_comments", {
  id: serial("id").primaryKey(),
  chirpId: integer("chirp_id").notNull().references(() => chirpsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChirpCommentSchema = createInsertSchema(chirpCommentsTable).omit({ id: true, createdAt: true });
export type InsertChirpComment = z.infer<typeof insertChirpCommentSchema>;
export type ChirpComment = typeof chirpCommentsTable.$inferSelect;
