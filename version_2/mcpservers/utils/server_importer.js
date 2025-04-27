/**
 * MCP Server Importer
 * 
 * This utility facilitates importing and cataloging thousands of MCP servers from
 * various sources like GitHub repositories, Smithery.ai, and other collections.
 * 
 * Features:
 * - Automatically scan GitHub for MCP servers
 * - Import server metadata and descriptions
 * - Generate local server implementations
 * - Categorize servers by functionality
 * - Track server popularity and usage statistics
 */

const fs = require('fs-extra');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Configuration and paths
const SERVERS_ROOT = path.join(__dirname, '..');
const IMPORTS_DIR = path.join(SERVERS_ROOT, 'imported');
const GITHUB_IMPORTS_DIR = path.join(IMPORTS_DIR, 'github');
const SMITHERY_IMPORTS_DIR = path.join(IMPORTS_DIR, 'smithery');
const CUSTOM_IMPORTS_DIR = path.join(IMPORTS_DIR, 'custom');
const SERVER_INDEX_PATH = path.join(SERVERS_ROOT, 'server_index.json');
const CATEGORIES_FILE = path.join(SERVERS_ROOT, 'categories.json');

// Server categories based on Smithery's organization
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
  'document_tools'
];

// Initialize directories
function initializeDirectories() {
  // Create the main import directories
  fs.ensureDirSync(IMPORTS_DIR);
  fs.ensureDirSync(GITHUB_IMPORTS_DIR);
  fs.ensureDirSync(SMITHERY_IMPORTS_DIR);
  fs.ensureDirSync(CUSTOM_IMPORTS_DIR);
  
  // Create category subdirectories
  SERVER_CATEGORIES.forEach(category => {
    fs.ensureDirSync(path.join(GITHUB_IMPORTS_DIR, category));
    fs.ensureDirSync(path.join(SMITHERY_IMPORTS_DIR, category));
    fs.ensureDirSync(path.join(CUSTOM_IMPORTS_DIR, category));
  });
  
  // Initialize categories file if it doesn't exist
  if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeJsonSync(CATEGORIES_FILE, {
      categories: SERVER_CATEGORIES.map(category => ({
        id: category,
        name: formatCategoryName(category),
        description: `MCP servers for ${formatCategoryName(category).toLowerCase()}`,
        count: 0
      }))
    }, { spaces: 2 });
  }
  
  console.log('Directories initialized for server imports');
}

// Format category name for display (e.g., web_search -> Web Search)
function formatCategoryName(category) {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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

// Update category counts
function updateCategoryCounts() {
  const index = loadServerIndex();
  
  // Count servers by category
  const categoryCounts = {};
  SERVER_CATEGORIES.forEach(category => {
    categoryCounts[category] = 0;
  });
  
  // Count all servers
  const allServers = [
    ...index.templates,
    ...index.examples,
    ...(index.imported || [])
  ];
  
  allServers.forEach(server => {
    if (server.category && categoryCounts[server.category] !== undefined) {
      categoryCounts[server.category]++;
    }
  });
  
  // Update the categories file
  const categories = fs.readJsonSync(CATEGORIES_FILE);
  categories.categories = categories.categories.map(category => ({
    ...category,
    count: categoryCounts[category.id] || 0
  }));
  
  fs.writeJsonSync(CATEGORIES_FILE, categories, { spaces: 2 });
  console.log('Category counts updated');
}

/**
 * Search for MCP servers on GitHub
 * @param {Object} options Search options
 * @returns {Array} List of GitHub repositories containing MCP servers
 */
async function searchGitHubMCPServers(options = {}) {
  const {
    maxResults = 100,
    includeArchived = false,
    minStars = 0
  } = options;
  
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    // Search queries to find MCP servers
    const searchQueries = [
      'topic:mcp-server',
      'Model Context Protocol server',
      'MCP server Claude',
      'Model Context Protocol implementation',
      'MCP server implementation'
    ];
    
    const allResults = [];
    
    // Execute each search query
    for (const query of searchQueries) {
      const { data } = await octokit.search.repos({
        q: `${query} ${minStars > 0 ? `stars:>=${minStars}` : ''}`,
        sort: 'stars',
        order: 'desc',
        per_page: Math.min(100, maxResults)
      });
      
      // Add unique results
      data.items.forEach(repo => {
        if (!includeArchived && repo.archived) {
          return;
        }
        
        if (!allResults.some(r => r.id === repo.id)) {
          allResults.push({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            updated_at: repo.updated_at,
            language: repo.language,
            topics: repo.topics || [],
            owner: {
              login: repo.owner.login,
              avatar_url: repo.owner.avatar_url
            }
          });
        }
      });
      
      // Limit total results
      if (allResults.length >= maxResults) {
        break;
      }
    }
    
    return allResults.slice(0, maxResults);
  } catch (error) {
    console.error('Error searching GitHub:', error.message);
    return [];
  }
}

/**
 * Import a server from GitHub
 * @param {Object} repo GitHub repository data
 * @param {string} category Server category
 * @returns {Object} Imported server data
 */
async function importGitHubServer(repo, category) {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    // Get repository contents
    const { data: contents } = await octokit.repos.getContent({
      owner: repo.owner.login,
      repo: repo.name,
      path: ''
    });
    
    // Look for server file (usually server.js, index.js, app.js, or main.py)
    const serverFiles = contents.filter(file => 
      file.type === 'file' && 
      (file.name === 'server.js' || 
       file.name === 'index.js' || 
       file.name === 'app.js' || 
       file.name === 'main.py' ||
       file.name === 'server.py')
    );
    
    if (serverFiles.length === 0) {
      console.log(`No server file found for ${repo.full_name}`);
      return null;
    }
    
    // Get the server file content
    const serverFile = serverFiles[0];
    const { data: fileData } = await octokit.request(serverFile.download_url);
    
    // Determine language
    const language = serverFile.name.endsWith('.py') ? 'python' : 'javascript';
    
    // Create a sanitized name for the file
    const sanitizedName = repo.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    
    // Generate output path
    const outputDir = path.join(GITHUB_IMPORTS_DIR, category);
    const outputPath = path.join(outputDir, `${sanitizedName}.${language === 'python' ? 'py' : 'js'}`);
    
    // Write the file
    fs.writeFileSync(outputPath, fileData);
    
    // Parse tools from the file content (basic implementation)
    const tools = parseToolsFromServerFile(fileData, language);
    
    // Create server metadata
    const server = {
      id: `github_${repo.owner.login}_${sanitizedName}`,
      name: repo.name,
      description: repo.description || `MCP server imported from ${repo.full_name}`,
      language,
      path: path.relative(SERVERS_ROOT, outputPath),
      author: repo.owner.login,
      source: 'github',
      sourceUrl: repo.html_url,
      category,
      stars: repo.stars,
      updated_at: repo.updated_at,
      tools,
      tags: [...new Set([
        ...getTagsFromCategory(category),
        ...(repo.topics || []),
        language
      ])]
    };
    
    return server;
  } catch (error) {
    console.error(`Error importing GitHub server ${repo.full_name}:`, error.message);
    return null;
  }
}

/**
 * Parse tools from a server file (basic implementation)
 * This is a simplified parser - in a real implementation, you'd use AST parsing
 */
function parseToolsFromServerFile(fileContent, language) {
  const tools = [];
  
  if (language === 'javascript') {
    // Very basic tool extraction for JavaScript
    const toolRegex = /name:\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = toolRegex.exec(fileContent)) !== null) {
      tools.push(match[1]);
    }
  } else if (language === 'python') {
    // Very basic tool extraction for Python
    const toolRegex = /['"]name['"]:\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = toolRegex.exec(fileContent)) !== null) {
      tools.push(match[1]);
    }
  }
  
  return [...new Set(tools)]; // Remove duplicates
}

/**
 * Get tags from a category
 */
function getTagsFromCategory(category) {
  const tags = [];
  
  switch (category) {
    case 'web_search':
      tags.push('search', 'web', 'browsing');
      break;
    case 'memory_management':
      tags.push('memory', 'storage', 'persistence');
      break;
    case 'desktop_tools':
      tags.push('desktop', 'system', 'command');
      break;
    case 'thinking_reasoning':
      tags.push('thinking', 'reasoning', 'logic');
      break;
    case 'api_integration':
      tags.push('api', 'integration', 'service');
      break;
    case 'data_processing':
      tags.push('data', 'processing', 'analysis');
      break;
    default:
      tags.push(category);
  }
  
  return tags;
}

/**
 * Import servers from Smithery.ai
 * This is a conceptual implementation - in reality, you would need to scrape
 * or use an API to get this data, if available
 */
async function importSmitheryServers(options = {}) {
  const {
    maxResults = 100,
    category = null
  } = options;
  
  try {
    console.log('Importing servers from Smithery.ai...');
    console.log('Note: In a real implementation, this would use Smithery\'s API or web scraping');
    
    // This is where you would fetch data from Smithery.ai
    // For now, we'll simulate it with a mock function
    const smitheryServers = await mockFetchSmitheryServers(maxResults, category);
    
    const importedServers = [];
    
    for (const server of smitheryServers) {
      // Determine the category
      const serverCategory = server.category || categorizeServer(server);
      
      // Create a sanitized name for the file
      const sanitizedName = server.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      // Generate output path
      const outputDir = path.join(SMITHERY_IMPORTS_DIR, serverCategory);
      const outputPath = path.join(outputDir, `${sanitizedName}.${server.language === 'python' ? 'py' : 'js'}`);
      
      // Generate a local implementation
      const serverContent = generateServerImplementation(server);
      
      // Write the file
      fs.writeFileSync(outputPath, serverContent);
      
      // Create server metadata
      const importedServer = {
        id: `smithery_${sanitizedName}`,
        name: server.name,
        description: server.description || `MCP server imported from Smithery.ai`,
        language: server.language || 'javascript',
        path: path.relative(SERVERS_ROOT, outputPath),
        author: server.author || 'Smithery.ai',
        source: 'smithery',
        category: serverCategory,
        tools: server.tools || [],
        tags: [...new Set([
          ...getTagsFromCategory(serverCategory),
          ...(server.tags || []),
          server.language || 'javascript'
        ])]
      };
      
      importedServers.push(importedServer);
    }
    
    return importedServers;
  } catch (error) {
    console.error('Error importing Smithery servers:', error.message);
    return [];
  }
}

/**
 * Mock function to simulate fetching servers from Smithery.ai
 * In a real implementation, this would be replaced with actual API calls or web scraping
 */
async function mockFetchSmitheryServers(maxResults, category) {
  // This is just a mock implementation for demonstration
  const servers = [];
  
  // Sample server categories
  const categories = [
    'web_search',
    'memory_management',
    'desktop_tools',
    'thinking_reasoning',
    'api_integration',
    'data_processing'
  ];
  
  // Generate mock servers
  for (let i = 1; i <= maxResults; i++) {
    const serverCategory = category || categories[Math.floor(Math.random() * categories.length)];
    const language = Math.random() > 0.3 ? 'javascript' : 'python';
    
    servers.push({
      name: `${serverCategory}_server_${i}`,
      description: `A ${serverCategory.replace('_', ' ')} MCP server`,
      language,
      category: serverCategory,
      author: `smithery_user_${Math.floor(Math.random() * 100)}`,
      tools: [`${serverCategory}_tool_${i}_1`, `${serverCategory}_tool_${i}_2`],
      tags: [serverCategory, language]
    });
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return servers;
}

/**
 * Categorize a server based on its description and tools
 */
function categorizeServer(server) {
  // This is a simple categorization heuristic
  // In a real implementation, this would be more sophisticated
  
  const description = (server.description || '').toLowerCase();
  const name = (server.name || '').toLowerCase();
  const tools = server.tools || [];
  
  // Check for category indicators in name, description and tools
  if (description.includes('search') || name.includes('search') || tools.some(t => t.includes('search'))) {
    return 'web_search';
  }
  
  if (description.includes('memory') || name.includes('memory') || tools.some(t => t.includes('memory'))) {
    return 'memory_management';
  }
  
  if (description.includes('desktop') || name.includes('desktop') || tools.some(t => t.includes('desktop'))) {
    return 'desktop_tools';
  }
  
  if (description.includes('reasoning') || name.includes('reasoning') || tools.some(t => t.includes('reasoning'))) {
    return 'thinking_reasoning';
  }
  
  if (description.includes('api') || name.includes('api') || tools.some(t => t.includes('api'))) {
    return 'api_integration';
  }
  
  if (description.includes('data') || name.includes('data') || tools.some(t => t.includes('data'))) {
    return 'data_processing';
  }
  
  // Default category
  return 'utilities';
}

/**
 * Generate a server implementation based on server metadata
 */
function generateServerImplementation(server) {
  const language = server.language || 'javascript';
  const tools = server.tools || [];
  
  if (language === 'javascript') {
    return generateJavaScriptServer(server.name, server.description, tools);
  } else if (language === 'python') {
    return generatePythonServer(server.name, server.description, tools);
  }
  
  return '';
}

/**
 * Generate a JavaScript server implementation
 */
function generateJavaScriptServer(name, description, tools) {
  const toolDefinitions = tools.map(tool => `
  {
    name: '${tool}',
    description: 'Tool for ${tool.replace(/_/g, ' ')}',
    parameters: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Input for the tool'
        }
      },
      required: ['input']
    }
  }`).join(',');
  
  return `/**
 * ${name}
 * 
 * ${description || 'An MCP server implementation'}
 * 
 * This is an auto-generated implementation based on server metadata.
 * In a real scenario, this would be the actual implementation from the source.
 */

const express = require('express');
const cors = require('cors');

// Create Express server
const app = express();
app.use(express.json());
app.use(cors());

// MCP Protocol version
const MCP_PROTOCOL_VERSION = '0.1';

// Available tools
const TOOLS = [${toolDefinitions}
];

/**
 * Helper function to validate parameters against a tool's schema
 */
function validateParameters(tool, params) {
  const schema = tool.parameters;
  const errors = [];
  
  // Check required parameters
  for (const required of schema.required || []) {
    if (params[required] === undefined) {
      errors.push(\`Missing required parameter: \${required}\`);
    }
  }
  
  return errors;
}

// Tool implementations
${tools.map(tool => `
async function handle_${tool}(parameters) {
  // This is a placeholder implementation
  return {
    result: \`Processed \${parameters.input} with ${tool}\`
  };
}`).join('\n')}

// MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    const requestData = req.body;
    
    // Validate MCP request format
    if (!requestData || !requestData.tool || !requestData.parameters) {
      return res.status(400).json({
        error: 'Invalid MCP request format'
      });
    }
    
    const { tool: toolName, parameters } = requestData;
    
    // Find the requested tool
    const tool = TOOLS.find(t => t.name === toolName);
    
    if (!tool) {
      return res.status(404).json({
        error: \`Tool not found: \${toolName}\`
      });
    }
    
    // Validate parameters
    const validationErrors = validateParameters(tool, parameters);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Parameter validation failed',
        details: validationErrors
      });
    }
    
    // Execute the appropriate tool
    let result;
    
    switch (toolName) {
      ${tools.map(tool => `case '${tool}':
        result = await handle_${tool}(parameters);
        break;`).join('\n      ')}
        
      default:
        return res.status(500).json({
          error: \`Tool implementation missing: \${toolName}\`
        });
    }
    
    // Return successful response
    res.json({
      tool: toolName,
      result
    });
  } catch (error) {
    console.error('MCP request error:', error);
    
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// MCP capabilities endpoint
app.get('/mcp', (req, res) => {
  res.json({
    protocol: 'mcp',
    version: MCP_PROTOCOL_VERSION,
    tools: TOOLS
  });
});

// Root endpoint for info
app.get('/', (req, res) => {
  res.json({
    name: '${name}',
    description: '${description || 'An MCP server implementation'}',
    version: '1.0.0',
    protocol: 'mcp',
    protocol_version: MCP_PROTOCOL_VERSION,
    tools: TOOLS.map(t => t.name)
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`${name} running on port \${PORT}\`);
});
`;
}

/**
 * Generate a Python server implementation
 */
function generatePythonServer(name, description, tools) {
  const toolDefinitions = tools.map(tool => `
    {
        "name": "${tool}",
        "description": "Tool for ${tool.replace(/_/g, ' ')}",
        "parameters": {
            "type": "object",
            "properties": {
                "input": {
                    "type": "string",
                    "description": "Input for the tool"
                }
            },
            "required": ["input"]
        }
    }`).join(',');
  
  return `"""
${name}

${description || 'An MCP server implementation'}

This is an auto-generated implementation based on server metadata.
In a real scenario, this would be the actual implementation from the source.
"""

from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)

# MCP Protocol version
MCP_PROTOCOL_VERSION = "0.1"

# Available tools
TOOLS = [${toolDefinitions}
]

def validate_parameters(tool, params):
    """Helper function to validate parameters against a tool's schema"""
    schema = tool["parameters"]
    errors = []
    
    # Check required parameters
    for required in schema.get("required", []):
        if required not in params:
            errors.append(f"Missing required parameter: {required}")
    
    return errors

${tools.map(tool => `
async def handle_${tool.replace(/[^a-z0-9_]/gi, '_')}(parameters):
    """Implementation for ${tool}"""
    # This is a placeholder implementation
    return {
        "result": f"Processed {parameters['input']} with ${tool}"
    }`).join('\n')}

@app.route("/mcp", methods=["GET", "POST"])
def mcp_endpoint():
    if request.method == "GET":
        # Return MCP capabilities
        return jsonify({
            "protocol": "mcp",
            "version": MCP_PROTOCOL_VERSION,
            "tools": TOOLS
        })
    
    # Handle MCP request
    try:
        request_data = request.json
        
        # Validate MCP request format
        if not request_data or "tool" not in request_data or "parameters" not in request_data:
            return jsonify({
                "error": "Invalid MCP request format"
            }), 400
        
        tool_name = request_data["tool"]
        parameters = request_data["parameters"]
        
        # Find the requested tool
        tool = next((t for t in TOOLS if t["name"] == tool_name), None)
        
        if not tool:
            return jsonify({
                "error": f"Tool not found: {tool_name}"
            }), 404
        
        # Validate parameters
        validation_errors = validate_parameters(tool, parameters)
        
        if validation_errors:
            return jsonify({
                "error": "Parameter validation failed",
                "details": validation_errors
            }), 400
        
        # Execute the appropriate tool
        result = None
        
        ${tools.map(tool => `if tool_name == "${tool}":
            result = await handle_${tool.replace(/[^a-z0-9_]/gi, '_')}(parameters)
        `).join('el')}
        else:
            return jsonify({
                "error": f"Tool implementation missing: {tool_name}"
            }), 500
        
        # Return successful response
        return jsonify({
            "tool": tool_name,
            "result": result
        })
    
    except Exception as error:
        print(f"MCP request error: {error}")
        
        return jsonify({
            "error": str(error) or "Internal server error"
        }), 500

@app.route("/")
def info():
    """Root endpoint for info"""
    return jsonify({
        "name": "${name}",
        "description": "${description || 'An MCP server implementation'}",
        "version": "1.0.0",
        "protocol": "mcp",
        "protocol_version": MCP_PROTOCOL_VERSION,
        "tools": [t["name"] for t in TOOLS]
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
`;
}

/**
 * Import multiple servers from GitHub
 */
async function importMultipleGitHubServers(options = {}) {
  const {
    maxResults = 100,
    minStars = 0,
    category = null
  } = options;
  
  // Search for MCP servers on GitHub
  const repos = await searchGitHubMCPServers({
    maxResults,
    minStars
  });
  
  console.log(`Found ${repos.length} repositories on GitHub`);
  
  const importedServers = [];
  
  // Import each repository
  for (const repo of repos) {
    const serverCategory = category || categorizeGitHubRepo(repo);
    
    console.log(`Importing ${repo.full_name} (Category: ${serverCategory})...`);
    
    const server = await importGitHubServer(repo, serverCategory);
    
    if (server) {
      importedServers.push(server);
      console.log(`Successfully imported ${repo.full_name}`);
    }
  }
  
  return importedServers;
}

/**
 * Categorize a GitHub repository
 */
function categorizeGitHubRepo(repo) {
  // Check topics first
  const topics = repo.topics || [];
  
  if (topics.includes('search') || topics.includes('web-search')) {
    return 'web_search';
  }
  
  if (topics.includes('memory') || topics.includes('memory-management')) {
    return 'memory_management';
  }
  
  if (topics.includes('desktop') || topics.includes('system-tools')) {
    return 'desktop_tools';
  }
  
  if (topics.includes('thinking') || topics.includes('reasoning')) {
    return 'thinking_reasoning';
  }
  
  if (topics.includes('api') || topics.includes('integration')) {
    return 'api_integration';
  }
  
  // Check description if no topics match
  return categorizeServer({
    name: repo.name,
    description: repo.description || '',
    tools: []
  });
}

/**
 * Update server index with imported servers
 */
function updateServerIndex(importedServers) {
  const index = loadServerIndex();
  
  // Create imported array if it doesn't exist
  if (!index.imported) {
    index.imported = [];
  }
  
  // Add or update imported servers
  importedServers.forEach(server => {
    const existingIndex = index.imported.findIndex(s => s.id === server.id);
    
    if (existingIndex >= 0) {
      index.imported[existingIndex] = server;
    } else {
      index.imported.push(server);
    }
  });
  
  saveServerIndex(index);
  updateCategoryCounts();
  
  console.log(`Server index updated with ${importedServers.length} imported servers`);
}

/**
 * Import a large number of servers from multiple sources
 */
async function importBulkServers(options = {}) {
  const {
    githubCount = 500,
    smitheryCount = 500,
    customCount = 1000,
    minStars = 0
  } = options;
  
  console.log('Starting bulk server import...');
  
  // Initialize directories
  initializeDirectories();
  
  // Import from GitHub
  console.log(`Importing up to ${githubCount} servers from GitHub...`);
  const githubServers = await importMultipleGitHubServers({
    maxResults: githubCount,
    minStars
  });
  
  // Import from Smithery
  console.log(`Importing up to ${smitheryCount} servers from Smithery.ai...`);
  const smitheryServers = await importSmitheryServers({
    maxResults: smitheryCount
  });
  
  // Import custom servers (this would be implemented based on your specific needs)
  console.log(`Generating ${customCount} custom servers...`);
  const customServers = await generateCustomServers(customCount);
  
  // Combine all servers
  const allServers = [
    ...githubServers,
    ...smitheryServers,
    ...customServers
  ];
  
  // Update the server index
  updateServerIndex(allServers);
  
  console.log('Bulk import completed successfully');
  console.log(`Total servers imported: ${allServers.length}`);
  console.log(`  - From GitHub: ${githubServers.length}`);
  console.log(`  - From Smithery: ${smitheryServers.length}`);
  console.log(`  - Custom: ${customServers.length}`);
  
  return allServers;
}

/**
 * Generate custom servers to fill out the collection
 * This is for demonstration purposes - in a real implementation, you would
 * generate these based on specific requirements
 */
async function generateCustomServers(count) {
  const servers = [];
  
  // Generate servers for each category
  for (const category of SERVER_CATEGORIES) {
    // Generate servers proportionally
    const categoryCount = Math.floor(count / SERVER_CATEGORIES.length);
    
    for (let i = 1; i <= categoryCount; i++) {
      const language = Math.random() > 0.3 ? 'javascript' : 'python';
      const serverName = `${category}_server_${i}`;
      
      // Generate tools for this server
      const toolCount = 2 + Math.floor(Math.random() * 4); // 2-5 tools
      const tools = Array.from({ length: toolCount }, (_, j) => `${category}_tool_${i}_${j + 1}`);
      
      // Create a sanitized name for the file
      const sanitizedName = serverName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      // Generate output path
      const outputDir = path.join(CUSTOM_IMPORTS_DIR, category);
      const outputPath = path.join(outputDir, `${sanitizedName}.${language === 'python' ? 'py' : 'js'}`);
      
      // Generate a server implementation
      const serverContent = generateServerImplementation({
        name: serverName,
        description: `A custom ${category.replace('_', ' ')} MCP server`,
        language,
        tools
      });
      
      // Write the file
      fs.writeFileSync(outputPath, serverContent);
      
      // Create server metadata
      servers.push({
        id: `custom_${sanitizedName}`,
        name: serverName,
        description: `A custom ${category.replace('_', ' ')} MCP server`,
        language,
        path: path.relative(SERVERS_ROOT, outputPath),
        author: 'MCP Server Builder',
        source: 'custom',
        category,
        tools,
        tags: [...new Set([
          ...getTagsFromCategory(category),
          language
        ])]
      });
    }
  }
  
  return servers;
}

// Export the functions
module.exports = {
  initializeDirectories,
  loadServerIndex,
  saveServerIndex,
  updateCategoryCounts,
  searchGitHubMCPServers,
  importGitHubServer,
  importMultipleGitHubServers,
  importSmitheryServers,
  updateServerIndex,
  importBulkServers,
  SERVER_CATEGORIES
};