#!/usr/bin/env node

/**
 * MCP Terminal CLI
 * 
 * Command-line interface for starting an MCP-compatible terminal server
 * that provides terminal access functionality to Claude and other LLMs.
 */

import { createMcpTerminalServer } from './mcp-terminal-server';

const PORT = process.env.PORT || 3000;
const app = createMcpTerminalServer();

// Display banner
console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║        Anthropic MCP Terminal Server      ║
║                                           ║
╚═══════════════════════════════════════════╝
`);

// Start the server
app.listen(PORT, () => {
  console.log(`✅ MCP Terminal Server running on port ${PORT}`);
  console.log(`🔗 Claude Integration URL: http://localhost:${PORT}`);
  console.log(`📚 OpenAPI schema available at http://localhost:${PORT}/openapi.json`);
  console.log(`ℹ️  MCP metadata available at http://localhost:${PORT}/.well-known/mcp`);
  console.log(`\n📋 Usage Instructions:`);
  console.log(`   1. In Claude Desktop, go to Settings > MCP`);
  console.log(`   2. Click "Add Server" and enter: http://localhost:${PORT}`);
  console.log(`   3. Click "Connect" and start using the terminal tool\n`);
  console.log(`⚠️  Caution: This gives Claude access to your terminal. Only use with trusted content.`);
  console.log(`\n📌 Press Ctrl+C to stop the server`);
});