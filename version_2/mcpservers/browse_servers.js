/**
 * MCP Server Browser
 * 
 * This utility provides an interactive command-line interface for browsing
 * through the collection of MCP servers.
 * 
 * Features:
 * - List view of all servers
 * - A-Z filtering options
 * - Search by keyword
 * - Filter by type (template, example, imported)
 * - Sort by name, category, or language
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

// Path to server index
const SERVER_INDEX_PATH = path.join(__dirname, 'server_index.json');

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for formatting
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
    crimson: '\x1b[38m'
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
    crimson: '\x1b[48m'
  }
};

// Load server index
function loadServerIndex() {
  try {
    if (fs.existsSync(SERVER_INDEX_PATH)) {
      return fs.readJsonSync(SERVER_INDEX_PATH);
    }
  } catch (error) {
    console.error('Error loading server index:', error.message);
  }
  
  // Return default structure if file doesn't exist or there's an error
  return {
    templates: [],
    examples: [],
    imported: []
  };
}

// Get all servers from the index
function getAllServers() {
  const index = loadServerIndex();
  
  return [
    ...index.templates.map(server => ({ ...server, type: 'template' })),
    ...index.examples.map(server => ({ ...server, type: 'example' })),
    ...(index.imported || []).map(server => ({ ...server, type: 'imported' }))
  ];
}

// Get all available categories
function getAllCategories() {
  const servers = getAllServers();
  const categories = new Set();
  
  servers.forEach(server => {
    if (server.category) {
      categories.add(server.category);
    }
  });
  
  return Array.from(categories).sort();
}

// Get all available languages
function getAllLanguages() {
  const servers = getAllServers();
  const languages = new Set();
  
  servers.forEach(server => {
    if (server.language) {
      languages.add(server.language);
    }
  });
  
  return Array.from(languages).sort();
}

// Filter servers by various criteria
function filterServers(servers, filters = {}) {
  return servers.filter(server => {
    // Filter by type
    if (filters.type && server.type !== filters.type) {
      return false;
    }
    
    // Filter by starting letter
    if (filters.startLetter) {
      if (filters.startLetter === '#') {
        // Non-alphabetic servers
        const firstChar = server.name.charAt(0).toLowerCase();
        if (firstChar >= 'a' && firstChar <= 'z') {
          return false;
        }
      } else {
        // Specific letter
        const firstChar = server.name.charAt(0).toLowerCase();
        if (firstChar !== filters.startLetter.toLowerCase()) {
          return false;
        }
      }
    }
    
    // Filter by category
    if (filters.category && server.category !== filters.category) {
      return false;
    }
    
    // Filter by language
    if (filters.language && server.language !== filters.language) {
      return false;
    }
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesName = server.name.toLowerCase().includes(searchTerm);
      const matchesDescription = (server.description || '').toLowerCase().includes(searchTerm);
      const matchesCategory = (server.category || '').toLowerCase().includes(searchTerm);
      const matchesTags = (server.tags || []).some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      
      if (!(matchesName || matchesDescription || matchesCategory || matchesTags)) {
        return false;
      }
    }
    
    // All filters passed
    return true;
  });
}

// Sort servers by different criteria
function sortServers(servers, sortBy = 'name') {
  return [...servers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      
      case 'language':
        return (a.language || '').localeCompare(b.language || '');
      
      case 'type':
        return a.type.localeCompare(b.type);
      
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

// Display servers in a list view
function displayListView(servers, page = 1, pageSize = 10) {
  const totalServers = servers.length;
  const totalPages = Math.ceil(totalServers / pageSize);
  
  // Ensure page is within valid range
  page = Math.max(1, Math.min(page, totalPages));
  
  // Calculate slice for current page
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalServers);
  const pageServers = servers.slice(startIndex, endIndex);
  
  // Clear screen
  console.clear();
  
  // Print header
  console.log('');
  console.log(`${colors.bright}${colors.fg.cyan}MCP Servers Collection${colors.reset}`);
  console.log(`${colors.dim}Showing ${startIndex + 1}-${endIndex} of ${totalServers} servers${colors.reset}`);
  console.log('');
  
  // Print servers
  pageServers.forEach((server, index) => {
    const number = startIndex + index + 1;
    const typeColor = server.type === 'template' 
      ? colors.fg.green 
      : server.type === 'example' 
        ? colors.fg.yellow 
        : colors.fg.blue;
    
    console.log(`${colors.bright}${number}. ${server.name}${colors.reset}`);
    console.log(`   ${colors.dim}${server.description || 'No description'}${colors.reset}`);
    console.log(`   ${typeColor}${server.type}${colors.reset} | ${colors.fg.magenta}${server.category || 'uncategorized'}${colors.reset} | ${colors.fg.cyan}${server.language || 'unknown'}${colors.reset}`);
    
    // Print tags if available
    if (server.tags && server.tags.length > 0) {
      console.log(`   ${colors.dim}Tags: ${server.tags.join(', ')}${colors.reset}`);
    }
    
    console.log('');
  });
  
  // Print pagination info
  console.log(`${colors.dim}Page ${page}/${totalPages}${colors.reset}`);
  console.log('');
  
  // Print commands
  console.log(`${colors.bright}Commands:${colors.reset}`);
  console.log(`  ${colors.fg.green}n${colors.reset} - Next page`);
  console.log(`  ${colors.fg.green}p${colors.reset} - Previous page`);
  console.log(`  ${colors.fg.green}f${colors.reset} - Filter options`);
  console.log(`  ${colors.fg.green}s${colors.reset} - Sort options`);
  console.log(`  ${colors.fg.green}v${colors.reset} - View modes`);
  console.log(`  ${colors.fg.green}q${colors.reset} - Quit`);
  console.log('');
  
  return { page, totalPages };
}

// Display servers in A-Z view
function displayAZView(servers) {
  // Group servers by first letter
  const groups = {};
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Initialize all letter groups
  alphabet.forEach(letter => {
    groups[letter] = [];
  });
  
  // Add a group for non-alphabetic servers
  groups['#'] = [];
  
  // Categorize servers by first letter
  servers.forEach(server => {
    const firstChar = server.name.charAt(0).toUpperCase();
    if (alphabet.includes(firstChar)) {
      groups[firstChar].push(server);
    } else {
      groups['#'].push(server);
    }
  });
  
  // Clear screen
  console.clear();
  
  // Print header
  console.log('');
  console.log(`${colors.bright}${colors.fg.cyan}MCP Servers Collection - A-Z View${colors.reset}`);
  console.log(`${colors.dim}Total: ${servers.length} servers${colors.reset}`);
  console.log('');
  
  // Print letter index
  console.log(`${colors.bright}Index:${colors.reset}`);
  
  // Create two rows of alphabet
  const firstRow = alphabet.slice(0, 13);
  const secondRow = alphabet.slice(13);
  
  const firstRowStr = firstRow.map(letter => {
    const count = groups[letter].length;
    return count > 0
      ? `${colors.fg.green}${letter}${colors.reset}:${count}`
      : `${colors.dim}${letter}${colors.reset}:0`;
  }).join(' ');
  
  const secondRowStr = secondRow.map(letter => {
    const count = groups[letter].length;
    return count > 0
      ? `${colors.fg.green}${letter}${colors.reset}:${count}`
      : `${colors.dim}${letter}${colors.reset}:0`;
  }).join(' ');
  
  const numCount = groups['#'].length;
  const numStr = numCount > 0
    ? `${colors.fg.green}#${colors.reset}:${numCount}`
    : `${colors.dim}#${colors.reset}:0`;
  
  console.log(`  ${firstRowStr}`);
  console.log(`  ${secondRowStr}`);
  console.log(`  ${numStr} (non-alphabetic)`);
  console.log('');
  
  // Print commands
  console.log(`${colors.bright}Commands:${colors.reset}`);
  console.log(`  ${colors.fg.green}[A-Z]${colors.reset} - Show servers starting with letter`);
  console.log(`  ${colors.fg.green}#${colors.reset} - Show non-alphabetic servers`);
  console.log(`  ${colors.fg.green}f${colors.reset} - Filter options`);
  console.log(`  ${colors.fg.green}s${colors.reset} - Sort options`);
  console.log(`  ${colors.fg.green}v${colors.reset} - View modes`);
  console.log(`  ${colors.fg.green}q${colors.reset} - Quit`);
  console.log('');
  
  return { groups };
}

// Show filter options
function showFilterOptions() {
  // Clear screen
  console.clear();
  
  // Print header
  console.log('');
  console.log(`${colors.bright}${colors.fg.cyan}Filter Options${colors.reset}`);
  console.log('');
  
  // Get categories and languages
  const categories = getAllCategories();
  const languages = getAllLanguages();
  
  // Print filter options
  console.log(`${colors.bright}Filter by Type:${colors.reset}`);
  console.log(`  ${colors.fg.green}t${colors.reset} - Templates only`);
  console.log(`  ${colors.fg.green}e${colors.reset} - Examples only`);
  console.log(`  ${colors.fg.green}i${colors.reset} - Imported only`);
  console.log(`  ${colors.fg.green}a${colors.reset} - All types (clear filter)`);
  console.log('');
  
  console.log(`${colors.bright}Filter by Category:${colors.reset}`);
  categories.forEach((category, index) => {
    console.log(`  ${colors.fg.green}c${index + 1}${colors.reset} - ${category}`);
  });
  console.log(`  ${colors.fg.green}c0${colors.reset} - Clear category filter`);
  console.log('');
  
  console.log(`${colors.bright}Filter by Language:${colors.reset}`);
  languages.forEach((language, index) => {
    console.log(`  ${colors.fg.green}l${index + 1}${colors.reset} - ${language}`);
  });
  console.log(`  ${colors.fg.green}l0${colors.reset} - Clear language filter`);
  console.log('');
  
  console.log(`${colors.bright}Search:${colors.reset}`);
  console.log(`  ${colors.fg.green}s${colors.reset} - Search by keyword`);
  console.log(`  ${colors.fg.green}sc${colors.reset} - Clear search filter`);
  console.log('');
  
  console.log(`${colors.fg.green}b${colors.reset} - Back to server list`);
  console.log('');
  
  return { categories, languages };
}

// Show sort options
function showSortOptions() {
  // Clear screen
  console.clear();
  
  // Print header
  console.log('');
  console.log(`${colors.bright}${colors.fg.cyan}Sort Options${colors.reset}`);
  console.log('');
  
  // Print sort options
  console.log(`${colors.fg.green}n${colors.reset} - Sort by name`);
  console.log(`${colors.fg.green}c${colors.reset} - Sort by category`);
  console.log(`${colors.fg.green}l${colors.reset} - Sort by language`);
  console.log(`${colors.fg.green}t${colors.reset} - Sort by type`);
  console.log('');
  
  console.log(`${colors.fg.green}b${colors.reset} - Back to server list`);
  console.log('');
}

// Show view mode options
function showViewModeOptions() {
  // Clear screen
  console.clear();
  
  // Print header
  console.log('');
  console.log(`${colors.bright}${colors.fg.cyan}View Mode Options${colors.reset}`);
  console.log('');
  
  // Print view mode options
  console.log(`${colors.fg.green}l${colors.reset} - List view`);
  console.log(`${colors.fg.green}a${colors.reset} - A-Z view`);
  console.log('');
  
  console.log(`${colors.fg.green}b${colors.reset} - Back to current view`);
  console.log('');
}

// Main browser function
async function browseMCPServers() {
  let currentView = 'list'; // 'list' or 'az'
  let currentPage = 1;
  let pageSize = 10;
  
  let filters = {};
  let sortBy = 'name';
  
  let currentLetter = null;
  
  const allServers = getAllServers();
  let filteredServers = [...allServers];
  
  let running = true;
  
  // Initial display
  let displayState = currentView === 'list'
    ? displayListView(filteredServers, currentPage, pageSize)
    : displayAZView(filteredServers);
  
  while (running) {
    // Get command from user
    const command = await new Promise(resolve => {
      rl.question('Enter command: ', answer => {
        resolve(answer.trim().toLowerCase());
      });
    });
    
    // Process command
    if (command === 'q') {
      // Quit
      running = false;
    } else if (currentView === 'list') {
      // List view commands
      if (command === 'n') {
        // Next page
        currentPage = Math.min(currentPage + 1, displayState.totalPages);
        displayState = displayListView(filteredServers, currentPage, pageSize);
      } else if (command === 'p') {
        // Previous page
        currentPage = Math.max(currentPage - 1, 1);
        displayState = displayListView(filteredServers, currentPage, pageSize);
      } else if (command === 'f') {
        // Filter options
        const filterOptions = showFilterOptions();
        
        const filterCommand = await new Promise(resolve => {
          rl.question('Enter filter command: ', answer => {
            resolve(answer.trim().toLowerCase());
          });
        });
        
        if (filterCommand === 'b') {
          // Back to list
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (filterCommand === 't') {
          // Templates only
          filters.type = 'template';
          filteredServers = filterServers(allServers, filters);
          currentPage = 1;
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (filterCommand === 'e') {
          // Examples only
          filters.type = 'example';
          filteredServers = filterServers(allServers, filters);
          currentPage = 1;
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (filterCommand === 'i') {
          // Imported only
          filters.type = 'imported';
          filteredServers = filterServers(allServers, filters);
          currentPage = 1;
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (filterCommand === 'a') {
          // All types
          delete filters.type;
          filteredServers = filterServers(allServers, filters);
          currentPage = 1;
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (filterCommand.startsWith('c')) {
          // Category filter
          const categoryIndex = parseInt(filterCommand.substring(1), 10);
          
          if (categoryIndex === 0) {
            // Clear category filter
            delete filters.category;
          } else if (categoryIndex > 0 && categoryIndex <= filterOptions.categories.length) {
            // Set category filter
            filters.category = filterOptions.categories[categoryIndex - 1];
          }
          
          filteredServers = filterServers(allServers, filters);
          currentPage = 1;
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (filterCommand.startsWith('l')) {
          // Language filter
          const languageIndex = parseInt(filterCommand.substring(1), 10);
          
          if (languageIndex === 0) {
            // Clear language filter
            delete filters.language;
          } else if (languageIndex > 0 && languageIndex <= filterOptions.languages.length) {
            // Set language filter
            filters.language = filterOptions.languages[languageIndex - 1];
          }
          
          filteredServers = filterServers(allServers, filters);
          currentPage = 1;
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (filterCommand === 's') {
          // Search by keyword
          const searchTerm = await new Promise(resolve => {
            rl.question('Enter search term: ', answer => {
              resolve(answer.trim());
            });
          });
          
          if (searchTerm) {
            filters.search = searchTerm;
            filteredServers = filterServers(allServers, filters);
            currentPage = 1;
            displayState = displayListView(filteredServers, currentPage, pageSize);
          }
        } else if (filterCommand === 'sc') {
          // Clear search filter
          delete filters.search;
          filteredServers = filterServers(allServers, filters);
          currentPage = 1;
          displayState = displayListView(filteredServers, currentPage, pageSize);
        }
      } else if (command === 's') {
        // Sort options
        showSortOptions();
        
        const sortCommand = await new Promise(resolve => {
          rl.question('Enter sort command: ', answer => {
            resolve(answer.trim().toLowerCase());
          });
        });
        
        if (sortCommand === 'b') {
          // Back to list
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (sortCommand === 'n') {
          // Sort by name
          sortBy = 'name';
          filteredServers = sortServers(filteredServers, sortBy);
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (sortCommand === 'c') {
          // Sort by category
          sortBy = 'category';
          filteredServers = sortServers(filteredServers, sortBy);
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (sortCommand === 'l') {
          // Sort by language
          sortBy = 'language';
          filteredServers = sortServers(filteredServers, sortBy);
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (sortCommand === 't') {
          // Sort by type
          sortBy = 'type';
          filteredServers = sortServers(filteredServers, sortBy);
          displayState = displayListView(filteredServers, currentPage, pageSize);
        }
      } else if (command === 'v') {
        // View modes
        showViewModeOptions();
        
        const viewCommand = await new Promise(resolve => {
          rl.question('Enter view command: ', answer => {
            resolve(answer.trim().toLowerCase());
          });
        });
        
        if (viewCommand === 'b') {
          // Back to current view
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (viewCommand === 'l') {
          // List view
          currentView = 'list';
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (viewCommand === 'a') {
          // A-Z view
          currentView = 'az';
          displayState = displayAZView(filteredServers);
        }
      }
    } else if (currentView === 'az') {
      // A-Z view commands
      if (command === 'f') {
        // Filter options
        const filterOptions = showFilterOptions();
        
        const filterCommand = await new Promise(resolve => {
          rl.question('Enter filter command: ', answer => {
            resolve(answer.trim().toLowerCase());
          });
        });
        
        if (filterCommand === 'b') {
          // Back to A-Z view
          displayState = displayAZView(filteredServers);
        } else if (filterCommand === 't') {
          // Templates only
          filters.type = 'template';
          filteredServers = filterServers(allServers, filters);
          displayState = displayAZView(filteredServers);
        } else if (filterCommand === 'e') {
          // Examples only
          filters.type = 'example';
          filteredServers = filterServers(allServers, filters);
          displayState = displayAZView(filteredServers);
        } else if (filterCommand === 'i') {
          // Imported only
          filters.type = 'imported';
          filteredServers = filterServers(allServers, filters);
          displayState = displayAZView(filteredServers);
        } else if (filterCommand === 'a') {
          // All types
          delete filters.type;
          filteredServers = filterServers(allServers, filters);
          displayState = displayAZView(filteredServers);
        } else if (filterCommand.startsWith('c')) {
          // Category filter
          const categoryIndex = parseInt(filterCommand.substring(1), 10);
          
          if (categoryIndex === 0) {
            // Clear category filter
            delete filters.category;
          } else if (categoryIndex > 0 && categoryIndex <= filterOptions.categories.length) {
            // Set category filter
            filters.category = filterOptions.categories[categoryIndex - 1];
          }
          
          filteredServers = filterServers(allServers, filters);
          displayState = displayAZView(filteredServers);
        } else if (filterCommand.startsWith('l')) {
          // Language filter
          const languageIndex = parseInt(filterCommand.substring(1), 10);
          
          if (languageIndex === 0) {
            // Clear language filter
            delete filters.language;
          } else if (languageIndex > 0 && languageIndex <= filterOptions.languages.length) {
            // Set language filter
            filters.language = filterOptions.languages[languageIndex - 1];
          }
          
          filteredServers = filterServers(allServers, filters);
          displayState = displayAZView(filteredServers);
        } else if (filterCommand === 's') {
          // Search by keyword
          const searchTerm = await new Promise(resolve => {
            rl.question('Enter search term: ', answer => {
              resolve(answer.trim());
            });
          });
          
          if (searchTerm) {
            filters.search = searchTerm;
            filteredServers = filterServers(allServers, filters);
            displayState = displayAZView(filteredServers);
          }
        } else if (filterCommand === 'sc') {
          // Clear search filter
          delete filters.search;
          filteredServers = filterServers(allServers, filters);
          displayState = displayAZView(filteredServers);
        }
      } else if (command === 's') {
        // Sort options
        showSortOptions();
        
        const sortCommand = await new Promise(resolve => {
          rl.question('Enter sort command: ', answer => {
            resolve(answer.trim().toLowerCase());
          });
        });
        
        if (sortCommand === 'b') {
          // Back to A-Z view
          displayState = displayAZView(filteredServers);
        } else if (sortCommand === 'n') {
          // Sort by name
          sortBy = 'name';
          filteredServers = sortServers(filteredServers, sortBy);
          displayState = displayAZView(filteredServers);
        } else if (sortCommand === 'c') {
          // Sort by category
          sortBy = 'category';
          filteredServers = sortServers(filteredServers, sortBy);
          displayState = displayAZView(filteredServers);
        } else if (sortCommand === 'l') {
          // Sort by language
          sortBy = 'language';
          filteredServers = sortServers(filteredServers, sortBy);
          displayState = displayAZView(filteredServers);
        } else if (sortCommand === 't') {
          // Sort by type
          sortBy = 'type';
          filteredServers = sortServers(filteredServers, sortBy);
          displayState = displayAZView(filteredServers);
        }
      } else if (command === 'v') {
        // View modes
        showViewModeOptions();
        
        const viewCommand = await new Promise(resolve => {
          rl.question('Enter view command: ', answer => {
            resolve(answer.trim().toLowerCase());
          });
        });
        
        if (viewCommand === 'b') {
          // Back to current view
          displayState = displayAZView(filteredServers);
        } else if (viewCommand === 'l') {
          // List view
          currentView = 'list';
          displayState = displayListView(filteredServers, currentPage, pageSize);
        } else if (viewCommand === 'a') {
          // A-Z view
          currentView = 'az';
          displayState = displayAZView(filteredServers);
        }
      } else if (command === '#') {
        // Show non-alphabetic servers
        filters.startLetter = '#';
        filteredServers = filterServers(allServers, filters);
        currentView = 'list';
        currentPage = 1;
        displayState = displayListView(filteredServers, currentPage, pageSize);
      } else if (command.length === 1 && command >= 'a' && command <= 'z') {
        // Show servers starting with letter
        filters.startLetter = command;
        filteredServers = filterServers(allServers, filters);
        currentView = 'list';
        currentPage = 1;
        displayState = displayListView(filteredServers, currentPage, pageSize);
      }
    }
  }
  
  console.log('');
  console.log('Thank you for using the MCP Server Browser!');
  rl.close();
}

// Start the browser
browseMCPServers().catch(error => {
  console.error('Error:', error);
  rl.close();
});