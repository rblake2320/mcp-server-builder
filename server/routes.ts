import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-storage"; // Using database storage instead of memory storage
import { setupAuth } from "./auth"; // Import auth setup
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import { v4 as uuidv4 } from "uuid";
import { insertServerSchema, User, InsertTemplate } from "@shared/schema";
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
import { platforms, generateDeploymentInstructions } from "./deployment/platforms";
import { initiatePlatformDeployment, downloadDeployment, cleanupDeployments } from './deployment/deploymentController';

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
  fs.ensureDirSync(path.join(process.cwd(), 'public/logos'));
  
  // API endpoint to get logo URLs
  app.get('/api/get-logo', (req, res) => {
    const { provider } = req.query;
    
    // Map of cloud providers and their logo file names
    const logoMap: Record<string, string> = {
      vercel: "/logos/vercel.svg",
      railway: "/logos/railway.svg",
      render: "/logos/render.svg",
      netlify: "/logos/netlify.svg",
      flyio: "/logos/flyio.svg",
      cursor: "/logos/cursor.svg"
    };
    
    // Return the correct logo URL or a default placeholder
    const logoUrl = logoMap[provider as string]?.toLowerCase() || "/logos/default.svg";
    res.json({ logoUrl });
  });

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
      
      // Type assertion to ensure we have a valid server type
      const validServerType = (serverType === 'python' || serverType === 'typescript') 
        ? serverType 
        : 'typescript'; // Default to typescript if invalid
      
      res.json({
        success: true,
        buildId,
        downloadUrl: `/api/download/${buildId}`,
        message: 'MCP server created successfully!',
        validation: {
          protocol: MCP_PROTOCOL_VERSION,
          sdkVersion: MCP_SDK_VERSION[validServerType],
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
  app.get('/api/download/:buildId', async (req, res) => {
    const { buildId } = req.params;
    const platformId = req.query.platform as string; // Optional platform ID for enhanced downloads
    const zipFilePath = path.join(process.cwd(), 'downloads', `${buildId}.zip`);
    
    if (!fs.existsSync(zipFilePath)) {
      return res.status(404).json({ error: 'Build not found' });
    }
    
    // If a specific platform is requested, enhance the download with platform-specific files
    if (platformId) {
      try {
        // Get server info
        const server = await storage.getServerByBuildId(buildId);
        if (!server) {
          return res.status(404).json({ error: 'Server not found' });
        }
        
        // Create temporary directory
        const tmpDir = path.join(process.cwd(), 'tmp', 'enhanced_downloads', buildId);
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        // Extract the original zip to the temporary directory
        await new Promise<void>((resolve, reject) => {
          const extract = require('extract-zip');
          extract(zipFilePath, { dir: tmpDir })
            .then(() => resolve())
            .catch(reject);
        });
        
        // Generate platform-specific files
        await import('./deployment/platforms').then(({ generateDeploymentFiles }) => {
          return generateDeploymentFiles(platformId, buildId, tmpDir);
        });
        
        // Create a new zip file with enhanced content
        const enhancedZipPath = path.join(process.cwd(), 'tmp', 'enhanced_downloads', `${buildId}_${platformId}.zip`);
        
        const output = fs.createWriteStream(enhancedZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.pipe(output);
        archive.directory(tmpDir, false);
        
        await new Promise<void>((resolve, reject) => {
          output.on('close', () => resolve());
          archive.on('error', reject);
          archive.finalize();
        });
        
        // Send the enhanced zip
        res.download(enhancedZipPath, `mcp-server-${platformId}.zip`);
        
        // Schedule cleanup
        setTimeout(() => {
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
            fs.unlinkSync(enhancedZipPath);
          } catch (error) {
            console.error('Error cleaning up enhanced download:', error);
          }
        }, 60 * 60 * 1000); // Clean up after 1 hour
        
        return;
      } catch (error) {
        console.error('Error enhancing download:', error);
        // Fall back to regular download
      }
    }
    
    // Regular download
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
  
  // URL Import endpoint - for importing MCP servers from GitHub/GitLab repos
  app.post('/api/import-from-url', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      // Import from GitHub repository
      const { importFromGitHub } = await import('./importers/github-importer');
      
      // Check if it's a GitHub URL
      if (url.includes('github.com')) {
        try {
          const config = await importFromGitHub(url);
          
          if (!config) {
            return res.status(400).json({ 
              error: 'No valid MCP server configuration found in the repository',
              message: 'Could not detect any MCP server tools in the repository. Make sure the repository contains a valid MCP server implementation.'
            });
          }
          
          return res.json({
            success: true,
            config,
            message: "Server configuration imported successfully"
          });
        } catch (error) {
          console.error('GitHub import error:', error);
          return res.status(400).json({ 
            error: 'Error importing from GitHub',
            message: error instanceof Error ? error.message : 'Failed to import from GitHub repository'
          });
        }
      } else {
        // For now, only GitHub URLs are supported
        return res.status(400).json({ 
          error: 'Unsupported repository type',
          message: 'Currently, only GitHub repositories are supported for importing'
        });
      }
    } catch (error) {
      console.error('Error importing from URL:', error);
      res.status(500).json({ 
        error: 'Failed to import server from URL',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  });
  
  // ===== Template Management API Endpoints =====
  
  // Get all public templates
  app.get('/api/templates/public', async (req, res) => {
    try {
      const templates = await storage.getPublicTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching public templates:', error);
      res.status(500).json({ error: 'Failed to fetch public templates' });
    }
  });

  // Get user's templates (auth required)
  app.get('/api/templates', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = (req.user as User).id;
      const templates = await storage.getUserTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching user templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // Get template by ID
  app.get('/api/templates/:id', async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // If template is not public, check if user is owner
      if (!template.public) {
        if (!req.isAuthenticated() || (req.user as User).id !== template.userId) {
          return res.status(403).json({ error: 'Access denied to this template' });
        }
      }
      
      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  });

  // Create a new template (auth required)
  app.post('/api/templates', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = (req.user as User).id;
      const { name, description, serverType, configData, public: isPublic } = req.body;
      
      // Basic validation
      if (!name || !description || !serverType || !configData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Validate serverType
      if (!['python', 'typescript'].includes(serverType)) {
        return res.status(400).json({ error: 'Server type must be "python" or "typescript"' });
      }
      
      // Make sure configData is valid JSON
      let parsedConfig;
      try {
        if (typeof configData === 'string') {
          parsedConfig = JSON.parse(configData);
        } else {
          parsedConfig = configData;
        }
      } catch (e) {
        return res.status(400).json({ error: 'Invalid configuration data (must be valid JSON)' });
      }
      
      // Validate config data against MCP protocol specs
      const validation = validateServerConfig(parsedConfig);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Invalid server configuration', 
          details: validation.errors,
          mcpVersion: MCP_PROTOCOL_VERSION
        });
      }
      
      const template = await storage.createTemplate({
        name,
        description,
        serverType,
        configData: typeof parsedConfig === 'string' ? JSON.parse(parsedConfig) : parsedConfig,
        public: isPublic === true,
        userId
      });
      
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  // Update template (auth required)
  app.put('/api/templates/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      const userId = (req.user as User).id;
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check if user is owner
      if (template.userId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to update this template' });
      }
      
      const { name, description, serverType, configData, public: isPublic } = req.body;
      
      // Handle configData if provided
      let parsedConfig = undefined;
      if (configData) {
        try {
          if (typeof configData === 'string') {
            parsedConfig = JSON.parse(configData);
          } else {
            parsedConfig = configData;
          }
          
          // Validate against MCP protocol specs if config changed
          const validation = validateServerConfig(parsedConfig);
          if (!validation.valid) {
            return res.status(400).json({ 
              error: 'Invalid server configuration', 
              details: validation.errors,
              mcpVersion: MCP_PROTOCOL_VERSION
            });
          }
        } catch (e) {
          return res.status(400).json({ error: 'Invalid configuration data (must be valid JSON)' });
        }
      }
      
      const updateData: Partial<InsertTemplate> = {};
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (serverType !== undefined) {
        if (!['python', 'typescript'].includes(serverType)) {
          return res.status(400).json({ error: 'Server type must be "python" or "typescript"' });
        }
        updateData.serverType = serverType;
      }
      if (parsedConfig !== undefined) {
        updateData.configData = parsedConfig;
      }
      if (isPublic !== undefined) {
        updateData.public = isPublic === true;
      }
      
      const updatedTemplate = await storage.updateTemplate(templateId, updateData);
      res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  // ===== Deployment API Endpoints =====
  
  // Get available deployment platforms
  app.get('/api/deployment/platforms', (req, res) => {
    // Remove sensitive information like credential fields from the response
    const publicPlatformInfo = platforms.map(platform => ({
      id: platform.id,
      name: platform.name,
      description: platform.description,
      requiresCredentials: platform.requiresCredentials,
      credentialFields: platform.credentialFields
    }));
    
    res.json(publicPlatformInfo);
  });
  
  // Prepare deployment package
  app.post('/api/deployment/prepare', async (req, res) => {
    try {
      const { buildId, platformId, credentials } = req.body;
      
      if (!buildId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing buildId parameter' 
        });
      }
      
      if (!platformId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing platformId parameter' 
        });
      }
      
      // Get the server details from storage
      const server = await storage.getServerByBuildId(buildId);
      
      if (!server) {
        return res.status(404).json({ 
          success: false,
          error: 'Server build not found' 
        });
      }
      
      // Find the selected platform
      const platform = platforms.find(p => p.id === platformId);
      
      if (!platform) {
        return res.status(404).json({ 
          success: false,
          error: 'Deployment platform not found' 
        });
      }
      
      // Validate credentials if required
      if (platform.requiresCredentials && platform.credentialFields) {
        const missingRequiredFields = platform.credentialFields
          .filter(field => field.required && (!credentials || !credentials[field.id]))
          .map(field => field.name);
          
        if (missingRequiredFields.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Missing required credentials: ${missingRequiredFields.join(', ')}`
          });
        }
      }
      
      // Generate deployment instructions
      const setupInstructions = generateDeploymentInstructions(
        platformId, 
        buildId, 
        server.serverName
      );
      
      // Return success with instructions
      res.json({
        success: true,
        message: `Deployment package for ${platform.name} is ready`,
        deploymentUrl: `/api/download/${buildId}`,
        platformId,
        setupInstructions
      });
    } catch (error) {
      console.error('Error preparing deployment:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to prepare deployment package' 
      });
    }
  });
  
  // Delete template (auth required)
  app.delete('/api/templates/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      const userId = (req.user as User).id;
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check if user is owner
      if (template.userId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this template' });
      }
      
      await storage.deleteTemplate(templateId);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // Deploy to cloud platform
  app.post('/api/deployment/deploy', async (req, res) => {
    try {
      const { buildId, platformId, credentials } = req.body;
      
      if (!buildId || !platformId) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields',
          message: 'Both buildId and platformId are required' 
        });
      }
      
      // Get the server details from storage
      const server = await storage.getServerByBuildId(buildId);
      
      if (!server) {
        return res.status(404).json({ 
          success: false,
          error: 'Server build not found' 
        });
      }
      
      // Find the selected platform
      const platform = platforms.find(p => p.id === platformId);
      
      if (!platform) {
        return res.status(404).json({ 
          success: false,
          error: 'Deployment platform not found' 
        });
      }
      
      // Return success with instructions for direct deployment
      res.json({
        success: true,
        message: `Deployment package for ${platform.name} is ready`,
        deploymentUrl: `/api/download/${buildId}`,
        platformId
      });
    } catch (error) {
      console.error('Error deploying to cloud:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to deploy to cloud platform'
      });
    }
  });
  
  // Create server from template (auth required)
  app.post('/api/templates/:id/build', async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // If template is not public, check if user is authenticated and is owner
      if (!template.public) {
        if (!req.isAuthenticated() || (req.user as User).id !== template.userId) {
          return res.status(403).json({ error: 'Access denied to this template' });
        }
      }
      
      // Use the template data to create a server
      const configData = template.configData as {
        serverName: string;
        description: string;
        serverType: 'python' | 'typescript';
        tools: any[];
      };
      const { serverName, description, serverType, tools } = configData;
      
      // Create server config object from template
      const serverConfig = {
        serverName,
        serverType,
        description,
        tools
      };
      
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
        message: 'MCP server created successfully from template!',
        template: {
          id: template.id,
          name: template.name
        },
        validation: {
          protocol: MCP_PROTOCOL_VERSION,
          sdkVersion: MCP_SDK_VERSION[(serverType === 'python' || serverType === 'typescript') ? serverType : 'typescript'],
          lastVerified: VALIDATION_INFO.lastVerified,
          compatibleWith: VALIDATION_INFO.compatibleWith
        }
      });
    } catch (error) {
      console.error('Error creating server from template:', error);
      res.status(500).json({ error: 'Failed to create server from template' });
    }
  });

  // Deployment endpoints
  app.get('/api/deployment/platforms', (req, res) => {
    const { getDeploymentPlatforms } = require('./deployment/platforms');
    res.json(getDeploymentPlatforms());
  });
  
  // One-click deployment API endpoint
  app.post('/api/deploy', initiatePlatformDeployment);
  
  // Download deployment package
  app.get('/api/download/deployment/:deploymentId', downloadDeployment);
  
  // Logo URL endpoint for deployment platforms
  app.get('/api/get-logo', (req, res) => {
    const provider = req.query.provider;
    // Default logo paths based on provider ID
    const logoMap: Record<string, string> = {
      'cursor': '/logos/cursor.svg',
      'docker': '/logos/docker.svg',
      'vercel': '/logos/vercel.svg',
      'railway': '/logos/railway.svg',
      'heroku': '/logos/heroku.svg',
      'netlify': '/logos/netlify.svg',
      'gcp': '/logos/gcp.svg',
      'aws': '/logos/aws.svg',
      'azure': '/logos/azure.svg',
      'digital-ocean': '/logos/digital-ocean.svg',
    };
    
    // Return the logo URL if found, otherwise a default
    res.json({
      logoUrl: logoMap[provider as string] || '/logos/cloud.svg'
    });
  });
  
  // Set up a cleanup job to run periodically (every hour)
  setInterval(cleanupDeployments, 60 * 60 * 1000);

  const httpServer = createServer(app);
  return httpServer;
}
