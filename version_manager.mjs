#!/usr/bin/env node

/**
 * MCP Server Builder Version Manager
 * 
 * This utility helps manage different versions of the MCP Server Builder.
 * It allows for:
 * - Creating a new version from the current state
 * - Switching between versions
 * - Comparing versions
 * - Reverting to a previous version
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Version metadata file
const VERSIONS_FILE = 'versions.json';

// Initialize versions database if it doesn't exist
if (!fs.existsSync(VERSIONS_FILE)) {
  fs.writeJsonSync(VERSIONS_FILE, {
    current: 'version_1',
    versions: {
      version_1: {
        name: 'Initial Version',
        created: new Date().toISOString(),
        description: 'Original MCP Server Builder implementation',
        path: '.'
      }
    }
  });
}

// Load versions data
let versionsData = fs.readJsonSync(VERSIONS_FILE);

/**
 * Create a new version
 */
async function createVersion() {
  const versionNumber = Object.keys(versionsData.versions).length + 1;
  const versionName = `version_${versionNumber}`;
  const versionPath = path.join('.', versionName);
  
  console.log(`\nCreating new version: ${versionName}`);
  
  // Get version description from user
  const description = await askQuestion('Enter description for this version: ');
  
  // Create version directory if it doesn't exist
  if (!fs.existsSync(versionPath)) {
    fs.mkdirSync(versionPath, { recursive: true });
  }
  
  console.log('\nCopying files to new version directory...');
  
  // Copy essential directories and files
  const directoriesToCopy = [
    'client',
    'server',
    'shared',
    'public',
    'mcpservers',
    'mcpservers_backup'
  ];
  
  const filesToCopy = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'postcss.config.js',
    'theme.json',
    '.env.example',
    'drizzle.config.ts'
  ];
  
  // Copy directories
  for (const dir of directoriesToCopy) {
    if (fs.existsSync(dir)) {
      console.log(`Copying ${dir}...`);
      fs.copySync(dir, path.join(versionPath, dir), {
        filter: (src) => !src.includes('node_modules')
      });
    }
  }
  
  // Copy files
  for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
      console.log(`Copying ${file}...`);
      fs.copySync(file, path.join(versionPath, file));
    }
  }
  
  // Create a snapshot of current version info
  versionsData.versions[versionName] = {
    name: `Version ${versionNumber}`,
    created: new Date().toISOString(),
    description,
    path: versionPath
  };
  
  // Save updated versions data
  fs.writeJsonSync(VERSIONS_FILE, versionsData, { spaces: 2 });
  
  console.log(`\nVersion ${versionName} created successfully!`);
  console.log(`To work with this version, use: node version_manager.mjs switch ${versionName}`);
}

/**
 * Switch to a different version
 */
function switchVersion(versionName) {
  if (!versionsData.versions[versionName]) {
    console.error(`Version ${versionName} does not exist!`);
    return;
  }
  
  const versionPath = versionsData.versions[versionName].path;
  
  console.log(`\nSwitching to version: ${versionName}`);
  console.log(`Version path: ${versionPath}`);
  console.log(`Description: ${versionsData.versions[versionName].description}`);
  
  // Update current version in versions data
  versionsData.current = versionName;
  fs.writeJsonSync(VERSIONS_FILE, versionsData, { spaces: 2 });
  
  console.log(`\nSuccessfully switched to ${versionName}!`);
  console.log('Please note: You should restart your development server.');
}

/**
 * List all available versions
 */
function listVersions() {
  console.log('\nAvailable Versions:');
  console.log('------------------');
  
  Object.entries(versionsData.versions).forEach(([key, version]) => {
    const isCurrent = key === versionsData.current ? '* ' : '  ';
    console.log(`${isCurrent}${key} - ${version.name} (${new Date(version.created).toLocaleDateString()})`);
    console.log(`   Description: ${version.description}`);
    console.log(`   Path: ${version.path}`);
    console.log('');
  });
  
  console.log(`\nCurrent version: ${versionsData.current}`);
}

/**
 * Provide information about how to use each version
 */
function showHelp() {
  console.log('\nMCP Server Builder Version Manager');
  console.log('================================');
  console.log('\nCommands:');
  console.log('  create              - Create a new version from the current state');
  console.log('  switch <version>    - Switch to a different version');
  console.log('  list                - List all available versions');
  console.log('  current             - Show current version');
  console.log('  help                - Show this help message');
  console.log('\nExample usage:');
  console.log('  node version_manager.mjs create');
  console.log('  node version_manager.mjs switch version_2');
  console.log('  node version_manager.mjs list');
}

/**
 * Show current version
 */
function showCurrentVersion() {
  const current = versionsData.current;
  const version = versionsData.versions[current];
  
  console.log('\nCurrent Version:');
  console.log('---------------');
  console.log(`Version: ${current}`);
  console.log(`Name: ${version.name}`);
  console.log(`Created: ${new Date(version.created).toLocaleString()}`);
  console.log(`Description: ${version.description}`);
  console.log(`Path: ${version.path}`);
}

/**
 * Ask a question and get user input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Main function to parse command line arguments and execute commands
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    showHelp();
    rl.close();
    return;
  }
  
  switch (command) {
    case 'create':
      await createVersion();
      break;
      
    case 'switch':
      const versionToSwitch = args[1];
      if (!versionToSwitch) {
        console.error('Error: Please specify a version to switch to.');
        console.log('Available versions:');
        Object.keys(versionsData.versions).forEach(v => console.log(`  ${v}`));
      } else {
        switchVersion(versionToSwitch);
      }
      break;
      
    case 'list':
      listVersions();
      break;
      
    case 'current':
      showCurrentVersion();
      break;
      
    case 'help':
      showHelp();
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
  }
  
  rl.close();
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  rl.close();
});