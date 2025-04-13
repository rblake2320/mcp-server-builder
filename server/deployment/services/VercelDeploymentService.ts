import fs from 'fs-extra';
import path from 'path';
import { DeploymentService, DeploymentResult } from './DeploymentService';

/**
 * Deployment service for Vercel
 */
export class VercelDeploymentService extends DeploymentService {
  /**
   * Generate Vercel-specific configuration files
   */
  protected async generateConfig(): Promise<void> {
    // Create Vercel configuration file
    const vercelConfig = {
      version: 2,
      builds: [
        {
          src: 'server.js',
          use: '@vercel/node'
        }
      ],
      routes: [
        {
          src: '/(.*)',
          dest: 'server.js'
        }
      ]
    };

    // Create the vercel.json file
    fs.writeFileSync(
      path.join(this.tempDir, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );

    // Create a deployment script for Windows
    const batchScriptContent = `@echo off
echo ===================================================================
echo Vercel MCP Server Deployment Assistant
echo ===================================================================
echo.
echo This script will help you deploy your MCP server to Vercel
echo.
echo Prerequisites:
echo  1. Vercel CLI installed (npm i -g vercel)
echo  2. Vercel account and login (vercel login)
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
echo [2/3] Preparing Vercel deployment...
if not exist "vercel.json" (
  echo Error: vercel.json not found
  pause
  exit /b 1
)

echo.
echo [3/3] Deploying to Vercel...
echo.
echo You will now be guided through the Vercel deployment process.
echo.
echo Running: vercel
call vercel
if ERRORLEVEL 1 (
  echo Error deploying to Vercel
  pause
  exit /b 1
)

echo.
echo Deployment complete! Your MCP server is now live on Vercel.
echo.
pause
`;

    // Create a deployment script for Linux/Mac
    const shellScriptContent = `#!/bin/bash
echo "==================================================================="
echo "Vercel MCP Server Deployment Assistant"
echo "==================================================================="
echo
echo "This script will help you deploy your MCP server to Vercel"
echo
echo "Prerequisites:"
echo "  1. Vercel CLI installed (npm i -g vercel)"
echo "  2. Vercel account and login (vercel login)"
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
echo "[2/3] Preparing Vercel deployment..."
if [ ! -f "vercel.json" ]; then
  echo "Error: vercel.json not found"
  read -p "Press Enter to exit..."
  exit 1
fi

echo
echo "[3/3] Deploying to Vercel..."
echo
echo "You will now be guided through the Vercel deployment process."
echo
echo "Running: vercel"
vercel
if [ $? -ne 0 ]; then
  echo "Error deploying to Vercel"
  read -p "Press Enter to exit..."
  exit 1
fi

echo
echo "Deployment complete! Your MCP server is now live on Vercel."
echo
read -p "Press Enter to exit..."
`;

    // Create deployment scripts
    fs.writeFileSync(path.join(this.tempDir, 'run-vercel-deploy.bat'), batchScriptContent);
    fs.writeFileSync(path.join(this.tempDir, 'run-vercel-deploy.sh'), shellScriptContent);
    
    // Make the shell script executable
    try {
      fs.chmodSync(path.join(this.tempDir, 'run-vercel-deploy.sh'), '755');
    } catch (error) {
      console.error('Error making shell script executable:', error);
    }
    
    // Create README with instructions
    const readmeContent = `# MCP Server Deployment to Vercel

## Automatic Deployment

This package includes automated deployment scripts to help you quickly deploy your MCP server to Vercel:

- **Windows**: Double-click \`run-vercel-deploy.bat\`
- **Mac/Linux**: Run \`./run-vercel-deploy.sh\` in a terminal

## Prerequisites

Before deploying, make sure you have:

1. A Vercel account (sign up at https://vercel.com if you don't have one)
2. Vercel CLI installed globally: \`npm install -g vercel\`
3. Logged in to Vercel CLI: \`vercel login\`

## Manual Deployment

If the automated scripts don't work, you can manually deploy to Vercel:

1. Install Vercel CLI: \`npm install -g vercel\`
2. Log in to Vercel: \`vercel login\`
3. Navigate to this project folder
4. Run: \`vercel\`
5. Follow the prompts to complete deployment

## Important Files

- \`vercel.json\`: Configuration for the Vercel deployment
- \`server.js\`: The main MCP server file
- \`package.json\`: Project dependencies and configuration

## Environment Variables

If your MCP server requires specific environment variables, you can set them during the Vercel deployment process or through the Vercel dashboard after deployment.
`;
    
    fs.writeFileSync(path.join(this.tempDir, 'README.md'), readmeContent);
    
    // Create or update package.json
    if (!fs.existsSync(path.join(this.tempDir, 'package.json'))) {
      const packageJson = {
        name: this.options.serverName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: `MCP Server: ${this.options.serverName}`,
        main: 'server.js',
        scripts: {
          start: 'node server.js',
          deploy: 'vercel --prod'
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
    } else {
      try {
        // Read existing package.json
        const packageJsonPath = path.join(this.tempDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Update scripts
        packageJson.scripts = {
          ...packageJson.scripts,
          deploy: 'vercel --prod'
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
   * Deploy to Vercel (local preparation only - the actual deployment happens via CLI)
   */
  protected async deploy(): Promise<DeploymentResult> {
    return {
      success: true,
      message: 'Vercel deployment package created successfully!',
      deploymentId: this.deploymentId,
      platformId: this.options.platformId,
      setupInstructions: [
        'Extract the downloaded package to a local folder',
        'Install Vercel CLI: npm install -g vercel',
        'Log in to Vercel: vercel login',
        'Run the deployment script:',
        ' • Windows: run-vercel-deploy.bat',
        ' • Mac/Linux: ./run-vercel-deploy.sh',
        'Follow the prompts to complete deployment',
        'Your MCP server will be deployed to Vercel automatically'
      ]
    };
  }
}