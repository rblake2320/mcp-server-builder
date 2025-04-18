/**
 * MCP Terminal Server
 * 
 * A complete MCP-compatible server implementation that provides terminal access
 * functionality to Claude and other LLMs through the Model Context Protocol.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { executeCommand } from './terminal-access';

// Define the MCP Terminal server schema
const MCP_SCHEMA = {
  openapi: '3.0.0',
  info: {
    title: 'MCP Terminal Server',
    description: 'Execute shell commands on the host system',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local MCP terminal server',
    },
  ],
  paths: {
    '/run': {
      post: {
        summary: 'Run a shell command',
        description: 'Execute a shell command and return the output',
        operationId: 'runCommand',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['command'],
                properties: {
                  command: {
                    type: 'string',
                    description: 'The shell command to execute',
                  },
                  args: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Optional arguments for the command',
                  },
                  cwd: {
                    type: 'string',
                    description: 'Working directory for the command execution',
                  },
                  env: {
                    type: 'object',
                    additionalProperties: {
                      type: 'string',
                    },
                    description: 'Environment variables to set for the command',
                  },
                  timeout: {
                    type: 'integer',
                    description: 'Timeout in milliseconds',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Command executed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    stdout: {
                      type: 'string',
                      description: 'Standard output from the command',
                    },
                    stderr: {
                      type: 'string',
                      description: 'Standard error output from the command',
                    },
                    exitCode: {
                      type: 'integer',
                      nullable: true,
                      description: 'Exit code of the command',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/.well-known/mcp': {
      get: {
        summary: 'MCP Metadata',
        description: 'Get MCP metadata information',
        operationId: 'getMcpMetadata',
        responses: {
          '200': {
            description: 'MCP metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    schema_version: {
                      type: 'string',
                    },
                    api_version: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                    description: {
                      type: 'string',
                    },
                    tools: {
                      type: 'array',
                      items: {
                        type: 'object',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// Create the MCP server
export function createMcpTerminalServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  });
  
  // MCP metadata endpoint
  app.get('/.well-known/mcp', (req, res) => {
    res.json({
      schema_version: '0.1.0',
      api_version: '0.1.0',
      name: 'terminal-access',
      description: 'Execute shell commands on the host system',
      tools: [
        {
          name: 'run',
          description: 'Run a shell command',
          input_schema: {
            type: 'object',
            required: ['command'],
            properties: {
              command: {
                type: 'string',
                description: 'The shell command to execute',
              },
              args: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Optional arguments for the command',
              },
              cwd: {
                type: 'string',
                description: 'Working directory for the command execution',
              },
              env: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                },
                description: 'Environment variables to set for the command',
              },
              timeout: {
                type: 'integer',
                description: 'Timeout in milliseconds',
              },
            },
          },
          output_schema: {
            type: 'object',
            properties: {
              stdout: {
                type: 'string',
                description: 'Standard output from the command',
              },
              stderr: {
                type: 'string',
                description: 'Standard error output from the command',
              },
              exitCode: {
                type: 'integer',
                nullable: true,
                description: 'Exit code of the command',
              },
            },
          },
        },
      ],
    });
  });
  
  // OpenAPI schema endpoint
  app.get('/openapi.json', (req, res) => {
    res.json(MCP_SCHEMA);
  });
  
  // Terminal command execution endpoint
  app.post('/run', async (req, res) => {
    try {
      const { command, args = [], cwd, env, timeout } = req.body;
      
      if (!command) {
        return res.status(400).json({ error: 'Command is required' });
      }
      
      // Execute the command
      const result = await executeCommand(command, args, { cwd, env, timeout });
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Terminal command execution error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });
  
  return app;
}

// If this file is executed directly, start the server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const app = createMcpTerminalServer();
  
  app.listen(PORT, () => {
    console.log(`MCP Terminal Server running on port ${PORT}`);
    console.log(`OpenAPI schema available at http://localhost:${PORT}/openapi.json`);
    console.log(`MCP metadata available at http://localhost:${PORT}/.well-known/mcp`);
  });
}

export default createMcpTerminalServer;