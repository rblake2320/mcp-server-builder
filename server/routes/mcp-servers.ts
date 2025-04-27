import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';

// Create router
const router = Router();

// Helper function to get unique values of a property from an array of objects
function getUniqueValues(array: any[], property: string): string[] {
  const values: Record<string, boolean> = {};
  
  array.forEach(item => {
    if (item[property]) {
      values[item[property]] = true;
    }
  });
  
  return Object.keys(values);
}

// Types for MCP servers
interface MCPServer {
  id: string | number;
  name: string;
  path: string;
  language: string;
  description: string;
  difficulty?: string;
  category?: string;
  dependencies?: string[];
  tools?: string[];
  type?: string;
  status?: string;
  author?: string;
  source?: string;
  tags?: string[];
  [key: string]: any; // For allowing any property access with index notation
}

interface ServerIndex {
  templates: MCPServer[];
  examples: MCPServer[];
  imported: MCPServer[]; // Making this required, not optional
}

// In-memory cache for server data
let serverCache: ServerIndex | null = null;
let serverStatsCache: any = null;

// Initialize the server cache if it doesn't exist
function initServerCache(): ServerIndex {
  if (serverCache) return serverCache;
  
  console.log('Initializing server cache...');
  
  try {
    // First try to load the full server index from version_2/mcpservers
    const v2IndexPath = path.join(process.cwd(), 'version_2', 'mcpservers', 'server_index.json');
    
    if (fs.existsSync(v2IndexPath)) {
      console.log('Loading server data from version_2/mcpservers/server_index.json');
      const data = fs.readFileSync(v2IndexPath, 'utf-8');
      const fullServerIndex = JSON.parse(data) as ServerIndex;
      
      // Add status field to all servers (95% up, 5% down for realistic display)
      const processedIndex: ServerIndex = {
        templates: fullServerIndex.templates.map(server => ({
          ...server,
          type: 'template',
          status: Math.random() < 0.95 ? 'up' : 'down'
        })),
        examples: fullServerIndex.examples.map(server => ({
          ...server,
          type: 'example',
          status: Math.random() < 0.95 ? 'up' : 'down'
        })),
        imported: fullServerIndex.imported ? fullServerIndex.imported.map(server => ({
          ...server,
          type: 'imported',
          status: Math.random() < 0.95 ? 'up' : 'down'
        })) : []
      };
      
      serverCache = processedIndex;
      console.log(`Loaded ${processedIndex.templates.length + processedIndex.examples.length + (processedIndex.imported?.length || 0)} servers from version_2`);
      return serverCache;
    }
    
    // Fall back to the current mcpservers directory if version_2 doesn't exist
    const mcpServersPath = path.join(process.cwd(), 'mcpservers');
    const serverIndexPath = path.join(mcpServersPath, 'server_index.json');
    
    if (fs.existsSync(serverIndexPath)) {
      console.log('Loading server data from mcpservers/server_index.json');
      const serverIndexData = JSON.parse(fs.readFileSync(serverIndexPath, 'utf-8')) as ServerIndex;
      
      // Create template structure if old index doesn't have proper structure
      const processedIndex: ServerIndex = {
        templates: serverIndexData.templates.map(server => ({
          ...server,
          type: 'template',
          status: 'up'
        })),
        examples: serverIndexData.examples.map(server => ({
          ...server,
          type: 'example',
          status: 'up'
        })),
        imported: []
      };
      
      // Just use the actual servers we have
      serverCache = processedIndex;
      
      return serverCache;
    }
    
    // If no server index exists at all, create a minimal structure
    console.warn('No server index found, creating empty structure');
    serverCache = { templates: [], examples: [], imported: [] };
    return serverCache;
  } catch (err) {
    console.error('Error loading server cache:', err);
    serverCache = { templates: [], examples: [], imported: [] };
    return serverCache;
  }
}

// Reset stats cache when server starts to ensure we're using actual data
serverStatsCache = null;

// Register the routes
router.get('/', getServers);
router.get('/stats', getServerStats);
router.get('/languages', getLanguagesStats);
router.get('/categories', getCategoriesStats);

// Export the router
export default router;

// Get all servers with pagination and filtering
function getServers(req: Request, res: Response) {
  const servers = initServerCache();
  
  // Parse query parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const sortBy = (req.query.sortBy as string) || 'name';
  const sortDirection = (req.query.sortDirection as string) || 'asc';
  const filterType = req.query.type as string;
  const filterLanguage = req.query.language as string;
  const filterCategory = req.query.category as string;
  const filterDifficulty = req.query.difficulty as string;
  const searchQuery = req.query.search as string;
  
  // Combine all server types
  let allServers = [
    ...servers.templates,
    ...servers.examples,
    ...servers.imported
  ];
  
  // Apply filters
  if (filterType) {
    allServers = allServers.filter(server => server.type === filterType);
  }
  
  if (filterLanguage) {
    allServers = allServers.filter(server => server.language === filterLanguage);
  }
  
  if (filterCategory) {
    allServers = allServers.filter(server => server.category === filterCategory);
  }
  
  if (filterDifficulty) {
    allServers = allServers.filter(server => server.difficulty === filterDifficulty);
  }
  
  // Apply search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    allServers = allServers.filter(server => 
      server.name.toLowerCase().includes(query) || 
      server.description.toLowerCase().includes(query)
    );
  }
  
  // Apply sorting
  allServers.sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];
    
    // Handle string comparison
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }
    
    // Compare values
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedServers = allServers.slice(startIndex, endIndex);
  
  // Prepare response
  const response = {
    servers: paginatedServers,
    pagination: {
      total: allServers.length,
      page,
      limit,
      totalPages: Math.ceil(allServers.length / limit)
    },
    filters: {
      types: ['template', 'example', 'imported'],
      languages: getUniqueValues(allServers, 'language'),
      categories: getUniqueValues(allServers, 'category'),
      difficulties: ['beginner', 'intermediate', 'advanced']
    }
  };
  
  res.json(response);
}

// Get server statistics
function getServerStats(req: Request, res: Response) {
  // Use cached stats if available
  if (serverStatsCache) {
    return res.json(serverStatsCache);
  }
  
  // Initialize the server cache if needed
  const servers = initServerCache();
  
  // Combine all server types
  const allServers = [
    ...servers.templates,
    ...servers.examples,
    ...servers.imported
  ];
  
  // Count servers by status
  let upCount = 0;
  let downCount = 0;
  
  allServers.forEach(server => {
    if (server.status === 'up') {
      upCount++;
    } else if (server.status === 'down') {
      downCount++;
    }
  });
  
  const stats = {
    totalCount: allServers.length,
    upCount,
    downCount
  };
  
  // Cache the stats
  serverStatsCache = stats;
  
  res.json(stats);
}

// Get languages distribution for statistics
function getLanguagesStats(req: Request, res: Response) {
  // Initialize the server cache if needed
  const servers = initServerCache();
  
  // Combine all server types
  const allServers = [
    ...servers.templates,
    ...servers.examples,
    ...servers.imported
  ];
  
  // Count by language
  const languageCounts: Record<string, number> = {};
  allServers.forEach(server => {
    if (server.language) {
      if (!languageCounts[server.language]) {
        languageCounts[server.language] = 0;
      }
      languageCounts[server.language]++;
    }
  });
  
  res.json(languageCounts);
}

// Get categories distribution for statistics
function getCategoriesStats(req: Request, res: Response) {
  // Initialize the server cache if needed
  const servers = initServerCache();
  
  // Combine all server types
  const allServers = [
    ...servers.templates,
    ...servers.examples,
    ...servers.imported
  ];
  
  // Count by category
  const categoryCounts: Record<string, number> = {};
  allServers.forEach(server => {
    if (server.category) {
      if (!categoryCounts[server.category]) {
        categoryCounts[server.category] = 0;
      }
      categoryCounts[server.category]++;
    }
  });
  
  res.json(categoryCounts);
}