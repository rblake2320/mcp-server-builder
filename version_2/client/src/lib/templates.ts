import { ServerConfig, Tool, Parameter } from '@/types';

// MCP protocol version tracking
export const MCP_PROTOCOL_VERSION = "1.2.0";
export const MCP_SDK_VERSION = {
  python: "0.6.0",
  typescript: "0.4.0"
};

// Validation info
export const VALIDATION_INFO = {
  protocol: MCP_PROTOCOL_VERSION,
  lastVerified: "2025-04-12",
  compatibleWith: {
    claude: ["Claude Desktop 3.0+", "Claude Web API 3.0+"],
    otherLLMs: ["GPT-4 with MCP adapters", "Anthropic API with MCP SDK"]
  }
};

// Helper function to convert from our Parameter type to language-specific types
const getParamType = (paramType: Parameter['type'], language: 'python' | 'typescript'): string => {
  if (language === 'python') {
    switch (paramType) {
      case 'number':
      case 'integer': 
        return 'int';
      case 'boolean': 
        return 'bool';
      case 'array': 
        return 'List[Any]';
      case 'object': 
        return 'Dict[str, Any]';
      case 'date': 
        return 'datetime.date';
      case 'email':
      case 'url':
      case 'enum':
      case 'string':
      default:
        return 'str';
    }
  } else {
    // TypeScript type mapping
    switch (paramType) {
      case 'number':
      case 'integer': 
        return 'number';
      case 'boolean': 
        return 'boolean';
      case 'array': 
        return 'any[]';
      case 'object': 
        return 'Record<string, any>';
      case 'date': 
        return 'Date';
      case 'email':
      case 'url':
      case 'enum':
      case 'string':
      default:
        return 'string';
    }
  }
};

// Generate constraint validators for Python (Pydantic)
const getPythonConstraints = (param: Parameter): string => {
  if (!param.constraints) return '';
  
  const constraints: string[] = [];
  const c = param.constraints;
  
  // Add constraint validators based on parameter type
  switch (param.type) {
    case 'string':
    case 'email':
    case 'url':
      if (c.minLength !== undefined) constraints.push(`min_length=${c.minLength}`);
      if (c.maxLength !== undefined) constraints.push(`max_length=${c.maxLength}`);
      if (c.pattern) constraints.push(`regex="${c.pattern}"`);
      
      // Add format validators
      if (param.type === 'email') constraints.push(`regex="^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$"`);
      if (param.type === 'url') constraints.push(`regex="^https?://[^\\s/$.?#].[^\\s]*$"`);
      break;
      
    case 'number':
    case 'integer':
      if (c.minimum !== undefined) constraints.push(`ge=${c.minimum}`);
      if (c.maximum !== undefined) constraints.push(`le=${c.maximum}`);
      break;
      
    case 'enum':
      if (c.enum && c.enum.length > 0) {
        const enumValues = c.enum.map(v => `"${v}"`).join(', ');
        return `, Literal[${enumValues}]`;
      }
      break;
  }
  
  // Add default value if specified
  if (c.default !== undefined) {
    if (typeof c.default === 'string') {
      constraints.push(`default="${c.default}"`);
    } else {
      constraints.push(`default=${c.default}`);
    }
  }
  
  return constraints.length ? `, ${constraints.join(', ')}` : '';
};

// Generate constraint validators for TypeScript (Zod)
const getZodConstraints = (param: Parameter): string => {
  if (!param.constraints) return '';
  
  const constraints: string[] = [];
  const c = param.constraints;
  
  // Add Zod validators based on parameter type and constraints
  switch (param.type) {
    case 'string':
    case 'email':
    case 'url':
      if (c.minLength !== undefined) constraints.push(`.min(${c.minLength})`);
      if (c.maxLength !== undefined) constraints.push(`.max(${c.maxLength})`);
      if (c.pattern) constraints.push(`.regex(/${c.pattern}/)`);
      
      // Add format-specific validators
      if (param.type === 'email') constraints.push(`.email()`);
      if (param.type === 'url') constraints.push(`.url()`);
      break;
      
    case 'number':
    case 'integer':
      if (param.type === 'integer') constraints.push(`.int()`);
      if (c.minimum !== undefined) constraints.push(`.gte(${c.minimum})`);
      if (c.maximum !== undefined) constraints.push(`.lte(${c.maximum})`);
      break;
      
    case 'enum':
      if (c.enum && c.enum.length > 0) {
        const enumValues = c.enum.map(v => `"${v}"`).join(', ');
        return `.enum([${enumValues}])`;
      }
      break;
  }
  
  // Add default value if provided
  if (c.default !== undefined) {
    if (typeof c.default === 'string') {
      constraints.push(`.default("${c.default}")`);
    } else {
      constraints.push(`.default(${c.default})`);
    }
  }
  
  return constraints.join('');
};

// Helper function to format parameters based on server type
const formatParameters = (parameters: Parameter[], serverType: 'python' | 'typescript'): string => {
  if (serverType === 'python') {
    return parameters.map(p => {
      const paramType = getParamType(p.type, 'python');
      return `${p.name.replace(/\s+/g, '_').toLowerCase()}: ${paramType}`;
    }).join(', ');
  } else {
    // TypeScript parameters format
    return parameters.map(p => p.name.replace(/\s+/g, '_').toLowerCase()).join(', ');
  }
};

// Format parameter declarations for TypeScript
const formatTSParameters = (parameters: Parameter[]): string => {
  return parameters.map(p => {
    // Base type definition
    const baseType = `${p.name.replace(/\s+/g, '_').toLowerCase()}: {
      type: "${p.type}",
      description: "${p.description}"`;
    
    // Add additional constraints if they exist
    const additionalProps = [];
    
    if (p.constraints) {
      const c = p.constraints;
      if (c.required) {
        additionalProps.push(`required: true`);
      }
      
      // Add appropriate constraints based on type
      switch (p.type) {
        case 'string':
        case 'email':
        case 'url':
          if (c.minLength !== undefined) additionalProps.push(`minLength: ${c.minLength}`);
          if (c.maxLength !== undefined) additionalProps.push(`maxLength: ${c.maxLength}`);
          if (c.pattern) additionalProps.push(`pattern: "${c.pattern}"`);
          break;
          
        case 'number':
        case 'integer':
          if (c.minimum !== undefined) additionalProps.push(`minimum: ${c.minimum}`);
          if (c.maximum !== undefined) additionalProps.push(`maximum: ${c.maximum}`);
          break;
          
        case 'enum':
          if (c.enum && c.enum.length > 0) {
            const enumValues = c.enum.map(v => `"${v}"`).join(', ');
            additionalProps.push(`enum: [${enumValues}]`);
          }
          break;
      }
      
      // Add default value if provided
      if (c.default !== undefined) {
        if (typeof c.default === 'string') {
          additionalProps.push(`default: "${c.default}"`);
        } else {
          additionalProps.push(`default: ${c.default}`);
        }
      }
    }
    
    // If we have additional properties, add them
    if (additionalProps.length > 0) {
      return `${baseType},
      ${additionalProps.join(',\n      ')}
    }`;
    }
    
    // Otherwise just return the base definition
    return `${baseType}
    }`;
  }).join(',\n    ');
};

export const pythonTemplate = (serverConfig: ServerConfig): string => {
  const { serverName, description, tools } = serverConfig;
  
  return `
from typing import Dict, List, Union, Optional, Any
from mcp.server import MCPServer, Tool, Resources
from pydantic import BaseModel, Field, validator  # You may need to install this: pip install pydantic
import os
import json
import asyncio
import requests  # You may need to install this: pip install requests

# Initialize the MCP server with security options
server = MCPServer(
    name="${serverName}",
    description="${description}",
    # Uncomment to enable authentication
    # auth_config={
    #     "api_keys": ["your-secret-key"],  # Replace with actual API keys or use environment variables
    # }
)

${tools.map(tool => {
  // Create parameter models for validation
  const hasParams = tool.parameters && tool.parameters.length > 0;
  const paramModelName = `${tool.name.replace(/\s+/g, '_').toLowerCase()}_params`;
  
  let paramModel = '';
  if (hasParams) {
    // Need to check if we need to import Literal type for enums
    const hasEnum = tool.parameters.some(p => p.type === 'enum' && p.constraints?.enum);
    const hasDate = tool.parameters.some(p => p.type === 'date');
    
    // Add special import for date and enum if needed
    const specialImports = [];
    if (hasEnum) specialImports.push('from typing import Literal');
    if (hasDate) specialImports.push('import datetime');
    
    paramModel = `${specialImports.length ? specialImports.join('\n') : ''}
# Parameter validation model for ${tool.name}
class ${paramModelName}(BaseModel):
    ${tool.parameters.map(p => {
      const paramType = getParamType(p.type, 'python');
      // Generate constraints for Pydantic
      const constraints = getPythonConstraints(p);
      
      return `${p.name.replace(/\s+/g, '_').toLowerCase()}: ${paramType} = Field(description="${p.description}"${constraints})`;
    }).join('\n    ')}
    
    # Add custom validation if needed
    # @validator("field_name")
    # def validate_field(cls, v):
    #     if not valid_condition:
    #         raise ValueError("Validation error message")
    #     return v
`;
  }
  
  return `${paramModel}
@server.tool()
async def ${tool.name.replace(/\s+/g, '_').toLowerCase()}(${formatParameters(tool.parameters, 'python')}) -> Dict[str, Any]:
    """${tool.description}"""
    # Validate parameters
${hasParams ? `    params = ${paramModelName}(
        ${tool.parameters.map(p => `${p.name.replace(/\s+/g, '_').toLowerCase()}=${p.name.replace(/\s+/g, '_').toLowerCase()}`).join(',\n        ')}
    )` : '    # No parameters to validate'}
    
    # TODO: Implement tool functionality
    
    # IMPLEMENTATION HINTS:
    # 1. For API calls:
    # async with aiohttp.ClientSession() as session:
    #     async with session.get(f"https://api.example.com/data?param={param_name}") as response:
    #         data = await response.json()
    #         return {"result": data}
    
    # 2. For file operations:
    # with open("data.json", "r") as f:
    #     data = json.load(f)
    # return {"result": data}
    
    # 3. For database queries (using SQLite as example):
    # import aiosqlite
    # async with aiosqlite.connect("database.db") as db:
    #     cursor = await db.execute("SELECT * FROM table WHERE column = ?", (param_value,))
    #     results = await cursor.fetchall()
    #     return {"result": results}
    
    # Example implementation (replace with your actual logic):
    return {"result": f"${tool.name} executed with parameters: ${tool.parameters.map(p => '{' + p.name.replace(/\s+/g, '_').toLowerCase() + '}').join(', ')}"}`;
}).join('\n')}

# Add middleware if needed (e.g., for logging, auth, etc.)
# @server.middleware
# async def log_request(context, next):
#     print(f"Request: {context.request}")
#     result = await next()
#     print(f"Response: {result}")
#     return result

# Start the server
if __name__ == "__main__":
    server.start()
`;
};

export const typescriptTemplate = (serverConfig: ServerConfig): string => {
  const { serverName, description, tools } = serverConfig;
  
  return `
import { MCPServer, Tool, ToolParameter } from '@modelcontextprotocol/mcp';
import { z } from 'zod';  // You may need to install this: npm install zod
import * as fs from 'fs';
import * as path from 'path';
// For API calls, uncomment: import axios from 'axios'; // You may need to install: npm install axios

// Initialize the MCP server with configuration
const server = new MCPServer({
  name: "${serverName}",
  description: "${description}",
  // Uncomment to enable authentication
  // auth: {
  //   apiKeys: process.env.API_KEYS?.split(',') || ["your-secret-key"],
  // }
});

// Define middleware if needed (logging, auth, etc.)
// server.use(async (ctx, next) => {
//   console.log('Request received:', ctx.requestId);
//   const result = await next();
//   console.log('Response sent:', ctx.requestId);
//   return result;
// });

// Define tools
${tools.map(tool => {
  const hasParams = tool.parameters && tool.parameters.length > 0;
  
  // Create parameter schema validation
  const paramSchema = hasParams ? 
    `// Parameter schema for ${tool.name}
const ${tool.name.replace(/\s+/g, '_').toLowerCase()}Schema = z.object({
  ${tool.parameters.map(p => {
    // Get base Zod type
    let zodType = 'z.string()';
    switch (p.type) {
      case 'number':
      case 'integer':
        zodType = 'z.number()';
        break;
      case 'boolean':
        zodType = 'z.boolean()';
        break;
      case 'array':
        zodType = 'z.array(z.any())';
        break;
      case 'object':
        zodType = 'z.record(z.string(), z.any())';
        break;
      case 'date':
        zodType = 'z.date()';
        break;
      case 'email':
        zodType = 'z.string().email()';
        break;
      case 'url':
        zodType = 'z.string().url()';
        break;
      case 'enum':
        if (p.constraints?.enum && p.constraints.enum.length > 0) {
          const enumValues = p.constraints.enum.map(v => `"${v}"`).join(', ');
          zodType = `z.enum([${enumValues}])`;
        } else {
          zodType = 'z.string()';
        }
        break;
      default:
        zodType = 'z.string()';
    }
    
    // Add additional constraints
    if (p.type !== 'enum') { // Already handled above for enum
      zodType += getZodConstraints(p);
    }
    
    return `${p.name.replace(/\s+/g, '_').toLowerCase()}: ${zodType}.describe("${p.description}")`;
  }).join(',\n  ')}
});` : '';

  return `${paramSchema}

server.registerTool({
  name: "${tool.name.replace(/\s+/g, '_').toLowerCase()}",
  description: "${tool.description}",
  parameters: {
    ${formatTSParameters(tool.parameters)}
  },
  handler: async ({${formatParameters(tool.parameters, 'typescript')}}) => {
    // Validate parameters using zod
    ${hasParams ? `const params = ${tool.name.replace(/\s+/g, '_').toLowerCase()}Schema.parse({
      ${tool.parameters.map(p => `${p.name.replace(/\s+/g, '_').toLowerCase()}`).join(',\n      ')}
    });` : '// No parameters to validate'}
    
    // TODO: Implement tool functionality
    
    /* IMPLEMENTATION HINTS:
    
    // 1. For API calls (using axios):
    // import axios from 'axios';
    // const response = await axios.get(\`https://api.example.com/data?param=\${paramName}\`);
    // return { result: response.data };
    
    // 2. For file operations:
    // const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    // return { result: data };
    
    // 3. For database operations (using Prisma as example):
    // import { PrismaClient } from '@prisma/client';
    // const prisma = new PrismaClient();
    // const results = await prisma.yourModel.findMany({
    //   where: { field: paramValue }
    // });
    // return { result: results };
    
    // 4. For secure operations with OAuth:
    // import { OAuthClient } from '@oauth/client';
    // const client = new OAuthClient({
    //   clientId: process.env.CLIENT_ID,
    //   clientSecret: process.env.CLIENT_SECRET
    // });
    // const data = await client.authorizedRequest(url);
    // return { result: data };
    
    */
    
    // Example implementation (replace with your actual logic):
    return {
      result: \`${tool.name} executed with parameters: ${tool.parameters.map(p => '\${' + p.name.replace(/\s+/g, '_').toLowerCase() + '}').join(', ')}\`
    };
  }
});`
}).join('\n\n')}

// Start the server with error handling and graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
});

server.start().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});
`;
};

export const readmeTemplate = (serverName: string, description: string): string => {
  const formattedName = serverName.toLowerCase().replace(/\s+/g, '-');
  
  return `# ${serverName} MCP Server

${description}

## Setup Instructions

### Prerequisites
- Node.js 18+ or Python 3.8+ (depending on the server type you chose)
- Claude Desktop, Claude on the web, or any MCP-compatible AI assistant

### Installation

#### For TypeScript server:
1. Install dependencies:
   \`\`\`
   ./install.sh
   \`\`\`
   
   Or manually:
   \`\`\`
   npm install
   \`\`\`
   
2. Start the server:
   \`\`\`
   npm start
   \`\`\`
   
   For development with auto-reload:
   \`\`\`
   npm run dev
   \`\`\`

#### For Python server:
1. Install dependencies using the provided script:
   \`\`\`
   ./install.sh
   \`\`\`
   
   Or manually:
   \`\`\`
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   pip install -r requirements.txt
   \`\`\`
   
2. Start the server:
   \`\`\`
   python server.py
   \`\`\`

### Security Configuration

This server comes with built-in security options that are commented out by default:

#### For TypeScript:
Edit the server configuration in \`server.js\`:
\`\`\`javascript
const server = new MCPServer({
  // Uncomment and configure auth
  auth: {
    apiKeys: process.env.API_KEYS?.split(',') || ["your-secret-key"],
  }
});
\`\`\`

#### For Python:
Edit the server configuration in \`server.py\`:
\`\`\`python
server = MCPServer(
    # Uncomment to enable authentication
    auth_config={
        "api_keys": ["your-secret-key"],  # Replace with actual API keys or use environment variables
    }
)
\`\`\`

### Connect to Claude or Other MCP-Compatible AI Assistants

#### Claude Desktop
Claude Desktop requires manual configuration file editing:

1. Locate the configuration file:
   - macOS: /Users/username/Library/Application Support/Claude/claude_desktop_config.json
   - Windows: %APPDATA%\\Claude\\claude_desktop_config.json

2. Edit the JSON file (create it if it doesn't exist) to add your server:

   For direct server execution:
   \`\`\`
   {
     "mcpServers": {
       "${formattedName}": {
         "command": "python",
         "args": ["/absolute/path/to/server.py"]
       }
     }
   }
   \`\`\`
   Note: Use "node" instead of "python" for TypeScript servers.

3. For Docker deployment (recommended for better isolation):
   \`\`\`
   {
     "mcpServers": {
       "${formattedName}": {
         "command": "docker",
         "args": ["run", "-i", "--rm", "${formattedName}"]
       }
     }
   }
   \`\`\`

4. Save the file and restart Claude Desktop

#### Claude on the Web or Other AI Assistants
Many AI assistants now support connecting to MCP servers over HTTP. To support this:

1. Install an MCP HTTP adapter:
   \`\`\`bash
   # For TypeScript
   npm install -g mcp-http-adapter
   
   # For Python
   pip install mcp-http-adapter
   \`\`\`

2. Run the adapter to expose your server via HTTP:
   \`\`\`bash
   # For TypeScript
   npx mcp-http-adapter --command "node /path/to/server.js" --port 8080
   
   # For Python
   mcp-http-adapter --command "python /path/to/server.py" --port 8080
   \`\`\`

3. Use the HTTP endpoint (http://localhost:8080) in web-based assistants

## Validating Your Server

This project includes testing tools to verify your MCP server implementation:

\`\`\`bash
# For TypeScript
npm run test

# For Python
mcp-test validate --server python server.py --spec mcp-1.2.0
\`\`\`

## Customizing Your Server

This server is pre-configured with tool definitions and includes:

1. **Schema Validation**: Parameter validation using Zod (TypeScript) or Pydantic (Python)
2. **Error Handling**: Built-in error handling for graceful failure
3. **Security Options**: API key authentication
4. **Middleware Support**: For logging, auth verification, etc.

To implement tool functionality:

1. Locate the tool functions in the server code
2. Replace the example implementations with your actual code
3. Refer to the implementation hints in the comments for guidance
4. Test your server with Claude to ensure it works as expected

## Deployment Options

### Docker
A Dockerfile is included for containerization. Build and run with:
\`\`\`bash
docker build -t ${formattedName} .
docker run -p 3000:3000 ${formattedName}
\`\`\`

### Serverless Deployment
For serverless deployment, consider the following options:

- **AWS Lambda**: Package with serverless framework
- **Cloudflare Workers**: Use the \`wrangler\` CLI tool
- **Vercel/Netlify Functions**: Add appropriate configuration files

## Troubleshooting

- If the AI can't connect to your server, check that:
  - The server is running (you should see it in your terminal)
  - The connection settings are correct
  - You've restarted the AI client if necessary
  
- If a tool isn't working correctly:
  - Check the server console for error messages
  - Verify the tool implementation code
  - Make sure any external services or APIs are accessible
  - Test with \`mcp-test\` to validate against the protocol

## Need Help?

- MCP Protocol Documentation: https://modelcontextprotocol.ai
- Claude Documentation: https://docs.anthropic.com
- MCP Server Community: https://discord.gg/mcp-protocol
- Awesome MCP Servers List: https://github.com/wong2/awesome-mcp-servers

## License

This MCP server is provided for your use and modification. Feel free to customize it to suit your needs.
`;
};

export const dockerfileTemplate = (serverType: 'python' | 'typescript'): string => {
  if (serverType === 'python') {
    return `
# Python MCP Server Dockerfile - Optimized for production use
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port if needed for HTTP adapter
# EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD python -c "import requests; requests.get('http://localhost:3000/health')" || exit 1

# Start the server
CMD ["python", "server.py"]
`;
  } else {
    return `
# TypeScript MCP Server Dockerfile - Optimized for production use
FROM node:18-slim AS builder

# Set working directory for build stage
WORKDIR /build

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build if TypeScript
RUN npm run build || echo "No build script found"

# Production image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /build/dist /app/dist
COPY --from=builder /build/server.js /app/server.js

# Set environment to production
ENV NODE_ENV=production

# Expose port if needed for HTTP adapter
# EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD node -e "const http = require('http'); const req = http.request('http://localhost:3000/health', { method: 'GET' }, (res) => { process.exit(res.statusCode !== 200 ? 1 : 0); }); req.on('error', () => process.exit(1)); req.end();" || exit 1

# Start the server
CMD ["node", "server.js"]
`;
  }
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
pip install mcp-client-sdk pydantic==2.4.2 asyncio aiohttp

# Install optional but recommended dependencies
pip install mcp-security mcp-test-suite

# Create requirements.txt for future reference
cat > requirements.txt << EOL
mcp-client-sdk>=0.6.0
pydantic>=2.4.2
asyncio>=3.4.3
aiohttp>=3.8.5
mcp-security>=0.1.0
mcp-test-suite>=0.3.0
EOL

echo "Installation complete! To start the server:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the server: python server.py"
echo ""
echo "To validate your MCP server against the protocol spec:"
echo "mcp-test validate --server python server.py --spec mcp-1.2.0"
`;
  } else {
    return `
#!/bin/bash
# Installation script for TypeScript MCP server

# Install dependencies
npm install

# Install development dependencies
npm install --save-dev nodemon eslint mcp-test-suite

# Install optional recommended dependencies
npm install --save-optional axios mcp-framework @mcp/oauth2

echo "Installation complete! To start the server:"
echo "npm start"
echo ""
echo "For development with auto-reload:"
echo "npm run dev"
echo ""
echo "To validate your MCP server against the protocol spec:"
echo "npx mcp-test validate --server ./server.js --spec mcp-1.2.0"
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
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "mcp-test validate --server ./server.js --spec mcp-1.2.0",
    "lint": "eslint ."
  },
  "dependencies": {
    "@modelcontextprotocol/mcp": "^0.4.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "eslint": "^8.56.0",
    "nodemon": "^3.0.3"
  },
  "optionalDependencies": {
    "axios": "^1.6.5",
    "mcp-framework": "^0.3.0",
    "@mcp/oauth2": "^0.2.0"
  }
}`;
};
