/**
 * Script to generate a large number of MCP servers for testing
 */

const fs = require('fs');
const path = require('path');

// Categories to use for servers
const categories = [
  'Search',
  'Web Scraping',
  'Communication',
  'Productivity',
  'Development',
  'Database',
  'Cloud Service',
  'File System',
  'Cloud Storage',
  'Version Control',
  'Machine Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Text Analysis',
  'Image Processing',
  'Document Management',
  'Data Processing',
  'API Integration',
  'Authentication',
  'Social Media'
];

// Languages
const languages = ['javascript', 'python', 'typescript', 'ruby', 'rust', 'go'];

// Server name prefixes and suffixes for generating names
const prefixes = [
  'Advanced', 'Better', 'Custom', 'Dynamic', 'Enhanced', 'Fast', 
  'Global', 'Hyper', 'Intelligent', 'Mega', 'Next-Gen', 'Omni', 
  'Pro', 'Quick', 'Rapid', 'Smart', 'Turbo', 'Ultra', 'Virtual', 'World'
];

const roots = [
  'AI', 'API', 'Assist', 'Bot', 'Chat', 'Connect', 'Data', 'Doc', 
  'Email', 'Fetch', 'Graph', 'Helper', 'Index', 'JSON', 'Knowledge', 
  'Link', 'Media', 'Net', 'Object', 'Parser', 'Query', 'Router', 
  'Search', 'Task', 'Util', 'Vector', 'Web', 'XML', 'Yield', 'Zone'
];

const suffixes = [
  'Agent', 'Bridge', 'Core', 'Engine', 'Framework', 'Gateway', 'Handler', 
  'Interface', 'Junction', 'Kit', 'Layer', 'Manager', 'Node', 'Optimizer', 
  'Platform', 'Query', 'Runner', 'Service', 'Tool', 'Utility', 'Validator', 
  'Worker', 'Xpert', 'Yielder', 'Zone'
];

// Generate a random server name
function generateServerName() {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const root = roots[Math.floor(Math.random() * roots.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix} ${root} ${suffix}`;
}

// Generate a random description
function generateDescription() {
  const actions = [
    'Processes', 'Analyzes', 'Indexes', 'Manages', 'Transforms', 
    'Converts', 'Streamlines', 'Enhances', 'Facilitates', 'Optimizes'
  ];
  
  const objects = [
    'data', 'content', 'resources', 'requests', 'documents',
    'files', 'information', 'media', 'records', 'inputs'
  ];
  
  const benefits = [
    'efficiently', 'quickly', 'securely', 'seamlessly', 'automatically',
    'intelligently', 'effectively', 'flawlessly', 'contextually', 'adaptively'
  ];
  
  const action = actions[Math.floor(Math.random() * actions.length)];
  const object = objects[Math.floor(Math.random() * objects.length)];
  const benefit = benefits[Math.floor(Math.random() * benefits.length)];
  
  return `${action} ${object} ${benefit} to improve productivity and accuracy`;
}

// Generate random dependencies
function generateDependencies(language) {
  const dependencies = [];
  const jsDeps = ['axios', 'express', 'lodash', 'moment', 'puppeteer', 'socket.io', 'mongodb', 'mongoose', 'redis', 'ioredis'];
  const pythonDeps = ['requests', 'flask', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'beautifulsoup4', 'django', 'pytest', 'sqlalchemy'];
  const typescriptDeps = ['typescript', 'ts-node', 'tslib', '@types/node', '@types/express', 'typeorm', 'nestjs', 'graphql-typescript', 'typedi', 'class-validator'];
  const rubyDeps = ['rails', 'sinatra', 'nokogiri', 'rspec', 'activerecord', 'sidekiq', 'devise', 'pundit', 'capybara', 'mechanize'];
  const rustDeps = ['tokio', 'serde', 'actix-web', 'rusoto', 'diesel', 'rocket', 'rand', 'regex', 'log', 'clap'];
  const goDeps = ['gin', 'gorm', 'echo', 'mux', 'cobra', 'logrus', 'testify', 'aws-sdk-go', 'go-redis', 'pq'];
  
  let availableDeps = [];
  if (language === 'javascript') availableDeps = jsDeps;
  else if (language === 'python') availableDeps = pythonDeps;
  else if (language === 'typescript') availableDeps = typescriptDeps;
  else if (language === 'ruby') availableDeps = rubyDeps;
  else if (language === 'rust') availableDeps = rustDeps;
  else if (language === 'go') availableDeps = goDeps;
  
  const count = Math.floor(Math.random() * 4) + 1; // 1 to 4 dependencies
  for (let i = 0; i < count; i++) {
    const dep = availableDeps[Math.floor(Math.random() * availableDeps.length)];
    if (!dependencies.includes(dep)) dependencies.push(dep);
  }
  
  return dependencies;
}

// Generate random tools
function generateTools() {
  const toolNames = [
    'search', 'fetch', 'analyze', 'process', 'transform',
    'convert', 'upload', 'download', 'sync', 'manage',
    'verify', 'validate', 'extract', 'generate', 'summarize'
  ];
  
  const tools = [];
  const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 tools
  
  for (let i = 0; i < count; i++) {
    const tool = toolNames[Math.floor(Math.random() * toolNames.length)];
    if (!tools.includes(tool)) tools.push(tool);
  }
  
  return tools;
}

// Generate a server
function generateServer(id) {
  const language = languages[Math.floor(Math.random() * languages.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  // Determine the type (weighted towards imported for realistic distribution)
  const typeRandom = Math.random();
  let type = 'imported';
  if (typeRandom < 0.02) type = 'template'; // 2% chance
  else if (typeRandom < 0.04) type = 'example'; // 2% chance
  
  // File extension based on language
  let extension = 'js';
  if (language === 'python') extension = 'py';
  else if (language === 'typescript') extension = 'ts';
  else if (language === 'ruby') extension = 'rb';
  else if (language === 'rust') extension = 'rs';
  else if (language === 'go') extension = 'go';
  
  return {
    id,
    name: generateServerName(),
    path: `${type}/${id.toString().padStart(5, '0')}_server.${extension}`,
    language,
    description: generateDescription(),
    category,
    difficulty: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
    dependencies: generateDependencies(language),
    tools: generateTools(),
    type,
    // Add other properties for filtering
    requiresApiKey: Math.random() < 0.3, // 30% chance
    apiProvider: Math.random() < 0.2 ? ['OpenAI', 'Google', 'Microsoft', 'AWS', 'Hugging Face'][Math.floor(Math.random() * 5)] : null,
    // Status for up/down metric
    status: Math.random() < 0.95 ? 'up' : 'down' // 95% up, 5% down
  };
}

// Generate the server list
function generateServerList(count) {
  console.log(`Generating ${count} MCP servers...`);
  
  const templates = [];
  const examples = [];
  const imported = [];
  
  // Generate servers
  for (let i = 1; i <= count; i++) {
    const server = generateServer(i);
    
    // Add to the appropriate array based on type
    if (server.type === 'template') templates.push(server);
    else if (server.type === 'example') examples.push(server);
    else imported.push(server);
    
    // Log progress
    if (i % 1000 === 0) console.log(`Generated ${i} servers...`);
  }
  
  // Create the final server index
  const serverIndex = {
    templates,
    examples,
    imported
  };
  
  // Return counts for verification
  return {
    serverIndex,
    counts: {
      templates: templates.length,
      examples: examples.length,
      imported: imported.length,
      total: templates.length + examples.length + imported.length
    }
  };
}

module.exports = { generateServerList };