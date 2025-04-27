/**
 * MCP Servers Directory Entry Point
 * 
 * This script automatically runs when the mcpservers directory is opened,
 * displaying the real-time server count and status.
 */

import { startMonitor } from './status_monitor.js';

console.log('Welcome to the MCP Servers Collection');
console.log('Starting real-time status monitor...\n');

// Start the status monitor
startMonitor();