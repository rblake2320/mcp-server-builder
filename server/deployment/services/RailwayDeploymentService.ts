import fs from 'fs-extra';
import path from 'path';
import { DeploymentService, DeploymentResult } from './DeploymentService';

/**
 * Deployment service for Railway
 */
export class RailwayDeploymentService extends DeploymentService {
  /**
   * Generate Railway-specific configuration files
   */
  protected async generateConfig(): Promise<void> {
    // Railway uses package.json and Procfile for configuration
    
    // Create a Procfile for Railway
    const isJavaScript = !this.options.serverName.toLowerCase().includes('python');
    const procfileContent = isJavaScript 
      ? 'web: node server.js'
      : 'web: python server.py';
    fs.writeFileSync(path.join(this.tempDir, 'Procfile'), procfileContent);
    
    // Create Railway configuration file
    const railwayConfig = {
      "$schema": "https://railway.app/railway.schema.json",
      "build": {
        "builder": isJavaScript ? "NIXPACKS" : "NIXPACKS",
        "buildCommand": isJavaScript ? "npm install" : "pip install -r requirements.txt"
      },
      "deploy": {
        "startCommand": isJavaScript ? "node server.js" : "python server.py",
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10
      }
    };

    // Create the railway.json file
    fs.writeFileSync(
      path.join(this.tempDir, 'railway.json'),
      JSON.stringify(railwayConfig, null, 2)
    );

    // Create a deployment script for Windows
    const batchScriptContent = `@echo off
echo ===================================================================
echo Railway MCP Server Deployment Assistant
echo ===================================================================
echo.
echo This script will help you deploy your MCP server to Railway
echo.
echo Prerequisites:
echo  1. Railway CLI installed (npm i -g @railway/cli)
echo  2. Railway account and login (railway login)
echo.
echo Press any key to continue...
pause > nul

echo.
echo [1/3] Installing dependencies...
call npm install
if ERRORLEVEL 1 (
  echo Error installing dependencies
  pause
  exit /b 1
)

echo.
echo [2/3] Preparing Railway deployment...
if not exist "railway.json" (
  echo Error: railway.json not found
  pause
  exit /b 1
)

echo.
echo [3/3] Deploying to Railway...
echo.
echo You will now be guided through the Railway deployment process.
echo.
echo Running: railway up
call railway up
if ERRORLEVEL 1 (
  echo Error deploying to Railway
  pause
  exit /b 1
)

echo.
echo Deployment complete! Your MCP server is now live on Railway.
echo.
pause
`;

    // Create a deployment script for Linux/Mac
    const shellScriptContent = `#!/bin/bash
echo "==================================================================="
echo "Railway MCP Server Deployment Assistant"
echo "==================================================================="
echo
echo "This script will help you deploy your MCP server to Railway"
echo
echo "Prerequisites:"
echo "  1. Railway CLI installed (npm i -g @railway/cli)"
echo "  2. Railway account and login (railway login)"
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
echo "[2/3] Preparing Railway deployment..."
if [ ! -f "railway.json" ]; then
  echo "Error: railway.json not found"
  read -p "Press Enter to exit..."
  exit 1
fi

echo
echo "[3/3] Deploying to Railway..."
echo
echo "You will now be guided through the Railway deployment process."
echo
echo "Running: railway up"
railway up
if [ $? -ne 0 ]; then
  echo "Error deploying to Railway"
  read -p "Press Enter to exit..."
  exit 1
fi

echo
echo "Deployment complete! Your MCP server is now live on Railway."
echo
read -p "Press Enter to exit..."
`;

    // Create deployment scripts
    fs.writeFileSync(path.join(this.tempDir, 'run-railway-deploy.bat'), batchScriptContent);
    fs.writeFileSync(path.join(this.tempDir, 'run-railway-deploy.sh'), shellScriptContent);
    
    // Make the shell script executable
    try {
      fs.chmodSync(path.join(this.tempDir, 'run-railway-deploy.sh'), '755');
    } catch (error) {
      console.error('Error making shell script executable:', error);
    }
    
    // Create README with instructions
    const readmeContent = `# MCP Server Deployment to Railway

## Automatic Deployment

This package includes automated deployment scripts to help you quickly deploy your MCP server to Railway:

- **Windows**: Double-click \`run-railway-deploy.bat\`
- **Mac/Linux**: Run \`./run-railway-deploy.sh\` in a terminal

## Prerequisites

Before deploying, make sure you have:

1. A Railway account (sign up at https://railway.app if you don't have one)
2. Railway CLI installed globally: \`npm install -g @railway/cli\`
3. Logged in to Railway CLI: \`railway login\`

## Manual Deployment

If the automated scripts don't work, you can manually deploy to Railway:

1. Install Railway CLI: \`npm install -g @railway/cli\`
2. Log in to Railway: \`railway login\`
3. Navigate to this project folder
4. Run: \`railway up\`
5. Follow the prompts to complete deployment

## Important Files

- \`railway.json\`: Configuration for the Railway deployment
- \`Procfile\`: Defines the command to start your application
- \`${isJavaScript ? 'server.js' : 'server.py'}\`: The main MCP server file
- \`${isJavaScript ? 'package.json' : 'requirements.txt'}\`: Project dependencies

## Environment Variables

If your MCP server requires specific environment variables, you can set them during the Railway deployment process or through the Railway dashboard after deployment.
`;
    
    fs.writeFileSync(path.join(this.tempDir, 'README.md'), readmeContent);
    
    // Create or update package.json for JavaScript servers
    if (isJavaScript && !fs.existsSync(path.join(this.tempDir, 'package.json'))) {
      const packageJson = {
        name: this.options.serverName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: `MCP Server: ${this.options.serverName}`,
        main: 'server.js',
        scripts: {
          start: 'node server.js',
          deploy: 'railway up'
        },
        engines: {
          node: '>=14'
        },
        dependencies: {}
      };
      
      fs.writeFileSync(
        path.join(this.tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    } else if (isJavaScript) {
      try {
        // Read existing package.json
        const packageJsonPath = path.join(this.tempDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Update scripts
        packageJson.scripts = {
          ...packageJson.scripts,
          deploy: 'railway up'
        };
        
        // Write updated package.json
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2)
        );
      } catch (error) {
        console.error('Error updating package.json:', error);
      }
    }
  }

  /**
   * Deploy to Railway (local preparation only - the actual deployment happens via CLI)
   */
  protected async deploy(): Promise<DeploymentResult> {
    return {
      success: true,
      message: 'Railway deployment package created successfully!',
      deploymentId: this.deploymentId,
      platformId: this.options.platformId,
      setupInstructions: [
        'Extract the downloaded package to a local folder',
        'Install Railway CLI: npm install -g @railway/cli',
        'Log in to Railway: railway login',
        'Run the deployment script:',
        ' • Windows: run-railway-deploy.bat',
        ' • Mac/Linux: ./run-railway-deploy.sh',
        'Follow the prompts to complete deployment',
        'Your MCP server will be deployed to Railway automatically'
      ]
    };
  }
}