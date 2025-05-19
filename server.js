const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Set up file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Helper functions for creating MCP server templates
const templates = {
  pythonTemplate: (serverName, tools) => {
    return `
from typing import Dict, List, Union, Optional, Any
from mcp.server import MCPServer, Tool, Resources

# Initialize the MCP server
server = MCPServer()

# Define tools
${tools.map(tool => `
@server.tool()
async def ${tool.name.replace(/\s+/g, '_').toLowerCase()}(${tool.parameters.map(p => p.name.replace(/\s+/g, '_').toLowerCase() + ': ' + (p.type || 'str')).join(', ')}) -> Dict[str, Any]:
    """${tool.description}"""
    # TODO: Implement tool functionality
    return {"result": f"${tool.name} executed with parameters: ${tool.parameters.map(p => '{' + p.name.replace(/\s+/g, '_').toLowerCase() + '}').join(', ')}"}
`).join('\n')}

# Start the server
if __name__ == "__main__":
    server.start()
`;
  },
  
  typescriptTemplate: (serverName, tools) => {
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
    ${tool.parameters.map(p => `${p.name.replace(/\s+/g, '_').toLowerCase()}: {
      type: "${p.type || 'string'}",
      description: "${p.description}"
    }`).join(',\n    ')}
  },
  handler: async ({${tool.parameters.map(p => p.name.replace(/\s+/g, '_').toLowerCase()).join(', ')}}) => {
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
  },
  
  readmeTemplate: (serverName, description) => {
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
  },
  
  dockerfileTemplate: () => {
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
  },
  
  installScriptTemplate: (serverType) => {
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
  }
};

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/builder', (req, res) => {
  res.render('builder');
});

// API to create and download MCP server
app.post('/api/create-server', async (req, res) => {
  try {
    const { serverName, description, serverType, tools } = req.body;
    
    if (!serverName || !serverType || !tools || !Array.isArray(tools)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create a unique ID for this build
    const buildId = uuidv4();
    const buildDir = path.join(__dirname, 'builds', buildId);
    fs.ensureDirSync(buildDir);
    
    // Generate server code
    const serverCode = serverType === 'python' 
      ? templates.pythonTemplate(serverName, tools)
      : templates.typescriptTemplate(serverName, tools);
    
    // Create main server file
    const serverFilename = serverType === 'python' ? 'server.py' : 'server.js';
    fs.writeFileSync(path.join(buildDir, serverFilename), serverCode);
    
    // Create package.json if TypeScript
    if (serverType === 'typescript') {
      const packageJson = {
        name: serverName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description,
        main: 'server.js',
        scripts: {
          start: 'node server.js'
        },
        dependencies: {
          '@modelcontextprotocol/mcp': '^0.4.0'
        }
      };
      fs.writeFileSync(
        path.join(buildDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    }
    
    // Create README.md
    fs.writeFileSync(
      path.join(buildDir, 'README.md'),
      templates.readmeTemplate(serverName, description)
    );
    
    // Create Dockerfile
    fs.writeFileSync(
      path.join(buildDir, 'Dockerfile'),
      templates.dockerfileTemplate()
    );
    
    // Create install script
    const installScript = templates.installScriptTemplate(serverType);
    fs.writeFileSync(
      path.join(buildDir, 'install.sh'),
      installScript
    );
    fs.chmodSync(path.join(buildDir, 'install.sh'), '755');
    
    // Create zip file
    const zipFilePath = path.join(__dirname, 'downloads', `${buildId}.zip`);
    fs.ensureDirSync(path.dirname(zipFilePath));
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    archive.directory(buildDir, false);
    
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });
    
    res.json({
      success: true,
      downloadUrl: `/api/download/${buildId}`,
      message: 'MCP server created successfully!'
    });
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(500).json({ error: 'Failed to create MCP server' });
  }
});

// API to download the created MCP server
app.get('/api/download/:buildId', (req, res) => {
  const { buildId } = req.params;
  const zipFilePath = path.join(__dirname, 'downloads', `${buildId}.zip`);
  
  if (!fs.existsSync(zipFilePath)) {
    return res.status(404).json({ error: 'Build not found' });
  }
  
  res.download(zipFilePath);
});

// Start the server
app.listen(PORT, () => {
  console.log(`MCP Server Builder running on http://localhost:${PORT}`);
});
