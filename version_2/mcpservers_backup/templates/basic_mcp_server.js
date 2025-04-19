/**
 * Basic MCP Server Template in JavaScript
 * 
 * This template provides a minimal implementation of an MCP server
 * with a single example tool. Use this as a starting point for your own servers.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MCP manifest endpoint - root route
app.get('/', (req, res) => {
  const manifest = {
    protocol: {
      schema: "mcp",
      version: "0.1.0"
    },
    server: {
      name: "Basic MCP Server",
      version: "1.0.0",
      description: "A simple MCP server template",
      vendor: "MCP Server Builder",
      // Use the hostname if available, otherwise fallback to localhost
      host: req.headers.host || `${HOST}:${PORT}`
    },
    tools: [
      {
        name: "hello_world",
        description: "Return a greeting message",
        parameters: [
          {
            name: "name",
            description: "Name to greet",
            type: "string",
            required: true
          }
        ]
      },
      // Add more tools here as needed
    ]
  };
  
  res.json(manifest);
});

// Tool implementation
app.post('/hello_world', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({
      error: "Missing required parameter: name"
    });
  }
  
  res.json({
    message: `Hello, ${name}! Welcome to MCP.`,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`MCP Server running at http://${HOST}:${PORT}`);
});