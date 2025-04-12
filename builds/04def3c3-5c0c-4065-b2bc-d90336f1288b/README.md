
# test MCP Server

A server that provides up-to-date weather forecast data for any location

## Setup Instructions

### Prerequisites
- Node.js 18+ or Python 3.8+ (depending on the server type you chose)
- Claude Desktop, Claude on the web, or any MCP-compatible AI assistant

### Installation

#### For TypeScript server:
1. Install dependencies:
   ```
   ./install.sh
   ```
   
   Or manually:
   ```
   npm install
   ```
   
2. Start the server:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

#### For Python server:
1. Install dependencies using the provided script:
   ```
   ./install.sh
   ```
   
   Or manually:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
   
2. Start the server:
   ```
   python server.py
   ```

### Security Configuration

This server comes with built-in security options that are commented out by default:

#### For TypeScript:
Edit the server configuration in `server.js`:
```javascript
const server = new MCPServer({
  // Uncomment and configure auth
  auth: {
    apiKeys: process.env.API_KEYS?.split(',') || ["your-secret-key"],
  }
});
```

#### For Python:
Edit the server configuration in `server.py`:
```python
server = MCPServer(
    # Uncomment to enable authentication
    auth_config={
        "api_keys": ["your-secret-key"],  # Replace with actual API keys or use environment variables
    }
)
```

### Connect to Claude or Other MCP-Compatible AI Assistants

#### Claude Desktop
1. Open Claude Desktop
2. Go to Settings and navigate to the MCP section
3. Click "Add Server"
4. Configure the server:
   - Name: Enter a descriptive name for your server
   - Type: Select "command"
   - Command: Enter the full path to run your server
     - For TypeScript: `node /full/path/to/server.js`
     - For Python: `python /full/path/to/server.py`
     - Tip: Use absolute paths to avoid issues
5. Save the configuration
6. Restart Claude Desktop if necessary

#### Claude on the Web or Other AI Assistants
Many AI assistants now support connecting to MCP servers over HTTP. To support this:

1. Install an MCP HTTP adapter:
   ```bash
   # For TypeScript
   npm install mcp-http-adapter
   
   # For Python
   pip install mcp-http-adapter
   ```

2. Modify your server code to add HTTP support (refer to documentation)

## Validating Your Server

This project includes testing tools to verify your MCP server implementation:

```bash
# For TypeScript
npm run test

# For Python
mcp-test validate --server python server.py --spec mcp-1.2.0
```

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
```bash
docker build -t test .
docker run -p 3000:3000 test
```

### Serverless Deployment
For serverless deployment, consider the following options:

- **AWS Lambda**: Package with serverless framework
- **Cloudflare Workers**: Use the `wrangler` CLI tool
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
  - Test with `mcp-test` to validate against the protocol

## Need Help?

- MCP Protocol Documentation: https://modelcontextprotocol.ai
- Claude Documentation: https://docs.anthropic.com
- MCP Server Community: https://discord.gg/mcp-protocol
- Awesome MCP Servers List: https://github.com/wong2/awesome-mcp-servers

## License

This MCP server is provided for your use and modification. Feel free to customize it to suit your needs.
