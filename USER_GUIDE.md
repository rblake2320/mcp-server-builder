# User Guide: MCP Server Builder

This guide will walk you through the process of using the MCP Server Builder to create your own MCP (Model Context Protocol) server without any coding knowledge, then deploying and connecting it to an AI assistant like Claude.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Building Your MCP Server](#building-your-mcp-server)
4. [Deploying Your MCP Server](#deploying-your-mcp-server)
5. [Connecting to Claude Desktop](#connecting-to-claude-desktop)
6. [Troubleshooting](#troubleshooting)
7. [Frequently Asked Questions](#frequently-asked-questions)

## Introduction

The MCP Server Builder is a user-friendly web application that lets you create Model Context Protocol (MCP) servers without technical knowledge. MCP servers allow AI assistants like Claude to connect to external tools, data sources, and services, extending their capabilities beyond what they can do out of the box.

### What is MCP?

Model Context Protocol (MCP) is an open standard that allows AI systems to securely connect with external data sources and tools. Think of it like a USB port for AI - it provides a standardized way for AI assistants to access and use tools outside of their core capabilities.

### Why Use MCP Server Builder?

- **No coding required**: Create powerful MCP servers through a simple interface
- **Full customization**: Define exactly what tools and capabilities you want to provide
- **Easy deployment**: Simple installation process with clear instructions
- **Works with Claude**: Seamlessly connects with Claude Desktop and other MCP-compatible AI assistants

## Getting Started

### Accessing the MCP Server Builder

1. Open your web browser and navigate to the MCP Server Builder URL (or deploy it following the instructions in the README)
2. Click on the "Builder" link in the navigation menu to start creating your MCP server

## Building Your MCP Server

### Step 1: Basic Server Configuration

1. **Server Name**: Enter a descriptive name for your MCP server (e.g., "Weather Data Provider")
2. **Description**: Write a brief description explaining what your server does
3. **Server Type**: Choose between Python or TypeScript implementation
   - Choose Python if you're more familiar with Python or plan to deploy on platforms that support Python
   - Choose TypeScript (Node.js) if you prefer JavaScript or plan to deploy on web-based platforms

### Step 2: Define Your Tools

Tools are the functions that your MCP server will expose to AI assistants. Each tool represents a specific capability your server will provide.

For each tool:

1. Click the "Add Tool" button
2. Fill in the tool details:
   - **Tool Name**: Give your tool a descriptive name (e.g., "get_weather_forecast")
   - **Description**: Explain what the tool does - this helps the AI understand when to use it

3. Define the parameters your tool will accept:
   - Click "Add Parameter" for each input your tool needs
   - For each parameter, specify:
     - **Parameter Name**: What the parameter is called (e.g., "location")
     - **Type**: The data type (string, number, boolean, etc.)
     - **Description**: What the parameter represents

4. Repeat this process for each tool you want to add

### Example: Creating a Weather Forecast Tool

Here's an example of how to create a simple weather forecast tool:

1. **Tool Name**: get_weather_forecast
2. **Description**: Retrieves weather forecast data for a specific location
3. **Parameters**:
   - Name: location, Type: string, Description: City name or zip code
   - Name: days, Type: number, Description: Number of days to forecast (1-7)

### Step 3: Generate and Download

1. Click the "Create MCP Server" button
2. Wait for the server to be generated
3. When complete, your browser will automatically download a ZIP file containing your MCP server

## Deploying Your MCP Server

After downloading your MCP server package, you'll need to deploy it. The package includes detailed setup instructions, but here's a quick overview:

### For Python Server

1. Extract the ZIP file to a folder on your computer
2. Open a terminal/command prompt and navigate to the extracted folder
3. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```
   pip install mcp-client-sdk
   ```
5. Start the server:
   ```
   python server.py
   ```

### For TypeScript Server

1. Extract the ZIP file to a folder on your computer
2. Open a terminal/command prompt and navigate to the extracted folder
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```

For more detailed deployment instructions, see the [Deployment Guide](DEPLOYMENT.md).

## Connecting to Claude Desktop

Once your MCP server is running, you can connect it to Claude Desktop:

1. Open Claude Desktop
2. Go to Settings
3. Navigate to the MCP section
4. Click "Add Server"
5. Configure the server:
   - **Name**: Enter a name for your server
   - **Type**: Select "command"
   - **Command**: Enter the command to run your server
     - For Python: `python /path/to/your/server.py`
     - For TypeScript: `node /path/to/your/server.js`
6. Save the configuration
7. Restart Claude Desktop

Now you can ask Claude to use your custom tools! For example, if you created a weather forecast tool, you could say:
"Claude, can you get the weather forecast for New York City for the next 3 days?"

## Customizing Your MCP Server (Optional)

The MCP Server Builder generates a functional but basic server. To add actual functionality:

1. Open the server file (`server.py` or `server.js`) in a text editor
2. Look for the `TODO` comments that indicate where to add your code
3. Implement the logic for each tool
4. Save and restart your server

## Troubleshooting

### Common Issues and Solutions

1. **Server won't start**
   - Ensure you've installed all dependencies
   - Check that you're using the correct Python or Node.js version
   - Verify that the required ports are not in use

2. **Claude can't connect to the server**
   - Ensure the server is running
   - Check that the path in Claude Desktop's configuration is correct
   - Restart Claude Desktop after making changes

3. **Tool functionality not working**
   - Remember that the generated server provides the structure but not the actual tool functionality
   - You'll need to implement the tool logic or have someone help you with it

## Frequently Asked Questions

**Q: Do I need to know how to code to use the MCP Server Builder?**

A: No, you can create the structure of an MCP server without coding knowledge. However, implementing the actual functionality of your tools will require some programming.

**Q: Can I modify my server after generating it?**

A: Yes, you can edit the generated code to add or modify functionality.

**Q: What can I do with an MCP server?**

A: MCP servers can extend AI capabilities in numerous ways, including:
- Retrieving real-time data (weather, stocks, news)
- Interacting with other services (email, calendar, social media)
- Accessing databases and local files
- Performing calculations or specialized functions
- Controlling IoT devices or software

**Q: Is the MCP Server Builder free to use?**

A: Yes, the MCP Server Builder is open-source and free to use.

**Q: Can I deploy my MCP server to the cloud?**

A: Yes, the generated server includes a Dockerfile and can be deployed to any platform that supports Python or Node.js applications. See the [Deployment Guide](DEPLOYMENT.md) for more information.

---

Happy building! If you have more questions or need assistance, please refer to the documentation or reach out to the community for support.