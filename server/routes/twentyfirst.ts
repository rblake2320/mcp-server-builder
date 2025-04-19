import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import twentyfirstClient from '../clients/twentyfirst';

const router = Router();
const mcpServersDir = path.join(process.cwd(), 'mcpservers');

// Ensure the directories exist
if (!fs.existsSync(mcpServersDir)) {
  fs.mkdirSync(mcpServersDir, { recursive: true });
  
  // Create subdirectories if they don't exist
  fs.mkdirSync(path.join(mcpServersDir, 'templates'), { recursive: true });
  fs.mkdirSync(path.join(mcpServersDir, 'examples'), { recursive: true });
  fs.mkdirSync(path.join(mcpServersDir, 'twentyfirst'), { recursive: true });
}

// GET /api/twentyfirst/mcp-servers - List available 21st.dev MCP servers
router.get('/mcp-servers', async (req, res) => {
  try {
    if (!twentyfirstClient) {
      return res.status(503).json({ 
        error: '21st.dev integration is not available',
        message: 'TWENTYFIRST_API_KEY not configured' 
      });
    }
    
    const servers = await twentyfirstClient.getMcpServers();
    res.json(servers);
  } catch (error) {
    console.error('Error listing 21st.dev MCP servers:', error);
    res.status(500).json({ 
      error: 'Failed to list 21st.dev MCP servers',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/twentyfirst/mcp-servers/:id - Get specific 21st.dev MCP server
router.get('/mcp-servers/:id', async (req, res) => {
  try {
    if (!twentyfirstClient) {
      return res.status(503).json({ 
        error: '21st.dev integration is not available',
        message: 'TWENTYFIRST_API_KEY not configured' 
      });
    }
    
    const serverId = req.params.id;
    const server = await twentyfirstClient.getMcpServer(serverId);
    res.json(server);
  } catch (error) {
    console.error(`Error getting 21st.dev MCP server ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to get 21st.dev MCP server',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/twentyfirst/mcp-servers/:id/code - Get 21st.dev MCP server code
router.get('/mcp-servers/:id/code', async (req, res) => {
  try {
    if (!twentyfirstClient) {
      return res.status(503).json({ 
        error: '21st.dev integration is not available',
        message: 'TWENTYFIRST_API_KEY not configured' 
      });
    }
    
    const serverId = req.params.id;
    const code = await twentyfirstClient.getMcpServerCode(serverId);
    res.json({ code });
  } catch (error) {
    console.error(`Error getting 21st.dev MCP server code ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to get 21st.dev MCP server code',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/twentyfirst/import/:id - Import 21st.dev MCP server
router.post('/import/:id', async (req, res) => {
  try {
    if (!twentyfirstClient) {
      return res.status(503).json({ 
        error: '21st.dev integration is not available',
        message: 'TWENTYFIRST_API_KEY not configured' 
      });
    }
    
    const serverId = req.params.id;
    const { info, code } = await twentyfirstClient.importMcpServer(serverId);
    
    // Determine file name and path
    const fileName = `${info.name.toLowerCase().replace(/\s+/g, '_')}.js`;
    const filePath = path.join(mcpServersDir, 'twentyfirst', fileName);
    
    // Save the server code
    fs.writeFileSync(filePath, code);
    
    // Update server index
    const indexPath = path.join(mcpServersDir, 'server_index.json');
    let serverIndex: { templates: any[], examples: any[] } = { templates: [], examples: [] };
    
    if (fs.existsSync(indexPath)) {
      serverIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    
    // Add new server metadata to the index
    const serverMeta = {
      name: info.name,
      path: path.relative(mcpServersDir, filePath),
      language: 'javascript',
      description: info.description || `MCP server from 21st.dev: ${info.name}`,
      difficulty: 'intermediate',
      dependencies: ['express', 'cors'],
      tools: info.tools || [],
      source: '21st.dev',
      sourceId: serverId
    };
    
    // Check if server already exists in index
    const existingIndex = serverIndex.examples.findIndex(
      (s: any) => s.source === '21st.dev' && s.sourceId === serverId
    );
    
    if (existingIndex >= 0) {
      // Update existing entry
      serverIndex.examples[existingIndex] = serverMeta;
    } else {
      // Add new entry
      serverIndex.examples.push(serverMeta);
    }
    
    // Save updated index
    fs.writeFileSync(indexPath, JSON.stringify(serverIndex, null, 2));
    
    res.status(201).json({
      message: 'Successfully imported 21st.dev MCP server',
      server: serverMeta
    });
  } catch (error) {
    console.error(`Error importing 21st.dev MCP server ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to import 21st.dev MCP server',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;