import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (kept from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// MCP Server model
export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  buildId: text("build_id").notNull().unique(),
  serverName: text("server_name").notNull(),
  serverType: text("server_type").notNull(),
  description: text("description").notNull(),
  tools: jsonb("tools").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const insertServerSchema = createInsertSchema(servers).pick({
  buildId: true,
  serverName: true,
  serverType: true,
  description: true,
  tools: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;
