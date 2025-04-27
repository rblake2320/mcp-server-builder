# MCP Server Structure and Development Guide

This document explains the structure and functionality of the MCP (Model Context Protocol) server implementation in this project.

## Directory Structure

```
mcpservers_backup/
│
├── create_server.js         # Script for creating new MCP servers from templates
├── server_index.json        # Catalog of available MCP servers and their metadata
├── README.md                # General information about the MCP server implementation
├── GUIDE.md                 # This documentation file
│
├── examples/                # Example MCP server implementations
│   ├── file_browser_server.py   # Python example for browsing files
│   └── weather_api_server.js    # JavaScript example for weather data
│
├── templates/               # Template files for creating new MCP servers
│   ├── basic_mcp_server.js  # JavaScript template for basic MCP server
│   └── basic_mcp_server.py  # Python template for basic MCP server
│
└── utils/                   # Utility functions and helpers for MCP servers
    # (Currently empty, but can contain custom utilities)
```

## Key Components

### 1. Server Templates

The `templates/` directory contains starter files for creating new MCP servers. These files follow the MCP protocol specification and include:

- Basic server structure
- Protocol handlers
- Tool definitions
- Error handling

Each template is designed to be easily customizable to create new MCP servers with different functionalities.

### 2. Example Servers

The `examples/` directory contains fully-implemented MCP servers that showcase different capabilities:

- `file_browser_server.py`: A Python implementation that provides tools for browsing and manipulating files.
- `weather_api_server.js`: A JavaScript implementation that provides weather data from external APIs.

These examples demonstrate best practices for MCP server implementation and can be used as reference when developing new servers.

### 3. Server Index

The `server_index.json` file is a catalog of available MCP servers with metadata such as:

- Server name and ID
- Description
- Language (Python/JavaScript)
- Author
- Tools provided
- Requirements

This index is used by the MCP Server Builder interface to display available servers.

### 4. Creation Script

The `create_server.js` script automates the process of creating new MCP servers from templates. It:

1. Takes input parameters like name, description, and language
2. Selects the appropriate template
3. Replaces placeholders with provided values
4. Generates the new server files in a specified location

## Developing a New MCP Server

To develop a new MCP server:

1. Choose a template (`basic_mcp_server.js` or `basic_mcp_server.py`)
2. Define the tools your server will provide (functions, parameters, return values)
3. Implement the tool logic
4. Add proper validation and error handling
5. Test the server against MCP protocol specifications
6. Update the server_index.json to include your new server

## MCP Protocol Essentials

MCP (Model Context Protocol) servers follow a specific protocol for communication:

- **Server Initialization**: Servers expose their capabilities including supported tools
- **Tool Definitions**: Each tool has a name, description, parameters, and return values
- **Parameter Validation**: Servers validate parameters according to specifications
- **Response Format**: Servers return results in a prescribed format
- **Error Handling**: Specific error format for invalid requests or internal errors

## Example Tool Definition

```javascript
{
  "name": "get_weather",
  "description": "Get current weather for a location",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City name or location"
      },
      "units": {
        "type": "string",
        "enum": ["metric", "imperial"],
        "default": "metric",
        "description": "Temperature units"
      }
    },
    "required": ["location"]
  }
}
```

## Further Customization

Feel free to modify and extend this structure for your specific needs:

- Add new templates for different types of MCP servers
- Create more sophisticated examples
- Develop utility libraries for common MCP server operations
- Implement testing frameworks specific to MCP servers
- Add deployment scripts for different hosting environments

## Resources

- [MCP Protocol Specification](https://github.com/anthropics/anthropic-cookbook/tree/main/mcp)
- [Anthropic Claude MCP Documentation](https://docs.anthropic.com/claude/docs/model-context-protocol)
- [21st.dev Magic MCP Examples](https://magic.21st.dev/)