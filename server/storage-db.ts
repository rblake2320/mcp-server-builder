import { db } from "./db";
import { users, type User, type InsertUser, type Server, type InsertServer, servers } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Server operations
  getServer(id: number): Promise<Server | undefined>;
  getServerByBuildId(buildId: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  listServers(limit?: number): Promise<Server[]>;
  
  // Session store
  sessionStore: session.Store;
}

// Get the Store class from connect-pg-simple
const PostgresSessionStore = connectPgSimple(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Server methods
  async getServer(id: number): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }
  
  async getServerByBuildId(buildId: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.buildId, buildId));
    return server;
  }
  
  async createServer(insertServer: InsertServer): Promise<Server> {
    const [server] = await db.insert(servers).values(insertServer).returning();
    return server;
  }
  
  async listServers(limit?: number): Promise<Server[]> {
    // Create the query
    const query = db.select().from(servers).orderBy(desc(servers.createdAt));
    
    // Execute with or without limit
    if (limit !== undefined) {
      return await query.limit(limit);
    } else {
      return await query;
    }
  }
}

export const storage = new DatabaseStorage();