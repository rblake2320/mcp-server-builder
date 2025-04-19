# MCP Server Quick Start Guide

This guide will help you get started with creating and running your own MCP (Model Context Protocol) servers using the content in this directory.

## What's Inside

This directory contains:

- `templates/` - Basic MCP server templates in Python and JavaScript
- `examples/` - Working example servers that demonstrate different capabilities
- `utils/` - Utility scripts to help you create and manage MCP servers
- `GUIDE.md` - Comprehensive documentation about MCP server structure
- `README.md` - Original project readme 
- `server_index.json` - Catalog of available servers
- `create_server.js` - The original server creation utility

## Quick Start

### Option 1: Run an Existing Example

1. Navigate to the examples directory:
   ```
   cd mcpservers_backup/examples
   ```

2. For JavaScript examples:
   ```
   # Install dependencies first (only needed once)
   npm install express cors

   # Run the server
   node weather_api_server.js
   ```

3. For Python examples:
   ```
   # Install dependencies first (only needed once)
   pip install flask requests

   # Run the server
   python file_browser_server.py
   ```

### Option 2: Create a New Server Using the Utility

Our interactive utility helps you create customized MCP servers:

1. Navigate to the utils directory:
   ```
   cd mcpservers_backup/utils
   ```

2. Run the server creation utility:
   ```
   node create-mcp-server.js
   ```

3. Follow the prompts to:
   - Name your server
   - Choose a language (JavaScript or Python)
   - Define tools with parameters
   - Generate server files

4. Your new server will be created in the `output` directory

### Option 3: Manually Create a Server from Templates

1. Choose a template from the `templates/` directory

2. Copy it to your working directory:
   ```
   cp mcpservers_backup/templates/basic_mcp_server.js my_server.js
   ```

3. Edit the template, replacing placeholder values and adding your own tool implementations

4. Run your server:
   ```
   node my_server.js
   ```

## Testing Your Server

Once your server is running, you can test it with:

1. **cURL**:
   ```bash
   # Get server capabilities
   curl http://localhost:3000/mcp

   # Call a tool (example)
   curl -X POST http://localhost:3000/mcp \
     -H "Content-Type: application/json" \
     -d '{"tool": "tool_name", "parameters": {"param1": "value1"}}'
   ```

2. **Claude Web Interface**:
   - Go to https://claude.ai/
   - Use the MCP server integration to connect to your local server
   - Ensure your server is publicly accessible or use a tool like ngrok

3. **Browser**:
   - Navigate to `http://localhost:3000/` to see the server info
   - Use browser developer tools to make API requests

## Learning From Examples

Each example in the `examples/` directory demonstrates different patterns:

- `weather_api_server.js` - Basic API integration for retrieving weather data
- `file_browser_server.py` - File system operations with comprehensive error handling
- `advanced_search_server.js` - More complex tools with caching and analysis capabilities

Review these examples to understand best practices for:

- Parameter validation
- Error handling
- Response formatting
- Tool implementation patterns

## Next Steps

After creating your basic server:

1. Add more sophisticated tools
2. Implement proper error handling and validation
3. Add authentication if needed
4. Deploy your server (cloud, local, or container)
5. Connect your server to Claude or other AI systems

Refer to `GUIDE.md` for more detailed information about MCP server structure and development.

Happy building!