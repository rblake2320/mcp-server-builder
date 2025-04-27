import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import axios from 'axios';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

const router = Router();
const mcpServersDir = path.join(process.cwd(), 'mcpservers');

// Ensure the directory exists
if (!fs.existsSync(mcpServersDir)) {
  fs.mkdirSync(mcpServersDir, { recursive: true });
  
  // Create subdirectories if they don't exist
  fs.mkdirSync(path.join(mcpServersDir, 'templates'), { recursive: true });
  fs.mkdirSync(path.join(mcpServersDir, 'examples'), { recursive: true });
}

// GET /api/mcp-servers - List available MCP servers
router.get('/', (req, res) => {
  try {
    // Try to read the server index file
    const indexPath = path.join(mcpServersDir, 'server_index.json');
    
    if (fs.existsSync(indexPath)) {
      const serverIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      return res.json(serverIndex);
    }
    
    // If the index doesn't exist, scan directories to build it
    const templates = scanDirectory(path.join(mcpServersDir, 'templates'));
    const examples = scanDirectory(path.join(mcpServersDir, 'examples'));
    
    const serverIndex = { templates, examples };
    
    // Save the index for future use
    fs.writeFileSync(indexPath, JSON.stringify(serverIndex, null, 2));
    
    res.json(serverIndex);
  } catch (error) {
    console.error('Error listing MCP servers:', error);
    res.status(500).json({ error: 'Failed to list MCP servers' });
  }
});

// GET /api/mcp-servers/stats - Get server statistics
router.get('/stats', (req, res) => {
  try {
    // Try to read the server index file
    const indexPath = path.join(mcpServersDir, 'server_index.json');
    
    if (!fs.existsSync(indexPath)) {
      return res.json({ 
        totalCount: 0, 
        upCount: 0, 
        downCount: 0,
        byType: { templates: 0, examples: 0, imported: 0 } 
      });
    }
    
    const serverIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    // Count servers
    const templatesCount = serverIndex.templates?.length || 0;
    const examplesCount = serverIndex.examples?.length || 0;
    const importedCount = serverIndex.imported?.length || 0;
    const totalCount = templatesCount + examplesCount + importedCount;
    
    // Simulate up/down counts (in a real implementation, we would check actual server status)
    // For now, we're assuming 95% of servers are up
    const upCount = Math.round(totalCount * 0.95);
    const downCount = totalCount - upCount;
    
    res.json({
      totalCount,
      upCount,
      downCount,
      byType: {
        templates: templatesCount,
        examples: examplesCount,
        imported: importedCount
      }
    });
  } catch (error) {
    console.error('Error getting MCP server stats:', error);
    res.status(500).json({ error: 'Failed to get server stats' });
  }
});

// GET /api/mcp-servers/:path - Get server code
router.get('/:serverPath(*)', (req, res) => {
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
    
    if (fs.statSync(fullPath).isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory, not a file' });
    }
    
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    
    res.json({
      path: serverPath,
      content: fileContent
    });
  } catch (error) {
    console.error('Error reading server code:', error);
    res.status(500).json({ error: 'Failed to read server code' });
  }
});

// GET /api/mcp-servers/download/:path - Download server code as ZIP
router.get('/download/:serverPath(*)', (req, res) => {
  console.log("Download request for:", req.params.serverPath);
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
    
    // Set up the archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Set the headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(serverPath)}.zip`);
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    if (fs.statSync(fullPath).isDirectory()) {
      // Add directory contents to the archive
      archive.directory(fullPath, false);
    } else {
      // Add single file to the archive
      archive.file(fullPath, { name: path.basename(fullPath) });
      
      // For single files, let's also gather necessary files for a complete project
      // Like package.json, README, etc. based on the type of server
      
      // Check if it's JavaScript/TypeScript
      if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
        // Add a sample package.json
        const packageJson = {
          "name": path.basename(fullPath, path.extname(fullPath)),
          "version": "1.0.0",
          "description": "MCP Server created with MCP Server Builder",
          "main": path.basename(fullPath),
          "scripts": {
            "start": `node ${path.basename(fullPath)}`
          },
          "dependencies": {
            "express": "^4.18.2",
            "cors": "^2.8.5"
          }
        };
        
        archive.append(JSON.stringify(packageJson, null, 2), { name: 'package.json' });
      } 
      // If it's Python
      else if (fullPath.endsWith('.py')) {
        // Add a requirements.txt
        archive.append('', { name: 'requirements.txt' });
      }
      
      // Add a README.md
      const readmeContent = `# MCP Server: ${path.basename(fullPath, path.extname(fullPath))}

An MCP server for Anthropic Claude.

## How to Use

1. Install dependencies:
${fullPath.endsWith('.js') || fullPath.endsWith('.ts') ? '   ```\n   npm install\n   ```' : '   ```\n   pip install -r requirements.txt\n   ```'}

2. Start the server:
${fullPath.endsWith('.js') || fullPath.endsWith('.ts') ? '   ```\n   node ' + path.basename(fullPath) + '\n   ```' : '   ```\n   python ' + path.basename(fullPath) + '\n   ```'}

3. Connect to Claude:
   - In Claude Desktop, go to Settings > MCP > Add Server
   - Enter the server URL (typically http://localhost:3000)
   - Click "Connect"

## License

MIT
`;
      
      archive.append(readmeContent, { name: 'README.md' });
    }
    
    // Finalize the archive and send the response
    archive.finalize();
  } catch (error) {
    console.error('Error downloading server:', error);
    res.status(500).json({ error: 'Failed to download server' });
  }
});

// Helper function to scan a directory for server files
function scanDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  
  const result = [];
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.py') || file.endsWith('.ts'))) {
      const relativePath = path.relative(mcpServersDir, filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Try to extract information from the file content
      const name = extractName(file, content);
      const description = extractDescription(content);
      const language = file.endsWith('.py') ? 'python' : 'javascript';
      const tools = extractTools(content);
      
      result.push({
        name,
        path: relativePath,
        language,
        description,
        difficulty: 'intermediate',
        dependencies: extractDependencies(content, language),
        tools
      });
    }
  }
  
  return result;
}

// Helper functions to extract info from server files
function extractName(filename: string, content: string): string {
  // Try to extract name from comment or class name
  const nameMatch = content.match(/(?:\/\*\*|#)\s*([^*\n]+)(?:\*\/|$)/);
  if (nameMatch && nameMatch[1].trim()) {
    return nameMatch[1].trim();
  }
  
  // Fallback to filename
  return filename.replace(/\.(js|py|ts)$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function extractDescription(content: string): string {
  // Try to extract description from comments
  const descMatch = content.match(/(?:\/\*\*|#)(?:[^*]|\*[^\/])*(?:\*\/|$)/);
  if (descMatch) {
    const desc = descMatch[0]
      .replace(/(?:\/\*\*|\*\/|#)/g, '')
      .replace(/\*/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('@'))
      .join(' ')
      .trim();
    
    if (desc) {
      return desc;
    }
  }
  
  return 'An MCP server for Claude';
}

function extractTools(content: string): string[] {
  const tools = new Set<string>();
  
  // Look for tools in manifest or endpoints
  const toolMatches = content.match(/["']?name["']?\s*:\s*["']([^"']+)["']/g);
  if (toolMatches) {
    toolMatches.forEach(match => {
      const tool = match.match(/["']([^"']+)["']/);
      if (tool && tool[1] && !tool[1].includes('server')) {
        tools.add(tool[1]);
      }
    });
  }
  
  // Look for endpoints in Express
  const routeMatches = content.match(/(?:app|router)\.(?:post|get)\(['"]\/([^'"]+)['"]/g);
  if (routeMatches) {
    routeMatches.forEach(match => {
      const route = match.match(/['"]\/([^'"]+)['"]/);
      if (route && route[1] && route[1] !== '') {
        tools.add(route[1]);
      }
    });
  }
  
  return Array.from(tools);
}

function extractDependencies(content: string, language: string): string[] {
  if (language === 'python') {
    // Look for imports in Python
    const importMatches = content.match(/(?:import|from)\s+([^\s.]+)(?:\s+|\.\*)/g);
    if (importMatches) {
      const deps = new Set<string>();
      importMatches.forEach(match => {
        const mod = match.match(/(?:import|from)\s+([^\s.]+)/);
        if (mod && mod[1] && !['os', 'sys', 'json', 'time', 'math', 'random', 'datetime', 're'].includes(mod[1])) {
          deps.add(mod[1]);
        }
      });
      return Array.from(deps);
    }
  } else {
    // Look for requires or imports in JS/TS
    const requireMatches = content.match(/(?:require|import).*?["']([^"'./]+)["']/g);
    if (requireMatches) {
      const deps = new Set<string>();
      requireMatches.forEach(match => {
        const mod = match.match(/["']([^"'./]+)["']/);
        if (mod && mod[1]) {
          deps.add(mod[1]);
        }
      });
      return Array.from(deps);
    }
  }
  
  return [];
}

// Server type definition for the index
interface MCPServer {
  name: string;
  path: string;
  language: string;
  description: string;
  difficulty: string;
  dependencies: string[];
  tools: string[];
  requires_api_key?: boolean;
  api_provider?: string;
}

interface ServerIndex {
  templates: MCPServer[];
  examples: MCPServer[];
}

// POST /api/mcp-servers/import - Import a server from URL
router.post('/import', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Support for different URL formats
    let fileUrl = url;
    let fileName: string;
    
    // Extract file name from URL
    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
      // GitHub URL conversion
      // Convert https://github.com/username/repo/blob/main/file.js to
      // https://raw.githubusercontent.com/username/repo/main/file.js
      fileUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      
      // Get filename from GitHub URL
      const urlParts = url.split('/');
      fileName = urlParts[urlParts.length - 1];
    } else if (url.includes('gist.github.com')) {
      // Gist URL conversion
      // This is more complex as we need to fetch the gist info first
      return res.status(400).json({ 
        error: 'Gist URLs are not yet supported. Please use raw GitHub URLs instead.' 
      });
    } else {
      // Extract filename from generic URL
      const urlParts = new URL(url).pathname.split('/');
      fileName = urlParts[urlParts.length - 1];
    }
    
    if (!fileName || !(fileName.endsWith('.js') || fileName.endsWith('.py') || fileName.endsWith('.ts'))) {
      return res.status(400).json({ 
        error: 'Invalid file format. Only .js, .py, and .ts files are supported.' 
      });
    }
    
    console.log(`Importing server from ${fileUrl}, fileName: ${fileName}`);
    
    // Determine destination path
    const destDir = path.join(mcpServersDir, 'examples');
    const destPath = path.join(destDir, fileName);
    
    // Ensure examples directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Check if file already exists
    if (fs.existsSync(destPath)) {
      // Add timestamp to make filename unique
      const extname = path.extname(fileName);
      const basename = path.basename(fileName, extname);
      fileName = `${basename}_${Date.now()}${extname}`;
    }
    
    // Fetch the file
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });
    
    if (response.status !== 200) {
      return res.status(response.status).json({ 
        error: `Failed to fetch file: ${response.statusText}` 
      });
    }
    
    // Save the file
    const finalDestPath = path.join(destDir, fileName);
    const writer = createWriteStream(finalDestPath);
    
    await pipeline(response.data, writer);
    
    // Read the file to extract metadata
    const fileContent = fs.readFileSync(finalDestPath, 'utf8');
    const language = finalDestPath.endsWith('.py') ? 'python' : 'javascript';
    
    // Extract server info
    const name = extractName(fileName, fileContent);
    const description = extractDescription(fileContent);
    const tools = extractTools(fileContent);
    const dependencies = extractDependencies(fileContent, language);
    
    // Update server index
    const indexPath = path.join(mcpServersDir, 'server_index.json');
    let serverIndex: ServerIndex = { templates: [], examples: [] };
    
    if (fs.existsSync(indexPath)) {
      serverIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as ServerIndex;
    }
    
    // Add the new server to examples
    serverIndex.examples.push({
      name,
      path: path.relative(mcpServersDir, finalDestPath),
      language,
      description,
      difficulty: 'intermediate',
      dependencies,
      tools
    });
    
    // Save updated index
    fs.writeFileSync(indexPath, JSON.stringify(serverIndex, null, 2));
    
    res.status(201).json({ 
      message: 'Server imported successfully',
      server: {
        name,
        path: path.relative(mcpServersDir, finalDestPath),
        language,
        description,
        tools
      }
    });
  } catch (error) {
    console.error('Error importing server:', error);
    res.status(500).json({ 
      error: 'Failed to import server', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;