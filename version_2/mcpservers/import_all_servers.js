/**
 * MCP Server Bulk Import Utility
 * 
 * This utility helps import thousands of MCP servers from various sources
 * including GitHub, Smithery.ai, and Context7.
 * 
 * Usage:
 *   node import_all_servers.js --source=all --count=5000
 *   node import_all_servers.js --source=github --count=1000
 *   node import_all_servers.js --source=smithery --count=2000
 *   node import_all_servers.js --source=context7 --count=3000
 */

const { importBulkServers } = require('./utils/server_importer');
const { importInBatches } = require('./utils/context7_importer');
const fs = require('fs-extra');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  source: 'all',
  count: 5000,
  batchSize: 100
};

// Parse arguments
args.forEach(arg => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  if (key === 'source') {
    options.source = value;
  } else if (key === 'count') {
    options.count = parseInt(value, 10);
  } else if (key === 'batch-size') {
    options.batchSize = parseInt(value, 10);
  }
});

// Validate options
if (isNaN(options.count) || options.count <= 0) {
  console.error('Invalid count value. Using default: 5000');
  options.count = 5000;
}

if (isNaN(options.batchSize) || options.batchSize <= 0) {
  console.error('Invalid batch size. Using default: 100');
  options.batchSize = 100;
}

// Print start message
console.log('================================');
console.log('MCP Server Bulk Import Utility');
console.log('================================');
console.log(`Source: ${options.source}`);
console.log(`Count: ${options.count}`);
console.log(`Batch Size: ${options.batchSize}`);
console.log('================================\n');

// Ensure the imported directory exists
const importedDir = path.join(__dirname, 'imported');
fs.ensureDirSync(importedDir);

// Function to perform all imports
async function performImports() {
  const startTime = Date.now();
  let totalImported = 0;

  try {
    if (options.source === 'all' || options.source === 'github') {
      console.log('\n=== Importing from GitHub ===\n');
      
      // Allocate count proportionally when importing from all sources
      const githubCount = options.source === 'all' 
        ? Math.floor(options.count / 3) 
        : options.count;
      
      const githubServers = await importBulkServers({
        githubCount,
        smitheryCount: 0,
        customCount: 0
      });
      
      totalImported += githubServers.length;
      console.log(`Imported ${githubServers.length} servers from GitHub`);
    }

    if (options.source === 'all' || options.source === 'smithery') {
      console.log('\n=== Importing from Smithery.ai ===\n');
      
      // Allocate count proportionally when importing from all sources
      const smitheryCount = options.source === 'all' 
        ? Math.floor(options.count / 3) 
        : options.count;
      
      const smitheryServers = await importBulkServers({
        githubCount: 0,
        smitheryCount,
        customCount: 0
      });
      
      totalImported += smitheryServers.length;
      console.log(`Imported ${smitheryServers.length} servers from Smithery.ai`);
    }

    if (options.source === 'all' || options.source === 'context7') {
      console.log('\n=== Importing from Context7 ===\n');
      
      // Allocate count proportionally when importing from all sources
      const context7Count = options.source === 'all' 
        ? Math.floor(options.count / 3) 
        : options.count;
      
      const context7Servers = await importInBatches({
        totalCount: context7Count,
        batchSize: options.batchSize
      });
      
      totalImported += context7Servers.length;
      console.log(`Imported ${context7Servers.length} documentation servers from Context7`);
    }

    // Display summary
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n================================');
    console.log('Import Summary');
    console.log('================================');
    console.log(`Total servers imported: ${totalImported}`);
    console.log(`Time taken: ${duration.toFixed(2)} seconds`);
    console.log('================================');
    
  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Run the imports
performImports().catch(error => {
  console.error('Fatal error during import:', error);
  process.exit(1);
});