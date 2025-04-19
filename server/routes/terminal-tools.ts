import { Router } from 'express';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

const router = Router();

// Create a temporary directory for the package
const tempDir = path.join(__dirname, '../../tmp/terminal-package');

// Ensure the temporary directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// API endpoint to download the terminal package
router.get('/download', async (req, res) => {
  try {
    // Set up the archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set the headers for the response
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=mcp-terminal-server.zip');

    // Pipe the archive to the response
    archive.pipe(res);

    // Add files to the archive
    const toolsDir = path.join(__dirname, '../tools');
    
    // Add the MCP terminal server files
    archive.file(path.join(toolsDir, 'terminal-access.ts'), { name: 'src/terminal-access.ts' });
    archive.file(path.join(toolsDir, 'mcp-terminal-server.ts'), { name: 'src/mcp-terminal-server.ts' });
    archive.file(path.join(toolsDir, 'mcp-terminal-cli.ts'), { name: 'src/cli.ts' });
    
    // Create and add package.json
    const packageJson = {
      name: '@anthropic-ai/mcp-server-terminal',
      version: '1.0.0',
      description: 'Terminal access tool for Claude via Model Context Protocol (MCP)',
      main: 'dist/index.js',
      bin: {
        'mcp-terminal': 'dist/cli.js'
      },
      scripts: {
        build: 'tsc',
        start: 'node dist/cli.js',
        prepublishOnly: 'npm run build'
      },
      keywords: [
        'anthropic',
        'claude',
        'mcp',
        'terminal',
        'shell',
        'command'
      ],
      author: 'MCP Server Builder',
      license: 'MIT',
      dependencies: {
        'cors': '^2.8.5',
        'express': '^4.18.2'
      },
      devDependencies: {
        '@types/cors': '^2.8.13',
        '@types/express': '^4.17.17',
        '@types/node': '^18.15.11',
        'typescript': '^5.0.4'
      }
    };

    // Add package.json to the archive
    archive.append(JSON.stringify(packageJson, null, 2), { name: 'package.json' });

    // Create and add tsconfig.json
    const tsconfigJson = {
      compilerOptions: {
        target: 'ES2018',
        module: 'CommonJS',
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };

    // Add tsconfig.json to the archive
    archive.append(JSON.stringify(tsconfigJson, null, 2), { name: 'tsconfig.json' });

    // Create and add README.md
    const readmeContent = `# MCP Terminal Server

A terminal access tool for Claude and other LLMs that support the Model Context Protocol (MCP).

## Features

- Run arbitrary shell commands
- Stream command output
- Control process termination
- Environment variable access

## Installation

### Option 1: Using NPX (Recommended)

\`\`\`bash
npx -y @anthropic-ai/mcp-server-terminal
\`\`\`

### Option 2: Install Globally

\`\`\`bash
npm install -g @anthropic-ai/mcp-server-terminal
mcp-terminal
\`\`\`

### Option 3: Manual Installation

1. Extract the ZIP file
2. Install dependencies: \`npm install\`
3. Build the project: \`npm run build\`
4. Start the server: \`npm start\`

## Usage with Claude

1. Start the MCP Terminal Server
2. In Claude Desktop, go to Settings > MCP
3. Click "Add Server" and enter: http://localhost:3000
4. Click "Connect" and start using the terminal tool

## Security Warning

⚠️ **Caution**: This tool gives Claude access to your terminal. Only use with trusted content and be mindful of commands executed.

## Example Prompts

- "Run 'ls -la' to list files in the current directory"
- "Check what processes are running with 'ps aux'"
- "Use 'cat /etc/os-release' to get information about the operating system"

## License

MIT

`;

    // Add README.md to the archive
    archive.append(readmeContent, { name: 'README.md' });

    // Finalize the archive
    await archive.finalize();
    
  } catch (error) {
    console.error('Error generating terminal package:', error);
    res.status(500).json({ error: 'Failed to generate terminal package' });
  }
});

export default router;