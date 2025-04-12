import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-storage"; // Using database storage instead of memory storage
import { setupAuth } from "./auth"; // Import auth setup
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import { v4 as uuidv4 } from "uuid";
import { insertServerSchema, User } from "@shared/schema";
import { pythonTemplate, typescriptTemplate, readmeTemplate, dockerfileTemplate, installScriptTemplate, packageJsonTemplate } from "../client/src/lib/templates";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Ensure directories exist
  fs.ensureDirSync(path.join(process.cwd(), 'builds'));
  fs.ensureDirSync(path.join(process.cwd(), 'downloads'));

  // Create MCP server
  app.post('/api/create-server', async (req, res) => {
    try {
      const { serverName, description, serverType, tools } = req.body;
      
      if (!serverName || !serverType || !tools || !Array.isArray(tools)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Create a unique ID for this build
      const buildId = uuidv4();
      const buildDir = path.join(process.cwd(), 'builds', buildId);
      fs.ensureDirSync(buildDir);
      
      // Create server config object from request
      const serverConfig = {
        serverName,
        serverType,
        description,
        tools
      };
      
      // Create main server file
      const serverFilename = serverType === 'python' ? 'server.py' : 'server.js';
      const serverCode = serverType === 'python' 
        ? pythonTemplate(serverConfig) 
        : typescriptTemplate(serverConfig);
      fs.writeFileSync(path.join(buildDir, serverFilename), serverCode);
      
      // Create package.json if TypeScript
      if (serverType === 'typescript') {
        fs.writeFileSync(
          path.join(buildDir, 'package.json'),
          packageJsonTemplate(serverName, description)
        );
      }
      
      // Create README.md
      fs.writeFileSync(
        path.join(buildDir, 'README.md'),
        readmeTemplate(serverName, description)
      );
      
      // Create Dockerfile
      fs.writeFileSync(
        path.join(buildDir, 'Dockerfile'),
        dockerfileTemplate()
      );
      
      // Create install script
      fs.writeFileSync(
        path.join(buildDir, 'install.sh'),
        installScriptTemplate(serverType)
      );
      fs.chmodSync(path.join(buildDir, 'install.sh'), '755');
      
      // Create zip file
      const zipFilePath = path.join(process.cwd(), 'downloads', `${buildId}.zip`);
      
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      archive.pipe(output);
      archive.directory(buildDir, false);
      
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.finalize();
      });
      
      // Store server in database
      const serverData = {
        buildId,
        serverName,
        serverType,
        description,
        tools: JSON.stringify(tools),
        // Associate with logged-in user if available
        userId: req.isAuthenticated() ? (req.user as User).id : undefined
      };

      try {
        // Validate with schema
        insertServerSchema.parse(serverData);
        
        // Store in database
        await storage.createServer(serverData);
      } catch (error) {
        console.error('Error storing server data:', error);
        // Continue anyway since we've already created the files
      }
      
      res.json({
        success: true,
        buildId,
        downloadUrl: `/api/download/${buildId}`,
        message: 'MCP server created successfully!'
      });
    } catch (error) {
      console.error('Error creating server:', error);
      res.status(500).json({ error: 'Failed to create MCP server' });
    }
  });

  // Download API endpoint
  app.get('/api/download/:buildId', (req, res) => {
    const { buildId } = req.params;
    const zipFilePath = path.join(process.cwd(), 'downloads', `${buildId}.zip`);
    
    if (!fs.existsSync(zipFilePath)) {
      return res.status(404).json({ error: 'Build not found' });
    }
    
    res.download(zipFilePath);
  });
  
  // List all servers endpoint
  app.get('/api/servers', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const servers = await storage.listServers(limit);
      res.json(servers);
    } catch (error) {
      console.error('Error listing servers:', error);
      res.status(500).json({ error: 'Failed to list servers' });
    }
  });
  
  // List user's servers endpoint (auth required)
  app.get('/api/my-servers', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = (req.user as User).id;
      const servers = await storage.getUserServers(userId);
      res.json(servers);
    } catch (error) {
      console.error('Error listing user servers:', error);
      res.status(500).json({ error: 'Failed to list servers' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
