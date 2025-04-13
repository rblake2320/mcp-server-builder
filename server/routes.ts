import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-storage"; // Using database storage instead of memory storage
import { setupAuth } from "./auth"; // Import auth setup
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import { v4 as uuidv4 } from "uuid";
import { insertServerSchema, User } from "@shared/schema";
import { 
  pythonTemplate, 
  typescriptTemplate, 
  readmeTemplate, 
  dockerfileTemplate, 
  installScriptTemplate, 
  packageJsonTemplate,
  MCP_PROTOCOL_VERSION,
  MCP_SDK_VERSION,
  VALIDATION_INFO
} from "../client/src/lib/templates";

// Validation function to ensure server templates are following protocol specifications
function validateServerConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!config.serverName || typeof config.serverName !== 'string') {
    errors.push('Server name is required and must be a string');
  }
  
  if (!config.serverType || !['python', 'typescript'].includes(config.serverType)) {
    errors.push('Server type must be "python" or "typescript"');
  }
  
  if (!config.tools || !Array.isArray(config.tools) || config.tools.length === 0) {
    errors.push('At least one tool must be defined');
  } else {
    // Validate each tool
    config.tools.forEach((tool: any, index: number) => {
      if (!tool.name || typeof tool.name !== 'string') {
        errors.push(`Tool ${index + 1}: name is required and must be a string`);
      }
      
      if (!tool.description || typeof tool.description !== 'string') {
        errors.push(`Tool ${index + 1}: description is required and must be a string`);
      }
      
      if (tool.parameters && Array.isArray(tool.parameters)) {
        tool.parameters.forEach((param: any, paramIndex: number) => {
          if (!param.name || typeof param.name !== 'string') {
            errors.push(`Tool ${index + 1}, Parameter ${paramIndex + 1}: name is required and must be a string`);
          }
          
          if (!param.type || !['string', 'number', 'boolean', 'array', 'object'].includes(param.type)) {
            errors.push(`Tool ${index + 1}, Parameter ${paramIndex + 1}: type must be one of: string, number, boolean, array, object`);
          }
          
          if (!param.description || typeof param.description !== 'string') {
            errors.push(`Tool ${index + 1}, Parameter ${paramIndex + 1}: description is required and must be a string`);
          }
        });
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

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
      
      // Create server config object from request
      const serverConfig = {
        serverName,
        serverType,
        description,
        tools
      };
      
      // Validate server configuration against MCP protocol specs
      const validation = validateServerConfig(serverConfig);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Invalid server configuration', 
          details: validation.errors,
          mcpVersion: MCP_PROTOCOL_VERSION
        });
      }
      
      // Create a unique ID for this build
      const buildId = uuidv4();
      const buildDir = path.join(process.cwd(), 'builds', buildId);
      fs.ensureDirSync(buildDir);
      
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
        dockerfileTemplate(serverType)
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
        message: 'MCP server created successfully!',
        validation: {
          protocol: MCP_PROTOCOL_VERSION,
          sdkVersion: MCP_SDK_VERSION[serverType],
          lastVerified: VALIDATION_INFO.lastVerified,
          compatibleWith: VALIDATION_INFO.compatibleWith
        }
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

  // MCP Protocol validation info endpoint
  app.get('/api/mcp-validation', (req, res) => {
    res.json({
      protocol: {
        version: MCP_PROTOCOL_VERSION,
        lastVerified: VALIDATION_INFO.lastVerified,
        sdkVersions: MCP_SDK_VERSION,
      },
      compatibility: VALIDATION_INFO.compatibleWith,
      validationRules: {
        tools: [
          "Tools must have a name, description, and at least one parameter",
          "Tool names must be lowercase with underscores or dashes for spaces",
          "Tool descriptions should be clear and concise"
        ],
        parameters: [
          "Parameters must have a name, type, and description",
          "Parameter types must be one of: string, number, boolean, array, object",
          "Parameter names should be lowercase with underscores for spaces"
        ],
        security: [
          "API key authentication is recommended for production use",
          "Environmental variables should be used for storing secrets"
        ]
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
