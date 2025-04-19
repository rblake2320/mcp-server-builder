// MCP Terminal Server - Provides terminal access to Claude via MCP protocol

import express from 'express';
import { Server as HTTPServer } from 'http';
import path from 'path';
import fs from 'fs';
import * as os from 'os';

// Import CORS for cross-origin requests (needed for CLI access)
// Note: Install with `npm install cors @types/cors`
import cors from 'cors';

import { executeCommand, spawnProcess, getEnvVars, getSystemInfo } from './terminal-access';

// Application type for strong typing
interface TerminalApplication {
  app: express.Express;
  server: HTTPServer | null;
  port: number;
  start: () => Promise<HTTPServer>;
  stop: () => Promise<void>;
}

// Process registry to keep track of spawned processes
interface ProcessInfo {
  pid: number | undefined;
  command: string;
  terminate: () => void;
  startTime: Date;
}

// Create a terminal application
export function createTerminalApp(port = 3000): TerminalApplication {
  const app = express();
  let server: HTTPServer | null = null;
  
  // Map to track running processes
  const processes = new Map<string, ProcessInfo>();
  
  // Basic middleware setup
  app.use(express.json());
  app.use(cors());
  
  // Middleware to log requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
  
  // MCP protocol manifest endpoint
  app.get('/', (req, res) => {
    const manifest = {
      protocol: {
        schema: "mcp",
        version: "0.1.0"
      },
      server: {
        name: "MCP Terminal Server",
        version: "1.0.0",
        description: "Provides terminal access to the host system",
        vendor: "Anthropic Claude Integration",
        host: req.headers.host || `localhost:${port}`
      },
      tools: [
        {
          name: "execute_command",
          description: "Execute a shell command on the host system and return its output",
          parameters: [
            {
              name: "command",
              description: "The shell command to execute",
              type: "string",
              required: true
            }
          ]
        },
        {
          name: "get_environment_variables",
          description: "Get a list of environment variables from the host system",
          parameters: []
        },
        {
          name: "get_system_info",
          description: "Get information about the host system",
          parameters: []
        },
        {
          name: "spawn_process",
          description: "Spawn a process and stream its output in real-time",
          parameters: [
            {
              name: "command",
              description: "The shell command to execute",
              type: "string",
              required: true
            },
            {
              name: "args",
              description: "Arguments to pass to the command",
              type: "array",
              items: {
                type: "string"
              },
              required: false
            }
          ]
        },
        {
          name: "terminate_process",
          description: "Terminate a running process",
          parameters: [
            {
              name: "id",
              description: "The process ID to terminate",
              type: "string",
              required: true
            }
          ]
        },
        {
          name: "list_processes",
          description: "List all running processes spawned by this server",
          parameters: []
        }
      ]
    };
    
    res.json(manifest);
  });
  
  // Execute command endpoint
  app.post('/execute_command', async (req, res) => {
    try {
      const { command } = req.body;
      
      if (!command) {
        return res.status(400).json({
          error: 'Command is required'
        });
      }
      
      const result = await executeCommand(command);
      
      res.json({
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode
      });
    } catch (error) {
      console.error('Error executing command:', error);
      res.status(500).json({
        error: 'Failed to execute command',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get environment variables endpoint
  app.post('/get_environment_variables', (req, res) => {
    try {
      const envVars = getEnvVars();
      res.json({ variables: envVars });
    } catch (error) {
      console.error('Error getting environment variables:', error);
      res.status(500).json({
        error: 'Failed to get environment variables',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get system info endpoint
  app.post('/get_system_info', async (req, res) => {
    try {
      const systemInfo = await getSystemInfo();
      res.json(systemInfo);
    } catch (error) {
      console.error('Error getting system info:', error);
      res.status(500).json({
        error: 'Failed to get system info',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Spawn process endpoint - uses WebSockets for streaming output
  app.post('/spawn_process', (req, res) => {
    try {
      const { command, args = [] } = req.body;
      
      if (!command) {
        return res.status(400).json({
          error: 'Command is required'
        });
      }
      
      // Generate a unique ID for this process
      const id = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Since we're not using WebSockets in this simplified version,
      // we'll just start the process and return its ID
      const { pid, terminate } = spawnProcess(
        command,
        args,
        (output) => { console.log(`[${id}] stdout: ${output}`); },
        (error) => { console.error(`[${id}] stderr: ${error}`); },
        (code) => { 
          console.log(`[${id}] Process exited with code ${code}`);
          // Clean up when the process ends
          processes.delete(id);
        }
      );
      
      // Store the process info
      processes.set(id, {
        pid: pid as number | undefined,
        command: `${command} ${args.join(' ')}`,
        terminate,
        startTime: new Date()
      });
      
      res.json({
        id,
        pid,
        message: 'Process started successfully'
      });
    } catch (error) {
      console.error('Error spawning process:', error);
      res.status(500).json({
        error: 'Failed to spawn process',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Terminate process endpoint
  app.post('/terminate_process', (req, res) => {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({
          error: 'Process ID is required'
        });
      }
      
      const processInfo = processes.get(id);
      
      if (!processInfo) {
        return res.status(404).json({
          error: 'Process not found'
        });
      }
      
      // Terminate the process
      processInfo.terminate();
      
      // Remove from the registry
      processes.delete(id);
      
      res.json({
        message: 'Process terminated successfully'
      });
    } catch (error) {
      console.error('Error terminating process:', error);
      res.status(500).json({
        error: 'Failed to terminate process',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // List processes endpoint
  app.post('/list_processes', (req, res) => {
    try {
      const processList = Array.from(processes.entries()).map(([id, info]) => ({
        id,
        pid: info.pid,
        command: info.command,
        startTime: info.startTime,
        uptime: Math.floor((Date.now() - info.startTime.getTime()) / 1000) // uptime in seconds
      }));
      
      res.json({
        processes: processList,
        count: processList.length
      });
    } catch (error) {
      console.error('Error listing processes:', error);
      res.status(500).json({
        error: 'Failed to list processes',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Start the server
  async function start(): Promise<HTTPServer> {
    return new Promise((resolve) => {
      server = app.listen(port, () => {
        console.log(`MCP Terminal Server running on http://localhost:${port}`);
        resolve(server!);
      });
    });
  }
  
  // Stop the server
  async function stop(): Promise<void> {
    if (!server) return;
    
    return new Promise((resolve, reject) => {
      // Terminate all running processes
      Array.from(processes.entries()).forEach(([id, info]) => {
        console.log(`Terminating process ${id} (PID: ${info.pid})`);
        info.terminate();
      });
      
      server!.close((err) => {
        if (err) {
          console.error('Error closing server:', err);
          reject(err);
        } else {
          console.log('MCP Terminal Server stopped');
          server = null;
          resolve();
        }
      });
    });
  }
  
  return { app, server, port, start, stop };
}