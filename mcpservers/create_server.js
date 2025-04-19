#!/usr/bin/env node
/**
 * MCP Server Creation Utility
 * 
 * This script helps users create a new MCP server from a template.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Load server index
const serverIndex = JSON.parse(fs.readFileSync(path.join(__dirname, 'server_index.json'), 'utf8'));

// Display templates
console.log('\n===== MCP Server Creator =====\n');
console.log('Available templates:');

serverIndex.templates.forEach((template, index) => {
  console.log(`${index + 1}. ${template.name} (${template.language})`);
  console.log(`   ${template.description}`);
});

// Ask user to select a template
rl.question('\nSelect a template number: ', (templateIndexStr) => {
  const templateIndex = parseInt(templateIndexStr) - 1;
  
  if (isNaN(templateIndex) || templateIndex < 0 || templateIndex >= serverIndex.templates.length) {
    console.error('Invalid template selection.');
    rl.close();
    return;
  }
  
  const selectedTemplate = serverIndex.templates[templateIndex];
  
  // Ask for server name
  rl.question('Enter a name for your server: ', (serverName) => {
    if (!serverName) {
      console.error('Server name cannot be empty.');
      rl.close();
      return;
    }
    
    // Create directory for new server
    const outputDir = path.join(process.cwd(), serverName.toLowerCase().replace(/\s+/g, '_'));
    
    if (fs.existsSync(outputDir)) {
      console.error(`Directory already exists: ${outputDir}`);
      rl.close();
      return;
    }
    
    fs.mkdirSync(outputDir);
    
    // Copy template file
    const templatePath = path.join(__dirname, selectedTemplate.path);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders in the template
    let serverContent = templateContent
      .replace(/Basic MCP Server/g, serverName)
      .replace(/A simple MCP server template/g, `A custom MCP server based on ${selectedTemplate.name}`);
    
    // Write server file
    const serverFileName = path.basename(templatePath);
    fs.writeFileSync(path.join(outputDir, serverFileName), serverContent);
    
    // Create README.md
    const readmeContent = `# ${serverName}

A custom MCP server based on the ${selectedTemplate.name} template.

## Description

This server implements the Model Context Protocol (MCP) to interact with Claude or other compatible AI assistants.

## Setup

1. Install dependencies:
${selectedTemplate.language === 'javascript' ? '   ```\n   npm install\n   ```' : '   ```\n   pip install -r requirements.txt\n   ```'}

2. Start the server:
${selectedTemplate.language === 'javascript' ? '   ```\n   node ' + serverFileName + '\n   ```' : '   ```\n   python ' + serverFileName + '\n   ```'}

3. Connect to Claude:
   - In Claude Desktop, go to Settings > MCP > Add Server
   - Enter the server URL (typically http://localhost:3000)
   - Click "Connect"

## Tools

${selectedTemplate.tools.map(tool => `- ${tool}`).join('\n')}

## Customization

Modify the server code to add your own tools and functionality.
`;
    
    fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);
    
    // Create package.json if it's a JavaScript template
    if (selectedTemplate.language === 'javascript') {
      const packageJson = {
        "name": serverName.toLowerCase().replace(/\s+/g, '-'),
        "version": "1.0.0",
        "description": `A custom MCP server based on ${selectedTemplate.name}`,
        "main": serverFileName,
        "scripts": {
          "start": `node ${serverFileName}`
        },
        "dependencies": selectedTemplate.dependencies.reduce((obj, dep) => {
          obj[dep] = "*";
          return obj;
        }, {})
      };
      
      fs.writeFileSync(
        path.join(outputDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    }
    
    // Create requirements.txt if it's a Python template
    if (selectedTemplate.language === 'python') {
      fs.writeFileSync(
        path.join(outputDir, 'requirements.txt'),
        selectedTemplate.dependencies.join('\n')
      );
    }
    
    console.log(`\nServer created successfully in: ${outputDir}`);
    console.log(`\nTo start your server:`);
    
    if (selectedTemplate.language === 'javascript') {
      console.log(`  cd ${serverName.toLowerCase().replace(/\s+/g, '_')}`);
      console.log(`  npm install`);
      console.log(`  npm start`);
    } else {
      console.log(`  cd ${serverName.toLowerCase().replace(/\s+/g, '_')}`);
      console.log(`  python ${serverFileName}`);
    }
    
    rl.close();
  });
});