
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
