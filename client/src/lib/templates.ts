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

# Initialize the MCP server
server = MCPServer()

# Define tools
${tools.map(tool => `
@server.tool()
async def ${tool.name.replace(/\s+/g, '_').toLowerCase()}(${formatParameters(tool.parameters, 'python')}) -> Dict[str, Any]:
    """${tool.description}"""
    # TODO: Implement tool functionality
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

### Installation

#### For TypeScript server:
1. Install dependencies:
   \`\`\`
   npm install
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
3. Start the server:
   \`\`\`
   python server.py
   \`\`\`

### Connect to Claude Desktop

1. Open Claude Desktop
2. Go to settings and add a new MCP server
3. Set the server type to "command"
4. For the command, use:
   - TypeScript: \`node /path/to/server.js\`
   - Python: \`python /path/to/server.py\`
5. Save and connect to your MCP server
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
