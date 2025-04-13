/**
 * Automatic Dependency Installer
 * 
 * This module generates scripts that automatically detect and install 
 * dependencies for MCP servers, making the deployment process seamless for users.
 */

import fs from 'fs-extra';
import path from 'path';

/**
 * Creates an auto-dependency installer script for Node.js MCP servers
 */
export function createNodeAutoInstaller(deploymentDir: string): void {
  const installerScript = `#!/usr/bin/env node
/**
 * MCP Server Auto-Dependency Installer
 * This script automatically detects and installs required dependencies.
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Detect imports in JavaScript/TypeScript files
function findDependencies() {
  console.log('📦 Scanning for dependencies...');
  
  const dependencies = new Set();
  const files = fs.readdirSync('.').filter(file => 
    file.endsWith('.js') || file.endsWith('.ts')
  );
  
  const requireRegex = /require\\(['"]([\\w\\-@\\/\\.]+)['"]\\)/g;
  const importRegex = /import.*?from\\s+['"]([\\w\\-@\\/\\.]+)['"]|import\\s+['"]([\\w\\-@\\/\\.]+)['"]/g;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Process require statements
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
      if (!match[1].startsWith('.') && !match[1].startsWith('/')) {
        const pkgName = match[1].startsWith('@') 
          ? match[1].split('/').slice(0, 2).join('/') 
          : match[1].split('/')[0];
        dependencies.add(pkgName);
      }
    }
    
    // Process import statements
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2];
      if (importPath && !importPath.startsWith('.') && !importPath.startsWith('/')) {
        const pkgName = importPath.startsWith('@') 
          ? importPath.split('/').slice(0, 2).join('/') 
          : importPath.split('/')[0];
        dependencies.add(pkgName);
      }
    }
  });
  
  return Array.from(dependencies);
}

// Install dependencies
function installDependencies() {
  const deps = findDependencies();
  
  if (deps.length === 0) {
    console.log('✅ No external dependencies detected.');
    return;
  }
  
  // Create package.json if it doesn't exist
  if (!fs.existsSync('package.json')) {
    console.log('Creating package.json...');
    try {
      execSync('npm init -y', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to create package.json:', error);
    }
  }
  
  console.log(\`📥 Installing \${deps.length} dependencies: \${deps.join(', ')}\`);
  try {
    execSync(\`npm install \${deps.join(' ')}\`, { stdio: 'inherit' });
    console.log('✅ All dependencies installed successfully!');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error);
    process.exit(1);
  }
}

// Main execution
console.log('🚀 MCP Server Automatic Dependency Installer');
installDependencies();

// If this script was called directly (not required), start the server
if (require.main === module) {
  console.log('🔄 Starting MCP server...');
  try {
    const serverFile = fs.existsSync('server.js') ? 'server.js' : 'index.js';
    require('./' + serverFile);
  } catch (error) {
    console.error(\`❌ Failed to start server: \${error.message}\`);
    process.exit(1);
  }
}
`;

  fs.writeFileSync(path.join(deploymentDir, 'auto-install.js'), installerScript);
  fs.chmodSync(path.join(deploymentDir, 'auto-install.js'), '755');
}

/**
 * Creates an auto-dependency installer script for Python MCP servers
 */
export function createPythonAutoInstaller(deploymentDir: string): void {
  const installerScript = `#!/usr/bin/env python3
# MCP Server Auto-Dependency Installer
# This script automatically detects and installs required dependencies.

import os
import re
import sys
import subprocess
import importlib.util

def extract_imports():
    """Extract import statements from Python files in the current directory."""
    print("📦 Scanning for dependencies...")
    
    imports = set()
    files = [f for f in os.listdir('.') if f.endswith('.py')]
    
    # Regular expressions to find imports
    import_regex = re.compile(r'^import\\s+([\\w\\.]+)', re.MULTILINE)
    from_regex = re.compile(r'^from\\s+([\\w\\.]+)\\s+import', re.MULTILINE)
    
    for file_path in files:
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                content = f.read()
                
                # Extract imports
                for match in import_regex.findall(content) + from_regex.findall(content):
                    # Get top-level package
                    pkg = match.split('.')[0]
                    # Skip standard library modules
                    if pkg not in sys.stdlib_module_names:
                        imports.add(pkg)
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
    
    return imports

def is_installed(package):
    """Check if a package is already installed."""
    try:
        importlib.import_module(package)
        return True
    except ImportError:
        return False

def install_dependencies():
    """Install missing dependencies."""
    packages = extract_imports()
    
    if not packages:
        print("✅ No external dependencies detected.")
        return
    
    # Filter out already installed packages
    missing = [pkg for pkg in packages if not is_installed(pkg)]
    
    if not missing:
        print("✅ All dependencies already installed.")
        return
    
    print(f"📥 Installing {len(missing)} dependencies: {', '.join(missing)}")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)
        print("✅ All dependencies installed successfully!")
        
        # Create requirements.txt
        print("📄 Creating requirements.txt...")
        with open("requirements.txt", "w") as f:
            for pkg in packages:
                f.write(f"{pkg}\\n")
    except Exception as e:
        print(f"❌ Failed to install dependencies: {e}")
        sys.exit(1)

def start_server():
    """Start the MCP server."""
    print("🔄 Starting MCP server...")
    server_file = "server.py"
    
    if not os.path.exists(server_file):
        print(f"❌ Server file {server_file} not found!")
        sys.exit(1)
        
    try:
        os.execv(sys.executable, [sys.executable, server_file])
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 MCP Server Automatic Dependency Installer")
    install_dependencies()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--install-only":
        print("✅ Installation completed. Not starting server.")
    else:
        start_server()
`;

  fs.writeFileSync(path.join(deploymentDir, 'auto-install.py'), installerScript);
  fs.chmodSync(path.join(deploymentDir, 'auto-install.py'), '755');
}

/**
 * Creates a platform-agnostic launcher script that runs the appropriate installer
 */
export function createUniversalLauncher(deploymentDir: string, isNodeJs: boolean): void {
  // Windows batch file
  const batchScript = `@echo off
echo 🚀 MCP Server Launcher
echo Detecting server type...

${isNodeJs ? `
IF EXIST "auto-install.js" (
  echo 🔍 Found Node.js MCP server
  echo 📦 Running automatic dependency installer...
  node auto-install.js
) ELSE (
  echo ❌ Couldn't detect server type
  exit /b 1
)
` : `
IF EXIST "auto-install.py" (
  echo 🔍 Found Python MCP server
  echo 📦 Running automatic dependency installer...
  python auto-install.py
) ELSE (
  echo ❌ Couldn't detect server type
  exit /b 1
)
`}
`;

  // Unix shell script
  const shellScript = `#!/bin/bash
echo "🚀 MCP Server Launcher"
echo "Detecting server type..."

${isNodeJs ? `
if [ -f "auto-install.js" ]; then
  echo "🔍 Found Node.js MCP server"
  echo "📦 Running automatic dependency installer..."
  node auto-install.js
else
  echo "❌ Couldn't detect server type"
  exit 1
fi
` : `
if [ -f "auto-install.py" ]; then
  echo "🔍 Found Python MCP server"
  echo "📦 Running automatic dependency installer..."
  python3 auto-install.py
else
  echo "❌ Couldn't detect server type"
  exit 1
fi
`}
`;

  fs.writeFileSync(path.join(deploymentDir, 'start.bat'), batchScript);
  fs.writeFileSync(path.join(deploymentDir, 'start.sh'), shellScript);
  fs.chmodSync(path.join(deploymentDir, 'start.sh'), '755');
}

/**
 * Creates a README file with complete setup instructions
 */
export function createReadme(deploymentDir: string, platform: string, serverName: string, isNodeJs: boolean): void {
  const readme = `# ${serverName} MCP Server

## Quick Start

This MCP server package includes automatic dependency detection and installation.
Simply run one of the launcher scripts to get started:

### Windows:
\`\`\`
start.bat
\`\`\`

### macOS/Linux:
\`\`\`
./start.sh
\`\`\`

## Manual Setup

If you prefer to set things up manually:

${isNodeJs ? `
### Node.js Setup:
1. Install Node.js if not already installed
2. Run \`node auto-install.js\` to automatically detect and install dependencies
3. Or manually install with \`npm install\`
4. Start the server with \`node server.js\`
` : `
### Python Setup:
1. Install Python 3.6+ if not already installed
2. Run \`python auto-install.py\` to automatically detect and install dependencies
3. Or manually install with \`pip install -r requirements.txt\`
4. Start the server with \`python server.py\`
`}

## Connecting to ${platform}

${platform === 'Cursor IDE' ? `
### Integrating with Cursor IDE:

1. Locate your Cursor IDE config file:
   - macOS: ~/Library/Application Support/Cursor/cursor_config.json
   - Windows: %APPDATA%\\Cursor\\cursor_config.json
   - Linux: ~/.config/Cursor/cursor_config.json

2. Add the following to your cursor_config.json:
\`\`\`json
{
  "mcpServers": {
    "${serverName.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "${isNodeJs ? 'node' : 'python'}",
      "args": ["/absolute/path/to/this/folder/${isNodeJs ? 'server.js' : 'server.py'}"]
    }
  }
}
\`\`\`

3. Replace '/absolute/path/to/this/folder/' with the actual path where you extracted this package

4. Restart Cursor IDE to apply the changes

5. Open Cursor IDE and click on the MCP icon in the sidebar to connect to your server
` : `
Follow the platform-specific instructions for ${platform}.
`}

## Troubleshooting

- If you encounter errors related to missing dependencies, run the auto-installer script again
- Check that you have the correct version of ${isNodeJs ? 'Node.js' : 'Python'} installed
- Ensure you have internet access for dependency installation

`;

  fs.writeFileSync(path.join(deploymentDir, 'README.md'), readme);
}

/**
 * Creates install scripts for the specified deployment
 */
export function addAutoInstallScripts(deploymentDir: string, platform: string, serverName: string): void {
  // Detect if this is a Node.js or Python project
  const isNodeJs = fs.existsSync(path.join(deploymentDir, 'server.js')) || 
                   fs.existsSync(path.join(deploymentDir, 'index.js'));

  // Create the appropriate auto-installer
  if (isNodeJs) {
    createNodeAutoInstaller(deploymentDir);
  } else {
    createPythonAutoInstaller(deploymentDir);
  }

  // Create universal launcher scripts
  createUniversalLauncher(deploymentDir, isNodeJs);
  
  // Create detailed README
  createReadme(deploymentDir, platform, serverName, isNodeJs);
}