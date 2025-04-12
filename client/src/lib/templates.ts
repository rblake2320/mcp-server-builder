import { ServerConfig, Tool, Parameter } from '@/types';

// Helper function to format parameters based on server type
const formatParameters = (parameters: Parameter[], serverType: 'python' | 'typescript'): string => {
  if (serverType === 'python') {
    return parameters.map(p => {
      let paramType = 'str';
      if (p.type === 'number') paramType = 'int';
      else if (p.type === 'boolean') paramType = 'bool';
      else if (p.type === 'array') paramType = 'List[Any]';
      else if (p.type === 'object') paramType = 'Dict[str, Any]';
      
      return `${p.name.replace(/\s+/g, '_').toLowerCase()}: ${paramType}`;
    }).join(', ');
  } else {
    // TypeScript parameters format
    return parameters.map(p => p.name.replace(/\s+/g, '_').toLowerCase()).join(', ');
  }
};

// Format parameter declarations for TypeScript
const formatTSParameters = (parameters: Parameter[]): string => {
  return parameters.map(p => `${p.name.replace(/\s+/g, '_').toLowerCase()}: {
      type: "${p.type}",
      description: "${p.description}"
    }`).join(',\n    ');
};

export const pythonTemplate = (serverConfig: ServerConfig): string => {
  const { serverName, description, tools } = serverConfig;
  
  return `
from typing import Dict, List, Union, Optional, Any
from mcp.server import MCPServer, Tool, Resources
import os
import json
import requests  # You may need to install this: pip install requests

# Initialize the MCP server
server = MCPServer()

# Define tools
${tools.map(tool => `
@server.tool()
async def ${tool.name.replace(/\s+/g, '_').toLowerCase()}(${formatParameters(tool.parameters, 'python')}) -> Dict[str, Any]:
    """${tool.description}"""
    # TODO: Implement tool functionality
    
    # IMPLEMENTATION HINTS:
    # 1. For API calls:
    # response = requests.get(f"https://api.example.com/data?param={param_name}")
    # return {"result": response.json()}
    
    # 2. For file operations:
    # with open("data.json", "r") as f:
    #     data = json.load(f)
    # return {"result": data}
    
    # 3. For database queries (using SQLite as example):
    # import sqlite3
    # conn = sqlite3.connect("database.db")
    # cursor = conn.cursor()
    # cursor.execute("SELECT * FROM table WHERE column = ?", (param_value,))
    # results = cursor.fetchall()
    # return {"result": results}
    
    # Example implementation (replace with your actual logic):
    return {"result": f"${tool.name} executed with parameters: ${tool.parameters.map(p => '{' + p.name.replace(/\s+/g, '_').toLowerCase() + '}').join(', ')}"}
`).join('\n')}

# Start the server
if __name__ == "__main__":
    server.start()
`;
};

export const typescriptTemplate = (serverConfig: ServerConfig): string => {
  const { serverName, description, tools } = serverConfig;
  
  return `
import { MCPServer, Tool } from '@modelcontextprotocol/mcp';
import * as fs from 'fs';
import * as path from 'path';
// For API calls, uncomment: import axios from 'axios'; // You may need to install: npm install axios

// Initialize the MCP server
const server = new MCPServer();

// Define tools
${tools.map(tool => `
server.registerTool({
  name: "${tool.name.replace(/\s+/g, '_').toLowerCase()}",
  description: "${tool.description}",
  parameters: {
    ${formatTSParameters(tool.parameters)}
  },
  handler: async ({${formatParameters(tool.parameters, 'typescript')}}) => {
    // TODO: Implement tool functionality
    
    /* IMPLEMENTATION HINTS:
    
    // 1. For API calls (using axios):
    // import axios from 'axios';
    // const response = await axios.get(\`https://api.example.com/data?param=\${paramName}\`);
    // return { result: response.data };
    
    // 2. For file operations:
    // const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    // return { result: data };
    
    // 3. For database operations (using SQLite as example):
    // import * as sqlite3 from 'sqlite3';
    // const db = new sqlite3.Database('./database.db');
    // const results = await new Promise((resolve, reject) => {
    //   db.all("SELECT * FROM table WHERE column = ?", [paramValue], (err, rows) => {
    //     if (err) reject(err);
    //     else resolve(rows);
    //   });
    // });
    // return { result: results };
    
    */
    
    // Example implementation (replace with your actual logic):
    return {
      result: \`${tool.name} executed with parameters: ${tool.parameters.map(p => '\${' + p.name.replace(/\s+/g, '_').toLowerCase() + '}').join(', ')}\`
    };
  }
});
`).join('\n')}

// Start the server
server.start().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});
`;
};

export const readmeTemplate = (serverName: string, description: string): string => {
  return `
# ${serverName} MCP Server

${description}

## Setup Instructions

### Prerequisites
- Node.js 18+ or Python 3.8+ (depending on the server type you chose)
- Claude Desktop application (for using the MCP server with Claude)

### Installation

#### For TypeScript server:
1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
   
   Note: If you plan to make API calls, you may need additional packages:
   \`\`\`
   npm install axios
   \`\`\`
   
2. Start the server:
   \`\`\`
   npm start
   \`\`\`

#### For Python server:
1. Create a virtual environment:
   \`\`\`
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`
   
2. Install dependencies:
   \`\`\`
   pip install mcp-client-sdk
   \`\`\`
   
   Note: If you plan to make API calls, you may need additional packages:
   \`\`\`
   pip install requests
   \`\`\`
   
3. Start the server:
   \`\`\`
   python server.py
   \`\`\`

### Connect to Claude Desktop

1. Open Claude Desktop
2. Go to Settings and navigate to the MCP section
3. Click "Add Server"
4. Configure the server:
   - Name: Enter a descriptive name for your server
   - Type: Select "command"
   - Command: Enter the full path to run your server
     - For TypeScript: \`node /full/path/to/server.js\`
     - For Python: \`python /full/path/to/server.py\`
     - Tip: Use absolute paths to avoid issues
5. Save the configuration
6. Restart Claude Desktop if necessary
7. You can now use your custom tools in conversations with Claude

## Customizing Your Server

This server is pre-configured with tool definitions, but you'll need to implement the actual tool functionality:

1. Locate the tool functions in the server code
2. Replace the example implementations with your actual code
3. Refer to the implementation hints in the comments for guidance
4. Test your server with Claude to ensure it works as expected

## Troubleshooting

- If Claude can't connect to your server, check that:
  - The server is running (you should see it in your terminal)
  - The command path in Claude Desktop settings is correct
  - You've restarted Claude Desktop after adding the server
  
- If a tool isn't working correctly:
  - Check the server console for error messages
  - Verify the tool implementation code
  - Make sure any external services or APIs are accessible

## Need Help?

- MCP Protocol Documentation: https://modelcontextprotocol.ai
- Claude Documentation: https://docs.anthropic.com
- MCP Server Community: https://discord.gg/mcp-protocol

## License

This MCP server is provided for your use and modification. Feel free to customize it to suit your needs.
`;
};

export const dockerfileTemplate = (): string => {
  return `
# Choose base image based on server type
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port if needed
# EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
`;
};

export const installScriptTemplate = (serverType: 'python' | 'typescript'): string => {
  if (serverType === 'python') {
    return `
#!/bin/bash
# Installation script for Python MCP server

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows, use: venv\\Scripts\\activate

# Install required dependencies
pip install mcp-client-sdk

echo "Installation complete! To start the server:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the server: python server.py"
`;
  } else {
    return `
#!/bin/bash
# Installation script for TypeScript MCP server

# Install dependencies
npm install

echo "Installation complete! To start the server:"
echo "npm start"
`;
  }
};

export const packageJsonTemplate = (serverName: string, description: string): string => {
  const formattedName = serverName.toLowerCase().replace(/\s+/g, '-');
  
  return `{
  "name": "${formattedName}",
  "version": "1.0.0",
  "description": "${description}",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/mcp": "^0.4.0"
  }
}`;
};
