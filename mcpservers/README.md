# MCP Servers Collection

This directory contains a curated collection of Model Context Protocol (MCP) server templates and examples to help you build your own MCP tools for Claude and other compatible LLMs.

## Directory Structure

- `/templates`: Starter templates for building your own MCP servers
- `/examples`: Fully functional example MCP servers for specific use cases

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
- **Basic Template**: A minimal starting point for building your own MCP server

## Contributing

We welcome contributions to this collection! If you've built an MCP server that might be useful to others, please consider submitting it as:

1. A template (if it's a general-purpose starting point)
2. An example (if it demonstrates a specific use case)

## Resources

For more information about the MCP protocol, visit the [Anthropic documentation](https://anthropic.com/claude).

## License

All servers and templates in this collection are released under the MIT License unless otherwise specified.