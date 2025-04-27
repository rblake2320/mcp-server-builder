#!/usr/bin/env node

/**
 * MCP Server Creation Utility
 * 
 * This script helps create a new MCP server from a template.
 * It guides you through the process with interactive prompts
 * and generates the server files based on your selections.
 * 
 * Usage: node create-mcp-server.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configure paths
const rootDir = path.resolve(__dirname, '..');
const templatesDir = path.join(rootDir, 'templates');
const outputDir = path.join(process.cwd(), 'output');

// Available templates
const templates = {
  javascript: 'basic_mcp_server.js',
  python: 'basic_mcp_server.py'
};

// Server metadata
let serverData = {
  name: '',
  description: '',
  language: '',
  author: '',
  tools: [],
  version: '1.0.0'
};

/**
 * Ask a question and return the response via Promise
 */
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

/**
 * Replace placeholders in template with actual values
 */
function replacePlaceholders(content, data) {
  return content
    .replace(/\{\{SERVER_NAME\}\}/g, data.name)
    .replace(/\{\{SERVER_DESCRIPTION\}\}/g, data.description)
    .replace(/\{\{AUTHOR\}\}/g, data.author)
    .replace(/\{\{VERSION\}\}/g, data.version)
    .replace(/\{\{CREATED_AT\}\}/g, new Date().toISOString())
    .replace(/\{\{TOOLS\}\}/g, JSON.stringify(data.tools, null, 2));
}

/**
 * Generate a new MCP server from template
 */
async function generateServer(data) {
  const templatePath = path.join(templatesDir, templates[data.language]);
  const serverDir = path.join(outputDir, data.name.toLowerCase().replace(/\s+/g, '_'));
  
  // Ensure directories exist
  ensureDirectoryExists(serverDir);
  
  // Read template
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  
  // Replace placeholders
  const serverContent = replacePlaceholders(templateContent, data);
  
  // Create server file
  const serverFileName = data.language === 'javascript' ? 'server.js' : 'server.py';
  const serverFilePath = path.join(serverDir, serverFileName);
  fs.writeFileSync(serverFilePath, serverContent);
  
  // Create package.json for JavaScript servers
  if (data.language === 'javascript') {
    const packageJson = {
      name: data.name.toLowerCase().replace(/\s+/g, '-'),
      version: data.version,
      description: data.description,
      main: 'server.js',
      scripts: {
        start: 'node server.js'
      },
      author: data.author,
      dependencies: {
        express: '^4.18.2'
      }
    };
    
    fs.writeFileSync(
      path.join(serverDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }
  
  // Create README.md
  const readmeContent = `# ${data.name}\n\n${data.description}\n\n## Tools\n\n${data.tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}\n\n## Usage\n\n${data.language === 'javascript' ? 'npm install\nnode server.js' : 'python server.py'}\n`;
  fs.writeFileSync(path.join(serverDir, 'README.md'), readmeContent);
  
  // Create .gitignore
  const gitignoreContent = data.language === 'javascript' ? 'node_modules\npackage-lock.json\n' : '__pycache__\n*.pyc\n.venv\n';
  fs.writeFileSync(path.join(serverDir, '.gitignore'), gitignoreContent);
  
  console.log(`\nMCP Server successfully created at: ${serverDir}`);
  console.log(`To run your server: ${data.language === 'javascript' ? 'node server.js' : 'python server.py'}`);
}

/**
 * Add a tool to the server
 */
async function addTool() {
  console.log('\n=== Add a Tool ===');
  
  const tool = {
    name: await ask('Tool name: '),
    description: await ask('Tool description: '),
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  };
  
  // Add parameters
  const paramCount = parseInt(await ask('Number of parameters: '), 10);
  for (let i = 0; i < paramCount; i++) {
    console.log(`\n--- Parameter ${i + 1} ---`);
    const paramName = await ask('Parameter name: ');
    const paramType = await ask('Parameter type (string, number, boolean, object, array): ');
    const paramDesc = await ask('Parameter description: ');
    const isRequired = (await ask('Is required? (y/n): ')).toLowerCase() === 'y';
    
    tool.parameters.properties[paramName] = {
      type: paramType,
      description: paramDesc
    };
    
    if (isRequired) {
      tool.parameters.required.push(paramName);
    }
  }
  
  serverData.tools.push(tool);
  console.log(`Tool '${tool.name}' added!`);
  
  const addAnother = (await ask('\nAdd another tool? (y/n): ')).toLowerCase();
  if (addAnother === 'y') {
    await addTool();
  }
}

/**
 * Main function that runs the server creation process
 */
async function main() {
  console.log('=== MCP Server Creation Utility ===\n');
  
  // Get basic server information
  serverData.name = await ask('Server name: ');
  serverData.description = await ask('Server description: ');
  serverData.language = (await ask('Language (javascript/python): ')).toLowerCase();
  serverData.author = await ask('Author: ');
  
  // Validate language
  if (!['javascript', 'python'].includes(serverData.language)) {
    console.error('Error: Language must be either "javascript" or "python"');
    rl.close();
    return;
  }
  
  // Add tools
  await addTool();
  
  // Generate server
  await generateServer(serverData);
  
  // Clean up
  rl.close();
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  rl.close();
});