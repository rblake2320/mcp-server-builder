/**
 * Terminal Access Tool for MCP Server
 * 
 * Provides a terminal access tool for the Model Context Protocol (MCP)
 * that allows executing shell commands on the host system.
 */

import { spawn } from 'child_process';
import { Request, Response } from 'express';

interface TerminalCommandRequest {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

interface TerminalCommandResponse {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

/**
 * Execute a shell command and return the results
 */
export const executeCommand = async (
  command: string,
  args: string[] = [],
  options: { cwd?: string; env?: Record<string, string>; timeout?: number } = {}
): Promise<TerminalCommandResponse> => {
  return new Promise((resolve) => {
    const { cwd, env, timeout } = options;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Combine environment variables
    const combinedEnv = { ...process.env, ...(env || {}) };
    
    // Spawn the process
    const childProcess = spawn(command, args, {
      cwd: cwd || process.cwd(),
      env: combinedEnv,
      shell: true,
    });
    
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    childProcess.on('error', (error) => {
      resolve({
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
    
    childProcess.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code,
      });
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
    
    // Set timeout if specified
    if (timeout) {
      timeoutId = setTimeout(() => {
        childProcess.kill();
        resolve({
          stdout,
          stderr,
          exitCode: null,
          error: 'Command execution timed out',
        });
      }, timeout);
    }
  });
};

/**
 * Terminal command execution handler for API endpoint
 */
export const terminalCommandHandler = async (req: Request, res: Response) => {
  try {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { command, args = [], cwd, env, timeout } = req.body as TerminalCommandRequest;
    
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
};