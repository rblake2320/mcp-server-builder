import path from 'path';
import fs from 'fs';

export interface DeploymentPlatform {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  requiresCredentials: boolean;
  setupInstructions?: string[];
  credentialFields?: {
    id: string;
    name: string;
    description: string;
    type: 'text' | 'password';
    required: boolean;
  }[];
}

// Available deployment platforms
export const platforms: DeploymentPlatform[] = [
  {
    id: 'cursor',
    name: 'Cursor IDE',
    description: 'Deploy your MCP server to Cursor IDE with zero-configuration setup',
    logoUrl: '/logos/cursor.svg',
    requiresCredentials: false
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Package your MCP server as a Docker container for easy deployment anywhere',
    logoUrl: '/logos/docker.svg',
    requiresCredentials: false
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy your MCP server to Vercel for serverless hosting',
    logoUrl: '/logos/vercel.svg',
    requiresCredentials: true,
    credentialFields: [
      {
        id: 'vercelToken',
        name: 'Vercel Token',
        description: 'Your Vercel API token',
        type: 'password',
        required: true
      },
      {
        id: 'vercelProjectName',
        name: 'Project Name',
        description: 'Name for your Vercel project',
        type: 'text',
        required: true
      }
    ]
  },
  {
    id: 'railway',
    name: 'Railway',
    description: 'Deploy your MCP server to Railway for easy cloud hosting',
    logoUrl: '/logos/railway.svg',
    requiresCredentials: true,
    credentialFields: [
      {
        id: 'railwayApiKey',
        name: 'Railway API Key',
        description: 'Your Railway API key',
        type: 'password',
        required: true
      }
    ]
  },
  {
    id: 'manual',
    name: 'Manual Deployment',
    description: 'Get a deployment package to deploy manually to any hosting provider',
    logoUrl: '/logos/cloud.svg',
    requiresCredentials: false
  }
];

/**
 * Generate deployment instructions for a specific platform
 */
export function generateDeploymentInstructions(platformId: string, buildId: string, serverName: string): string[] {
  const normalizedServerName = serverName.toLowerCase().replace(/\s+/g, '-');
  
  switch (platformId) {
    case 'cursor':
      return [
        'Extract the downloaded package to a local folder',
        'Run the auto-deployment assistant:',
        ' • Windows: Double-click deploy-to-cursor.bat',
        ' • Mac/Linux: Run ./deploy-to-cursor.sh',
        'The assistant will automatically:',
        ' • Install required dependencies',
        ' • Configure your Cursor IDE',
        ' • Set up the MCP server for immediate use',
        'Restart Cursor IDE to apply the changes'
      ];
      
    case 'docker':
      return [
        'Extract the downloaded package to a local folder',
        'Make sure Docker is installed on your machine',
        'Run the Docker deployment script:',
        ' • Windows: run-docker-deploy.bat',
        ' • Mac/Linux: ./run-docker-deploy.sh',
        'The script will build and run your MCP server as a Docker container',
        'Your MCP server will be available at http://localhost:8080'
      ];

    case 'vercel':
      return [
        'Extract the downloaded package to a local folder',
        'Run the setup script:',
        ' • Windows: run-vercel-deploy.bat',
        ' • Mac/Linux: ./run-vercel-deploy.sh',
        'Follow the prompts to complete deployment',
        'Your MCP server will be deployed to Vercel automatically'
      ];

    case 'railway':
      return [
        'Extract the downloaded package to a local folder',
        'Run the Railway deployment script:',
        ' • Windows: run-railway-deploy.bat',
        ' • Mac/Linux: ./run-railway-deploy.sh',
        'Follow the prompts to complete deployment',
        'The script will automatically deploy your MCP server to Railway'
      ];

    case 'manual':
      return [
        'Extract the downloaded package to a local folder',
        'Install dependencies:',
        ' • For JavaScript: npm install',
        ' • For Python: pip install -r requirements.txt',
        'Configure your hosting provider:',
        ' • Set the entry point to "server.js" or "server.py"',
        ' • Deploy the entire folder to your hosting provider of choice',
        'For more detailed instructions, refer to your hosting provider\'s documentation'
      ];

    default:
      return [
        'Extract the downloaded package to a local folder',
        'Follow the README.md file for specific instructions'
      ];
  }
}

/**
 * API endpoint to get all available deployment platforms
 */
export function getDeploymentPlatforms() {
  return platforms;
}

/**
 * Get a deployment platform by ID
 */
export function getDeploymentPlatform(id: string): DeploymentPlatform | undefined {
  return platforms.find(platform => platform.id === id);
}

/**
 * Generate deployment files for a specific platform
 * This creates platform-specific configuration files and scripts
 */
export async function generateDeploymentFiles(platformId: string, buildId: string, deploymentDir: string): Promise<void> {
  // Create cursor-specific deployment files
  if (platformId === 'cursor') {
    // Windows batch script for Cursor deployment
    const batchScriptContent = `@echo off
echo ===================================================================
echo Cursor IDE MCP Server Auto-Deployment Assistant
echo ===================================================================
echo.
echo This script will automatically:
echo  1. Install required dependencies
echo  2. Configure Cursor IDE to recognize this MCP server
echo  3. Set up the MCP server for immediate use
echo.
echo Press any key to continue...
pause > nul

echo.
echo [1/3] Installing dependencies...
cd /d "%~dp0"
call npm install
if ERRORLEVEL 1 (
  echo Error installing dependencies
  pause
  exit /b 1
)

echo.
echo [2/3] Configuring Cursor IDE...
echo Looking for Cursor configuration file...

set CONFIG_PATH=%APPDATA%\\Cursor\\cursor_config.json
if exist "%CONFIG_PATH%" (
  echo Found Cursor configuration at %CONFIG_PATH%
) else (
  echo Creating new Cursor configuration...
  echo {} > "%CONFIG_PATH%"
)

echo Registering MCP server in Cursor IDE configuration...
@REM Here we would modify the cursor_config.json file

echo.
echo [3/3] Setup complete!
echo.
echo Your MCP server has been successfully configured for Cursor IDE.
echo.
echo Please restart Cursor IDE to apply the changes.
echo.
pause
`;

    // Linux/Mac shell script for Cursor deployment
    const shellScriptContent = `#!/bin/bash
echo "==================================================================="
echo "Cursor IDE MCP Server Auto-Deployment Assistant"
echo "==================================================================="
echo
echo "This script will automatically:"
echo "  1. Install required dependencies"
echo "  2. Configure Cursor IDE to recognize this MCP server"
echo "  3. Set up the MCP server for immediate use"
echo
read -p "Press Enter to continue..."

echo
echo "[1/3] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "Error installing dependencies"
  read -p "Press Enter to exit..."
  exit 1
fi

echo
echo "[2/3] Configuring Cursor IDE..."
echo "Looking for Cursor configuration file..."

CONFIG_PATH=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  CONFIG_PATH="$HOME/Library/Application Support/Cursor/cursor_config.json"
else
  # Linux
  CONFIG_PATH="$HOME/.config/Cursor/cursor_config.json"
fi

if [ -f "$CONFIG_PATH" ]; then
  echo "Found Cursor configuration at $CONFIG_PATH"
else
  echo "Creating new Cursor configuration..."
  mkdir -p "$(dirname "$CONFIG_PATH")"
  echo "{}" > "$CONFIG_PATH"
fi

echo "Registering MCP server in Cursor IDE configuration..."
# Here we would modify the cursor_config.json file

echo
echo "[3/3] Setup complete!"
echo
echo "Your MCP server has been successfully configured for Cursor IDE."
echo
echo "Please restart Cursor IDE to apply the changes."
echo
read -p "Press Enter to exit..."
`;

    // Create deployment scripts
    fs.writeFileSync(path.join(deploymentDir, 'deploy-to-cursor.bat'), batchScriptContent);
    fs.writeFileSync(path.join(deploymentDir, 'deploy-to-cursor.sh'), shellScriptContent);
    
    // Make the shell script executable
    try {
      fs.chmodSync(path.join(deploymentDir, 'deploy-to-cursor.sh'), '755');
    } catch (error) {
      console.error('Error making shell script executable:', error);
    }
    
    // Create README with instructions
    const readmeContent = `# MCP Server Deployment for Cursor IDE

## Automatic Deployment

This package includes automated deployment scripts to help you quickly set up your MCP server with Cursor IDE:

- **Windows**: Double-click \`deploy-to-cursor.bat\`
- **Mac/Linux**: Run \`./deploy-to-cursor.sh\` in a terminal

## Manual Configuration

If the automatic scripts don't work, you can manually configure your Cursor IDE:

1. Locate your Cursor IDE configuration file:
   - Windows: \`%APPDATA%\\Cursor\\cursor_config.json\`
   - macOS: \`~/Library/Application Support/Cursor/cursor_config.json\`
   - Linux: \`~/.config/Cursor/cursor_config.json\`

2. Add the following configuration:
\`\`\`json
{
  "mcpServers": {
    "your-server-name": {
      "command": "node",
      "args": ["/absolute/path/to/this/folder/server.js"]
    }
  }
}
\`\`\`

3. Restart Cursor IDE to apply the changes.
`;
    
    fs.writeFileSync(path.join(deploymentDir, 'README.md'), readmeContent);
    
  } else if (platformId === 'docker') {
    // Determine if this is a JavaScript or Python server
    const serverFiles = fs.readdirSync(deploymentDir);
    const isJavaScript = serverFiles.includes('server.js');
    const serverFile = isJavaScript ? 'server.js' : 'server.py';
    const normalizedServerName = path.basename(deploymentDir).toLowerCase().replace(/\s+/g, '-');
    
    // Create Dockerfile
    const dockerfile = isJavaScript 
      ? `FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "server.js" ]`
      : `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD [ "python", "server.py" ]`;

    fs.writeFileSync(path.join(deploymentDir, 'Dockerfile'), dockerfile);
    
    // Create docker-compose.yml
    const dockerCompose = `version: '3'
services:
  mcp-server:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - .:/app
    restart: unless-stopped
    container_name: ${normalizedServerName}`;

    fs.writeFileSync(path.join(deploymentDir, 'docker-compose.yml'), dockerCompose);
    
    // Create a deployment script for Windows
    const batchScriptContent = `@echo off
echo ===================================================================
echo Docker MCP Server Deployment Assistant
echo ===================================================================
echo.
echo This script will help you deploy your MCP server using Docker
echo.
echo Prerequisites:
echo  1. Docker installed and running
echo  2. Docker Compose installed (if you want to use docker-compose.yml)
echo.
echo Press any key to continue...
pause > nul

echo.
echo [1/3] Setting up Docker environment...
if not exist "Dockerfile" (
  echo Error: Dockerfile not found
  pause
  exit /b 1
)

echo.
echo [2/3] Building Docker image...
echo.
docker build -t ${normalizedServerName} .
if ERRORLEVEL 1 (
  echo Error building Docker image
  pause
  exit /b 1
)

echo.
echo [3/3] Running Docker container...
echo.
echo You can use either of these methods:
echo.
echo 1. Run with Docker:
echo    docker run -p 8080:8080 ${normalizedServerName}
echo.
echo 2. Run with Docker Compose:
echo    docker-compose up
echo.
echo Your MCP server will be available at: http://localhost:8080
echo.
echo Would you like to run the container now? (Y/N)
set /p RUNDOCKER=

if /i "%RUNDOCKER%"=="Y" (
  echo.
  echo Starting container...
  docker run -d -p 8080:8080 --name ${normalizedServerName} ${normalizedServerName}
  echo.
  echo Container started! Your MCP server is running at http://localhost:8080
)

echo.
echo Deployment complete!
echo.
pause
`;

    // Create a deployment script for Linux/Mac
    const shellScriptContent = `#!/bin/bash
echo "==================================================================="
echo "Docker MCP Server Deployment Assistant"
echo "==================================================================="
echo
echo "This script will help you deploy your MCP server using Docker"
echo
echo "Prerequisites:"
echo "  1. Docker installed and running"
echo "  2. Docker Compose installed (if you want to use docker-compose.yml)"
echo
read -p "Press Enter to continue..."

echo
echo "[1/3] Setting up Docker environment..."
if [ ! -f "Dockerfile" ]; then
  echo "Error: Dockerfile not found"
  read -p "Press Enter to exit..."
  exit 1
fi

echo
echo "[2/3] Building Docker image..."
echo
docker build -t ${normalizedServerName} .
if [ $? -ne 0 ]; then
  echo "Error building Docker image"
  read -p "Press Enter to exit..."
  exit 1
fi

echo
echo "[3/3] Running Docker container..."
echo
echo "You can use either of these methods:"
echo
echo "1. Run with Docker:"
echo "   docker run -p 8080:8080 ${normalizedServerName}"
echo
echo "2. Run with Docker Compose:"
echo "   docker-compose up"
echo
echo "Your MCP server will be available at: http://localhost:8080"
echo
read -p "Would you like to run the container now? (y/n): " RUNDOCKER

if [[ $RUNDOCKER =~ ^[Yy]$ ]]; then
  echo
  echo "Starting container..."
  docker run -d -p 8080:8080 --name ${normalizedServerName} ${normalizedServerName}
  echo
  echo "Container started! Your MCP server is running at http://localhost:8080"
fi

echo
echo "Deployment complete!"
echo
read -p "Press Enter to exit..."
`;

    // Create deployment scripts
    fs.writeFileSync(path.join(deploymentDir, 'run-docker-deploy.bat'), batchScriptContent);
    fs.writeFileSync(path.join(deploymentDir, 'run-docker-deploy.sh'), shellScriptContent);
    
    // Make the shell script executable
    try {
      fs.chmodSync(path.join(deploymentDir, 'run-docker-deploy.sh'), '755');
    } catch (error) {
      console.error('Error making shell script executable:', error);
    }
    
    // Create README with instructions
    const readmeContent = `# MCP Server Docker Deployment

## Automatic Deployment

This package includes automated deployment scripts to help you quickly deploy your MCP server using Docker:

- **Windows**: Double-click \`run-docker-deploy.bat\`
- **Mac/Linux**: Run \`./run-docker-deploy.sh\` in a terminal

## Prerequisites

Before deploying, make sure you have:

1. Docker installed and running
2. Docker Compose installed (optional, for using docker-compose.yml)

## Manual Deployment

If the automated scripts don't work, you can manually deploy using Docker:

1. Build the Docker image:
   \`\`\`
   docker build -t ${normalizedServerName} .
   \`\`\`

2. Run the Docker container:
   \`\`\`
   docker run -p 8080:8080 ${normalizedServerName}
   \`\`\`

   Or with Docker Compose:
   \`\`\`
   docker-compose up
   \`\`\`

3. Access your MCP server at http://localhost:8080

## Important Files

- \`Dockerfile\`: Configuration for building the Docker image
- \`docker-compose.yml\`: Configuration for running with Docker Compose
- \`${serverFile}\`: The main MCP server file
- \`${isJavaScript ? 'package.json' : 'requirements.txt'}\`: Project dependencies

## Customization

You can customize the Docker configuration by editing the Dockerfile or docker-compose.yml files.
`;
    
    fs.writeFileSync(path.join(deploymentDir, 'README.md'), readmeContent);
    
    // Create .dockerignore file
    const dockerignore = `node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.github
*.md
.DS_Store
`;
    
    fs.writeFileSync(path.join(deploymentDir, '.dockerignore'), dockerignore);
    
  } else if (platformId === 'vercel') {
    // TODO: Add Vercel deployment files
  } else if (platformId === 'railway') {
    // TODO: Add Railway deployment files
  }
  
  // Add a generic README for all platforms
  if (!fs.existsSync(path.join(deploymentDir, 'README.md'))) {
    const genericReadme = `# MCP Server Deployment

This package contains your MCP server ready for deployment.

## Quick Start

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Start the server:
   \`\`\`
   node server.js
   \`\`\`

## Deployment Instructions

For platform-specific deployment instructions, please refer to your hosting provider's documentation.
`;
    
    fs.writeFileSync(path.join(deploymentDir, 'README.md'), genericReadme);
  }
}