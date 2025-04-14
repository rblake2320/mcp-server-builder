import { pgTable, text, serial, integer, boolean, jsonb, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model (kept from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  githubId: text("github_id"),
  githubUsername: text("github_username"),
  githubToken: text("github_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations for users table
export const usersRelations = relations(users, ({ many }) => ({
  servers: many(servers),
  templates: many(templates),
}));

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

// Define relations for servers table
export const serversRelations = relations(servers, ({ one }) => ({
  user: one(users, {
    fields: [servers.userId],
    references: [users.id],
  }),
}));

export const insertServerSchema = createInsertSchema(servers).pick({
  buildId: true,
  serverName: true,
  serverType: true,
  description: true,
  tools: true,
  userId: true,
});

// Template model for saved server configurations
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  serverType: text("server_type").notNull(),
  configData: jsonb("config_data").notNull(), // Stores the entire server configuration
  public: boolean("public").default(false).notNull(), // If template is shared publicly
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
});

// Define relations for templates table
export const templatesRelations = relations(templates, ({ one }) => ({
  user: one(users, {
    fields: [templates.userId],
    references: [users.id],
  }),
}));

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  description: true,
  serverType: true,
  configData: true,
  public: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
