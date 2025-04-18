import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { User } from '@shared/schema';

// GitHub API URLs
const GITHUB_API_URL = 'https://api.github.com';

// Interface for GitHub repository data
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  hasMcpConfig?: boolean;
}

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

/**
 * Check if a repository contains MCP server configuration files
 */
async function checkForMcpConfig(token: string, repo: GitHubRepo): Promise<boolean> {
  try {
    // Check for common MCP server files in the repository
    // Try both Python and JavaScript/TypeScript server files
    const potentialMcpFiles = [
      'server.py',
      'mcp_server.py',
      'server.js',
      'server.ts',
      'mcp_server.js',
      'mcp_server.ts',
      'mcp.json',
      'mcp.yaml',
      'mcp.yml'
    ];
    
    for (const file of potentialMcpFiles) {
      const url = `${GITHUB_API_URL}/repos/${repo.full_name}/contents/${file}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MCP-Server-Builder'
        }
      });
      
      if (response.status === 200) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking for MCP config in ${repo.full_name}:`, error);
    return false;
  }
}

/**
 * Get the list of GitHub repositories for a user
 */
export async function getUserRepositories(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        error: 'Authentication required',
        userMessage: 'Please sign in to access this feature'
      });
    }
    
    const user = req.user as User;
    
    // Verify GitHub token exists
    if (!user.githubToken) {
      return res.status(400).json({ 
        error: 'GitHub token not found', 
        userMessage: 'To access GitHub repositories, you need to connect your GitHub account. Please use the GitHub login button at the top right.' 
      });
    }
    
    // Fetch repositories from GitHub API
    const response = await fetch(`${GITHUB_API_URL}/user/repos?sort=updated&per_page=100`, {
      headers: {
        'Authorization': `Bearer ${user.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MCP-Server-Builder'
      }
    });
    
    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('GitHub API error:', error);
        console.error('GitHub API response status:', response.status);
        console.error('GitHub API response URL:', response.url);
        
        let userMessage = 'We encountered an issue connecting to GitHub. ';
        
        // Handle specific error cases
        if (response.status === 401) {
          userMessage += 'Your GitHub token appears to be invalid or expired. Please try signing in with GitHub again.';
        } else if (response.status === 403) {
          userMessage += 'GitHub API rate limit exceeded or insufficient permissions. Please try again later or check your GitHub account permissions.';
        } else if (response.status === 404) {
          userMessage += 'We couldn\'t find your GitHub repositories. Please make sure your GitHub account has repositories.';
        } else {
          userMessage += 'Please try again later or contact support.';
        }
        
        return res.status(200).json({ // Return 200 so frontend can handle it gracefully
          error: 'Failed to fetch repositories',
          githubError: error,
          status: response.status,
          userMessage
        });
      } catch (parseError) {
        console.error('Failed to parse GitHub error response:', parseError);
        console.error('GitHub API response status:', response.status);
        console.error('GitHub API response URL:', response.url);
        
        return res.status(200).json({ // Return 200 so frontend can display a user-friendly message
          error: 'Failed to fetch repositories',
          status: response.status,
          userMessage: 'We couldn\'t connect to GitHub properly. Please try again later or try reconnecting your GitHub account.'
        });
      }
    }
    
    const repos = await response.json() as GitHubRepo[];
    
    // Check each repository for MCP configuration
    const reposWithMcpStatus = await Promise.all(
      repos.map(async (repo) => {
        const hasMcpConfig = await checkForMcpConfig(user.githubToken!, repo);
        return { ...repo, hasMcpConfig };
      })
    );
    
    // Filter to only show repositories with MCP configs if requested
    const { mcpOnly } = req.query;
    const filteredRepos = mcpOnly === 'true' 
      ? reposWithMcpStatus.filter(repo => repo.hasMcpConfig) 
      : reposWithMcpStatus;
    
    return res.json(filteredRepos);
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return res.status(500).json({ error: 'Failed to fetch repositories' });
  }
}

/**
 * Import an MCP server from a GitHub repository
 */
export async function importRepositoryServer(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = req.user as User;
    const { repoFullName, branch = 'main' } = req.body;
    
    if (!repoFullName) {
      return res.status(400).json({ error: 'Repository name is required' });
    }
    
    if (!user.githubToken) {
      return res.status(400).json({ 
        error: 'GitHub token not found', 
        message: 'Please connect your GitHub account' 
      });
    }
    
    // Fetch repository details
    const repoResponse = await fetch(`${GITHUB_API_URL}/repos/${repoFullName}`, {
      headers: {
        'Authorization': `Bearer ${user.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MCP-Server-Builder'
      }
    });
    
    if (!repoResponse.ok) {
      try {
        const error = await repoResponse.json();
        console.error('GitHub API error:', error);
        console.error('GitHub API response status:', repoResponse.status);
        console.error('GitHub API response URL:', repoResponse.url);
        
        return res.status(repoResponse.status).json({ 
          error: 'Failed to fetch repository',
          githubError: error,
          status: repoResponse.status,
          message: `GitHub API returned ${repoResponse.status} status code. Please check your GitHub token permissions.`
        });
      } catch (parseError) {
        console.error('Failed to parse GitHub error response:', parseError);
        console.error('GitHub API response status:', repoResponse.status);
        console.error('GitHub API response URL:', repoResponse.url);
        
        return res.status(repoResponse.status).json({
          error: 'Failed to fetch repository',
          status: repoResponse.status,
          message: `GitHub API returned ${repoResponse.status} status code with unparseable response. Please check your GitHub token permissions.`
        });
      }
    }
    
    const repo = await repoResponse.json() as GitHubRepo;
    
    // The implementation for actually importing the server would go here
    // This would involve:
    // 1. Detecting the server type (Python, JavaScript/TypeScript)
    // 2. Processing the files to extract tool definitions
    // 3. Creating a new server record in the database
    
    // For now we'll return a placeholder success response
    return res.json({
      success: true,
      message: 'Repository prepared for import',
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url
      }
    });
  } catch (error) {
    console.error('Error importing repository:', error);
    return res.status(500).json({ error: 'Failed to import repository' });
  }
}