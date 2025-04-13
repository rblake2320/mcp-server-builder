import fs from 'fs';
import path from 'path';
import { DeploymentService, DeploymentResult } from './DeploymentService';

/**
 * Deployment service for Docker
 */
export class DockerDeploymentService extends DeploymentService {
  /**
   * Generate Docker-specific configuration files
   */
  protected async generateConfig(): Promise<void> {
    // Get server files
    const serverFiles = fs.readdirSync(this.tempDir);
    
    // Determine if this is a JavaScript or Python server
    const isJavaScript = serverFiles.includes('server.js');
    const serverFile = isJavaScript ? 'server.js' : 'server.py';
    const normalizedServerName = this.options.serverName.toLowerCase().replace(/\s+/g, '-');
    
    console.log(`Generating Docker config for ${isJavaScript ? 'JavaScript' : 'Python'} server`);
    
    // Create Dockerfile (or replace existing one with a better version)
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

    fs.writeFileSync(path.join(this.tempDir, 'Dockerfile'), dockerfile);
    
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

    fs.writeFileSync(path.join(this.tempDir, 'docker-compose.yml'), dockerCompose);
    
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
    fs.writeFileSync(path.join(this.tempDir, 'run-docker-deploy.bat'), batchScriptContent);
    fs.writeFileSync(path.join(this.tempDir, 'run-docker-deploy.sh'), shellScriptContent);
    
    // Make the shell script executable
    try {
      fs.chmodSync(path.join(this.tempDir, 'run-docker-deploy.sh'), '755');
    } catch (error) {
      console.error('Error making shell script executable:', error);
    }
    
    // Create comprehensive README with instructions
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

## Troubleshooting

If you encounter any issues:

1. Make sure Docker is properly installed and running.
2. Check that ports are not already in use (8080 is required).
3. For permission issues on Linux/Mac, you may need to use \`sudo\` with Docker commands.
4. If the container fails to start, check the logs with: \`docker logs ${normalizedServerName}\`
`;
    
    fs.writeFileSync(path.join(this.tempDir, 'README.md'), readmeContent);
    
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
    
    fs.writeFileSync(path.join(this.tempDir, '.dockerignore'), dockerignore);
    
    console.log('Docker configuration generated successfully');
  }

  /**
   * Deploy Docker package (local preparation only)
   */
  protected async deploy(): Promise<DeploymentResult> {
    try {
      console.log('Preparing Docker deployment package');
      
      // Generate Docker-specific setup instructions
      const setupInstructions = [
        'Extract the downloaded package to a local folder',
        'Make sure Docker is installed and running on your machine',
        'Run the Docker deployment script:',
        ' • Windows: run-docker-deploy.bat',
        ' • Mac/Linux: ./run-docker-deploy.sh',
        'The script will build and run your MCP server as a Docker container',
        'Your MCP server will be available at http://localhost:8080'
      ];
      
      return {
        success: true,
        message: 'Deployment package for Docker is ready',
        deploymentId: this.deploymentId,
        platformId: this.options.platformId,
        setupInstructions
      };
    } catch (error) {
      console.error('Docker deployment preparation failed:', error);
      return {
        success: false,
        message: 'Docker deployment preparation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        platformId: this.options.platformId
      };
    }
  }
}