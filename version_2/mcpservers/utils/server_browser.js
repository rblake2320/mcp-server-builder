/**
 * MCP Server Browser Utility
 * 
 * This utility provides functions for browsing and filtering MCP servers,
 * including list view and alphabetical filtering.
 */

const fs = require('fs');
const path = require('path');

// Path to the server index file
const SERVER_INDEX_PATH = path.join(__dirname, '..', 'server_index.json');

/**
 * Load all servers from the index file
 * @returns {Object} Server index data
 */
function loadServerIndex() {
  try {
    const indexData = fs.readFileSync(SERVER_INDEX_PATH, 'utf8');
    return JSON.parse(indexData);
  } catch (error) {
    console.error('Error loading server index:', error.message);
    return { templates: [], examples: [] };
  }
}

/**
 * Get all servers (both templates and examples) as a flat list
 * @returns {Array} Combined list of all servers
 */
function getAllServers() {
  const indexData = loadServerIndex();
  
  // Combine templates and examples into a single list
  const templates = indexData.templates.map(template => ({
    ...template,
    type: 'template'
  }));
  
  const examples = indexData.examples.map(example => ({
    ...example,
    type: 'example'
  }));
  
  return [...templates, ...examples];
}

/**
 * Sort servers by a specific field
 * @param {Array} servers List of servers to sort
 * @param {String} sortField Field to sort by
 * @param {Boolean} ascending Sort direction
 * @returns {Array} Sorted servers
 */
function sortServers(servers, sortField = 'name', ascending = true) {
  return [...servers].sort((a, b) => {
    const valueA = a[sortField]?.toString().toLowerCase() || '';
    const valueB = b[sortField]?.toString().toLowerCase() || '';
    
    return ascending
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });
}

/**
 * Filter servers by starting letter
 * @param {Array} servers List of servers to filter
 * @param {String} letter Starting letter (A-Z) or '#' for non-alphabetic
 * @returns {Array} Filtered servers
 */
function filterServersByLetter(servers, letter) {
  if (!letter) return servers;
  
  letter = letter.toUpperCase();
  
  if (letter === '#') {
    // Return servers that don't start with a letter
    return servers.filter(server => {
      const firstChar = server.name.charAt(0).toUpperCase();
      return firstChar < 'A' || firstChar > 'Z';
    });
  }
  
  // Filter servers by starting letter
  return servers.filter(server => 
    server.name.charAt(0).toUpperCase() === letter
  );
}

/**
 * Filter servers by type (template or example)
 * @param {Array} servers List of servers to filter
 * @param {String} type Type of server ('template' or 'example')
 * @returns {Array} Filtered servers
 */
function filterServersByType(servers, type) {
  if (!type) return servers;
  return servers.filter(server => server.type === type);
}

/**
 * Filter servers by tags
 * @param {Array} servers List of servers to filter
 * @param {Array} tags Tags to filter by
 * @returns {Array} Filtered servers
 */
function filterServersByTags(servers, tags) {
  if (!tags || tags.length === 0) return servers;
  return servers.filter(server => 
    tags.some(tag => server.tags?.includes(tag))
  );
}

/**
 * Search servers by keyword
 * @param {Array} servers List of servers to search
 * @param {String} keyword Keyword to search for
 * @returns {Array} Matching servers
 */
function searchServers(servers, keyword) {
  if (!keyword) return servers;
  
  const searchTerm = keyword.toLowerCase();
  
  return servers.filter(server => {
    // Search in name, description, and tags
    return (
      server.name.toLowerCase().includes(searchTerm) ||
      (server.description && server.description.toLowerCase().includes(searchTerm)) ||
      (server.tags && server.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  });
}

/**
 * Get all available letters for alphabetical filtering
 * @param {Array} servers List of servers
 * @returns {Object} Available letters with counts
 */
function getAvailableLetters(servers) {
  const letterCounts = {};
  let nonAlphaCount = 0;
  
  servers.forEach(server => {
    const firstChar = server.name.charAt(0).toUpperCase();
    
    if (firstChar >= 'A' && firstChar <= 'Z') {
      letterCounts[firstChar] = (letterCounts[firstChar] || 0) + 1;
    } else {
      nonAlphaCount++;
    }
  });
  
  // Add non-alphabetic count if any
  if (nonAlphaCount > 0) {
    letterCounts['#'] = nonAlphaCount;
  }
  
  return letterCounts;
}

/**
 * Group servers by first letter for A-Z browsing
 * @param {Array} servers List of servers to group
 * @returns {Object} Servers grouped by first letter
 */
function groupServersByLetter(servers) {
  const groupedServers = {};
  
  servers.forEach(server => {
    const firstChar = server.name.charAt(0).toUpperCase();
    
    const group = (firstChar >= 'A' && firstChar <= 'Z')
      ? firstChar
      : '#';
    
    if (!groupedServers[group]) {
      groupedServers[group] = [];
    }
    
    groupedServers[group].push(server);
  });
  
  // Sort each group by name
  Object.keys(groupedServers).forEach(letter => {
    groupedServers[letter] = sortServers(groupedServers[letter], 'name', true);
  });
  
  return groupedServers;
}

/**
 * Generate alphabetical navigation data
 * @returns {Object} Navigation data with letters and counts
 */
function generateAlphabeticalNavigation() {
  const servers = getAllServers();
  const letterCounts = getAvailableLetters(servers);
  
  // Generate full A-Z navigation
  const alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  const navigation = alphabet.map(letter => ({
    letter,
    count: letterCounts[letter] || 0,
    available: letterCounts[letter] ? true : false
  }));
  
  return navigation;
}

/**
 * Get a list view of servers with optional filtering and sorting
 * @param {Object} options Filtering and sorting options
 * @returns {Array} Filtered and sorted servers
 */
function getServerListView(options = {}) {
  const {
    letter = '',
    type = '',
    tags = [],
    keyword = '',
    sortField = 'name',
    sortDirection = 'asc'
  } = options;
  
  let servers = getAllServers();
  
  // Apply filters
  if (letter) {
    servers = filterServersByLetter(servers, letter);
  }
  
  if (type) {
    servers = filterServersByType(servers, type);
  }
  
  if (tags && tags.length > 0) {
    servers = filterServersByTags(servers, tags);
  }
  
  if (keyword) {
    servers = searchServers(servers, keyword);
  }
  
  // Apply sorting
  servers = sortServers(servers, sortField, sortDirection === 'asc');
  
  return servers;
}

/**
 * Get an A-Z view of servers with optional filtering
 * @param {Object} options Filtering options
 * @returns {Object} Servers grouped by letter with navigation
 */
function getServerAZView(options = {}) {
  const {
    type = '',
    tags = [],
    keyword = ''
  } = options;
  
  let servers = getAllServers();
  
  // Apply filters except letter (since we're grouping by letter)
  if (type) {
    servers = filterServersByType(servers, type);
  }
  
  if (tags && tags.length > 0) {
    servers = filterServersByTags(servers, tags);
  }
  
  if (keyword) {
    servers = searchServers(servers, keyword);
  }
  
  // Group by letter
  const groupedServers = groupServersByLetter(servers);
  
  // Generate A-Z navigation based on filtered servers
  const letterCounts = getAvailableLetters(servers);
  const alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const navigation = alphabet.map(letter => ({
    letter,
    count: letterCounts[letter] || 0,
    available: letterCounts[letter] ? true : false
  }));
  
  return {
    navigation,
    groupedServers
  };
}

// Export public functions
module.exports = {
  getAllServers,
  getServerListView,
  getServerAZView,
  generateAlphabeticalNavigation,
  groupServersByLetter,
  searchServers,
  filterServersByLetter,
  filterServersByType,
  filterServersByTags
};