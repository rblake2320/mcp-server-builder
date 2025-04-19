#!/usr/bin/env node

/**
 * MCP Server Browser CLI
 * 
 * A command-line interface for browsing MCP servers with list view and A-Z filtering.
 * Run with node browse_servers.js
 */

const serverBrowser = require('./utils/server_browser');
const readline = require('readline');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    gray: '\x1b[100m',
  }
};

// Current filter state
const filterState = {
  letter: '',
  type: '',
  keyword: '',
  sortField: 'name',
  sortDirection: 'asc',
  viewMode: 'list' // 'list' or 'az'
};

/**
 * Display the main menu
 */
function showMainMenu() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.cyan}=== MCP Server Browser ===${colors.reset}\n`);
  console.log(`Current view mode: ${colors.fg.green}${filterState.viewMode === 'list' ? 'List View' : 'A-Z View'}${colors.reset}`);
  console.log(`Current filters: ${getFilterSummary()}\n`);
  
  console.log(`${colors.bright}Menu Options:${colors.reset}`);
  console.log(`1. ${colors.fg.yellow}Toggle View Mode${colors.reset} (List / A-Z)`);
  console.log(`2. ${colors.fg.yellow}Filter by Letter${colors.reset}`);
  console.log(`3. ${colors.fg.yellow}Filter by Type${colors.reset} (Template / Example)`);
  console.log(`4. ${colors.fg.yellow}Search by Keyword${colors.reset}`);
  console.log(`5. ${colors.fg.yellow}Change Sort Order${colors.reset} (Name / Language)`);
  console.log(`6. ${colors.fg.yellow}Reset Filters${colors.reset}`);
  console.log(`7. ${colors.fg.yellow}Show Servers${colors.reset} (with current filters)`);
  console.log(`8. ${colors.fg.yellow}View Server Details${colors.reset}`);
  console.log(`9. ${colors.fg.yellow}Exit${colors.reset}`);
  
  rl.question('\nEnter your choice (1-9): ', handleMenuChoice);
}

/**
 * Get a text summary of current filters
 */
function getFilterSummary() {
  const filters = [];
  
  if (filterState.letter) {
    filters.push(`Letter: ${filterState.letter}`);
  }
  
  if (filterState.type) {
    filters.push(`Type: ${filterState.type}`);
  }
  
  if (filterState.keyword) {
    filters.push(`Keyword: "${filterState.keyword}"`);
  }
  
  filters.push(`Sort: ${filterState.sortField} (${filterState.sortDirection})`);
  
  return filters.length > 1
    ? filters.join(', ')
    : 'None';
}

/**
 * Handle main menu choice
 */
function handleMenuChoice(choice) {
  switch (choice) {
    case '1':
      // Toggle view mode
      filterState.viewMode = filterState.viewMode === 'list' ? 'az' : 'list';
      showMainMenu();
      break;
      
    case '2':
      // Filter by letter
      showLetterFilterMenu();
      break;
      
    case '3':
      // Filter by type
      showTypeFilterMenu();
      break;
      
    case '4':
      // Search by keyword
      promptForKeyword();
      break;
      
    case '5':
      // Change sort order
      showSortMenu();
      break;
      
    case '6':
      // Reset filters
      resetFilters();
      showMainMenu();
      break;
      
    case '7':
      // Show servers with current filters
      showServers();
      break;
      
    case '8':
      // View server details
      promptForServerDetails();
      break;
      
    case '9':
      // Exit
      console.log('\nExiting MCP Server Browser. Goodbye!');
      rl.close();
      break;
      
    default:
      console.log(`\n${colors.fg.red}Invalid choice. Please try again.${colors.reset}`);
      setTimeout(showMainMenu, 1500);
  }
}

/**
 * Show A-Z letter filter menu
 */
function showLetterFilterMenu() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.cyan}=== Filter by Starting Letter ===${colors.reset}\n`);
  
  const navigation = serverBrowser.generateAlphabeticalNavigation();
  
  // Display A-Z navigation
  console.log(`${colors.bright}Available Letters:${colors.reset}`);
  
  let output = '';
  navigation.forEach(item => {
    const letterDisplay = item.letter === '#' ? '#' : item.letter;
    const style = item.available
      ? item.count > 0 ? colors.fg.green : colors.fg.yellow
      : colors.fg.gray;
    
    output += `${style}${letterDisplay}${colors.reset}(${item.count}) `;
  });
  
  console.log(output + '\n');
  
  console.log(`${colors.fg.yellow}Enter a letter to filter by, or:${colors.reset}`);
  console.log(`- Enter '0' to clear letter filter`);
  console.log(`- Enter 'b' to go back to the main menu`);
  
  rl.question('\nYour choice: ', answer => {
    answer = answer.trim().toUpperCase();
    
    if (answer === 'B') {
      showMainMenu();
    } else if (answer === '0') {
      filterState.letter = '';
      showMainMenu();
    } else if (answer === '#' || (answer.length === 1 && answer >= 'A' && answer <= 'Z')) {
      filterState.letter = answer;
      showMainMenu();
    } else {
      console.log(`\n${colors.fg.red}Invalid choice. Please enter a letter A-Z, #, 0, or B.${colors.reset}`);
      setTimeout(showLetterFilterMenu, 1500);
    }
  });
}

/**
 * Show type filter menu
 */
function showTypeFilterMenu() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.cyan}=== Filter by Server Type ===${colors.reset}\n`);
  
  console.log(`${colors.bright}Available Types:${colors.reset}`);
  console.log(`1. ${colors.fg.green}Templates${colors.reset} (starter MCP server templates)`);
  console.log(`2. ${colors.fg.green}Examples${colors.reset} (fully implemented example servers)`);
  console.log(`3. ${colors.fg.yellow}Clear type filter${colors.reset}`);
  console.log(`4. ${colors.fg.yellow}Back to main menu${colors.reset}`);
  
  rl.question('\nYour choice (1-4): ', answer => {
    switch (answer) {
      case '1':
        filterState.type = 'template';
        showMainMenu();
        break;
        
      case '2':
        filterState.type = 'example';
        showMainMenu();
        break;
        
      case '3':
        filterState.type = '';
        showMainMenu();
        break;
        
      case '4':
        showMainMenu();
        break;
        
      default:
        console.log(`\n${colors.fg.red}Invalid choice. Please enter 1-4.${colors.reset}`);
        setTimeout(showTypeFilterMenu, 1500);
    }
  });
}

/**
 * Prompt for keyword search
 */
function promptForKeyword() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.cyan}=== Search by Keyword ===${colors.reset}\n`);
  
  console.log(`Enter a keyword to search for in server names, descriptions, and tags.`);
  console.log(`Leave empty and press Enter to clear the keyword filter.\n`);
  
  rl.question('Keyword: ', answer => {
    filterState.keyword = answer.trim();
    showMainMenu();
  });
}

/**
 * Show sort options menu
 */
function showSortMenu() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.cyan}=== Change Sort Order ===${colors.reset}\n`);
  
  console.log(`${colors.bright}Sort Field:${colors.reset}`);
  console.log(`1. ${colors.fg.green}Name${colors.reset}`);
  console.log(`2. ${colors.fg.green}Language${colors.reset}`);
  
  console.log(`\n${colors.bright}Sort Direction:${colors.reset}`);
  console.log(`3. ${colors.fg.green}Ascending (A-Z)${colors.reset}`);
  console.log(`4. ${colors.fg.green}Descending (Z-A)${colors.reset}`);
  
  console.log(`\n5. ${colors.fg.yellow}Back to main menu${colors.reset}`);
  
  rl.question('\nYour choice (1-5): ', answer => {
    switch (answer) {
      case '1':
        filterState.sortField = 'name';
        showMainMenu();
        break;
        
      case '2':
        filterState.sortField = 'language';
        showMainMenu();
        break;
        
      case '3':
        filterState.sortDirection = 'asc';
        showMainMenu();
        break;
        
      case '4':
        filterState.sortDirection = 'desc';
        showMainMenu();
        break;
        
      case '5':
        showMainMenu();
        break;
        
      default:
        console.log(`\n${colors.fg.red}Invalid choice. Please enter 1-5.${colors.reset}`);
        setTimeout(showSortMenu, 1500);
    }
  });
}

/**
 * Reset all filters to default values
 */
function resetFilters() {
  filterState.letter = '';
  filterState.type = '';
  filterState.keyword = '';
  filterState.sortField = 'name';
  filterState.sortDirection = 'asc';
}

/**
 * Show servers based on current filters and view mode
 */
function showServers() {
  console.clear();
  
  if (filterState.viewMode === 'list') {
    showListView();
  } else {
    showAZView();
  }
}

/**
 * Show servers in list view
 */
function showListView() {
  console.log(`${colors.bright}${colors.fg.cyan}=== MCP Servers (List View) ===${colors.reset}\n`);
  
  // Get filtered servers
  const servers = serverBrowser.getServerListView({
    letter: filterState.letter,
    type: filterState.type,
    keyword: filterState.keyword,
    sortField: filterState.sortField,
    sortDirection: filterState.sortDirection
  });
  
  if (servers.length === 0) {
    console.log(`${colors.fg.yellow}No servers match the current filters.${colors.reset}\n`);
  } else {
    console.log(`Found ${colors.fg.green}${servers.length}${colors.reset} servers:\n`);
    
    // Display servers in a table format
    console.log(`${colors.underscore}${colors.bright}ID               Name                                    Language    Type${colors.reset}`);
    
    servers.forEach((server, index) => {
      const serverType = server.type === 'template' 
        ? `${colors.fg.blue}Template${colors.reset}` 
        : `${colors.fg.magenta}Example${colors.reset}`;
      
      // Truncate name if too long
      const name = server.name.length > 40
        ? server.name.substring(0, 37) + '...'
        : server.name;
      
      console.log(
        `${colors.fg.green}${(index + 1).toString().padEnd(3)}${colors.reset}` +
        `${colors.fg.yellow}${server.id.padEnd(16)}${colors.reset}` +
        `${name.padEnd(40)}` +
        `${server.language.padEnd(11)}` +
        `${serverType}`
      );
    });
  }
  
  console.log('\nPress Enter to return to the main menu...');
  rl.question('', () => showMainMenu());
}

/**
 * Show servers in A-Z view
 */
function showAZView() {
  console.log(`${colors.bright}${colors.fg.cyan}=== MCP Servers (A-Z View) ===${colors.reset}\n`);
  
  // Get A-Z view data
  const azView = serverBrowser.getServerAZView({
    type: filterState.type,
    keyword: filterState.keyword
  });
  
  const { navigation, groupedServers } = azView;
  
  // Show A-Z navigation
  console.log(`${colors.bright}Letters:${colors.reset} `);
  
  let navDisplay = '';
  navigation.forEach(item => {
    const letterDisplay = item.letter === '#' ? '#' : item.letter;
    const style = item.available 
      ? (item.count > 0 ? colors.fg.green : colors.fg.yellow) 
      : colors.fg.gray;
    
    navDisplay += `${style}${letterDisplay}${colors.reset}(${item.count}) `;
  });
  
  console.log(navDisplay + '\n');
  
  // Show servers grouped by letter
  let totalServers = 0;
  
  const visibleLetters = Object.keys(groupedServers).sort((a, b) => {
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b);
  });
  
  visibleLetters.forEach(letter => {
    const serversInLetter = groupedServers[letter];
    
    if (serversInLetter && serversInLetter.length > 0) {
      console.log(`${colors.bright}${colors.fg.cyan}${letter === '#' ? 'Other' : letter}${colors.reset} (${serversInLetter.length} servers)`);
      console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
      
      serversInLetter.forEach((server, index) => {
        const serverType = server.type === 'template' 
          ? `${colors.fg.blue}[Template]${colors.reset}` 
          : `${colors.fg.magenta}[Example]${colors.reset}`;
        
        console.log(`${colors.fg.green}${(index + 1).toString().padEnd(3)}${colors.reset}` +
          `${colors.fg.yellow}${server.name}${colors.reset} ` +
          `${colors.dim}(${server.language})${colors.reset} ${serverType}`);
        
        if (server.description) {
          console.log(`${colors.dim}   ${server.description.substring(0, 80)}${server.description.length > 80 ? '...' : ''}${colors.reset}`);
        }
      });
      
      console.log('');
      totalServers += serversInLetter.length;
    }
  });
  
  if (totalServers === 0) {
    console.log(`${colors.fg.yellow}No servers match the current filters.${colors.reset}\n`);
  } else {
    console.log(`${colors.bright}Total: ${colors.fg.green}${totalServers}${colors.reset} servers\n`);
  }
  
  console.log('Press Enter to return to the main menu...');
  rl.question('', () => showMainMenu());
}

/**
 * Prompt for server details
 */
function promptForServerDetails() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.cyan}=== View Server Details ===${colors.reset}\n`);
  
  // Get all servers
  const servers = serverBrowser.getAllServers();
  
  if (servers.length === 0) {
    console.log(`${colors.fg.yellow}No servers available.${colors.reset}\n`);
    console.log('Press Enter to return to the main menu...');
    rl.question('', () => showMainMenu());
    return;
  }
  
  console.log(`Enter the ID of the server you want to view:\n`);
  
  // Show a simplified list of servers
  servers.forEach((server, index) => {
    console.log(`${colors.fg.green}${server.id}${colors.reset}: ${server.name}`);
  });
  
  console.log(`\n${colors.fg.yellow}Enter 'b' to go back to the main menu${colors.reset}`);
  
  rl.question('\nServer ID: ', answer => {
    answer = answer.trim();
    
    if (answer.toLowerCase() === 'b') {
      showMainMenu();
      return;
    }
    
    const server = servers.find(s => s.id === answer);
    
    if (!server) {
      console.log(`\n${colors.fg.red}Server with ID "${answer}" not found.${colors.reset}`);
      setTimeout(() => promptForServerDetails(), 1500);
      return;
    }
    
    showServerDetails(server);
  });
}

/**
 * Show detailed information about a server
 */
function showServerDetails(server) {
  console.clear();
  console.log(`${colors.bright}${colors.fg.cyan}=== Server Details: ${server.name} ===${colors.reset}\n`);
  
  console.log(`${colors.bright}ID:${colors.reset} ${colors.fg.yellow}${server.id}${colors.reset}`);
  console.log(`${colors.bright}Name:${colors.reset} ${server.name}`);
  console.log(`${colors.bright}Type:${colors.reset} ${server.type === 'template' ? colors.fg.blue + 'Template' : colors.fg.magenta + 'Example'}${colors.reset}`);
  console.log(`${colors.bright}Language:${colors.reset} ${server.language}`);
  console.log(`${colors.bright}Path:${colors.reset} ${server.path}`);
  console.log(`${colors.bright}Author:${colors.reset} ${server.author || 'Unknown'}`);
  
  if (server.description) {
    console.log(`\n${colors.bright}Description:${colors.reset}\n${server.description}`);
  }
  
  if (server.tags && server.tags.length > 0) {
    console.log(`\n${colors.bright}Tags:${colors.reset}`);
    console.log(server.tags.map(tag => `${colors.fg.green}${tag}${colors.reset}`).join(', '));
  }
  
  if (server.requirements && server.requirements.length > 0) {
    console.log(`\n${colors.bright}Requirements:${colors.reset}`);
    console.log(server.requirements.join(', '));
  }
  
  if (server.tools && server.tools.length > 0) {
    console.log(`\n${colors.bright}Tools:${colors.reset}`);
    server.tools.forEach(tool => {
      console.log(`- ${colors.fg.yellow}${tool}${colors.reset}`);
    });
  }
  
  console.log('\nPress Enter to return to the main menu...');
  rl.question('', () => showMainMenu());
}

// Start the browser
console.clear();
console.log(`${colors.bright}${colors.fg.cyan}Welcome to the MCP Server Browser!${colors.reset}\n`);
console.log('Loading server data...');

setTimeout(() => {
  showMainMenu();
}, 500);