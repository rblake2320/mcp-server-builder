/**
 * MCP Server Cursor IDE Deployment Assistant
 * 
 * This script completely automates the deployment of an MCP server to Cursor IDE.
 * It handles:
 * - Dependency installation
 * - Cursor config file editing
 * - Cursor IDE restart (optional)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const readline = require('readline');

// Configuration (dynamically populated during deployment package creation)
const SERVER_NAME = "{{SERVER_NAME}}";
const IS_PYTHON = "{{IS_PYTHON}}" === "true"; // Will be true or false

// Get the directory where this script is located
const CURRENT_DIR = __dirname;

// Color console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Get Cursor config file path based on OS
function getCursorConfigPath() {
  const platform = process.platform;
  const homedir = os.homedir();
  
  if (platform === 'darwin') { // macOS
    return path.join(homedir, 'Library/Application Support/Cursor/cursor_config.json');
  } else if (platform === 'win32') { // Windows
    return path.join(process.env.APPDATA, 'Cursor', 'cursor_config.json');
  } else { // Linux
    return path.join(homedir, '.config/Cursor/cursor_config.json');
  }
}

// Install dependencies automatically
function installDependencies() {
  console.log(`${colors.cyan}📦 Installing dependencies...${colors.reset}`);
  
  try {
    if (IS_PYTHON) {
      // Python dependency installation
      const requirementsFile = path.join(CURRENT_DIR, 'requirements.txt');
      
      if (fs.existsSync(requirementsFile)) {
        execSync(`pip install -r "${requirementsFile}"`, { stdio: 'inherit' });
      } else {
        // Auto-detect dependencies from Python files
        console.log(`${colors.yellow}No requirements.txt found. Detecting Python dependencies...${colors.reset}`);
        
        // Run the auto-installer to detect and install dependencies
        const autoInstall = path.join(CURRENT_DIR, 'auto-install.py');
        if (fs.existsSync(autoInstall)) {
          execSync(`python "${autoInstall}" --install-only`, { stdio: 'inherit' });
        } else {
          console.log(`${colors.yellow}Warning: Could not find auto-installer. Some dependencies may be missing.${colors.reset}`);
        }
      }
    } else {
      // Node.js dependency installation
      const packageJson = path.join(CURRENT_DIR, 'package.json');
      
      if (fs.existsSync(packageJson)) {
        execSync('npm install', { stdio: 'inherit', cwd: CURRENT_DIR });
      } else {
        // Auto-detect dependencies from JavaScript files
        console.log(`${colors.yellow}No package.json found. Detecting Node.js dependencies...${colors.reset}`);
        
        // Run the auto-installer to detect and install dependencies
        const autoInstall = path.join(CURRENT_DIR, 'auto-install.js');
        if (fs.existsSync(autoInstall)) {
          execSync(`node "${autoInstall}"`, { stdio: 'inherit' });
        } else {
          console.log(`${colors.yellow}Warning: Could not find auto-installer. Some dependencies may be missing.${colors.reset}`);
        }
      }
    }
    
    console.log(`${colors.green}✅ Dependencies installed successfully!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to install dependencies:${colors.reset}`, error);
    return false;
  }
}

// Update Cursor IDE configuration file
function updateCursorConfig() {
  console.log(`${colors.cyan}⚙️ Updating Cursor IDE configuration...${colors.reset}`);
  
  const configPath = getCursorConfigPath();
  
  // Check if config file exists
  if (!fs.existsSync(configPath)) {
    console.log(`${colors.red}❌ Cursor config file not found at ${configPath}${colors.reset}`);
    console.log('Please make sure Cursor IDE is installed and has been run at least once.');
    return false;
  }
  
  try {
    // Read current config
    let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Initialize mcpServers if it doesn't exist
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    
    // Get absolute path to server file
    const serverFile = IS_PYTHON ? 'server.py' : 'server.js';
    const serverPath = path.join(CURRENT_DIR, serverFile);
    
    // Normalize server name for config (lowercase with dashes instead of spaces)
    const serverKey = SERVER_NAME.toLowerCase().replace(/\\s+/g, '-');
    
    // Add/update server configuration
    config.mcpServers[serverKey] = {
      "command": IS_PYTHON ? "python" : "node",
      "args": [serverPath]
    };
    
    // Create a backup of the original config
    const backupPath = `${configPath}.backup`;
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(configPath, backupPath);
      console.log(`${colors.green}Created backup of Cursor config at ${backupPath}${colors.reset}`);
    }
    
    // Write updated config back
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(`${colors.green}✅ Cursor configuration updated successfully!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to update Cursor configuration:${colors.reset}`, error);
    return false;
  }
}

// Check if Cursor IDE is running
function checkIfCursorIsRunning() {
  try {
    if (process.platform === 'win32') {
      const output = execSync('tasklist /FI "IMAGENAME eq cursor.exe"').toString();
      return output.includes('cursor.exe');
    } else {
      const output = execSync('ps aux | grep -v grep | grep -i Cursor').toString();
      return output !== '';
    }
  } catch (error) {
    return false;
  }
}

// Start Cursor IDE
function startCursor() {
  try {
    console.log(`${colors.cyan}🚀 Starting Cursor IDE...${colors.reset}`);
    
    if (process.platform === 'win32') {
      // Try common installation paths for Windows
      const possiblePaths = [
        path.join(process.env['ProgramFiles'], 'Cursor', 'Cursor.exe'),
        path.join(process.env['ProgramFiles(x86)'], 'Cursor', 'Cursor.exe'),
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'cursor', 'Cursor.exe')
      ];
      
      const cursorPath = possiblePaths.find(p => fs.existsSync(p));
      
      if (cursorPath) {
        execSync(`start "" "${cursorPath}"`, { stdio: 'ignore', shell: true });
      } else {
        console.log(`${colors.yellow}⚠️ Cursor executable not found. Please start Cursor IDE manually.${colors.reset}`);
        return false;
      }
    } else if (process.platform === 'darwin') {
      execSync('open -a Cursor', { stdio: 'ignore' });
    } else {
      execSync('cursor', { stdio: 'ignore' });
    }
    
    console.log(`${colors.green}✅ Cursor IDE should be starting...${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Failed to start Cursor IDE. Please start it manually.${colors.reset}`);
    return false;
  }
}

// Attempt to restart Cursor IDE
async function handleCursorRestart() {
  // Check if Cursor is running
  const isRunning = checkIfCursorIsRunning();
  
  if (isRunning) {
    console.log(`${colors.yellow}⚠️ Cursor IDE is currently running.${colors.reset}`);
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Ask user if they want to restart Cursor
    rl.question(`${colors.cyan}Would you like to restart Cursor IDE now? (y/n): ${colors.reset}`, (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'y') {
        // Terminate Cursor process
        try {
          if (process.platform === 'win32') {
            execSync('taskkill /F /IM cursor.exe');
          } else {
            execSync('pkill -f Cursor');
          }
          
          console.log(`${colors.green}✅ Cursor IDE terminated. Restarting...${colors.reset}`);
          
          // Short delay before starting Cursor again
          setTimeout(() => {
            startCursor();
            showCompletionMessage();
          }, 1500);
        } catch (error) {
          console.log(`${colors.red}❌ Failed to terminate Cursor IDE. Please restart it manually.${colors.reset}`);
          showCompletionMessage();
        }
      } else {
        console.log(`${colors.yellow}Please restart Cursor IDE manually to apply the changes.${colors.reset}`);
        showCompletionMessage();
      }
    });
  } else {
    // If Cursor is not running, offer to start it
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`${colors.cyan}Would you like to start Cursor IDE now? (y/n): ${colors.reset}`, (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'y') {
        startCursor();
      } 
      
      showCompletionMessage();
    });
  }
}

// Display completion message with instructions on how to use the MCP server
function showCompletionMessage() {
  const serverKey = SERVER_NAME.toLowerCase().replace(/\\s+/g, '-');
  
  console.log('\n');
  console.log(`${colors.bright}${colors.green}=== MCP Server "${SERVER_NAME}" successfully deployed! ===${colors.reset}`);
  console.log('\n');
  console.log(`${colors.bright}To use your MCP server in Cursor IDE:${colors.reset}`);
  console.log(`${colors.cyan}1. Open Cursor IDE${colors.reset}`);
  console.log(`${colors.cyan}2. Click on the MCP icon in the sidebar${colors.reset}`);
  console.log(`${colors.cyan}3. Select "${serverKey}" from the dropdown menu${colors.reset}`);
  console.log(`${colors.cyan}4. Click "Connect"${colors.reset}`);
  console.log('\n');
  console.log(`${colors.bright}Configuration Information:${colors.reset}`);
  console.log(`${colors.cyan}• Server Name: ${SERVER_NAME}${colors.reset}`);
  console.log(`${colors.cyan}• Server Type: ${IS_PYTHON ? 'Python' : 'Node.js'}${colors.reset}`);
  console.log(`${colors.cyan}• Location: ${CURRENT_DIR}${colors.reset}`);
  console.log('\n');
  console.log(`${colors.bright}${colors.green}Thank you for using the MCP Server Builder!${colors.reset}`);
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.blue}=== MCP Server Cursor IDE Deployment Assistant ===${colors.reset}`);
  console.log(`${colors.cyan}Deploying "${SERVER_NAME}" to Cursor IDE${colors.reset}`);
  console.log(`${colors.cyan}Current directory: ${CURRENT_DIR}${colors.reset}`);
  console.log('\n');
  
  // Step 1: Install dependencies
  if (!installDependencies()) {
    console.log(`${colors.yellow}⚠️ Continuing with deployment despite dependency installation issues...${colors.reset}`);
  }
  
  console.log('\n');
  
  // Step 2: Update Cursor config
  if (!updateCursorConfig()) {
    console.log(`${colors.red}❌ Unable to update Cursor configuration. Deployment failed.${colors.reset}`);
    return;
  }
  
  console.log('\n');
  
  // Step 3: Handle Cursor restart/start
  await handleCursorRestart();
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Deployment failed:${colors.reset}`, error);
});