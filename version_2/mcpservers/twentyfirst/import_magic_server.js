/**
 * 21st.dev Magic MCP Server Importer
 * 
 * This utility helps import MCP servers from the 21st.dev Magic platform.
 * It downloads server definitions and creates local versions for customization.
 * 
 * Requirements:
 * - TWENTYFIRST_API_KEY environment variable must be set
 * - Node.js fetch or node-fetch package
 */

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// API endpoints
const MAGIC_API_BASE_URL = 'https://api.twentyfirst.dev';
const MAGIC_MCP_SERVERS_ENDPOINT = '/magic/mcp/servers';
const MAGIC_MCP_SERVER_ENDPOINT = '/magic/mcp/server';

// Check if the API key is set
if (!process.env.TWENTYFIRST_API_KEY) {
  console.error('Error: TWENTYFIRST_API_KEY environment variable is not set');
  console.error('Please set it in your .env file or environment variables');
  process.exit(1);
}

// Create the 21st directory if it doesn't exist
const outputDir = path.join(__dirname, 'imported');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Fetch available Magic MCP servers from 21st.dev
 */
async function fetchMagicMCPServers() {
  try {
    const response = await fetch(`${MAGIC_API_BASE_URL}${MAGIC_MCP_SERVERS_ENDPOINT}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TWENTYFIRST_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.servers || [];
  } catch (error) {
    console.error('Error fetching Magic MCP servers:', error.message);
    return [];
  }
}

/**
 * Fetch details for a specific Magic MCP server
 */
async function fetchMagicMCPServerDetails(serverId) {
  try {
    const response = await fetch(`${MAGIC_API_BASE_URL}${MAGIC_MCP_SERVER_ENDPOINT}/${serverId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TWENTYFIRST_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching details for server ${serverId}:`, error.message);
    return null;
  }
}

/**
 * Create a local JavaScript implementation of the MCP server
 */
function createLocalMCPServer(serverDetails, outputPath) {
  const { id, name, description, tools = [] } = serverDetails;
  
  // Generate the JavaScript code
  const code = `/**
 * 21st.dev Magic MCP Server: ${name}
 * 
 * Imported from 21st.dev Magic MCP server ID: ${id}
 * This is a local implementation that uses the same tools and functionality.
 * 
 * Original description: ${description}
 * 
 * Generated on: ${new Date().toISOString()}
 */

const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Create Express server
const app = express();
app.use(express.json());
app.use(cors());

// Check if the API key is set
if (!process.env.TWENTYFIRST_API_KEY) {
  console.error('Error: TWENTYFIRST_API_KEY environment variable is not set');
  console.error('Please set it in your .env file or environment variables');
  process.exit(1);
}

// 21st.dev Magic API settings
const MAGIC_API_BASE_URL = 'https://api.twentyfirst.dev';
const MAGIC_MCP_SERVER_ENDPOINT = '/magic/mcp/server';
const ORIGINAL_SERVER_ID = '${id}';

// MCP Protocol version
const MCP_PROTOCOL_VERSION = '0.1';

// Tool definitions (imported from 21st.dev Magic)
const TOOLS = ${JSON.stringify(tools, null, 2)};

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
  
  // Check parameter types
  for (const [param, value] of Object.entries(params)) {
    const paramSchema = schema.properties[param];
    
    if (!paramSchema) {
      errors.push(\`Unknown parameter: \${param}\`);
      continue;
    }
    
    // Type checking
    if (paramSchema.type === 'string' && typeof value !== 'string') {
      errors.push(\`Parameter \${param} must be a string\`);
    } else if (paramSchema.type === 'number' && typeof value !== 'number') {
      errors.push(\`Parameter \${param} must be a number\`);
    } else if (paramSchema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(\`Parameter \${param} must be a boolean\`);
    } else if (paramSchema.type === 'array' && !Array.isArray(value)) {
      errors.push(\`Parameter \${param} must be an array\`);
    } else if (paramSchema.type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
      errors.push(\`Parameter \${param} must be an object\`);
    }
    
    // Enum validation
    if (paramSchema.enum && !paramSchema.enum.includes(value)) {
      errors.push(\`Parameter \${param} must be one of: \${paramSchema.enum.join(', ')}\`);
    }
  }
  
  return errors;
}

/**
 * Proxy a request to the original 21st.dev Magic MCP server
 */
async function proxyToMagicServer(toolName, parameters) {
  try {
    const response = await fetch(\`\${MAGIC_API_BASE_URL}\${MAGIC_MCP_SERVER_ENDPOINT}/\${ORIGINAL_SERVER_ID}/run\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.TWENTYFIRST_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: toolName,
        parameters
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(\`HTTP error! Status: \${response.status}, \${errorText}\`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(\`Error calling Magic MCP server: \${error.message}\`);
  }
}

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
    
    // Proxy the request to the original 21st.dev Magic MCP server
    const result = await proxyToMagicServer(toolName, parameters);
    
    // Return successful response
    res.json(result);
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
    description: '${description}',
    original_id: '${id}',
    version: '1.0.0',
    protocol: 'mcp',
    protocol_version: MCP_PROTOCOL_VERSION,
    endpoints: {
      '/': 'This info page',
      '/mcp': 'MCP capabilities (GET) and tool execution (POST)'
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`21st.dev Magic MCP Server (${name}) running on port \${PORT}\`);
});
`;
  
  // Write the code to the output file
  fs.writeFileSync(outputPath, code);
  
  return {
    serverName: name,
    outputPath,
    toolCount: tools.length
  };
}

/**
 * Main function to import Magic MCP servers
 */
async function importMagicMCPServers() {
  console.log('Fetching available 21st.dev Magic MCP servers...');
  const servers = await fetchMagicMCPServers();
  
  if (servers.length === 0) {
    console.log('No Magic MCP servers found.');
    return;
  }
  
  console.log(`Found ${servers.length} Magic MCP servers:`);
  servers.forEach((server, index) => {
    console.log(`${index + 1}. ${server.name} (ID: ${server.id})`);
  });
  
  // Create an index file for the imported servers
  const importIndex = {
    importedAt: new Date().toISOString(),
    servers: []
  };
  
  // Import each server
  for (const server of servers) {
    console.log(`\nImporting server: ${server.name} (ID: ${server.id})...`);
    
    // Fetch detailed information
    const serverDetails = await fetchMagicMCPServerDetails(server.id);
    
    if (!serverDetails) {
      console.log(`Failed to fetch details for server: ${server.name}`);
      continue;
    }
    
    // Create a sanitized filename
    const sanitizedName = server.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    
    const outputPath = path.join(outputDir, `${sanitizedName}.js`);
    
    // Create the local implementation
    const result = createLocalMCPServer(serverDetails, outputPath);
    
    console.log(`Created local implementation: ${result.outputPath}`);
    console.log(`Server has ${result.toolCount} tools`);
    
    // Add to the index
    importIndex.servers.push({
      id: server.id,
      name: server.name,
      description: server.description || '',
      filename: path.basename(outputPath),
      toolCount: result.toolCount
    });
  }
  
  // Write the index file
  fs.writeFileSync(
    path.join(outputDir, 'import_index.json'),
    JSON.stringify(importIndex, null, 2)
  );
  
  console.log(`\nImported ${importIndex.servers.length} servers to ${outputDir}`);
  console.log(`Import index created at: ${path.join(outputDir, 'import_index.json')}`);
}

// Run the import if this file is executed directly
if (require.main === module) {
  importMagicMCPServers().catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });
}

module.exports = {
  fetchMagicMCPServers,
  fetchMagicMCPServerDetails,
  createLocalMCPServer,
  importMagicMCPServers
};