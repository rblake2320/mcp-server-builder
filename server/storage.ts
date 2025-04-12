import { users, type User, type InsertUser, type Server, type InsertServer } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private servers: Map<number, Server>;
  private userCurrentId: number;
  private serverCurrentId: number;

  constructor() {
    this.users = new Map();
    this.servers = new Map();
    this.userCurrentId = 1;
    this.serverCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Server methods
  async getServer(id: number): Promise<Server | undefined> {
    return this.servers.get(id);
  }
  
  async getServerByBuildId(buildId: string): Promise<Server | undefined> {
    return Array.from(this.servers.values()).find(
      (server) => server.buildId === buildId,
    );
  }
  
  async createServer(insertServer: InsertServer): Promise<Server> {
    const id = this.serverCurrentId++;
    const server: Server = { ...insertServer, id };
    this.servers.set(id, server);
    return server;
  }
  
  async listServers(limit?: number): Promise<Server[]> {
    const servers = Array.from(this.servers.values());
    // Sort by creation date (newest first)
    servers.sort((a, b) => b.createdAt - a.createdAt);
    
    if (limit) {
      return servers.slice(0, limit);
    }
    
    return servers;
  }
}

export const storage = new MemStorage();
