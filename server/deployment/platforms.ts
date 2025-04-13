// Deployment platform configurations
import fs from 'fs-extra';
import path from 'path';
import { addAutoInstallScripts } from './auto-dependencies';

export interface DeploymentPlatform {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  requiresCredentials: boolean;
  credentialFields?: {
    id: string;
    name: string;
    description: string;
    type: 'text' | 'password';
    required: boolean;
  }[];
  setupInstructions?: string[];
}

/**
 * Get deployment platform by ID
 */
export function getDeploymentPlatform(platformId: string): DeploymentPlatform | undefined {
  return platforms.find(p => p.id === platformId);
}

/**
 * Generate platform-specific files for deployment
 */
export async function generateDeploymentFiles(platformId: string, buildId: string, deploymentDir: string): Promise<void> {
  // Get server information from the build directory
  const serverFile = fs.existsSync(path.join(deploymentDir, 'server.js')) 
    ? 'server.js' 
    : fs.existsSync(path.join(deploymentDir, 'server.py'))
      ? 'server.py'
      : null;
      
  if (!serverFile) {
    throw new Error('No server file found in the build directory');
  }
  
  // Get server name from the first line of the server file
  let serverName = 'MCP Server';
  try {
    const fileContent = fs.readFileSync(path.join(deploymentDir, serverFile), 'utf8');
    const nameMatch = fileContent.match(/\/\*\*\s*\n\s*\*\s*(.*?)\s*MCP Server/i);
    if (nameMatch && nameMatch[1]) {
      serverName = nameMatch[1].trim() + ' MCP Server';
    }
  } catch (error) {
    console.warn('Failed to extract server name:', error);
  }
  
  // Add platform-specific files
  switch (platformId) {
    case 'vercel':
      await fs.writeJSON(path.join(deploymentDir, 'vercel.json'), {
        version: 2,
        builds: [{ src: serverFile, use: '@vercel/node' }],
        routes: [{ src: '/(.*)', dest: serverFile }]
      }, { spaces: 2 });
      break;
      
    case 'netlify':
      await fs.writeJSON(path.join(deploymentDir, 'netlify.toml'), {
        [serverFile.endsWith('.js') ? 'functions' : 'edge_functions']: {
          directory: '.',
          external_node_modules: ['*']
        }
      }, { spaces: 2 });
      break;
  }
  
  // Add automatic dependency installation scripts to all platforms
  addAutoInstallScripts(deploymentDir, getDeploymentPlatform(platformId)?.name || 'Cloud', serverName);
  
  // Add enhanced Cursor assistant for Cursor IDE deployments
  if (platformId === 'cursor') {
    const isServerPython = serverFile.endsWith('.py');
    
    // Copy and configure the Cursor deployment assistant script
    const cursorAssistantTemplate = fs.readFileSync(
      path.join(process.cwd(), 'server', 'deployment', 'templates', 'cursor-assistant.js'),
      'utf8'
    );
    
    // Replace template placeholders with actual values
    const configuredAssistant = cursorAssistantTemplate
      .replace('{{SERVER_NAME}}', serverName)
      .replace('{{IS_PYTHON}}', isServerPython ? 'true' : 'false');
    
    // Write the configured assistant to the deployment directory
    fs.writeFileSync(path.join(deploymentDir, 'deploy-to-cursor.js'), configuredAssistant);
    
    // Create a simple batch script for Windows users
    const batchScript = `@echo off
echo Starting MCP Server Deployment Assistant...
node deploy-to-cursor.js
pause
`;
    fs.writeFileSync(path.join(deploymentDir, 'deploy-to-cursor.bat'), batchScript);
    
    // Create a shell script for macOS/Linux users
    const shellScript = `#!/bin/bash
echo "Starting MCP Server Deployment Assistant..."
node deploy-to-cursor.js
read -p "Press Enter to exit..."
`;
    fs.writeFileSync(path.join(deploymentDir, 'deploy-to-cursor.sh'), shellScript);
    fs.chmodSync(path.join(deploymentDir, 'deploy-to-cursor.sh'), '755');
  }
}

/**
 * List of supported deployment platforms
 * Note: The logo URLs will be dynamically fetched from the server
 */
export const platforms: DeploymentPlatform[] = [
  {
    id: "vercel",
    name: "Vercel",
    description: "Deploy to Vercel for serverless hosting with global CDN",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "token",
        name: "Vercel API Token",
        description: "Your Vercel API token from vercel.com/account/tokens",
        type: "password",
        required: true
      },
      {
        id: "scope",
        name: "Project Scope",
        description: "Team or personal account name (optional)",
        type: "text",
        required: false
      }
    ]
  },
  {
    id: "railway",
    name: "Railway",
    description: "One-click deployment to Railway with automatic CI/CD",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "apiKey",
        name: "Railway API Key",
        description: "Your Railway API key from railway.app",
        type: "password",
        required: true
      }
    ]
  },
  {
    id: "render",
    name: "Render",
    description: "Deploy to Render with automatic builds and scaling",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "apiKey",
        name: "Render API Key",
        description: "Your Render API key from render.com/dashboard",
        type: "password",
        required: true
      },
      {
        id: "serviceType",
        name: "Service Type",
        description: "web or background service",
        type: "text",
        required: false
      }
    ]
  },
  {
    id: "netlify",
    name: "Netlify",
    description: "Deploy your MCP server to Netlify with serverless functions",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "personalAccessToken",
        name: "Personal Access Token",
        description: "Your Netlify Personal Access Token",
        type: "password",
        required: true
      },
      {
        id: "siteId",
        name: "Site ID",
        description: "Your Netlify Site ID (optional)",
        type: "text",
        required: false
      }
    ]
  },
  {
    id: "flyio",
    name: "Fly.io",
    description: "Global deployment on Fly.io's application platform",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "accessToken",
        name: "Access Token",
        description: "Your Fly.io access token",
        type: "password",
        required: true
      },
      {
        id: "org",
        name: "Organization",
        description: "Your Fly.io organization name",
        type: "text",
        required: false
      }
    ]
  },
  {
    id: "cursor",
    name: "Cursor IDE",
    description: "Configure MCP server for Cursor IDE integration",
    requiresCredentials: false,
  }
];

/**
 * Generate deployment instructions based on the platform
 */
export function generateDeploymentInstructions(platformId: string, buildId: string, serverName: string): string[] {
  const instructions: Record<string, string[]> = {
    "vercel": [
      "Extract the downloaded ZIP file to a local directory",
      "Open a terminal in that directory",
      "Run `npm install` to install dependencies",
      "Run `vercel deploy` or connect your GitHub repository to Vercel",
      "Once deployed, your MCP server will be available at the provided URL"
    ],
    "railway": [
      "Extract the downloaded ZIP file",
      "Create a new project on Railway",
      "Push the code to a GitHub repository",
      "Connect the repository to Railway",
      "Railway will automatically deploy your MCP server"
    ],
    "render": [
      "Extract the downloaded ZIP file",
      "Create a new Web Service on Render",
      "Connect to your GitHub repository with the extracted code",
      "Set the build command to `npm install`",
      "Set the start command to `node server.js` or `python server.py` based on your server type",
      "Deploy and access your MCP server through the provided Render URL"
    ],
    "netlify": [
      "Extract the downloaded ZIP file",
      "Push the code to a GitHub repository",
      "Create a new site on Netlify from the repository",
      "In Site Settings, configure the build command to `npm install`",
      "Add a `netlify.toml` file with your function configuration",
      "Deploy and access your MCP server through Netlify Functions"
    ],
    "flyio": [
      "Extract the downloaded ZIP file",
      "Install the Fly CLI with `curl -L https://fly.io/install.sh | sh`",
      "Navigate to the extracted directory",
      "Run `fly launch` to create a new app",
      "Run `fly deploy` to deploy your MCP server",
      "Your API will be accessible at `https://your-app-name.fly.dev`"
    ],
    "cursor": [
      "1. Extract the downloaded ZIP file to a local directory",
      "2. ✨ ONE-CLICK SETUP: Run 'deploy-to-cursor.bat' (Windows) or './deploy-to-cursor.sh' (Mac/Linux)",
      "   This will AUTOMATICALLY:",
      "   • Install all dependencies",
      "   • Update your Cursor IDE configuration",
      "   • Prompt to restart Cursor IDE",
      "   • Guide you through the final steps",
      "",
      "   [ALTERNATIVELY, IF YOU PREFER MANUAL SETUP]:",
      "3. Run 'start.bat' (Windows) or './start.sh' (Mac/Linux) to install dependencies",
      "4. Locate your Cursor IDE config file:",
      "   • macOS: ~/Library/Application Support/Cursor/cursor_config.json",
      "   • Windows: %APPDATA%\\Cursor\\cursor_config.json",
      "   • Linux: ~/.config/Cursor/cursor_config.json",
      "5. Edit the config file to add your MCP server:",
      `{
  "mcpServers": {
    "${serverName.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "${serverName.includes("Python") ? "python" : "node"}",
      "args": ["/absolute/path/to/extracted/folder/${serverName.includes("Python") ? "auto-install.py" : "auto-install.js"}"]
    }
  }
}`,
      "6. Replace '/absolute/path/to/extracted/folder/' with the actual path where you extracted the files",
      "7. Restart Cursor IDE to apply the changes",
      "",
      "AFTER SETUP:",
      "8. Open Cursor IDE and click on the MCP icon in the sidebar",
      "9. Select your server from the dropdown and click 'Connect'",
      "10. That's it! Your MCP server is now connected to Cursor IDE"
    ]
  };

  return instructions[platformId] || [
    "Extract the downloaded ZIP file",
    "Follow the hosting platform's documentation to deploy",
    "Set the entry point to server.js or server.py depending on your server type"
  ];
}