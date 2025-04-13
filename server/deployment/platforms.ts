/**
 * Deployment Service for MCP Servers
 * 
 * This service provides deployment options for MCP servers to various hosting platforms.
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Platform-specific deployment settings
 */
export interface DeploymentPlatform {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  setupInstructions: string[];
  requiresCredentials: boolean;
  credentialFields?: {
    id: string;
    name: string;
    description: string;
    type: 'text' | 'password';
    required: boolean;
  }[];
  generateDeploymentFiles: (buildId: string, buildDir: string) => Promise<Record<string, string>>;
}

/**
 * Available deployment platforms
 */
export const deploymentPlatforms: DeploymentPlatform[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy to Vercel for serverless MCP server hosting with automatic HTTPS',
    logoUrl: '/logos/vercel.svg',
    setupInstructions: [
      'Sign up for a Vercel account at https://vercel.com if you don\'t have one',
      'Install the Vercel CLI: npm install -g vercel',
      'Run "vercel login" to authenticate with your account',
      'Extract the downloaded deployment package to a folder on your computer',
      'Open a terminal/command prompt in the extracted folder',
      'Run "vercel" and follow the prompts to deploy your MCP server',
      'After deployment completes, note the URL provided by Vercel',
      'Use this URL to access your MCP server in AI assistants'
    ],
    requiresCredentials: true,
    credentialFields: [
      {
        id: 'vercel_token',
        name: 'Vercel API Token',
        description: 'Your Vercel API token for automated deployments',
        type: 'password',
        required: true
      }
    ],
    generateDeploymentFiles: async (buildId: string, buildDir: string) => {
      // Generate vercel.json for Vercel deployments
      const vercelConfig = {
        version: 2,
        builds: [
          {
            src: "*.*",
            use: "@vercel/node"
          }
        ],
        routes: [
          {
            src: "/(.*)",
            dest: "/"
          }
        ],
        env: {
          NODE_ENV: "production"
        }
      };
      
      // Write vercel.json to build directory
      await fs.writeFile(
        path.join(buildDir, 'vercel.json'),
        JSON.stringify(vercelConfig, null, 2)
      );
      
      return {
        'vercel.json': JSON.stringify(vercelConfig, null, 2)
      };
    }
  },
  {
    id: 'railway',
    name: 'Railway',
    description: 'Deploy to Railway for easy setup and management of MCP servers',
    logoUrl: '/logos/railway.svg',
    setupInstructions: [
      'Create a Railway account at https://railway.app if you don\'t have one',
      'Install the Railway CLI: npm install -g @railway/cli',
      'Run "railway login" to authenticate with your account',
      'Extract the downloaded deployment package to a folder on your computer',
      'Open a terminal/command prompt in the extracted folder',
      'Run "railway init" to create a new project',
      'Run "railway up" to deploy your MCP server',
      'After deployment, run "railway domain" to create a public URL',
      'Use this URL to access your MCP server in AI assistants'
    ],
    requiresCredentials: true,
    credentialFields: [
      {
        id: 'railway_token',
        name: 'Railway API Token',
        description: 'Your Railway API token for automated deployments',
        type: 'password',
        required: true
      }
    ],
    generateDeploymentFiles: async (buildId: string, buildDir: string) => {
      // Generate railway.json for Railway deployments
      const railwayConfig = {
        version: 2,
        build: {
          builder: "NIXPACKS",
          buildCommand: "npm install && npm run build"
        },
        deploy: {
          restartPolicyType: "ON_FAILURE",
          restartPolicyMaxRetries: 10
        }
      };
      
      // Write railway.json to build directory
      await fs.writeFile(
        path.join(buildDir, 'railway.json'),
        JSON.stringify(railwayConfig, null, 2)
      );
      
      return {
        'railway.json': JSON.stringify(railwayConfig, null, 2)
      };
    }
  },
  {
    id: 'render',
    name: 'Render',
    description: 'Deploy to Render for easy cloud hosting with automatic TLS certificates',
    logoUrl: '/logos/render.svg',
    setupInstructions: [
      'Create a Render account at https://render.com if you don\'t have one',
      'Extract the downloaded deployment package to a folder on your computer',
      'Log in to your Render dashboard at https://dashboard.render.com',
      'Click "New +" and select "Web Service"',
      'Choose "Build and deploy from a Git repository"',
      'Connect your GitHub/GitLab account or click "Public Git repository"',
      'Enter the repository URL or upload the deployment package',
      'Choose "Node" as the runtime and set "npm start" as the start command',
      'Click "Create Web Service" to deploy',
      'After deployment, copy the service URL to use with your AI assistants'
    ],
    requiresCredentials: true,
    credentialFields: [
      {
        id: 'render_token',
        name: 'Render API Token',
        description: 'Your Render API token for automated deployments',
        type: 'password',
        required: true
      }
    ],
    generateDeploymentFiles: async (buildId: string, buildDir: string) => {
      // Generate render.yaml for Render deployments
      const renderConfig = {
        services: [
          {
            type: "web",
            name: `mcp-server-${buildId}`,
            env: "node",
            buildCommand: "npm install && npm run build",
            startCommand: "npm start",
            envVars: [
              {
                key: "NODE_ENV",
                value: "production"
              }
            ]
          }
        ]
      };
      
      // Write render.yaml to build directory
      await fs.writeFile(
        path.join(buildDir, 'render.yaml'),
        JSON.stringify(renderConfig, null, 2)
      );
      
      return {
        'render.yaml': JSON.stringify(renderConfig, null, 2)
      };
    }
  },
  {
    id: 'fly',
    name: 'Fly.io',
    description: 'Deploy to Fly.io for globally distributed MCP server instances',
    logoUrl: '/logos/fly.svg',
    setupInstructions: [
      'Create a Fly.io account at https://fly.io if you don\'t have one',
      'Extract the downloaded deployment package to a folder on your computer',
      'Install the Fly.io CLI:',
      '  • macOS/Linux: curl -L https://fly.io/install.sh | sh',
      '  • Windows: powershell -Command "iwr https://fly.io/install.ps1 -UseBASIC | iex"',
      'Run "fly auth login" to authenticate with your account',
      'Open a terminal/command prompt in the extracted folder',
      'Run "fly launch" to create a new app (accept defaults when prompted)',
      'Run "fly deploy" to deploy your MCP server',
      'After deployment, note the URL provided by Fly.io',
      'Use this URL to access your MCP server in AI assistants'
    ],
    requiresCredentials: true,
    credentialFields: [
      {
        id: 'fly_token',
        name: 'Fly.io API Token',
        description: 'Your Fly.io API token for automated deployments',
        type: 'password',
        required: true
      }
    ],
    generateDeploymentFiles: async (buildId: string, buildDir: string) => {
      // Generate fly.toml for Fly.io deployments
      const flyConfig = `
app = "mcp-server-${buildId}"
primary_region = "ewr"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
`;
      
      // Write fly.toml to build directory
      await fs.writeFile(
        path.join(buildDir, 'fly.toml'),
        flyConfig
      );
      
      return {
        'fly.toml': flyConfig
      };
    }
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Deploy to Netlify for serverless MCP server functions with global CDN',
    logoUrl: '/logos/netlify.svg',
    setupInstructions: [
      'Create a Netlify account at https://netlify.com if you don\'t have one',
      'Extract the downloaded deployment package to a folder on your computer',
      'Install the Netlify CLI: npm install -g netlify-cli',
      'Run "netlify login" to authenticate with your account',
      'Open a terminal/command prompt in the extracted folder',
      'Run "netlify init" to create a new site (follow the prompts)',
      'Run "netlify deploy --prod" to deploy your MCP server',
      'After deployment, note the URL provided by Netlify',
      'Use this URL to access your MCP server in AI assistants'
    ],
    requiresCredentials: true,
    credentialFields: [
      {
        id: 'netlify_token',
        name: 'Netlify API Token',
        description: 'Your Netlify API token for automated deployments',
        type: 'password',
        required: true
      }
    ],
    generateDeploymentFiles: async (buildId: string, buildDir: string) => {
      // Generate netlify.toml for Netlify deployments
      const netlifyConfig = `
[build]
  command = "npm run build"
  publish = "public"
  functions = "functions"

[dev]
  command = "npm run dev"
  port = 8080
  targetPort = 5000
  publish = "public"
  autoLaunch = true

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
`;
      
      // Write netlify.toml to build directory
      await fs.writeFile(
        path.join(buildDir, 'netlify.toml'),
        netlifyConfig
      );
      
      return {
        'netlify.toml': netlifyConfig
      };
    }
  }
];

/**
 * Get a deployment platform by ID
 */
export function getDeploymentPlatform(platformId: string): DeploymentPlatform | undefined {
  return deploymentPlatforms.find(platform => platform.id === platformId);
}

/**
 * Generate deployment files for a specific platform
 */
export async function generateDeploymentFiles(platformId: string, buildId: string, buildDir: string): Promise<Record<string, string>> {
  const platform = getDeploymentPlatform(platformId);
  
  if (!platform) {
    throw new Error(`Deployment platform "${platformId}" not found`);
  }
  
  return platform.generateDeploymentFiles(buildId, buildDir);
}