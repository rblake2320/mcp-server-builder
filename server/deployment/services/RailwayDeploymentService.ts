import fs from 'fs';
import path from 'path';
import { DeploymentService, DeploymentResult, DeploymentOptions } from './DeploymentService';

export class RailwayDeploymentService extends DeploymentService {
  constructor(options: DeploymentOptions) {
    super(options);
  }

  /**
   * Generate Railway configuration files
   */
  protected async generateConfig(): Promise<void> {
    // Determine if this is a Python or Node.js project
    const isPython = fs.existsSync(path.join(this.options.deploymentDir, 'server.py'));
    
    // Create railway.json configuration file
    const railwayConfig = {
      "$schema": "https://railway.app/railway.schema.json",
      "build": {
        "builder": isPython ? "NIXPACKS" : "NIXPACKS",
        "buildCommand": isPython ? "pip install -r requirements.txt" : "npm install"
      },
      "deploy": {
        "startCommand": isPython ? "python server.py" : "node server.js",
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10
      }
    };

    // Write railway.json file
    fs.writeFileSync(
      path.join(this.tempDir, 'railway.json'),
      JSON.stringify(railwayConfig, null, 2)
    );

    // Create .gitignore file (Railway deploys from Git)
    const gitignore = `
node_modules
__pycache__
*.pyc
.env
.env.local
*.log
.DS_Store
`;
    fs.writeFileSync(path.join(this.tempDir, '.gitignore'), gitignore);

    // Create Procfile for Railway
    const procfile = isPython 
      ? 'web: python server.py'
      : 'web: node server.js';
    
    fs.writeFileSync(path.join(this.tempDir, 'Procfile'), procfile);

    // Create deployment scripts
    await this.createDeploymentScript();
  }

  /**
   * Create a deployment script that uses Railway CLI
   */
  private async createDeploymentScript(): Promise<void> {
    // Create a script to deploy with Railway CLI
    const deployScript = `#!/bin/bash
# One-click Railway deployment script
# Automatically deploys your MCP server to Railway

# Text styling
BOLD="\\033[1m"
GREEN="\\033[0;32m"
BLUE="\\033[0;34m"
YELLOW="\\033[0;33m"
RED="\\033[0;31m"
RESET="\\033[0m"

echo -e "\${BOLD}\${BLUE}=== MCP Server Railway Deployment Script ===\${RESET}"
echo -e "\${BLUE}This script will deploy your MCP server to Railway\${RESET}"
echo

# Check if the Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "\${YELLOW}Railway CLI not found. Installing...\${RESET}"
    npm install -g @railway/cli
fi

# Check if API key is provided
if [ -z "$RAILWAY_API_KEY" ]; then
    # Check if .env file exists with RAILWAY_API_KEY
    if [ -f ".env" ] && grep -q "RAILWAY_API_KEY" ".env"; then
        source .env
    else
        echo -e "\${YELLOW}No Railway API key found. Please provide your Railway API key:\${RESET}"
        read -p "Railway API Key: " RAILWAY_API_KEY
        echo "RAILWAY_API_KEY=$RAILWAY_API_KEY" > .env
    fi
fi

# Login to Railway with API key
echo -e "\${BLUE}Logging in to Railway...\${RESET}"
railway login --apikey $RAILWAY_API_KEY

if [ $? -ne 0 ]; then
    echo -e "\${RED}\${BOLD}Login failed. Please check your API key and try again.\${RESET}"
    exit 1
fi

# Initialize a new project
echo -e "\${BLUE}Initializing a new Railway project...\${RESET}"
railway init

# Deploy to Railway
echo -e "\${BLUE}Deploying to Railway...\${RESET}"
railway up

if [ $? -eq 0 ]; then
    echo -e "\${GREEN}\${BOLD}Deployment successful!\${RESET}"
    echo -e "\${BLUE}Your MCP server is now deploying to Railway.\${RESET}"
    echo
    echo -e "\${BLUE}To open your project in the Railway dashboard, run:\${RESET}"
    echo -e "\${YELLOW}railway open\${RESET}"
else
    echo -e "\${RED}\${BOLD}Deployment failed.\${RESET}"
    echo -e "\${RED}Please check the error message above and try again.\${RESET}"
fi

echo
echo -e "\${BOLD}Thank you for using the MCP Server Builder!\${RESET}"
`;

    // Write deployment script
    fs.writeFileSync(path.join(this.tempDir, 'deploy-to-railway.sh'), deployScript);
    fs.chmodSync(path.join(this.tempDir, 'deploy-to-railway.sh'), '755');

    // Create a batch file for Windows users
    const batchScript = `@echo off
echo Starting MCP Server Railway Deployment...

:: Check if Railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Railway CLI not found. Installing...
    call npm install -g @railway/cli
)

:: Check if .env file exists with RAILWAY_API_KEY
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="RAILWAY_API_KEY" set RAILWAY_API_KEY=%%b
    )
)

:: If no API key found, prompt for input
if "%RAILWAY_API_KEY%"=="" (
    echo No Railway API key found. Please provide your Railway API key:
    set /p RAILWAY_API_KEY="Railway API Key: "
    echo RAILWAY_API_KEY=%RAILWAY_API_KEY%> .env
)

:: Login to Railway with API key
echo Logging in to Railway...
railway login --apikey %RAILWAY_API_KEY%

if %ERRORLEVEL% neq 0 (
    echo Login failed. Please check your API key and try again.
    exit /b 1
)

:: Initialize a new project
echo Initializing a new Railway project...
railway init

:: Deploy to Railway
echo Deploying to Railway...
railway up

if %ERRORLEVEL% equ 0 (
    echo Deployment successful!
    echo Your MCP server is now deploying to Railway.
    echo.
    echo To open your project in the Railway dashboard, run:
    echo railway open
) else (
    echo Deployment failed.
    echo Please check the error message above and try again.
)

echo.
echo Thank you for using the MCP Server Builder!
pause
`;

    // Write Windows batch script
    fs.writeFileSync(path.join(this.tempDir, 'deploy-to-railway.bat'), batchScript);
  }

  /**
   * Deploy to Railway (in this case, prepare deployment package with scripts)
   */
  protected async deploy(): Promise<DeploymentResult> {
    // Create .env file with credentials
    const envContent = `RAILWAY_API_KEY=${this.options.credentials.apiKey || ''}`;
    fs.writeFileSync(path.join(this.tempDir, '.env'), envContent);

    return {
      success: true,
      message: 'Railway deployment package created successfully. Run the included deploy script to deploy.',
      deploymentId: this.deploymentId,
      platformId: this.options.platformId
    };
  }
}