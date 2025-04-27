/**
 * MCP Server Bulk Generator
 * 
 * This utility generates a specified number of MCP server entries
 * for testing, demonstration, and stress-testing the system.
 * 
 * Usage: node generate_bulk_servers.js --count=1000
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to server index
const SERVER_INDEX_PATH = path.join(__dirname, 'server_index.json');

// Server categories
const CATEGORIES = [
  'web_search',
  'thinking_reasoning',
  'data_processing',
  'api_integration',
  'desktop_tools',
  'memory_management',
  'document_processing',
  'code_generation',
  'database_operations',
  'ai_services'
];

// Server languages
const LANGUAGES = [
  'javascript',
  'python',
  'go',
  'typescript',
  'java',
  'rust',
  'ruby',
  'csharp',
  'php',
  'kotlin'
];

// Generate a random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random server entry
function generateServer(id) {
  const category = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];
  const language = LANGUAGES[randomInt(0, LANGUAGES.length - 1)];
  
  return {
    id,
    name: `${category}_server_${id}`,
    description: `A ${category} MCP server`,
    category: 'imported',
    subcategory: category,
    language,
    tags: [
      ...category.split('_'),
      category,
      language
    ],
    path: `./imported/${category}/${id}`,
    entryPoint: language === 'python' ? 'server.py' : 'server.js',
    buildCommand: language === 'python' ? 'pip install -r requirements.txt' : 'npm install',
    runCommand: language === 'python' ? 'python server.py' : 'node server.js',
    port: 3000 + id % 1000,
    tools: [
      {
        name: `${category.split('_')[0]}Tool`,
        description: `Main tool for ${category} operations`
      },
      {
        name: `utility${id % 10}`,
        description: `Utility function #${id % 10}`
      }
    ]
  };
}

// Generate bulk servers
async function generateBulkServers(count) {
  try {
    console.log(chalk.blue(`Generating ${count} MCP servers...`));
    
    // Load existing server index
    let serverIndex = {};
    if (fs.existsSync(SERVER_INDEX_PATH)) {
      serverIndex = await fs.readJson(SERVER_INDEX_PATH);
    } else {
      serverIndex = {
        templates: [],
        examples: [],
        imported: []
      };
    }
    
    // Get the highest ID currently in use
    const allServers = [
      ...serverIndex.templates,
      ...serverIndex.examples,
      ...serverIndex.imported
    ];
    
    let maxId = 0;
    if (allServers.length > 0) {
      maxId = Math.max(...allServers.map(server => server.id));
    }
    
    // Generate new servers
    const newServers = [];
    for (let i = 0; i < count; i++) {
      newServers.push(generateServer(maxId + i + 1));
    }
    
    // Add new servers to the index
    serverIndex.imported = [
      ...serverIndex.imported,
      ...newServers
    ];
    
    // Save the updated server index
    await fs.writeJson(SERVER_INDEX_PATH, serverIndex, { spaces: 2 });
    
    console.log(chalk.green(`✓ Successfully generated ${count} new MCP servers`));
    console.log(chalk.blue(`Total servers: ${serverIndex.templates.length + serverIndex.examples.length + serverIndex.imported.length}`));
    
    return newServers;
  } catch (error) {
    console.error(chalk.red('Error generating bulk servers:'), error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    count: 100 // Default value
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--count=')) {
      const count = parseInt(arg.substring(8), 10);
      if (!isNaN(count) && count > 0) {
        options.count = count;
      }
    }
  });
  
  return options;
}

// Run if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArgs();
  
  generateBulkServers(options.count)
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Generation failed:', error);
      process.exit(1);
    });
}

export default generateBulkServers;