/**
 * GitHub Repository Importer for MCP Servers
 * 
 * This service analyzes GitHub repositories to extract MCP server configurations,
 * including tools, parameters, and documentation.
 */

import fs from 'fs-extra';
import path from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import { v4 as uuidv4 } from 'uuid';

// Define types to match client-side types
interface Parameter {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Parameter[];
}

interface ServerConfig {
  serverName: string;
  serverType: 'python' | 'typescript';
  description: string;
  tools: Tool[];
}

// Temporary directory for cloning repositories
const TEMP_DIR = path.join(process.cwd(), 'tmp');

/**
 * Extract GitHub repository name from URL
 */
function extractRepoInfo(url: string): { owner: string; repo: string } | null {
  // Match GitHub repository URLs
  // Examples:
  // - https://github.com/username/repo
  // - https://github.com/username/repo.git
  // - git@github.com:username/repo.git
  
  // HTTPS format
  let match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2]
    };
  }
  
  // SSH format
  match = url.match(/github\.com:([^\/]+)\/([^\/\.]+)/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace('.git', '')
    };
  }
  
  return null;
}

/**
 * Parse a Python file to extract MCP tool definitions
 */
async function extractToolsFromPythonFile(filePath: string): Promise<Tool[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const tools: Tool[] = [];
    
    // Look for class-based parameter definitions
    // Format: class ToolNameParams(BaseModel):
    const classMatches = content.matchAll(/class\s+([A-Za-z0-9_]+)_?[pP]arams\s*\([^)]*\):\s*([\s\S]*?)(?=class|\Z)/g);
    
    for (const match of Array.from(classMatches)) {
      const toolName = match[1].toLowerCase();
      const classBody = match[2];
      const parameters: Parameter[] = [];
      
      // Extract parameters from class body
      // Format: param_name: type = Field(description="...")
      const paramMatches = classBody.matchAll(/([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_]+)(?:\s*=\s*Field\((?:[^)]*description\s*=\s*"([^"]*)")?[^)]*\))?/g);
      
      for (const paramMatch of Array.from(paramMatches)) {
        const paramName = paramMatch[1];
        let paramType = paramMatch[2].toLowerCase();
        const description = paramMatch[3] || `${paramName} parameter`;
        
        // Convert Python types to our type system
        if (paramType === 'str') paramType = 'string';
        else if (paramType === 'int' || paramType === 'float') paramType = 'number';
        else if (paramType === 'bool') paramType = 'boolean';
        else if (paramType === 'list' || paramType === 'array') paramType = 'array';
        else if (paramType === 'dict') paramType = 'object';
        else paramType = 'string'; // Default
        
        parameters.push({
          id: uuidv4(),
          name: paramName,
          type: paramType,
          description
        });
      }
      
      // Extract function definition for description
      const funcMatch = content.match(new RegExp(`async\\s+def\\s+${toolName}\\s*\\([^)]*\\)\\s*(?:->[^:]*)?:\\s*(["\'])([^\\1]*?)\\1`));
      const description = funcMatch ? funcMatch[2] : `${toolName} tool`;
      
      tools.push({
        id: uuidv4(),
        name: toolName,
        description,
        parameters
      });
    }
    
    // Look for direct function definitions if no class-based definitions were found
    if (tools.length === 0) {
      const funcMatches = content.matchAll(/async\s+def\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*(?:->[^:]*)?:\s*(?:(?:["\'])([^"\']*?)(?:["\']))?/g);
      
      for (const match of Array.from(funcMatches)) {
        const toolName = match[1];
        const params = match[2];
        const description = match[3] || `${toolName} tool`;
        const parameters: Parameter[] = [];
        
        // Extract parameters from function arguments
        const paramMatches = params.split(',');
        
        for (let i = 0; i < paramMatches.length; i++) {
          const paramStr = paramMatches[i].trim();
          if (paramStr === 'self' || paramStr === 'cls' || !paramStr) continue;
          
          const paramParts = paramStr.split(':');
          if (paramParts.length < 2) continue;
          
          const paramName = paramParts[0].trim();
          let paramType = paramParts[1].trim().split('=')[0].trim();
          
          // Convert Python types to our type system
          if (paramType === 'str') paramType = 'string';
          else if (paramType === 'int' || paramType === 'float') paramType = 'number';
          else if (paramType === 'bool') paramType = 'boolean';
          else if (paramType === 'list' || paramType === 'array') paramType = 'array';
          else if (paramType === 'dict') paramType = 'object';
          else paramType = 'string'; // Default
          
          parameters.push({
            id: uuidv4(),
            name: paramName,
            type: paramType,
            description: `${paramName} parameter for ${toolName}`
          });
        }
        
        tools.push({
          id: uuidv4(),
          name: toolName,
          description,
          parameters
        });
      }
    }
    
    return tools;
  } catch (error) {
    console.error('Error extracting tools from Python file:', error);
    return [];
  }
}

/**
 * Parse a TypeScript/JavaScript file to extract MCP tool definitions
 */
async function extractToolsFromJSFile(filePath: string): Promise<Tool[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const tools: Tool[] = [];
    
    // Look for function-based tool definitions
    // Format: export async function toolName(params: {...}) { ... }
    const funcMatches = content.matchAll(/export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)(?:\s*:\s*[^{]*)?{(?:\s*\/\*\*\s*([\s\S]*?)\s*\*\/)?/g);
    
    for (const match of Array.from(funcMatches)) {
      const toolName = match[1];
      const params = match[2];
      
      // Extract description from JSDoc comment
      let description = match[3] || `${toolName} tool`;
      description = description.replace(/\*\s*/g, '').trim();
      
      const parameters: Parameter[] = [];
      
      // Extract parameter information
      // First, check for a destructured object parameter
      const objectParamMatch = params.match(/{([^}]*)}\s*:\s*{([^}]*)}/);
      
      if (objectParamMatch) {
        // This is a destructured object parameter
        const paramNames = objectParamMatch[1].split(',').map(p => p.trim());
        const paramTypes = objectParamMatch[2].split(',').map(p => p.trim());
        
        for (let i = 0; i < paramNames.length; i++) {
          const paramName = paramNames[i];
          const typeMatch = paramTypes.find(t => t.startsWith(paramName + '?:') || t.startsWith(paramName + ':'));
          let paramType = 'string'; // Default
          
          if (typeMatch) {
            const typePart = typeMatch.split(':')[1].trim();
            if (typePart.includes('number')) paramType = 'number';
            else if (typePart.includes('boolean')) paramType = 'boolean';
            else if (typePart.includes('string')) paramType = 'string';
            else if (typePart.includes('[]') || typePart.includes('Array')) paramType = 'array';
            else if (typePart.includes('object') || typePart.includes('{')) paramType = 'object';
          }
          
          parameters.push({
            id: uuidv4(),
            name: paramName,
            type: paramType,
            description: `${paramName} parameter for ${toolName}`
          });
        }
      } else {
        // Try to extract from regular parameters
        const paramMatches = params.split(',');
        
        for (let i = 0; i < paramMatches.length; i++) {
          const paramStr = paramMatches[i].trim();
          if (!paramStr) continue;
          
          const paramParts = paramStr.split(':');
          const paramName = paramParts[0].trim();
          let paramType = 'string'; // Default
          
          if (paramParts.length > 1) {
            const typePart = paramParts[1].trim();
            if (typePart.includes('number')) paramType = 'number';
            else if (typePart.includes('boolean')) paramType = 'boolean';
            else if (typePart.includes('string')) paramType = 'string';
            else if (typePart.includes('[]') || typePart.includes('Array')) paramType = 'array';
            else if (typePart.includes('object') || typePart.includes('{')) paramType = 'object';
          }
          
          parameters.push({
            id: uuidv4(),
            name: paramName,
            type: paramType,
            description: `${paramName} parameter for ${toolName}`
          });
        }
      }
      
      // Look for JSDoc param descriptions in comment blocks before the function
      const jsDocMatches = content.matchAll(/@param\s+{[^}]*}\s+(\w+)\s+([^\n]*)/g);
      const jsDocParams = Array.from(jsDocMatches).reduce((acc, match) => {
        acc[match[1]] = match[2].trim();
        return acc;
      }, {} as Record<string, string>);
      
      // Update parameter descriptions if JSDoc comments exist
      parameters.forEach(param => {
        if (jsDocParams[param.name]) {
          param.description = jsDocParams[param.name];
        }
      });
      
      tools.push({
        id: uuidv4(),
        name: toolName,
        description,
        parameters
      });
    }
    
    return tools;
  } catch (error) {
    console.error('Error extracting tools from JS/TS file:', error);
    return [];
  }
}

/**
 * Analyze repository and extract MCP server configuration
 */
async function analyzeRepository(localPath: string): Promise<ServerConfig | null> {
  try {
    // Check if repository exists
    if (!await fs.pathExists(localPath)) {
      throw new Error(`Repository directory not found: ${localPath}`);
    }
    
    // Get a list of all files in the repository
    const files = await fs.readdir(localPath, { recursive: true });
    
    // Try to find server configuration
    let serverName = path.basename(localPath);
    let serverDescription = `Imported from GitHub repository ${serverName}`;
    let serverType: 'python' | 'typescript' = 'python'; // Default
    const tools: Tool[] = [];
    
    // First look for package.json to determine if it's a TypeScript/JavaScript project
    const packageJsonPath = path.join(localPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        serverName = packageJson.name || serverName;
        serverDescription = packageJson.description || serverDescription;
        serverType = 'typescript';
      } catch (error) {
        console.error('Error parsing package.json:', error);
      }
    }
    
    // Look for Python setup.py or pyproject.toml
    const setupPyPath = path.join(localPath, 'setup.py');
    const pyprojectTomlPath = path.join(localPath, 'pyproject.toml');
    
    if (await fs.pathExists(setupPyPath)) {
      const setupPyContent = await fs.readFile(setupPyPath, 'utf-8');
      const nameMatch = setupPyContent.match(/name\s*=\s*['"]([^'"]+)['"]/);
      const descMatch = setupPyContent.match(/description\s*=\s*['"]([^'"]+)['"]/);
      
      if (nameMatch) serverName = nameMatch[1];
      if (descMatch) serverDescription = descMatch[1];
      serverType = 'python';
    } else if (await fs.pathExists(pyprojectTomlPath)) {
      const pyprojectContent = await fs.readFile(pyprojectTomlPath, 'utf-8');
      const nameMatch = pyprojectContent.match(/name\s*=\s*['"]([^'"]+)['"]/);
      const descMatch = pyprojectContent.match(/description\s*=\s*['"]([^'"]+)['"]/);
      
      if (nameMatch) serverName = nameMatch[1];
      if (descMatch) serverDescription = descMatch[1];
      serverType = 'python';
    }
    
    // Look for README.md for description
    const readmePath = path.join(localPath, 'README.md');
    if (await fs.pathExists(readmePath)) {
      const readmeContent = await fs.readFile(readmePath, 'utf-8');
      const firstLine = readmeContent.split('\n')[0].replace(/^#+\s*/, '').trim();
      if (firstLine) {
        serverName = firstLine;
      }
      
      // Extract the first paragraph for description
      const paragraphs = readmeContent.split('\n\n');
      if (paragraphs.length > 1) {
        const firstParagraph = paragraphs[1].trim();
        if (firstParagraph && !firstParagraph.startsWith('#')) {
          serverDescription = firstParagraph;
        }
      }
    }
    
    // Look for Python files and extract tools
    const pyFiles = [];
    for (const file of files) {
      if (typeof file === 'string' && file.endsWith('.py')) {
        pyFiles.push(file);
      }
    }
    
    for (const file of pyFiles) {
      const filePath = path.join(localPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        const fileTools = await extractToolsFromPythonFile(filePath);
        tools.push(...fileTools);
      }
    }
    
    // Look for TypeScript/JavaScript files and extract tools
    if (tools.length === 0) {
      const jsFiles = [];
      for (const file of files) {
        if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.js'))) {
          jsFiles.push(file);
        }
      }
      
      for (const file of jsFiles) {
        const filePath = path.join(localPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          const fileTools = await extractToolsFromJSFile(filePath);
          tools.push(...fileTools);
        }
      }
    }
    
    // If no tools were found, return null
    if (tools.length === 0) {
      console.error('No MCP tools found in repository');
      return null;
    }
    
    return {
      serverName,
      serverType,
      description: serverDescription,
      tools
    };
  } catch (error) {
    console.error('Error analyzing repository:', error);
    return null;
  }
}

/**
 * Import MCP server from GitHub repository URL
 */
export async function importFromGitHub(repositoryUrl: string): Promise<ServerConfig | null> {
  const repoInfo = extractRepoInfo(repositoryUrl);
  
  if (!repoInfo) {
    throw new Error('Invalid GitHub repository URL');
  }
  
  // Create temporary directory if it doesn't exist
  await fs.ensureDir(TEMP_DIR);
  
  // Create a unique directory for this repository
  const repoDir = path.join(TEMP_DIR, `${repoInfo.owner}-${repoInfo.repo}-${Date.now()}`);
  await fs.ensureDir(repoDir);
  
  try {
    // Clone the repository
    const git: SimpleGit = simpleGit();
    await git.clone(repositoryUrl, repoDir);
    
    // Analyze the repository
    const config = await analyzeRepository(repoDir);
    
    // Clean up
    await fs.remove(repoDir);
    
    return config;
  } catch (error) {
    // Clean up on error
    await fs.remove(repoDir);
    throw error;
  }
}