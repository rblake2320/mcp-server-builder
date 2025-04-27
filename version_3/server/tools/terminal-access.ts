// This file contains the terminal access functions for the MCP Terminal Tool

import { exec, spawn } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Execute a shell command and return the result
 * 
 * @param command The command to execute
 * @returns Object containing stdout, stderr, and exit code
 */
export async function executeCommand(command: string): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: error ? error.code || 1 : 0,
      });
    });
  });
}

/**
 * Spawn a process and stream its output
 * 
 * @param command The command to execute
 * @param args The arguments to pass to the command
 * @param onOutput Callback for when output is received
 * @param onError Callback for when error output is received
 * @param onExit Callback for when the process exits
 * @returns Object containing the process ID and a function to terminate the process
 */
export function spawnProcess(
  command: string,
  args: string[],
  onOutput: (data: string) => void,
  onError: (data: string) => void,
  onExit: (code: number | null) => void
): { pid: number | undefined; terminate: () => void } {
  // Use appropriate shell based on platform
  const isWindows = os.platform() === 'win32';
  
  const proc = spawn(command, args, {
    shell: isWindows ? true : '/bin/bash',
    env: process.env,
  });

  proc.stdout.on('data', (data) => {
    onOutput(data.toString());
  });

  proc.stderr.on('data', (data) => {
    onError(data.toString());
  });

  proc.on('exit', (code) => {
    onExit(code);
  });

  return {
    pid: proc.pid,
    terminate: () => {
      // Try to terminate gracefully first, then kill if needed
      try {
        proc.kill();
      } catch (error) {
        console.error('Failed to terminate process:', error);
      }
    },
  };
}

/**
 * Get environment variables as a dictionary
 * 
 * @returns Object containing environment variables
 */
export function getEnvVars(): Record<string, string> {
  const envVars: Record<string, string> = {};
  
  // Filter sensitive environment variables
  const sensitiveKeys = [
    'SECRET', 'KEY', 'PASSWORD', 'PASS', 'TOKEN', 'AUTH',
    'ACCESS', 'CREDENTIAL', 'PRIVATE', 'APIKEY', 'API_KEY'
  ];
  
  for (const [key, value] of Object.entries(process.env)) {
    // Skip undefined values and sensitive data
    if (value === undefined) continue;
    
    if (sensitiveKeys.some(sk => key.toUpperCase().includes(sk))) {
      envVars[key] = '[REDACTED]';
    } else {
      envVars[key] = value;
    }
  }
  
  return envVars;
}

/**
 * Get system information
 * 
 * @returns Object containing system information
 */
export async function getSystemInfo(): Promise<{
  platform: string;
  release: string;
  hostname: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  nodeVersion: string;
  currentDir: string;
}> {
  const { stdout: currentDir } = await executeCommand('pwd');
  
  return {
    platform: os.platform(),
    release: os.release(),
    hostname: os.hostname(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    nodeVersion: process.version,
    currentDir: currentDir.trim(),
  };
}