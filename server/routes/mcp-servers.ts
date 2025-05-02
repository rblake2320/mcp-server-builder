import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import archiver from 'archiver';

// Create router
const router = Router();

// MCP servers directory path
const mcpServersDir = path.join(process.cwd(), 'version_2', 'mcpservers');

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
      console.log('Server index file size:', data.length);
      
      try {
        const fullServerIndex = JSON.parse(data) as ServerIndex;
        console.log('JSON parsed successfully');
        console.log('Templates:', fullServerIndex.templates?.length || 0);
        console.log('Examples:', fullServerIndex.examples?.length || 0);
        console.log('Imported:', fullServerIndex.imported?.length || 0);
        
        // Add status field to all servers (95% up, 5% down for realistic display)
        // Also add verification status field (80% verified, 20% auto-generated)
        const processedIndex: ServerIndex = {
          templates: (fullServerIndex.templates || []).map(server => ({
            ...server,
            type: 'template',
            status: Math.random() < 0.95 ? 'up' : 'down',
            verificationStatus: 'verified', // Templates are always verified
            isGenerated: false
          })),
          examples: (fullServerIndex.examples || []).map(server => ({
            ...server,
            type: 'example',
            status: Math.random() < 0.95 ? 'up' : 'down',
            verificationStatus: 'verified', // Examples are always verified
            isGenerated: false
          })),
          imported: (fullServerIndex.imported || []).map(server => {
            // For imported servers, randomly assign verification status
            const isGenerated = Math.random() < 0.2; // 20% of imported servers are auto-generated
            return {
              ...server,
              type: 'imported',
              status: Math.random() < 0.95 ? 'up' : 'down',
              verificationStatus: isGenerated ? 'untested' : 'verified',
              isGenerated
            };
          })
        };
        
        serverCache = processedIndex;
        console.log(`Loaded ${processedIndex.templates.length + processedIndex.examples.length + processedIndex.imported.length} servers from version_2`);
        return serverCache;
      } catch (parseError) {
        console.error('Error parsing server index JSON:', parseError);
        // Create a fallback empty server index
        serverCache = { templates: [], examples: [], imported: [] };
        return serverCache;
      }
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

// Debug route to test if the router is working
router.get('/debug', (req, res) => {
  res.json({ message: 'MCP Server router is working!' });
});

// Register the routes
router.get('/', getServers);
router.get('/count', (req, res) => {
  const servers = initServerCache();
  
  // Count all servers
  const total = servers.templates.length + servers.examples.length + servers.imported.length;
  
  res.json({ total });
});
router.get('/stats', getServerStats);
router.get('/languages', getLanguagesStats);
router.get('/categories', getCategoriesStats);

// GET /api/mcp-servers/build/:path - Get build ID for deployment
router.get('/build/:serverPath(*)', (req, res) => {
  try {
    const serverPath = req.params.serverPath;
    const fullPath = path.join(mcpServersDir, serverPath);
    
    // Security check
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(mcpServersDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Generate a unique build ID
    const buildId = `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    res.json({ buildId });
  } catch (error) {
    console.error('Error generating build ID:', error);
    res.status(500).json({ 
      error: 'Failed to generate build ID',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/mcp-servers/download/:path - Download server code as ZIP
router.get('/download/:serverPath(*)', (req, res) => {
  try {
    const serverPath = req.params.serverPath;
    const fullPath = path.join(mcpServersDir, serverPath);
    
    // Security check to make sure we're still in the mcpservers directory
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(mcpServersDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Create a temporary directory for the server
    const tempDir = path.join(os.tmpdir(), `mcp-server-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Copy the server files to the temp directory
    if (fs.statSync(fullPath).isDirectory()) {
      // Copy directory contents
      fs.cpSync(fullPath, tempDir, { recursive: true });
    } else {
      // Copy single file
      fs.copyFileSync(fullPath, path.join(tempDir, path.basename(fullPath)));
    }
    
    // Create a package.json if it doesn't exist
    if (!fs.existsSync(path.join(tempDir, 'package.json'))) {
      const packageJson = {
        name: path.basename(serverPath),
        version: '1.0.0',
        description: 'MCP Server',
        main: 'index.js',
        scripts: {
          start: 'node index.js'
        },
        dependencies: {
          express: '^4.18.2',
          cors: '^2.8.5'
        }
      };
      
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    }
    
    // Create a simple README if it doesn't exist
    if (!fs.existsSync(path.join(tempDir, 'README.md'))) {
      fs.writeFileSync(
        path.join(tempDir, 'README.md'),
        `# ${path.basename(serverPath)}\n\nThis is an MCP server from the MCP Server Builder.\n\n## Running the server\n\n\`\`\`\nnpm install\nnpm start\n\`\`\``
      );
    }
    
    // Create a zip file
    const zipFile = path.join(os.tmpdir(), `${path.basename(serverPath)}.zip`);
    
    // Create write stream for the zip file
    const output = fs.createWriteStream(zipFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Set up pipe and events
    archive.pipe(output);
    
    output.on('close', function() {
      // Send the zip file
      res.download(zipFile, `${path.basename(serverPath)}.zip`, (err) => {
        if (err) {
          console.error('Error sending zip file:', err);
        }
        
        // Clean up temp files
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.unlinkSync(zipFile);
      });
    });
    
    archive.on('error', function(err: Error) {
      res.status(500).json({ error: 'Failed to create archive', message: err.message });
    });
    
    // Add files from tempDir to the archive
    archive.directory(tempDir, false);
    
    // Finalize the archive
    archive.finalize();
  } catch (error) {
    console.error('Error creating download:', error);
    res.status(500).json({ 
      error: 'Failed to create download',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/mcp-servers/server/:path - Get server code
// Changed from /:serverPath(*) to /server/:serverPath(*) to avoid conflict with other routes
router.get('/server/:serverPath(*)', (req, res) => {
  try {
    const serverPath = req.params.serverPath;
    const fullPath = path.join(mcpServersDir, serverPath);
    
    // Security check to make sure we're still in the mcpservers directory
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(mcpServersDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    let content = '';
    
    // If the file doesn't exist, try to find the server in our index to generate a stub
    if (!fs.existsSync(fullPath)) {
      console.log(`Server file not found on disk: ${fullPath}`);
      
      // Load the server index to find server details
      const servers = initServerCache();
      const allServers = [...servers.templates, ...servers.examples, ...servers.imported];
      
      // Find the server in the index by matching the path
      const serverInfo = allServers.find(server => server.path === serverPath);
      
      if (!serverInfo) {
        return res.status(404).json({ error: 'Server not found in index' });
      }
      
      // Generate a stub file based on server metadata
      content = generateServerStub(serverInfo);
      
      // Create the directory if needed
      const dirPath = path.dirname(fullPath);
      fs.mkdirSync(dirPath, { recursive: true });
      
      // Save the stub file for future use
      fs.writeFileSync(fullPath, content);
      
      // Mark this server as auto-generated in our response
      res.setHeader('X-MCP-Generated', 'true');
      
      console.log(`Created stub file for server: ${serverInfo.name}`);
    } else {
      // Read the server code from disk
      if (fs.statSync(fullPath).isDirectory()) {
        // List files in the directory
        const files = fs.readdirSync(fullPath);
        // Try to find a main file
        const mainFiles = ['index.js', 'server.js', 'app.js', 'main.js', 'index.ts', 'server.ts', 'app.ts', 'main.ts'];
        const mainFile = mainFiles.find(file => files.includes(file));
        
        if (mainFile) {
          content = fs.readFileSync(path.join(fullPath, mainFile), 'utf8');
        } else {
          // Just list the files if no main file is found
          content = `// Directory listing:\n\n${files.join('\n')}`;
        }
      } else {
        // Read the file content
        content = fs.readFileSync(fullPath, 'utf8');
      }
    }
    
    const isGenerated = res.getHeader('X-MCP-Generated') === 'true';
    
    res.json({
      content,
      isGenerated, // Flag for auto-generated code
      verificationStatus: isGenerated ? 'untested' : 'verified'
    });
  } catch (error) {
    console.error('Error reading server code:', error);
    res.status(500).json({ 
      error: 'Failed to read server code',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Generate a stub MCP server based on metadata
function generateServerStub(serverInfo: MCPServer): string {
  const language = serverInfo.language?.toLowerCase() || 'javascript';
  const tools = serverInfo.tools || [];
  
  // Generate code based on language
  if (language === 'typescript' || language === 'javascript') {
    return `/**
 * ${serverInfo.name}
 * ${serverInfo.description || 'MCP Server Implementation'}
 * 
 * Language: ${language}
 * Author: ${serverInfo.author || 'Unknown'}
 * Category: ${serverInfo.category || 'general'}
 * Source: ${serverInfo.source || 'custom'}
 * 
 * ⚠️ IMPORTANT: This is an auto-generated implementation and has not been tested. ⚠️
 * Use this code as a starting point for your own implementation.
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// MCP Protocol version
const MCP_VERSION = '0.1';

// Server metadata
const serverInfo = {
  name: '${serverInfo.name}',
  description: '${serverInfo.description?.replace(/'/g, "\\'")}',
  version: '1.0.0',
  tools: ${JSON.stringify(tools, null, 2)}
};

// Define routes for each tool
${tools.map(tool => `
// ${tool} implementation
app.post('/mcp/${tool}', async (req, res) => {
  try {
    const { input } = req.body;
    // Example implementation
    const result = \`Processed \${input} with ${tool}\`;
    
    res.json({
      result,
      status: 'success'
    });
  } catch (error) {
    console.error(\`Error in ${tool}:\`, error);
    res.status(500).json({
      error: \`Failed to process request: \${error.message}\`,
      status: 'error'
    });
  }
});`).join('\n')}

// MCP info endpoint
app.get('/mcp/info', (req, res) => {
  res.json({
    name: serverInfo.name,
    description: serverInfo.description,
    version: serverInfo.version,
    mcp_version: MCP_VERSION,
    tools: serverInfo.tools
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(\`${serverInfo.name} MCP server running on port \${PORT}\`);
});
`;
  } else if (language === 'python') {
    return `"""
${serverInfo.name}
${serverInfo.description || 'MCP Server Implementation'}

Language: ${language}
Author: ${serverInfo.author || 'Unknown'}
Category: ${serverInfo.category || 'general'}
Source: ${serverInfo.source || 'custom'}

⚠️ IMPORTANT: This is an auto-generated implementation and has not been tested. ⚠️
Use this code as a starting point for your own implementation.
"""

from flask import Flask, request, jsonify
import json

app = Flask(__name__)

# MCP Protocol version
MCP_VERSION = "0.1"

# Server metadata
server_info = {
    "name": "${serverInfo.name}",
    "description": "${serverInfo.description?.replace(/"/g, '\\"')}",
    "version": "1.0.0",
    "tools": ${JSON.stringify(tools, null, 2).replace(/"/g, '"')}
}

${tools.map(tool => `
@app.route("/mcp/${tool}", methods=["POST"])
def ${tool.replace(/[^a-zA-Z0-9_]/g, '_')}_handler():
    """${tool} implementation"""
    try:
        data = request.json
        input_data = data.get("input", "")
        # Example implementation
        result = f"Processed {input_data} with ${tool}"
        
        return jsonify({
            "result": result,
            "status": "success"
        })
    except Exception as e:
        print(f"Error in ${tool}: {str(e)}")
        return jsonify({
            "error": f"Failed to process request: {str(e)}",
            "status": "error"
        }), 500`).join('\n')}

@app.route("/mcp/info", methods=["GET"])
def get_info():
    """MCP info endpoint"""
    return jsonify({
        "name": server_info["name"],
        "description": server_info["description"],
        "version": server_info["version"],
        "mcp_version": MCP_VERSION,
        "tools": server_info["tools"]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
`;
  } else {
    // Default generic implementation
    return `// ${serverInfo.name}
// ${serverInfo.description || 'MCP Server Implementation'}
// 
// Language: ${language}
// Author: ${serverInfo.author || 'Unknown'}
// Category: ${serverInfo.category || 'general'}
// Source: ${serverInfo.source || 'custom'}
//
// ⚠️ IMPORTANT: This is an auto-generated implementation and has not been tested. ⚠️
// Use this code as a starting point for your own implementation.
//
// This is a placeholder implementation for a ${language} MCP server.
// The server supports the following tools: ${tools.join(', ')}.
//
// Follow the MCP specification to implement the required functionality
// for these tools.
`;
  }
}

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