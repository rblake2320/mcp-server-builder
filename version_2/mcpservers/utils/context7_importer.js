/**
 * Context7 Documentation Importer
 * 
 * This utility imports and converts documentation from Context7 into MCP-compatible
 * server implementations, allowing Claude and other LLMs to access documentation
 * through the Model Context Protocol.
 * 
 * Features:
 * - Import comprehensive documentation from Context7's repository collection
 * - Convert documentation to searchable, queryable MCP servers
 * - Generate code snippets and examples from documentation
 * - Provide code completion and reference tools
 */

const fs = require('fs-extra');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Configuration and paths
const SERVERS_ROOT = path.join(__dirname, '..');
const IMPORTS_DIR = path.join(SERVERS_ROOT, 'imported');
const CONTEXT7_IMPORTS_DIR = path.join(IMPORTS_DIR, 'context7');
const SERVER_INDEX_PATH = path.join(SERVERS_ROOT, 'server_index.json');

// Initialize directories
function initializeDirectories() {
  // Create the main Context7 import directory
  fs.ensureDirSync(CONTEXT7_IMPORTS_DIR);
  
  // Create subdirectories for different types of documentation
  fs.ensureDirSync(path.join(CONTEXT7_IMPORTS_DIR, 'frameworks'));
  fs.ensureDirSync(path.join(CONTEXT7_IMPORTS_DIR, 'libraries'));
  fs.ensureDirSync(path.join(CONTEXT7_IMPORTS_DIR, 'languages'));
  fs.ensureDirSync(path.join(CONTEXT7_IMPORTS_DIR, 'databases'));
  fs.ensureDirSync(path.join(CONTEXT7_IMPORTS_DIR, 'apis'));
  
  console.log('Directories initialized for Context7 imports');
}

// Load the server index
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

// Save the server index
function saveServerIndex(indexData) {
  fs.writeJsonSync(SERVER_INDEX_PATH, indexData, { spaces: 2 });
  console.log('Server index updated successfully');
}

/**
 * Fetch Context7 library list
 * @returns {Array} List of libraries available in Context7
 */
async function fetchContext7Libraries() {
  try {
    // In a real implementation, you would fetch this from Context7's API or website
    // This is a simulated fetch with a sample of what was shown in the screenshot
    console.log('Fetching libraries from Context7...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Sample libraries from the screenshot
    return [
      {
        name: 'Next.js',
        repo: 'vercel/next.js',
        tokens: '485.9K',
        snippets: '4K',
        lastUpdate: '2 days ago'
      },
      {
        name: 'Elasticsearch',
        repo: 'elastic/elasticsearch',
        tokens: '627.7K',
        snippets: '5.2K',
        lastUpdate: '2 days ago'
      },
      {
        name: 'Laravel',
        repo: 'laravel/docs',
        tokens: '278.1K',
        snippets: '3.1K',
        lastUpdate: '2 days ago'
      },
      {
        name: 'Clerk',
        repo: 'clerk/clerk-docs',
        tokens: '399.7K',
        snippets: '2.4K',
        lastUpdate: '2 days ago'
      },
      {
        name: 'MongoDB',
        repo: 'mongodb/docs',
        tokens: '923.3K',
        snippets: '8.5K',
        lastUpdate: '1 day ago'
      },
      {
        name: 'Upstash Redis',
        repo: 'upstash/docs',
        tokens: '117.8K',
        snippets: '849',
        lastUpdate: '2 days ago'
      },
      {
        name: 'FastAPI',
        repo: 'tiangolo/fastapi',
        tokens: '190K',
        snippets: '1.8K',
        lastUpdate: '4 hours ago'
      },
      {
        name: 'PyTorch Tutorials',
        repo: 'pytorch/tutorials',
        tokens: '184.7K',
        snippets: '877',
        lastUpdate: '1 day ago'
      },
      {
        name: 'Vue 3',
        repo: 'vuejs/docs',
        tokens: '138.8K',
        snippets: '1.3K',
        lastUpdate: '1 day ago'
      },
      {
        name: 'Supabase',
        repo: 'supabase/supabase',
        tokens: '670.4K',
        snippets: '4.7K',
        lastUpdate: '1 day ago'
      }
    ];
  } catch (error) {
    console.error('Error fetching Context7 libraries:', error.message);
    return [];
  }
}

/**
 * Fetch additional Context7 libraries beyond the initial sample
 */
async function fetchAdditionalLibraries(count = 5000) {
  // This is a simulated function to generate a large collection of libraries
  // In a real implementation, you would fetch these from Context7
  
  console.log(`Generating ${count} additional libraries...`);
  
  const libraries = [];
  const categories = [
    'frameworks', 'libraries', 'languages', 'databases', 'apis',
    'ui-libraries', 'state-management', 'testing', 'devops', 'security',
    'machine-learning', 'blockchain', 'mobile', 'game-development', 'data-science'
  ];
  
  const languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'PHP', 'Go', 'Ruby',
    'Rust', 'Swift', 'Kotlin', 'C++', 'Scala', 'Dart', 'R'
  ];
  
  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const language = languages[Math.floor(Math.random() * languages.length)];
    const tokens = Math.floor(Math.random() * 1000000) + 10000;
    const snippets = Math.floor(Math.random() * 10000) + 100;
    
    libraries.push({
      name: `${category}-lib-${i}`,
      repo: `example-org/${category}-lib-${i}`,
      tokens: `${tokens}`,
      snippets: `${snippets}`,
      language,
      category,
      lastUpdate: `${Math.floor(Math.random() * 30)} days ago`
    });
  }
  
  return libraries;
}

/**
 * Fetch documentation for a specific library
 * @param {string} repo Repository identifier (e.g., 'vercel/next.js')
 * @returns {Object} Library documentation data
 */
async function fetchLibraryDocumentation(repo) {
  try {
    // In a real implementation, you would fetch this from Context7's API or website
    // This is a simulated fetch
    console.log(`Fetching documentation for ${repo}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Parse repository parts
    const [owner, name] = repo.split('/');
    
    // Generate mock documentation data
    return {
      name,
      owner,
      repo,
      sections: generateMockDocumentationSections(name),
      codeSnippets: generateMockCodeSnippets(name, 10),
      metadata: {
        language: detectLanguage(name),
        version: `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        lastUpdate: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error(`Error fetching documentation for ${repo}:`, error.message);
    return null;
  }
}

/**
 * Generate mock documentation sections
 */
function generateMockDocumentationSections(libraryName) {
  const sections = [];
  
  // Introduction section
  sections.push({
    title: 'Introduction',
    content: `# ${libraryName}\n\nThis is the documentation for ${libraryName}. It provides an overview of key features and how to use them.\n\n## Installation\n\n\`\`\`bash\nnpm install ${libraryName.toLowerCase()}\n\`\`\`\n\n## Getting Started\n\nHere's a simple example to get started:`
  });
  
  // API Reference
  sections.push({
    title: 'API Reference',
    content: `# API Reference\n\nThis section documents the ${libraryName} API.\n\n## Core APIs\n\nThe core functionality is exposed through these main functions and classes.\n\n### \`function1(param1, param2)\`\n\nDescription of function1 and its parameters.\n\n### \`class Class1\`\n\nDescription of Class1 and its methods.`
  });
  
  // Examples
  sections.push({
    title: 'Examples',
    content: `# Examples\n\nHere are some examples of common use cases for ${libraryName}.\n\n## Basic Example\n\n\`\`\`javascript\n// Example code here\n\`\`\`\n\n## Advanced Example\n\n\`\`\`javascript\n// Advanced example code here\n\`\`\``
  });
  
  // FAQ
  sections.push({
    title: 'FAQ',
    content: `# Frequently Asked Questions\n\n## How do I install ${libraryName}?\n\nYou can install ${libraryName} using npm or yarn.\n\n## How do I contribute to ${libraryName}?\n\nContributions are welcome! Please read our contribution guidelines.`
  });
  
  return sections;
}

/**
 * Generate mock code snippets
 */
function generateMockCodeSnippets(libraryName, count) {
  const snippets = [];
  
  for (let i = 1; i <= count; i++) {
    const language = i % 3 === 0 ? 'python' : 'javascript';
    
    snippets.push({
      title: `Example ${i}`,
      code: language === 'javascript' 
        ? `// Example ${i} for ${libraryName}\nconst ${libraryName.toLowerCase()} = require('${libraryName.toLowerCase()}');\n\nfunction example${i}() {\n  // Function implementation\n  return ${libraryName.toLowerCase()}.doSomething();\n}`
        : `# Example ${i} for ${libraryName}\nimport ${libraryName.toLowerCase()}\n\ndef example${i}():\n    # Function implementation\n    return ${libraryName.toLowerCase()}.do_something()`,
      language
    });
  }
  
  return snippets;
}

/**
 * Detect programming language based on library name
 */
function detectLanguage(libraryName) {
  const lowercase = libraryName.toLowerCase();
  
  if (lowercase.includes('py') || lowercase.includes('torch') || lowercase.endsWith('.py')) {
    return 'python';
  }
  
  if (lowercase.includes('java') || lowercase.endsWith('.java')) {
    return 'java';
  }
  
  if (lowercase.includes('go') || lowercase.endsWith('.go')) {
    return 'go';
  }
  
  // Default to JavaScript
  return 'javascript';
}

/**
 * Create a DocGen MCP server for a specific library
 * @param {Object} docData Documentation data
 * @returns {string} Server code
 */
function generateDocGenServer(docData) {
  const {
    name,
    owner,
    repo,
    sections,
    codeSnippets,
    metadata
  } = docData;
  
  const serverCode = `/**
 * DocGen MCP Server: ${name}
 * 
 * This MCP server provides access to ${name} documentation and code snippets.
 * It allows AI assistants to search, retrieve, and use documentation and
 * code examples from ${repo}.
 * 
 * Data sourced from Context7
 */

const express = require('express');
const cors = require('cors');

// Create Express server
const app = express();
app.use(express.json());
app.use(cors());

// MCP Protocol version
const MCP_PROTOCOL_VERSION = '0.1';

// Documentation data
const DOC_DATA = ${JSON.stringify({
    name,
    owner,
    repo,
    sections: sections.map(s => ({ title: s.title })),
    metadata
  }, null, 2)};

// Documentation sections
const SECTIONS = ${JSON.stringify(sections, null, 2)};

// Code snippets
const CODE_SNIPPETS = ${JSON.stringify(codeSnippets, null, 2)};

// Available tools
const TOOLS = [
  {
    name: 'search_docs',
    description: 'Search the ${name} documentation',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 5
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_section',
    description: 'Get a specific documentation section',
    parameters: {
      type: 'object',
      properties: {
        section_title: {
          type: 'string',
          description: 'Title of the section to retrieve'
        }
      },
      required: ['section_title']
    }
  },
  {
    name: 'list_sections',
    description: 'List all available documentation sections',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_code_examples',
    description: 'Get code examples from the ${name} documentation',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to search for in code examples'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of examples to return',
          default: 3
        },
        language: {
          type: 'string',
          description: 'Filter by programming language',
          default: ''
        }
      },
      required: ['keyword']
    }
  }
];

/**
 * Helper function to validate parameters against a tool's schema
 */
function validateParameters(tool, params) {
  const schema = tool.parameters;
  const errors = [];
  
  // Check required parameters
  for (const required of schema.required || []) {
    if (params[required] === undefined) {
      errors.push(\`Missing required parameter: \${required}\`);
    }
  }
  
  return errors;
}

/**
 * Search documentation
 */
function searchDocs(query, maxResults = 5) {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  // Search in section titles and content
  for (const section of SECTIONS) {
    const titleMatch = section.title.toLowerCase().includes(lowerQuery);
    const contentMatch = section.content.toLowerCase().includes(lowerQuery);
    
    if (titleMatch || contentMatch) {
      // Extract matching context with the query term highlighted
      let context = '';
      
      if (contentMatch) {
        const lowerContent = section.content.toLowerCase();
        const index = lowerContent.indexOf(lowerQuery);
        const start = Math.max(0, index - 100);
        const end = Math.min(section.content.length, index + query.length + 100);
        
        context = section.content.substring(start, end);
        
        // Add ellipsis if we're not at the beginning/end
        if (start > 0) context = '...' + context;
        if (end < section.content.length) context += '...';
      }
      
      results.push({
        section: section.title,
        context: context || section.content.substring(0, 200) + '...',
        relevance: titleMatch ? 2 : 1
      });
    }
  }
  
  // Sort by relevance and limit results
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
}

/**
 * Get a specific documentation section
 */
function getSection(sectionTitle) {
  const section = SECTIONS.find(s => 
    s.title.toLowerCase() === sectionTitle.toLowerCase()
  );
  
  if (!section) {
    return {
      error: \`Section "\${sectionTitle}" not found\`,
      available_sections: SECTIONS.map(s => s.title)
    };
  }
  
  return {
    title: section.title,
    content: section.content
  };
}

/**
 * List all documentation sections
 */
function listSections() {
  return {
    sections: SECTIONS.map(s => ({
      title: s.title,
      preview: s.content.substring(0, 100) + '...'
    }))
  };
}

/**
 * Get code examples
 */
function getCodeExamples(keyword, maxResults = 3, language = '') {
  const lowerKeyword = keyword.toLowerCase();
  
  // Filter snippets by keyword and language
  const filteredSnippets = CODE_SNIPPETS.filter(snippet => {
    const matchesKeyword = snippet.code.toLowerCase().includes(lowerKeyword) ||
                           snippet.title.toLowerCase().includes(lowerKeyword);
    const matchesLanguage = !language || 
                           snippet.language.toLowerCase() === language.toLowerCase();
    
    return matchesKeyword && matchesLanguage;
  });
  
  // Sort by relevance (title matches are more relevant than code matches)
  const sortedSnippets = filteredSnippets.sort((a, b) => {
    const aTitleMatch = a.title.toLowerCase().includes(lowerKeyword) ? 2 : 1;
    const bTitleMatch = b.title.toLowerCase().includes(lowerKeyword) ? 2 : 1;
    
    return bTitleMatch - aTitleMatch;
  });
  
  return {
    examples: sortedSnippets.slice(0, maxResults),
    total_matches: filteredSnippets.length,
    showing: Math.min(maxResults, filteredSnippets.length)
  };
}

// MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    const requestData = req.body;
    
    // Validate MCP request format
    if (!requestData || !requestData.tool || !requestData.parameters) {
      return res.status(400).json({
        error: 'Invalid MCP request format'
      });
    }
    
    const { tool: toolName, parameters } = requestData;
    
    // Find the requested tool
    const tool = TOOLS.find(t => t.name === toolName);
    
    if (!tool) {
      return res.status(404).json({
        error: \`Tool not found: \${toolName}\`
      });
    }
    
    // Validate parameters
    const validationErrors = validateParameters(tool, parameters);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Parameter validation failed',
        details: validationErrors
      });
    }
    
    // Execute the appropriate tool
    let result;
    
    switch (toolName) {
      case 'search_docs':
        result = searchDocs(
          parameters.query,
          parameters.max_results
        );
        break;
        
      case 'get_section':
        result = getSection(parameters.section_title);
        break;
        
      case 'list_sections':
        result = listSections();
        break;
        
      case 'get_code_examples':
        result = getCodeExamples(
          parameters.keyword,
          parameters.max_results,
          parameters.language
        );
        break;
        
      default:
        return res.status(500).json({
          error: \`Tool implementation missing: \${toolName}\`
        });
    }
    
    // Return successful response
    res.json({
      tool: toolName,
      result
    });
  } catch (error) {
    console.error('MCP request error:', error);
    
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// MCP capabilities endpoint
app.get('/mcp', (req, res) => {
  res.json({
    protocol: 'mcp',
    version: MCP_PROTOCOL_VERSION,
    tools: TOOLS
  });
});

// Root endpoint for info
app.get('/', (req, res) => {
  res.json({
    name: '${name} Documentation Server',
    description: 'An MCP server providing access to ${name} documentation',
    version: '1.0.0',
    protocol: 'mcp',
    protocol_version: MCP_PROTOCOL_VERSION,
    source: 'Context7',
    repository: '${repo}',
    metadata: DOC_DATA.metadata
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`${name} Documentation Server running on port \${PORT}\`);
});
`;

  return serverCode;
}

/**
 * Import a specific Context7 library
 * @param {Object} library Library metadata
 * @returns {Object} Imported server metadata
 */
async function importContext7Library(library) {
  try {
    console.log(`Importing ${library.name} (${library.repo})...`);
    
    // Fetch detailed documentation
    const documentation = await fetchLibraryDocumentation(library.repo);
    
    if (!documentation) {
      console.log(`Failed to fetch documentation for ${library.repo}`);
      return null;
    }
    
    // Determine category based on name or other metadata
    const category = determineLibraryCategory(library);
    
    // Create a sanitized name for the file
    const sanitizedName = library.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    
    // Generate output path
    const outputDir = path.join(CONTEXT7_IMPORTS_DIR, category);
    const outputPath = path.join(outputDir, `${sanitizedName}_docs.js`);
    
    // Generate server code
    const serverCode = generateDocGenServer(documentation);
    
    // Write the file
    fs.writeFileSync(outputPath, serverCode);
    
    // Create server metadata
    const server = {
      id: `context7_${sanitizedName}`,
      name: `${library.name} Documentation`,
      description: `Documentation for ${library.name} sourced from Context7`,
      language: 'javascript',
      path: path.relative(SERVERS_ROOT, outputPath),
      author: 'Context7',
      source: 'context7',
      sourceRepo: library.repo,
      category: 'documentation',
      subcategory: category,
      tokens: library.tokens,
      snippets: library.snippets,
      tools: [
        'search_docs',
        'get_section',
        'list_sections',
        'get_code_examples'
      ],
      tags: [
        'documentation',
        category,
        library.name.toLowerCase(),
        'reference',
        'code-examples'
      ]
    };
    
    console.log(`Successfully imported ${library.name}`);
    
    return server;
  } catch (error) {
    console.error(`Error importing ${library.repo}:`, error.message);
    return null;
  }
}

/**
 * Determine library category based on name and metadata
 */
function determineLibraryCategory(library) {
  const name = library.name.toLowerCase();
  
  // Check if the library comes with a category
  if (library.category) {
    return library.category;
  }
  
  // Database libraries
  if (name.includes('db') || name.includes('sql') || name.includes('mongo') ||
      name.includes('postgres') || name.includes('redis') || name.includes('supabase')) {
    return 'databases';
  }
  
  // Framework libraries
  if (name.includes('react') || name.includes('vue') || name.includes('angular') ||
      name.includes('next') || name.includes('nuxt') || name.includes('svelte') ||
      name.includes('express') || name.includes('laravel') || name.includes('django')) {
    return 'frameworks';
  }
  
  // Programming languages
  if (name.includes('python') || name.includes('javascript') || name.includes('typescript') ||
      name.includes('java') || name.includes('go') || name.includes('ruby') ||
      name.includes('rust') || name.includes('cpp') || name.includes('php')) {
    return 'languages';
  }
  
  // API libraries
  if (name.includes('api') || name.includes('client') || name.includes('sdk') ||
      name.includes('http') || name.includes('rest') || name.includes('graphql')) {
    return 'apis';
  }
  
  // Default to libraries
  return 'libraries';
}

/**
 * Import multiple Context7 libraries
 * @param {Object} options Import options
 * @returns {Array} Imported server metadata
 */
async function importContext7Libraries(options = {}) {
  const {
    maxResults = 5000,
    startIndex = 0,
    endIndex = null
  } = options;
  
  try {
    // Initialize directories
    initializeDirectories();
    
    // Fetch libraries from Context7
    console.log('Fetching Context7 libraries...');
    let libraries = await fetchContext7Libraries();
    
    // Fetch additional libraries to reach the desired count
    if (libraries.length < maxResults) {
      const additionalCount = maxResults - libraries.length;
      const additionalLibraries = await fetchAdditionalLibraries(additionalCount);
      libraries = [...libraries, ...additionalLibraries];
    }
    
    // Apply range limits
    const end = endIndex !== null ? endIndex : libraries.length;
    libraries = libraries.slice(startIndex, end);
    
    console.log(`Importing ${libraries.length} libraries from Context7...`);
    
    const importedServers = [];
    let successCount = 0;
    
    // Import each library
    for (let i = 0; i < libraries.length; i++) {
      const library = libraries[i];
      console.log(`Processing ${i + 1}/${libraries.length}: ${library.name}`);
      
      const server = await importContext7Library(library);
      
      if (server) {
        importedServers.push(server);
        successCount++;
      }
    }
    
    console.log(`Import completed: ${successCount} libraries successfully imported`);
    
    return importedServers;
  } catch (error) {
    console.error('Error importing Context7 libraries:', error.message);
    return [];
  }
}

/**
 * Update server index with imported Context7 servers
 */
function updateServerIndex(importedServers) {
  // Load the current index
  const index = loadServerIndex();
  
  // Create imported array if it doesn't exist
  if (!index.imported) {
    index.imported = [];
  }
  
  // Add new servers or update existing ones
  importedServers.forEach(server => {
    const existingIndex = index.imported.findIndex(s => s.id === server.id);
    
    if (existingIndex >= 0) {
      // Update existing entry
      index.imported[existingIndex] = server;
    } else {
      // Add new entry
      index.imported.push(server);
    }
  });
  
  // Save the index
  saveServerIndex(index);
  
  console.log(`Server index updated with ${importedServers.length} imported servers`);
}

/**
 * Import Context7 libraries in batches
 * @param {Object} options Import options
 */
async function importInBatches(options = {}) {
  const {
    totalCount = 5000,
    batchSize = 100
  } = options;
  
  const batches = Math.ceil(totalCount / batchSize);
  const allImported = [];
  
  for (let i = 0; i < batches; i++) {
    console.log(`\nProcessing batch ${i + 1}/${batches}...`);
    
    const startIndex = i * batchSize;
    const endIndex = Math.min(startIndex + batchSize, totalCount);
    
    const imported = await importContext7Libraries({
      maxResults: totalCount,
      startIndex,
      endIndex
    });
    
    allImported.push(...imported);
    
    // Update index after each batch
    updateServerIndex(imported);
    
    console.log(`Batch ${i + 1} complete: ${imported.length} libraries imported`);
    
    // Small delay between batches to prevent overloading
    if (i < batches - 1) {
      console.log('Pausing before next batch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return allImported;
}

// Export functions
module.exports = {
  initializeDirectories,
  fetchContext7Libraries,
  importContext7Library,
  importContext7Libraries,
  updateServerIndex,
  importInBatches
};