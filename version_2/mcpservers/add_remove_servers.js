/**
 * MCP Server Add/Remove Simulator
 * 
 * This utility simulates adding and removing servers in real-time
 * to test the status monitor's ability to track changes.
 * 
 * Usage: node add_remove_servers.js --add=100 --remove=50
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import generateBulkServers from './generate_bulk_servers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to server index
const SERVER_INDEX_PATH = path.join(__dirname, 'server_index.json');

// Add servers
async function addServers(count) {
  try {
    console.log(chalk.blue(`Adding ${count} new MCP servers...`));
    
    // Use the bulk generator to add servers
    await generateBulkServers(count);
    
    console.log(chalk.green(`✓ Successfully added ${count} new MCP servers`));
  } catch (error) {
    console.error(chalk.red('Error adding servers:'), error);
    throw error;
  }
}

// Remove servers
async function removeServers(count) {
  try {
    console.log(chalk.yellow(`Removing ${count} MCP servers...`));
    
    // Load existing server index
    let serverIndex = {};
    if (fs.existsSync(SERVER_INDEX_PATH)) {
      serverIndex = await fs.readJson(SERVER_INDEX_PATH);
    } else {
      console.log(chalk.red('Server index not found. Nothing to remove.'));
      return;
    }
    
    // Count total servers
    const totalServers = serverIndex.templates.length + 
                        serverIndex.examples.length + 
                        serverIndex.imported.length;
    
    // Check if we have enough servers to remove
    if (count > totalServers) {
      console.log(chalk.yellow(`Cannot remove ${count} servers, only ${totalServers} available. Removing all.`));
      count = totalServers;
    }
    
    // Prioritize removing from imported servers first
    let remainingToRemove = count;
    
    if (remainingToRemove > 0 && serverIndex.imported.length > 0) {
      const removeFromImported = Math.min(remainingToRemove, serverIndex.imported.length);
      serverIndex.imported = serverIndex.imported.slice(0, serverIndex.imported.length - removeFromImported);
      remainingToRemove -= removeFromImported;
      console.log(chalk.gray(`Removed ${removeFromImported} imported servers`));
    }
    
    if (remainingToRemove > 0 && serverIndex.examples.length > 0) {
      const removeFromExamples = Math.min(remainingToRemove, serverIndex.examples.length);
      serverIndex.examples = serverIndex.examples.slice(0, serverIndex.examples.length - removeFromExamples);
      remainingToRemove -= removeFromExamples;
      console.log(chalk.gray(`Removed ${removeFromExamples} example servers`));
    }
    
    if (remainingToRemove > 0 && serverIndex.templates.length > 0) {
      const removeFromTemplates = Math.min(remainingToRemove, serverIndex.templates.length);
      serverIndex.templates = serverIndex.templates.slice(0, serverIndex.templates.length - removeFromTemplates);
      remainingToRemove -= removeFromTemplates;
      console.log(chalk.gray(`Removed ${removeFromTemplates} template servers`));
    }
    
    // Save the updated server index
    await fs.writeJson(SERVER_INDEX_PATH, serverIndex, { spaces: 2 });
    
    const remainingTotal = serverIndex.templates.length + 
                          serverIndex.examples.length + 
                          serverIndex.imported.length;
    
    console.log(chalk.green(`✓ Successfully removed ${count} MCP servers`));
    console.log(chalk.blue(`Total servers remaining: ${remainingTotal}`));
  } catch (error) {
    console.error(chalk.red('Error removing servers:'), error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    add: 0,
    remove: 0
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--add=')) {
      const addCount = parseInt(arg.substring(6), 10);
      if (!isNaN(addCount) && addCount > 0) {
        options.add = addCount;
      }
    } else if (arg.startsWith('--remove=')) {
      const removeCount = parseInt(arg.substring(9), 10);
      if (!isNaN(removeCount) && removeCount > 0) {
        options.remove = removeCount;
      }
    }
  });
  
  return options;
}

// Run if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArgs();
  
  // Perform the operations
  async function run() {
    try {
      if (options.add > 0) {
        await addServers(options.add);
      }
      
      if (options.remove > 0) {
        await removeServers(options.remove);
      }
      
      // If no options specified, show help
      if (options.add === 0 && options.remove === 0) {
        console.log(chalk.cyan('MCP Server Add/Remove Simulator'));
        console.log(chalk.cyan('================================'));
        console.log('');
        console.log('This utility allows you to add or remove servers to test real-time updates');
        console.log('');
        console.log('Usage:');
        console.log('  node add_remove_servers.js --add=100 --remove=50');
        console.log('');
        console.log('Options:');
        console.log('  --add=N     Add N new servers');
        console.log('  --remove=N  Remove N existing servers');
        console.log('');
        console.log('Examples:');
        console.log('  node add_remove_servers.js --add=100');
        console.log('  node add_remove_servers.js --remove=50');
        console.log('  node add_remove_servers.js --add=100 --remove=50');
      }
    } catch (error) {
      console.error('Operation failed:', error);
      process.exit(1);
    }
  }
  
  run();
}

export { addServers, removeServers };