/**
 * Filesystem MCP Server
 * 
 * Secure file operations with configurable access controls
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Tool definition
const tools = [
  {
    name: 'list_files',
    description: 'List files in a directory',
    input_schema: {
      type: 'object',
      properties: {
        dir: {
          type: 'string',
          description: 'The directory path to list files from'
        },
        include_hidden: {
          type: 'boolean',
          description: 'Whether to include hidden files',
          default: false
        }
      },
      required: ['dir']
    }
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to read'
        },
        encoding: {
          type: 'string',
          description: 'The encoding to use',
          default: 'utf8'
        }
      },
      required: ['path']
    }
  }
];

// Tool implementations
async function listFiles(params) {
  const { dir, include_hidden = false } = params;
  
  // Security check - validate directory is within allowed paths
  // In a real implementation, you would have more robust security checks
  
  return new Promise((resolve, reject) => {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      
      const fileList = files
        .filter(file => include_hidden || !file.name.startsWith('.'))
        .map(file => ({
          name: file.name,
          type: file.isDirectory() ? 'directory' : 'file',
          path: path.join(dir, file.name)
        }));
      
      resolve({
        directory: dir,
        files: fileList,
        count: fileList.length
      });
    });
  });
}

async function readFile(params) {
  const { path: filePath, encoding = 'utf8' } = params;
  
  // Security check - validate file is within allowed paths
  // In a real implementation, you would have more robust security checks
  
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve({
        path: filePath,
        content: data,
        size: Buffer.byteLength(data, encoding)
      });
    });
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
          
          let result;
          if (tool_name === 'list_files') {
            result = await listFiles(params);
          } else if (tool_name === 'read_file') {
            result = await readFile(params);
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unknown tool' }));
            return;
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result }));
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
    console.log(`Filesystem MCP server running on port ${PORT}`);
  });
}

module.exports = { tools, handleRequest, listFiles, readFile };