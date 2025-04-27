/**
 * Brave Search MCP Server
 * 
 * Web and local search using Brave's Search API
 */

const https = require('https');

// Tool definition
const tools = [
  {
    name: 'brave_search',
    description: 'Search the web using Brave Search API',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        count: {
          type: 'integer',
          description: 'Number of results to return (1-10)',
          default: 5
        }
      },
      required: ['query']
    }
  }
];

// Tool implementation
async function braveSearch(params) {
  const { query, count = 5 } = params;
  
  // In production, you should use the actual Brave Search API
  // For demo purposes, we're returning mock results
  const results = [
    {
      title: 'Example Search Result 1',
      url: 'https://example.com/result1',
      description: 'This is an example search result for the query.'
    },
    {
      title: 'Example Search Result 2',
      url: 'https://example.com/result2',
      description: 'Another matching result for the provided search terms.'
    }
  ];
  
  return {
    results: results.slice(0, count),
    total_results: results.length
  };
}

// Handle HTTP requests
function handleRequest(req, res) {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const path = parsedUrl.pathname;
    
    if (path === '/mcp/tools' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tools }));
      return;
    }
    
    if (path === '/mcp/run-tool' && req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { tool_name, params } = JSON.parse(body);
          
          if (tool_name === 'brave_search') {
            const result = await braveSearch(params);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unknown tool' }));
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      
      return;
    }
    
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

// Start the server when run directly
if (require.main === module) {
  const server = require('http').createServer(handleRequest);
  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, () => {
    console.log(`Brave Search MCP server running on port ${PORT}`);
  });
}

module.exports = { tools, handleRequest, braveSearch };