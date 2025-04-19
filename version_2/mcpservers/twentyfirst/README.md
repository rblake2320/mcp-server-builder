# 21st.dev Magic MCP Server Integration

This directory contains utilities and examples for working with 21st.dev Magic MCP servers. The 21st.dev Magic platform provides a collection of pre-built MCP servers that can be easily integrated into your applications.

## What's Included

- `import_magic_server.js`: A utility to import MCP servers from 21st.dev Magic and create local implementations
- `imported/`: Directory where imported server implementations are stored (created on first import)

## Getting Started

### Prerequisites

To use these utilities, you'll need:

1. A 21st.dev account
2. An API key from 21st.dev
3. The following environment variables set:
   ```
   TWENTYFIRST_API_KEY=your_api_key_here
   ```

### Importing Magic MCP Servers

To import available MCP servers from 21st.dev Magic:

```bash
# Make sure you're in the mcpservers/twentyfirst directory
cd mcpservers/twentyfirst

# Run the import utility
node import_magic_server.js
```

This will:
1. Fetch the list of available servers from 21st.dev Magic
2. Download detailed information for each server
3. Create local JavaScript implementations in the `imported/` directory
4. Generate an index file with metadata about the imported servers

### Using Imported Servers

Each imported server is a standalone Node.js application that:

1. Uses the same tools and parameters as the original Magic MCP server
2. Proxies requests to the actual 21st.dev Magic server (requires your API key)
3. Handles parameter validation locally

To run an imported server:

```bash
# Navigate to the imported directory
cd imported

# Install dependencies
npm install express cors dotenv node-fetch

# Run the server
node your_imported_server.js
```

## Customizing Imported Servers

The imported server implementations are fully editable. You can:

1. Modify the tool definitions
2. Add local implementations instead of proxying to 21st.dev
3. Add new tools or remove existing ones
4. Change the server configuration

## Additional Notes

- The 21st.dev Magic platform is regularly updated with new MCP servers. Run the import utility periodically to stay current.
- Be mindful of your API usage limits when using the proxied implementations.
- For production use, consider implementing the functionality locally rather than proxying all requests.

## Resources

- [21st.dev Website](https://21st.dev)
- [Magic MCP Documentation](https://magic.21st.dev/mcp)
- [API Documentation](https://api.twentyfirst.dev/docs)