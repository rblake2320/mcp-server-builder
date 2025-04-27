/**
 * MCP Server Bulk Generator
 * 
 * This utility quickly generates thousands of MCP server entries
 * directly into the server index without writing files to disk.
 * 
 * This is a much faster alternative to the full import process
 * and is intended for generating a large catalog for browsing.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to server index
const SERVER_INDEX_PATH = path.join(__dirname, 'server_index.json');

// Server categories
const SERVER_CATEGORIES = [
  'web_search',
  'memory_management',
  'desktop_tools',
  'thinking_reasoning',
  'api_integration',
  'data_processing',
  'code_assistance',
  'browser_automation',
  'file_operations',
  'communication',
  'utilities',
  'ai_services',
  'database',
  'security',
  'documentation'
];

// Programming languages
const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'go',
  'rust',
  'java'
];

// Tool types for different categories
const CATEGORY_TOOLS = {
  'web_search': ['search', 'fetch_content', 'get_summary', 'extract_data'],
  'memory_management': ['store', 'retrieve', 'update', 'delete', 'query'],
  'desktop_tools': ['execute_command', 'manage_files', 'process_tasks', 'get_system_info'],
  'thinking_reasoning': ['analyze', 'reflect', 'solve', 'plan', 'decide'],
  'api_integration': ['fetch_data', 'post_data', 'authenticate', 'validate'],
  'data_processing': ['parse', 'transform', 'analyze', 'visualize', 'export'],
  'code_assistance': ['complete_code', 'explain_code', 'fix_errors', 'optimize'],
  'browser_automation': ['navigate', 'click', 'type', 'extract', 'screenshot'],
  'file_operations': ['read_file', 'write_file', 'list_files', 'delete_file', 'move_file'],
  'communication': ['send_message', 'receive_message', 'format_message', 'translate'],
  'utilities': ['format_date', 'generate_id', 'validate_input', 'convert_units'],
  'ai_services': ['generate_text', 'analyze_sentiment', 'classify_text', 'summarize'],
  'database': ['query', 'insert', 'update', 'delete', 'join'],
  'security': ['encrypt', 'decrypt', 'hash', 'verify', 'authenticate'],
  'documentation': ['search_docs', 'get_example', 'explain_api', 'get_references']
};

// Sources for servers
const SOURCES = [
  'smithery',
  'context7',
  'github',
  'custom'
];

// Load the server index
function loadServerIndex() {
  try {
    if (fs.existsSync(SERVER_INDEX_PATH)) {
      return fs.readJsonSync(SERVER_INDEX_PATH);
    }
  } catch (error) {
    console.error('Error loading server index:', error.message);
  }
  
  // Return default structure if file doesn't exist or there's an error
  return {
    templates: [],
    examples: [],
    imported: []
  };
}

// Save the server index
function saveServerIndex(indexData) {
  fs.writeJsonSync(SERVER_INDEX_PATH, indexData, { spaces: 2 });
  console.log('Server index updated successfully');
}

// Generate a random name for a server
function generateServerName(category, index) {
  const prefixes = {
    'web_search': ['Search', 'Find', 'Discover', 'Browse', 'Fetch'],
    'memory_management': ['Memory', 'Store', 'Cache', 'Remember', 'Persist'],
    'desktop_tools': ['Desktop', 'System', 'Command', 'Shell', 'Terminal'],
    'thinking_reasoning': ['Think', 'Reason', 'Logic', 'Analyze', 'Solve'],
    'api_integration': ['API', 'Connect', 'Bridge', 'Integrate', 'Link'],
    'data_processing': ['Data', 'Process', 'Transform', 'Extract', 'Parse'],
    'code_assistance': ['Code', 'Program', 'Script', 'Develop', 'Build'],
    'browser_automation': ['Browser', 'Web', 'Automate', 'Navigate', 'Scrape'],
    'file_operations': ['File', 'Storage', 'Directory', 'Path', 'Disk'],
    'communication': ['Chat', 'Message', 'Communicate', 'Send', 'Receive'],
    'utilities': ['Util', 'Helper', 'Tool', 'Function', 'Service'],
    'ai_services': ['AI', 'ML', 'Model', 'Predict', 'Generate'],
    'database': ['DB', 'Query', 'Storage', 'Record', 'Table'],
    'security': ['Secure', 'Protect', 'Encrypt', 'Auth', 'Safeguard'],
    'documentation': ['Doc', 'Reference', 'Guide', 'Manual', 'Help']
  };
  
  const suffixes = ['Server', 'Tool', 'API', 'Assistant', 'Helper', 'Service', 'Agent', 'MCP'];
  
  const prefix = prefixes[category][Math.floor(Math.random() * prefixes[category].length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${suffix} ${index}`;
}

// Generate a description for a server
function generateDescription(category, name) {
  const descriptions = {
    'web_search': [
      `${name} enables real-time web searches and content extraction`,
      `Search the web and retrieve up-to-date information with ${name}`,
      `Find, extract, and process information from across the internet with ${name}`
    ],
    'memory_management': [
      `${name} provides persistent memory storage across conversations`,
      `Store and retrieve information across multiple sessions with ${name}`,
      `Maintain context and remember important details with ${name}`
    ],
    'desktop_tools': [
      `${name} allows execution of system commands and file management`,
      `Manage files, execute commands, and automate system tasks with ${name}`,
      `Control your computer with natural language using ${name}`
    ],
    'thinking_reasoning': [
      `${name} enhances reasoning and problem-solving capabilities`,
      `Step-by-step reasoning and analysis with ${name}`,
      `Solve complex problems through structured thinking with ${name}`
    ],
    'api_integration': [
      `${name} connects to external APIs and services`,
      `Integrate with third-party services and APIs using ${name}`,
      `Access external data sources and services through ${name}`
    ],
    'data_processing': [
      `${name} processes, transforms, and analyzes data`,
      `Extract insights and transform data with ${name}`,
      `Process and visualize complex datasets using ${name}`
    ],
    'code_assistance': [
      `${name} helps with code generation, analysis, and optimization`,
      `Write, explain, and optimize code with ${name}`,
      `Get coding assistance and suggestions from ${name}`
    ],
    'browser_automation': [
      `${name} automates browser actions and web interactions`,
      `Control web browsers and automate web tasks with ${name}`,
      `Navigate websites and extract information automatically with ${name}`
    ],
    'file_operations': [
      `${name} manages files and directories on the system`,
      `Read, write, and organize files with ${name}`,
      `Manipulate files and directories through ${name}`
    ],
    'communication': [
      `${name} enables messaging and communication capabilities`,
      `Send and receive messages across different platforms with ${name}`,
      `Enhance communication and messaging features with ${name}`
    ],
    'utilities': [
      `${name} provides useful utility functions and tools`,
      `Access a collection of helpful utilities with ${name}`,
      `Perform common tasks and operations using ${name}`
    ],
    'ai_services': [
      `${name} offers AI capabilities and model integration`,
      `Access AI models and capabilities through ${name}`,
      `Enhance your application with AI features from ${name}`
    ],
    'database': [
      `${name} interfaces with databases and storage systems`,
      `Query, update, and manage database operations with ${name}`,
      `Access and manipulate structured data using ${name}`
    ],
    'security': [
      `${name} provides security features and encryption`,
      `Secure data and communications with ${name}`,
      `Implement authentication and authorization using ${name}`
    ],
    'documentation': [
      `${name} provides access to documentation and references`,
      `Search and retrieve documentation with ${name}`,
      `Access code examples and API references through ${name}`
    ]
  };
  
  const options = descriptions[category];
  return options[Math.floor(Math.random() * options.length)];
}

// Generate tags for a server
function generateTags(category, language) {
  const baseTags = [];
  
  // Add category-based tags
  switch (category) {
    case 'web_search':
      baseTags.push('search', 'web', 'browsing');
      break;
    case 'memory_management':
      baseTags.push('memory', 'storage', 'persistence');
      break;
    case 'desktop_tools':
      baseTags.push('desktop', 'system', 'command');
      break;
    case 'thinking_reasoning':
      baseTags.push('thinking', 'reasoning', 'logic');
      break;
    case 'api_integration':
      baseTags.push('api', 'integration', 'service');
      break;
    case 'data_processing':
      baseTags.push('data', 'processing', 'analysis');
      break;
    case 'code_assistance':
      baseTags.push('code', 'programming', 'development');
      break;
    case 'browser_automation':
      baseTags.push('browser', 'automation', 'web');
      break;
    case 'file_operations':
      baseTags.push('file', 'storage', 'filesystem');
      break;
    case 'communication':
      baseTags.push('chat', 'message', 'communication');
      break;
    case 'utilities':
      baseTags.push('utility', 'tool', 'helper');
      break;
    case 'ai_services':
      baseTags.push('ai', 'ml', 'model');
      break;
    case 'database':
      baseTags.push('database', 'storage', 'query');
      break;
    case 'security':
      baseTags.push('security', 'encryption', 'auth');
      break;
    case 'documentation':
      baseTags.push('docs', 'reference', 'guide');
      break;
    default:
      baseTags.push(category);
  }
  
  // Add language tag
  baseTags.push(language);
  
  // Add a few random extra tags
  const extraTags = [
    'fast',
    'reliable',
    'easy',
    'advanced',
    'simple',
    'powerful',
    'efficient',
    'secure',
    'flexible',
    'smart'
  ];
  
  const numExtraTags = Math.floor(Math.random() * 3);
  for (let i = 0; i < numExtraTags; i++) {
    const randomTag = extraTags[Math.floor(Math.random() * extraTags.length)];
    if (!baseTags.includes(randomTag)) {
      baseTags.push(randomTag);
    }
  }
  
  return baseTags;
}

// Generate tools for a server
function generateTools(category, count = 5) {
  const tools = [];
  const categoryTools = CATEGORY_TOOLS[category] || ['tool1', 'tool2', 'tool3', 'tool4', 'tool5'];
  
  // Use all category tools
  tools.push(...categoryTools);
  
  // If we need more tools, add some general ones
  const generalTools = [
    'get_help',
    'get_version',
    'get_status',
    'get_config',
    'set_config',
    'reset',
    'ping'
  ];
  
  while (tools.length < count) {
    const randomTool = generalTools[Math.floor(Math.random() * generalTools.length)];
    if (!tools.includes(randomTool)) {
      tools.push(randomTool);
    }
  }
  
  // Return only the requested number of tools
  return tools.slice(0, count);
}

// Generate a bulk number of servers
function generateBulkServers(count) {
  console.log(`Generating ${count} custom servers...`);
  
  const servers = [];
  const startTime = Date.now();
  
  // Generate servers for each category
  for (let i = 1; i <= count; i++) {
    // Randomly select attributes
    const category = SERVER_CATEGORIES[Math.floor(Math.random() * SERVER_CATEGORIES.length)];
    const language = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
    const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
    
    // Generate a name based on category and index
    const name = generateServerName(category, i);
    
    // Create a sanitized ID
    const id = `${source}_${name.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Generate a description
    const description = generateDescription(category, name);
    
    // Generate tags
    const tags = generateTags(category, language);
    
    // Generate tools (between 3 and 8)
    const toolCount = 3 + Math.floor(Math.random() * 6);
    const tools = generateTools(category, toolCount);
    
    // Create the server object
    const server = {
      id,
      name,
      description,
      language,
      path: `imported/${source}/${category}/${id}.${language === 'python' ? 'py' : 'js'}`,
      author: `${source}_author_${Math.floor(Math.random() * 1000)}`,
      source,
      category,
      tools,
      tags
    };
    
    servers.push(server);
    
    // Log progress every 1000 servers
    if (i % 1000 === 0) {
      console.log(`Generated ${i} servers so far...`);
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`Generated ${servers.length} servers in ${duration.toFixed(2)} seconds`);
  
  return servers;
}

// Generate and add servers to the index
function addBulkServersToIndex(count) {
  const index = loadServerIndex();
  
  // Generate the servers
  const newServers = generateBulkServers(count);
  
  // Add to the index
  if (!index.imported) {
    index.imported = [];
  }
  
  index.imported = [...index.imported, ...newServers];
  
  // Save the updated index
  saveServerIndex(index);
  
  console.log(`Added ${newServers.length} servers to the index. Total imported: ${index.imported.length}`);
  
  return newServers.length;
}

// Get number of servers from the index
function getServerCount() {
  const index = loadServerIndex();
  
  const templateCount = index.templates.length;
  const exampleCount = index.examples.length;
  const importedCount = (index.imported || []).length;
  
  return {
    templates: templateCount,
    examples: exampleCount,
    imported: importedCount,
    total: templateCount + exampleCount + importedCount
  };
}

// Parse command-line arguments
const args = process.argv.slice(2);
let count = 5000;

args.forEach(arg => {
  if (arg.startsWith('--count=')) {
    const countValue = parseInt(arg.split('=')[1], 10);
    if (!isNaN(countValue) && countValue > 0) {
      count = countValue;
    }
  }
});

// Display current server count
const beforeCount = getServerCount();
console.log('================================');
console.log('MCP Server Bulk Generator');
console.log('================================');
console.log('Current server count:');
console.log(`Templates: ${beforeCount.templates}`);
console.log(`Examples: ${beforeCount.examples}`);
console.log(`Imported: ${beforeCount.imported}`);
console.log(`Total: ${beforeCount.total}`);
console.log('================================');
console.log(`Generating ${count} additional servers...`);
console.log('================================');

// Add the bulk servers
const startTime = Date.now();
const added = addBulkServersToIndex(count);
const endTime = Date.now();
const duration = (endTime - startTime) / 1000;

// Display final server count
const afterCount = getServerCount();
console.log('');
console.log('================================');
console.log('Bulk Generation Summary');
console.log('================================');
console.log(`Added: ${added} servers`);
console.log(`Time: ${duration.toFixed(2)} seconds`);
console.log('Final server count:');
console.log(`Templates: ${afterCount.templates}`);
console.log(`Examples: ${afterCount.examples}`);
console.log(`Imported: ${afterCount.imported}`);
console.log(`Total: ${afterCount.total}`);
console.log('================================');