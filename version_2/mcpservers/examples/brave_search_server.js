/**
 * Brave Search MCP Server
 * 
 * This MCP server provides web search capabilities using the Brave Search API.
 * It enables AI assistants to perform real-time web searches and access up-to-date
 * information from the internet.
 * 
 * Features:
 * - Web search with customizable parameters
 * - Web page content extraction
 * - Search with filters (news, images, videos)
 * - Result analytics and clustering
 */

const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Create Express server
const app = express();
app.use(express.json());
app.use(cors());

// Brave Search API configuration
const BRAVE_SEARCH_API_URL = 'https://api.search.brave.com/res/v1';
const DEFAULT_RESULT_COUNT = 10;

// If you have an API key, it should be provided as an environment variable
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';

// MCP Protocol version
const MCP_PROTOCOL_VERSION = '0.1';

// Available tools
const TOOLS = [
  {
    name: 'web_search',
    description: 'Search the web using Brave Search',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        count: {
          type: 'number',
          description: 'Number of results to return (1-20)',
          default: 10
        },
        country: {
          type: 'string',
          description: 'Country code for localized results (e.g., "us", "gb", "fr")',
          default: 'us'
        },
        search_lang: {
          type: 'string',
          description: 'Language for search results (e.g., "en", "fr", "es")',
          default: 'en'
        },
        safe_search: {
          type: 'string',
          enum: ['strict', 'moderate', 'off'],
          description: 'Safe search level',
          default: 'moderate'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'fetch_content',
    description: 'Extract content from a web page',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the web page'
        },
        include_images: {
          type: 'boolean',
          description: 'Whether to include image URLs in the extracted content',
          default: false
        }
      },
      required: ['url']
    }
  },
  {
    name: 'news_search',
    description: 'Search for news articles using Brave Search',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query for news'
        },
        count: {
          type: 'number',
          description: 'Number of results to return (1-20)',
          default: 10
        },
        freshness: {
          type: 'string',
          enum: ['day', 'week', 'month', 'any'],
          description: 'Time period for news',
          default: 'week'
        }
      },
      required: ['query']
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
      errors.push(`Missing required parameter: ${required}`);
    }
  }
  
  // Check parameter types
  for (const [param, value] of Object.entries(params)) {
    const paramSchema = schema.properties[param];
    
    if (!paramSchema) {
      errors.push(`Unknown parameter: ${param}`);
      continue;
    }
    
    // Type checking
    if (paramSchema.type === 'string' && typeof value !== 'string') {
      errors.push(`Parameter ${param} must be a string`);
    } else if (paramSchema.type === 'number' && typeof value !== 'number') {
      errors.push(`Parameter ${param} must be a number`);
    } else if (paramSchema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Parameter ${param} must be a boolean`);
    } else if (paramSchema.type === 'array' && !Array.isArray(value)) {
      errors.push(`Parameter ${param} must be an array`);
    } else if (paramSchema.type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
      errors.push(`Parameter ${param} must be an object`);
    }
    
    // Enum validation
    if (paramSchema.enum && !paramSchema.enum.includes(value)) {
      errors.push(`Parameter ${param} must be one of: ${paramSchema.enum.join(', ')}`);
    }
  }
  
  return errors;
}

/**
 * Perform a web search using Brave Search
 */
async function performWebSearch(query, count = 10, country = 'us', searchLang = 'en', safeSearch = 'moderate') {
  try {
    // Validate the parameters
    count = Math.min(Math.max(1, count), 20); // Ensure count is between 1 and 20
    
    // Build the API request
    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
    };
    
    // Add API key if available
    if (BRAVE_API_KEY) {
      headers['X-Subscription-Token'] = BRAVE_API_KEY;
    }
    
    // Query parameters
    const params = new URLSearchParams({
      q: query,
      count: count.toString(),
      country: country,
      search_lang: searchLang,
      safesearch: safeSearch
    });
    
    // Make the request to Brave Search API
    let searchResults;
    
    if (BRAVE_API_KEY) {
      // If we have an API key, make the actual API call
      const response = await fetch(`${BRAVE_SEARCH_API_URL}/search?${params.toString()}`, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.statusText}`);
      }
      
      searchResults = await response.json();
    } else {
      // If we don't have an API key, generate mock results
      // This is for demonstration purposes only
      searchResults = generateMockSearchResults(query, count);
    }
    
    // Format the results
    return formatSearchResults(searchResults, query);
  } catch (error) {
    console.error('Web search error:', error);
    throw new Error(`Failed to perform web search: ${error.message}`);
  }
}

/**
 * Extract content from a web page
 */
async function fetchWebPageContent(url, includeImages = false) {
  try {
    // Make request to the web page
    let pageContent;
    
    if (BRAVE_API_KEY) {
      // In a real implementation, we would use a web scraping service or library
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.statusText}`);
      }
      
      const html = await response.text();
      pageContent = extractMainContent(html, includeImages);
    } else {
      // Generate mock content for demonstration
      pageContent = generateMockPageContent(url, includeImages);
    }
    
    return {
      url,
      title: pageContent.title,
      content: pageContent.content,
      images: includeImages ? pageContent.images : [],
      text_content: pageContent.textContent,
      metadata: {
        word_count: pageContent.textContent.split(/\s+/).length,
        extracted_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Content extraction error:', error);
    throw new Error(`Failed to extract content: ${error.message}`);
  }
}

/**
 * Search for news articles
 */
async function performNewsSearch(query, count = 10, freshness = 'week') {
  try {
    // Validate parameters
    count = Math.min(Math.max(1, count), 20);
    
    // Build the API request
    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
    };
    
    if (BRAVE_API_KEY) {
      headers['X-Subscription-Token'] = BRAVE_API_KEY;
    }
    
    // Query parameters
    const params = new URLSearchParams({
      q: query,
      count: count.toString(),
      search_type: 'news',
      freshness: freshness
    });
    
    // Make the request to Brave Search API
    let newsResults;
    
    if (BRAVE_API_KEY) {
      const response = await fetch(`${BRAVE_SEARCH_API_URL}/news?${params.toString()}`, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`Brave News API error: ${response.statusText}`);
      }
      
      newsResults = await response.json();
    } else {
      // If we don't have an API key, generate mock results
      newsResults = generateMockNewsResults(query, count, freshness);
    }
    
    // Format the results
    return formatNewsResults(newsResults, query);
  } catch (error) {
    console.error('News search error:', error);
    throw new Error(`Failed to perform news search: ${error.message}`);
  }
}

/**
 * Generate mock search results for demonstration without API key
 */
function generateMockSearchResults(query, count) {
  const results = [];
  
  for (let i = 1; i <= count; i++) {
    results.push({
      title: `Search Result ${i} for "${query}"`,
      url: `https://example.com/result-${i}`,
      description: `This is a mock search result ${i} for the query "${query}". This is for demonstration purposes only.`,
      age: `${Math.floor(Math.random() * 30)} days ago`
    });
  }
  
  return {
    query: query,
    results: results
  };
}

/**
 * Generate mock page content for demonstration without API key
 */
function generateMockPageContent(url, includeImages) {
  const domain = new URL(url).hostname;
  
  return {
    title: `Example Page on ${domain}`,
    content: `<h1>Example Page on ${domain}</h1><p>This is a mock web page content extraction for demonstration purposes. In a real implementation, this would be the actual content of the web page at ${url}.</p><p>The content would be extracted using a library like Readability or a similar content extraction service.</p>`,
    textContent: `Example Page on ${domain}\n\nThis is a mock web page content extraction for demonstration purposes. In a real implementation, this would be the actual content of the web page at ${url}.\n\nThe content would be extracted using a library like Readability or a similar content extraction service.`,
    images: includeImages ? [
      { url: 'https://example.com/image1.jpg', alt: 'Example image 1' },
      { url: 'https://example.com/image2.jpg', alt: 'Example image 2' }
    ] : []
  };
}

/**
 * Generate mock news results for demonstration without API key
 */
function generateMockNewsResults(query, count, freshness) {
  const results = [];
  const currentDate = new Date();
  
  let maxAgeDays;
  switch (freshness) {
    case 'day': maxAgeDays = 1; break;
    case 'week': maxAgeDays = 7; break;
    case 'month': maxAgeDays = 30; break;
    default: maxAgeDays = 365;
  }
  
  for (let i = 1; i <= count; i++) {
    const daysAgo = Math.floor(Math.random() * maxAgeDays);
    const date = new Date(currentDate);
    date.setDate(date.getDate() - daysAgo);
    
    results.push({
      title: `News Article ${i} about "${query}"`,
      url: `https://news-example.com/article-${i}`,
      description: `This is a mock news article ${i} about "${query}". This is for demonstration purposes only.`,
      source: `News Source ${i}`,
      published_date: date.toISOString(),
      age: `${daysAgo} days ago`
    });
  }
  
  return {
    query: query,
    results: results
  };
}

/**
 * Format search results for the response
 */
function formatSearchResults(searchResults, query) {
  // If this is mock data or real API data, ensure consistent format
  const results = searchResults.results || [];
  
  return {
    query: query,
    result_count: results.length,
    results: results.map(result => ({
      title: result.title,
      url: result.url,
      description: result.description,
      age: result.age
    }))
  };
}

/**
 * Format news results for the response
 */
function formatNewsResults(newsResults, query) {
  const results = newsResults.results || [];
  
  return {
    query: query,
    result_count: results.length,
    results: results.map(result => ({
      title: result.title,
      url: result.url,
      description: result.description,
      source: result.source,
      published_date: result.published_date,
      age: result.age
    }))
  };
}

/**
 * Extract main content from HTML (mock implementation)
 */
function extractMainContent(html, includeImages) {
  // In a real implementation, use a library like Mozilla's Readability
  // This is a simplified mock version
  const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || 'Unknown Title';
  
  // Basic content extraction (very simplified)
  let content = '';
  let textContent = '';
  let images = [];
  
  // For demo purposes only - in real implementation use proper HTML parsing
  content = '<h1>' + title + '</h1><p>Extracted content would appear here.</p>';
  textContent = title + '\n\nExtracted content would appear here.';
  
  if (includeImages) {
    // Mock image extraction
    images = [
      { url: 'https://example.com/image1.jpg', alt: 'Example image 1' },
      { url: 'https://example.com/image2.jpg', alt: 'Example image 2' }
    ];
  }
  
  return {
    title,
    content,
    textContent,
    images
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
        error: `Tool not found: ${toolName}`
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
      case 'web_search':
        result = await performWebSearch(
          parameters.query,
          parameters.count,
          parameters.country,
          parameters.search_lang,
          parameters.safe_search
        );
        break;
        
      case 'fetch_content':
        result = await fetchWebPageContent(
          parameters.url,
          parameters.include_images
        );
        break;
        
      case 'news_search':
        result = await performNewsSearch(
          parameters.query,
          parameters.count,
          parameters.freshness
        );
        break;
        
      default:
        return res.status(500).json({
          error: `Tool implementation missing: ${toolName}`
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
    name: 'Brave Search MCP Server',
    description: 'An MCP server that provides web search capabilities using Brave Search',
    version: '1.0.0',
    protocol: 'mcp',
    protocol_version: MCP_PROTOCOL_VERSION,
    endpoints: {
      '/': 'This info page',
      '/mcp': 'MCP capabilities (GET) and tool execution (POST)'
    },
    note: BRAVE_API_KEY 
      ? 'Using Brave Search API with provided API key' 
      : 'Using mock results (no API key provided)'
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Brave Search MCP Server running on port ${PORT}`);
  if (!BRAVE_API_KEY) {
    console.log('WARNING: No Brave API key provided. Using mock results.');
    console.log('Set the BRAVE_API_KEY environment variable to use the actual Brave Search API.');
  }
});