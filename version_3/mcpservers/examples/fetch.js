/**
 * Fetch MCP Server
 * 
 * Web content fetching and conversion for efficient LLM usage
 */

const https = require('https');
const { URL } = require('url');

// Tool definition
const tools = [
  {
    name: 'fetch_url',
    description: 'Fetch content from a URL and return it in a format suitable for LLMs',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch content from'
        },
        format: {
          type: 'string',
          description: 'The format to convert the content to',
          enum: ['text', 'markdown', 'html'],
          default: 'text'
        },
        max_length: {
          type: 'integer',
          description: 'Maximum length of content to return',
          default: 8000
        }
      },
      required: ['url']
    }
  }
];

// Tool implementation
async function fetchUrl(params) {
  const { url, format = 'text', max_length = 8000 } = params;
  
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'MCP Fetch Server/1.0'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          let content = data;
          
          // Convert content based on format
          if (format === 'text') {
            // Simple HTML to text conversion
            content = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
          // For demo, we're not implementing actual markdown/HTML conversion
          
          // Truncate to max_length
          if (content.length > max_length) {
            content = content.substring(0, max_length) + '...';
          }
          
          resolve({
            content,
            url,
            format,
            original_size: data.length,
            truncated: data.length > max_length
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    } catch (error) {
      reject(error);
    }
  });
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
          
          if (tool_name === 'fetch_url') {
            const result = await fetchUrl(params);
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
    console.log(`Fetch MCP server running on port ${PORT}`);
  });
}

module.exports = { tools, handleRequest, fetchUrl };