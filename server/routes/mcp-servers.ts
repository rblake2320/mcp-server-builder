import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

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

export default router;