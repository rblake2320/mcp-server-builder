#!/usr/bin/env node

// MCP Terminal CLI - Command line interface for the MCP Terminal Server
import { createTerminalApp } from './mcp-terminal-server';

// Parse command line arguments
const args = process.argv.slice(2);
const port = parseInt(args[0]) || 3000;

// Create and start the terminal server
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   MCP Terminal Server                             ║
║   Model Context Protocol - Terminal Access Tool   ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
  
  console.log('Starting MCP Terminal Server...');
  
  try {
    const app = createTerminalApp(port);
    await app.start();
    
    console.log(`
Server is now running at: http://localhost:${port}
Add this URL to Claude Desktop in Settings > MCP > Add Server

Press Ctrl+C to stop the server.
    `);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT signal. Shutting down...');
      
      try {
        await app.stop();
        console.log('Server stopped.');
        process.exit(0);
      } catch (error) {
        console.error('Error stopping server:', error);
        process.exit(1);
      }
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM signal. Shutting down...');
      
      try {
        await app.stop();
        console.log('Server stopped.');
        process.exit(0);
      } catch (error) {
        console.error('Error stopping server:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start MCP Terminal Server:', error);
    process.exit(1);
  }
}

// Run the server
main();