import fs from 'fs';
import path from 'path';
import { DeploymentService, DeploymentResult, DeploymentOptions } from './DeploymentService';

export class VercelDeploymentService extends DeploymentService {
  constructor(options: DeploymentOptions) {
    super(options);
  }

  /**
   * Generate Vercel configuration files
   */
  protected async generateConfig(): Promise<void> {
    // Create vercel.json configuration file
    const serverType = fs.existsSync(path.join(this.options.deploymentDir, 'server.py')) ? 'python' : 'node';
    
    const vercelConfig = {
      version: 2,
      name: this.options.serverName.toLowerCase().replace(/\s+/g, '-'),
      builds: [
        {
          src: serverType === 'python' ? 'server.py' : 'server.js',
          use: serverType === 'python' ? '@vercel/python' : '@vercel/node'
        }
      ],
      routes: [
        { handle: 'filesystem' },
        { src: '/(.*)', dest: serverType === 'python' ? 'server.py' : 'server.js' }
      ],
      env: {
        MCP_SERVER_NAME: this.options.serverName
      }
    };

    // Write vercel.json file
    fs.writeFileSync(
      path.join(this.tempDir, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );

    // Create .vercelignore file
    const vercelIgnore = `
.git
node_modules
.env
*.log
__pycache__
`;
    fs.writeFileSync(path.join(this.tempDir, '.vercelignore'), vercelIgnore);

    // Create deployment script
    await this.createDeploymentScript();
  }

  /**
   * Create a deployment script that uses Vercel CLI
   */
  private async createDeploymentScript(): Promise<void> {
    // Create a script to deploy with Vercel CLI
    const deployScript = `#!/bin/bash
# One-click Vercel deployment script
# Automatically deploys your MCP server to Vercel

# Text styling
BOLD="\\033[1m"
GREEN="\\033[0;32m"
BLUE="\\033[0;34m"
YELLOW="\\033[0;33m"
RED="\\033[0;31m"
RESET="\\033[0m"

echo -e "\${BOLD}\${BLUE}=== MCP Server Vercel Deployment Script ===\${RESET}"
echo -e "\${BLUE}This script will deploy your MCP server to Vercel\${RESET}"
echo

# Check if the Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "\${YELLOW}Vercel CLI not found. Installing...\${RESET}"
    npm install -g vercel
fi

# Check if token is provided
if [ -z "$VERCEL_TOKEN" ]; then
    # Check if .env file exists with VERCEL_TOKEN
    if [ -f ".env" ] && grep -q "VERCEL_TOKEN" ".env"; then
        source .env
    else
        echo -e "\${YELLOW}No Vercel token found. Please provide your Vercel token:\${RESET}"
        read -p "Vercel Token: " VERCEL_TOKEN
        echo "VERCEL_TOKEN=$VERCEL_TOKEN" > .env
    fi
fi

# Deploy to Vercel
echo -e "\${BLUE}Deploying to Vercel...\${RESET}"
VERCEL_TOKEN=$VERCEL_TOKEN vercel deploy --token $VERCEL_TOKEN ${this.options.credentials.scope ? '--scope ' + this.options.credentials.scope : ''} --prod --yes

if [ $? -eq 0 ]; then
    echo -e "\${GREEN}\${BOLD}Deployment successful!\${RESET}"
    echo -e "\${BLUE}Your MCP server is now deployed to Vercel.\${RESET}"
    echo -e "\${BLUE}You can access your deployment details on the Vercel dashboard.\${RESET}"
else
    echo -e "\${RED}\${BOLD}Deployment failed.\${RESET}"
    echo -e "\${RED}Please check the error message above and try again.\${RESET}"
fi

echo
echo -e "\${BOLD}Thank you for using the MCP Server Builder!\${RESET}"
`;

    // Write deployment script
    fs.writeFileSync(path.join(this.tempDir, 'deploy-to-vercel.sh'), deployScript);
    fs.chmodSync(path.join(this.tempDir, 'deploy-to-vercel.sh'), '755');

    // Create a batch file for Windows users
    const batchScript = `@echo off
echo Starting MCP Server Vercel Deployment...

:: Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Vercel CLI not found. Installing...
    call npm install -g vercel
)

:: Check if .env file exists with VERCEL_TOKEN
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VERCEL_TOKEN" set VERCEL_TOKEN=%%b
    )
)

:: If no token found, prompt for input
if "%VERCEL_TOKEN%"=="" (
    echo No Vercel token found. Please provide your Vercel token:
    set /p VERCEL_TOKEN="Vercel Token: "
    echo VERCEL_TOKEN=%VERCEL_TOKEN%> .env
)

:: Deploy to Vercel
echo Deploying to Vercel...
set VERCEL_TOKEN=%VERCEL_TOKEN%
vercel deploy --token %VERCEL_TOKEN% ${this.options.credentials.scope ? '--scope ' + this.options.credentials.scope : ''} --prod --yes

if %ERRORLEVEL% equ 0 (
    echo Deployment successful!
    echo Your MCP server is now deployed to Vercel.
    echo You can access your deployment details on the Vercel dashboard.
) else (
    echo Deployment failed.
    echo Please check the error message above and try again.
)

echo.
echo Thank you for using the MCP Server Builder!
pause
`;

    // Write Windows batch script
    fs.writeFileSync(path.join(this.tempDir, 'deploy-to-vercel.bat'), batchScript);
  }

  /**
   * Deploy to Vercel (in this case, prepare deployment package with scripts)
   */
  protected async deploy(): Promise<DeploymentResult> {
    // Create .env file with credentials
    const envContent = Object.entries(this.options.credentials)
      .map(([key, value]) => `${key.toUpperCase()}=${value}`)
      .join('\n');
    
    fs.writeFileSync(path.join(this.tempDir, '.env'), envContent);

    return {
      success: true,
      message: 'Vercel deployment package created successfully. Run the included deploy script to deploy.',
      deploymentId: this.deploymentId,
      platformId: this.options.platformId,
      deploymentUrl: `https://${this.options.serverName.toLowerCase().replace(/\s+/g, '-')}.vercel.app`
    };
  }
}