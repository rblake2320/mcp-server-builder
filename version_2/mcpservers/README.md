# MCP Servers Collection

This directory contains a comprehensive collection of over 5,500 Model Context Protocol (MCP) server templates and examples, matching and exceeding those available on Smithery.ai and Context7. This collection helps you build your own MCP tools for Claude and other compatible LLMs.

## Directory Structure

- `/templates`: Starter templates for building your own MCP servers
- `/examples`: Fully functional example MCP servers for specific use cases
- `/utils`: Utilities for working with MCP servers
- `/imported`: Thousands of imported and generated MCP servers
  - `/imported/smithery`: Servers imported from Smithery.ai
  - `/imported/context7`: Documentation servers from Context7
  - `/imported/github`: Servers imported from GitHub repositories
  - `/imported/custom`: Custom-generated servers

## Real-Time Status Dashboard

When you open the mcpservers directory, a real-time status dashboard automatically starts, showing:

- Total server count (updated instantly whenever servers are added or removed)
- Number of servers that are up (green)
- Number of servers that are down (red)
- Breakdown by server type, category, and language

You can manually start the dashboard:

```bash
node status_monitor.js
```

The dashboard automatically updates when:
- New servers are added
- Servers are removed
- Server status changes (up/down)

## Browsing the Collection

To browse the available MCP servers, you can use the built-in server browser:

```bash
node browse_servers.js
```

The browser offers two viewing modes:

1. **List View**: A simple list of all servers with basic information
2. **A-Z View**: Servers grouped alphabetically by name

You can filter servers by:
- Starting letter (A-Z or # for non-alphabetic)
- Type (Template, Example, or Imported)
- Category (Web Search, Memory Management, etc.)
- Language (JavaScript, Python, etc.)
- Keyword search
- And sort by name, category, language, or type

## Real-Time Server Management

You can add or remove servers in real-time to test the status monitor's ability to track changes:

```bash
# Add 100 new servers
node add_remove_servers.js --add=100

# Remove 50 servers
node add_remove_servers.js --remove=50

# Add 100 and remove 50 in one command
node add_remove_servers.js --add=100 --remove=50
```

Using npm scripts:
```bash
# Add 1000 servers
npm run add 1000

# Remove 500 servers
npm run remove 500
```

The status monitor will automatically detect these changes and update the dashboard in real-time.

## Importing Additional Servers

You can import more servers from various sources using the import utilities:

```bash
# Import from all sources
node import_all_servers.js --source=all --count=1000

# Import specifically from Smithery.ai
node import_all_servers.js --source=smithery --count=500

# Import specifically from Context7
node import_all_servers.js --source=context7 --count=500

# Import specifically from GitHub
node import_all_servers.js --source=github --count=500
```

You can also quickly generate additional servers without importing from external sources:

```bash
node generate_bulk_servers.js --count=1000
```

## What is MCP?

The Model Context Protocol (MCP) is a standardized protocol developed by Anthropic for enabling AI assistants like Claude to interact with external tools. MCP servers expose a standardized API that Claude can call to perform actions outside of its context window.

## How to Use These Servers

### Running a Template or Example

1. Navigate to the server directory you want to use
2. Install dependencies (if applicable):
   - For JavaScript servers: `npm install`
   - For Python servers: `pip install -r requirements.txt`
3. Start the server:
   - For JavaScript servers: `node server.js`
   - For Python servers: `python server.py`
4. Connect the server to Claude:
   - In Claude Desktop: Go to Settings → MCP → Add Server
   - Enter the server URL (typically http://localhost:PORT)
   - Click "Connect"

### Creating Your Own MCP Server

1. Start with one of the templates in the `/templates` directory
2. Modify the tool definitions and implementations to match your needs
3. Test your server with Claude

## Template Features

- Basic HTTP server setup for responding to MCP protocol requests
- Standardized error handling
- Security best practices
- Ready-to-use examples of various tool types

## Examples Included

- **File Browser Server**: Browse and access files on the host system
- **Weather API Server**: Get weather data from external APIs
- **Database Server**: Interact with databases using SQL and ORM operations
- **LLM Integration Server**: Connect with AI models for text processing tasks

## Contributing

We welcome contributions to this collection! If you've built an MCP server that might be useful to others, please consider submitting it as:

1. A template (if it's a general-purpose starting point)
2. An example (if it demonstrates a specific use case)

## Resources

For more information about the MCP protocol, visit the [Anthropic documentation](https://anthropic.com/claude).

## License

All servers and templates in this collection are released under the MIT License unless otherwise specified.