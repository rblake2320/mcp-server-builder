/**
 * Initialize Server Index
 * 
 * This utility ensures that the server_index.json file exists and has the
 * correct structure. If the file doesn't exist, it creates a default version.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to server index
const SERVER_INDEX_PATH = path.join(__dirname, '..', 'server_index.json');

// Default server index structure
const DEFAULT_SERVER_INDEX = {
  templates: [
    {
      id: 1,
      name: "Basic MCP Server Template",
      description: "A minimal starting point for building your own MCP server",
      category: "template",
      subcategory: "utilities",
      language: "javascript",
      tags: ["starter", "template", "basic"],
      path: "./templates/basic",
      entryPoint: "server.js",
      buildCommand: "npm install",
      runCommand: "node server.js",
      port: 3333,
      tools: [
        {
          name: "getDateTime",
          description: "Get the current date and time"
        }
      ]
    },
    {
      id: 2,
      name: "LLM Integration Server",
      description: "Template for integrating with LLM APIs (Claude, GPT, etc.)",
      category: "template",
      subcategory: "ai_services",
      language: "javascript",
      tags: ["llm", "ai", "text-generation"],
      path: "./templates/llm_integration",
      entryPoint: "server.js",
      buildCommand: "npm install",
      runCommand: "node server.js",
      port: 3334,
      tools: [
        {
          name: "generateText",
          description: "Generate text using an LLM API"
        },
        {
          name: "summarizeText",
          description: "Summarize long text into concise points"
        }
      ]
    }
  ],
  examples: [
    {
      id: 3,
      name: "File Browser Server",
      description: "Browse and access files on the host system",
      category: "example",
      subcategory: "file_operations",
      language: "javascript",
      tags: ["file", "storage", "filesystem"],
      path: "./examples/file_browser",
      entryPoint: "server.js",
      buildCommand: "npm install",
      runCommand: "node server.js",
      port: 3335,
      tools: [
        {
          name: "listFiles",
          description: "List files in a directory"
        },
        {
          name: "readFile",
          description: "Read the contents of a file"
        },
        {
          name: "writeFile",
          description: "Write content to a file"
        }
      ]
    },
    {
      id: 4,
      name: "Brave Search Server",
      description: "Web search capabilities using the Brave Search API",
      category: "example",
      subcategory: "web_search",
      language: "javascript",
      tags: ["search", "web", "brave"],
      path: "./examples/brave_search",
      entryPoint: "server.js",
      buildCommand: "npm install",
      runCommand: "node server.js",
      port: 3336,
      tools: [
        {
          name: "search",
          description: "Search the web using Brave Search API"
        },
        {
          name: "searchNews",
          description: "Search for recent news articles"
        }
      ]
    }
  ],
  imported: []
};

// Create the server index if it doesn't exist
async function initServerIndex() {
  try {
    if (!fs.existsSync(SERVER_INDEX_PATH)) {
      console.log('Server index not found. Creating default index...');
      await fs.writeJson(SERVER_INDEX_PATH, DEFAULT_SERVER_INDEX, { spaces: 2 });
      console.log('Default server index created successfully.');
    } else {
      console.log('Server index already exists.');
    }
  } catch (error) {
    console.error('Error initializing server index:', error);
    throw error;
  }
}

// Run if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initServerIndex().catch(error => {
    console.error('Initialization failed:', error);
    process.exit(1);
  });
}

export default initServerIndex;