/**
 * Git MCP Server
 * 
 * Tools to read, search, and manipulate Git repositories
 */

const { URL } = require('url');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Tool definition
const tools = [
  {
    name: 'git_clone',
    description: 'Clone a Git repository',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the Git repository to clone'
        },
        branch: {
          type: 'string',
          description: 'The branch to clone',
          default: 'main'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'git_search',
    description: 'Search for code in a Git repository',
    input_schema: {
      type: 'object',
      properties: {
        repo_path: {
          type: 'string',
          description: 'The path to the Git repository'
        },
        query: {
          type: 'string',
          description: 'The search query'
        },
        file_pattern: {
          type: 'string',
          description: 'Optional file pattern to search in (e.g., "*.js")',
          default: ''
        }
      },
      required: ['repo_path', 'query']
    }
  }
];

// Tool implementations
async function gitClone(params) {
  const { url, branch = 'main' } = params;
  
  // Create a temporary directory for the clone
  const tempDir = path.join(os.tmpdir(), `git-clone-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  try {
    // Clone the repository
    execSync(`git clone --branch ${branch} ${url} ${tempDir}`, { stdio: 'pipe' });
    
    // Get repository info
    const remoteUrl = execSync(`git -C ${tempDir} config --get remote.origin.url`, { stdio: 'pipe' }).toString().trim();
    const commitHash = execSync(`git -C ${tempDir} rev-parse HEAD`, { stdio: 'pipe' }).toString().trim();
    const filesCount = execSync(`git -C ${tempDir} ls-files | wc -l`, { stdio: 'pipe' }).toString().trim();
    
    return {
      repository: url,
      branch,
      path: tempDir,
      commit: commitHash,
      files_count: parseInt(filesCount),
      success: true
    };
  } catch (error) {
    // Clean up on failure
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

async function gitSearch(params) {
  const { repo_path, query, file_pattern = '' } = params;
  
  try {
    // Validate that repo_path is a git repository
    execSync(`git -C ${repo_path} rev-parse --is-inside-work-tree`, { stdio: 'pipe' });
    
    // Perform the search
    const grepCommand = file_pattern 
      ? `git -C ${repo_path} grep -n "${query}" -- "${file_pattern}"`
      : `git -C ${repo_path} grep -n "${query}"`;
    
    const results = execSync(grepCommand, { stdio: 'pipe' }).toString().trim();
    
    // Parse the results
    const matches = results.split('\n').map(line => {
      const [file, lineNumber, ...contentParts] = line.split(':');
      const content = contentParts.join(':');
      
      return {
        file,
        line: parseInt(lineNumber),
        content: content.trim()
      };
    });
    
    return {
      repository: repo_path,
      query,
      file_pattern: file_pattern || '*',
      matches,
      count: matches.length
    };
  } catch (error) {
    if (error.status === 1 && error.stdout) {
      // grep returns status 1 when no matches are found
      return {
        repository: repo_path,
        query,
        file_pattern: file_pattern || '*',
        matches: [],
        count: 0
      };
    }
    
    throw new Error(`Failed to search repository: ${error.message}`);
  }
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
          if (tool_name === 'git_clone') {
            result = await gitClone(params);
          } else if (tool_name === 'git_search') {
            result = await gitSearch(params);
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
    console.log(`Git MCP server running on port ${PORT}`);
  });
}

module.exports = { tools, handleRequest, gitClone, gitSearch };