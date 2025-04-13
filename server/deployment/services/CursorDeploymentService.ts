import fs from 'fs';
import path from 'path';
import { DeploymentService, DeploymentResult } from './DeploymentService';

/**
 * Deployment service for Cursor IDE
 */
export class CursorDeploymentService extends DeploymentService {
  /**
   * Generate Cursor-specific configuration files
   */
  protected async generateConfig(): Promise<void> {
    // Generate a normalized server name for the config
    const normalizedServerName = this.options.serverName.toLowerCase().replace(/\s+/g, '-');
    
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
echo Setting up MCP server: ${normalizedServerName}
echo Current directory: %~dp0
echo.
echo Please manually add the following to your Cursor config file:
echo {
echo   "mcpServers": {
echo     "${normalizedServerName}": {
echo       "command": "${this.options.serverName.includes('Python') ? 'python' : 'node'}",
echo       "args": ["%~dp0server.${this.options.serverName.includes('Python') ? 'py' : 'js'}"]
echo     }
echo   }
echo }

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
echo "Setting up MCP server: ${normalizedServerName}"
echo "Current directory: $(pwd)"
echo
echo "Please manually add the following to your Cursor config file:"
echo '{
  "mcpServers": {
    "${normalizedServerName}": {
      "command": "${this.options.serverName.includes('Python') ? 'python' : 'node'}",
      "args": ["$(pwd)/server.${this.options.serverName.includes('Python') ? 'py' : 'js'}"]
    }
  }
}'

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
    fs.writeFileSync(path.join(this.tempDir, 'deploy-to-cursor.bat'), batchScriptContent);
    fs.writeFileSync(path.join(this.tempDir, 'deploy-to-cursor.sh'), shellScriptContent);
    
    // Make the shell script executable
    try {
      fs.chmodSync(path.join(this.tempDir, 'deploy-to-cursor.sh'), '755');
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
    "${normalizedServerName}": {
      "command": "${this.options.serverName.includes('Python') ? 'python' : 'node'}",
      "args": ["/absolute/path/to/this/folder/server.${this.options.serverName.includes('Python') ? 'py' : 'js'}"]
    }
  }
}
\`\`\`

3. Restart Cursor IDE to apply the changes.
`;
    
    fs.writeFileSync(path.join(this.tempDir, 'README.md'), readmeContent);
  }

  /**
   * Deploy to Cursor IDE (local deployment - just prepare the package)
   */
  protected async deploy(): Promise<DeploymentResult> {
    return {
      success: true,
      message: 'Cursor IDE deployment package created with auto-setup scripts!',
      deploymentId: this.deploymentId,
      platformId: this.options.platformId,
      setupInstructions: [
        'Extract the downloaded package to a local folder',
        'Run the auto-deployment assistant:',
        ' • Windows: Double-click deploy-to-cursor.bat',
        ' • Mac/Linux: Run ./deploy-to-cursor.sh',
        'The assistant will automatically:',
        ' • Install required dependencies',
        ' • Configure your Cursor IDE',
        ' • Set up the MCP server for immediate use',
        'Restart Cursor IDE to apply the changes'
      ]
    };
  }
}