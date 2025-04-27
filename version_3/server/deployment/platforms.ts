import fs from 'fs-extra';
import path from 'path';

// Define supported platforms and their configurations
export const platforms = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Serverless platform for static and hybrid applications',
    logoUrl: '/logos/vercel.svg',
    setupUrl: 'https://vercel.com/new',
    docsUrl: 'https://vercel.com/docs',
    supports: ['javascript', 'typescript'],
    configFiles: ['vercel.json']
  },
  {
    id: 'railway',
    name: 'Railway',
    description: 'Infrastructure platform for full-stack applications',
    logoUrl: '/logos/railway.svg',
    setupUrl: 'https://railway.app/new',
    docsUrl: 'https://docs.railway.app/',
    supports: ['javascript', 'typescript', 'python'],
    configFiles: ['railway.json']
  },
  {
    id: 'render',
    name: 'Render',
    description: 'Unified cloud to build and run apps and websites',
    logoUrl: '/logos/render.svg',
    setupUrl: 'https://dashboard.render.com/select-repo',
    docsUrl: 'https://render.com/docs',
    supports: ['javascript', 'typescript', 'python'],
    configFiles: ['render.yaml']
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Platform for modern web projects with serverless functions',
    logoUrl: '/logos/netlify.svg',
    setupUrl: 'https://app.netlify.com/start',
    docsUrl: 'https://docs.netlify.com/',
    supports: ['javascript', 'typescript'],
    configFiles: ['netlify.toml']
  },
  {
    id: 'fly',
    name: 'Fly.io',
    description: 'Run applications globally on their edge network',
    logoUrl: '/logos/flyio.svg',
    setupUrl: 'https://fly.io/docs/hands-on/install-flyctl/',
    docsUrl: 'https://fly.io/docs/',
    supports: ['javascript', 'typescript', 'python'],
    configFiles: ['fly.toml']
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Containerize and run your MCP server anywhere',
    logoUrl: '/logos/docker.svg',
    setupUrl: 'https://www.docker.com/get-started',
    docsUrl: 'https://docs.docker.com/',
    supports: ['javascript', 'typescript', 'python'],
    configFiles: ['Dockerfile', 'docker-compose.yml']
  }
];

// Generate deployment instructions for different platforms
export function generateDeploymentInstructions(platformId: string, serverConfig: any) {
  const platform = platforms.find(p => p.id === platformId);
  if (!platform) {
    throw new Error(`Platform ${platformId} not supported`);
  }

  // Basic instructions that apply to all platforms
  let instructions = `# Deploying your MCP Server to ${platform.name}\n\n`;

  // Add platform-specific instructions
  switch (platformId) {
    case 'vercel':
      instructions += `
## Prerequisites
- A [Vercel account](https://vercel.com/signup)
- The [Vercel CLI](https://vercel.com/cli) installed (optional for direct deployment)

## Deployment Steps

1. **Push your code to GitHub**
   Create a new repository and push this code to it.

2. **Import your repository**
   Go to [Vercel Dashboard](https://vercel.com/new) and import your GitHub repository.

3. **Configure your project**
   - Project Name: \`${serverConfig.serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`
   - Framework Preset: \`Other\`
   - Root Directory: \`./\`
   - Build Command: \`npm install\`
   - Output Directory: \`./\`
   - Install Command: \`npm install\`

4. **Environment Variables**
   If your MCP server requires API keys, add them in the Environment Variables section.

5. **Deploy**
   Click "Deploy" and wait for your project to build.

## Alternatively: Deploy with Vercel CLI

\`\`\`bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd your-project-directory
vercel
\`\`\`

Your MCP server will be available at the URL provided by Vercel after deployment.
`;
      break;
    
    case 'railway':
      instructions += `
## Prerequisites
- A [Railway account](https://railway.app/)
- The [Railway CLI](https://docs.railway.app/develop/cli) installed (optional for direct deployment)

## Deployment Steps

1. **Push your code to GitHub**
   Create a new repository and push this code to it.

2. **Import your repository**
   Go to [Railway Dashboard](https://railway.app/new) and click "Deploy from GitHub repo".

3. **Configure your project**
   - Select your repository
   - Configure the build settings:
     - Build Command: \`npm install\`
     - Start Command: \`${serverConfig.serverType === 'python' ? 'python server.py' : 'node server.js'}\`

4. **Environment Variables**
   If your MCP server requires API keys, add them in the Variables section.

5. **Deploy**
   Your project will deploy automatically.

## Alternatively: Deploy with Railway CLI

\`\`\`bash
# Install Railway CLI if you haven't already
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize and deploy from your project directory
cd your-project-directory
railway init
railway up
\`\`\`

Your MCP server will be available at the URL provided by Railway after deployment.
`;
      break;
    
    case 'render':
      instructions += `
## Prerequisites
- A [Render account](https://render.com/)

## Deployment Steps

1. **Push your code to GitHub**
   Create a new repository and push this code to it.

2. **Create a new Web Service**
   Go to [Render Dashboard](https://dashboard.render.com/new/web-service) and connect your GitHub repository.

3. **Configure your service**
   - Name: \`${serverConfig.serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`
   - Runtime: \`${serverConfig.serverType === 'python' ? 'Python' : 'Node'}\`
   - Build Command: \`${serverConfig.serverType === 'python' ? 'pip install -r requirements.txt' : 'npm install'}\`
   - Start Command: \`${serverConfig.serverType === 'python' ? 'python server.py' : 'node server.js'}\`

4. **Environment Variables**
   If your MCP server requires API keys, add them in the Environment section.

5. **Create Web Service**
   Click "Create Web Service" and wait for your project to deploy.

Your MCP server will be available at the URL provided by Render after deployment.
`;
      break;
    
    case 'netlify':
      instructions += `
## Prerequisites
- A [Netlify account](https://www.netlify.com/)
- The [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed (optional for direct deployment)

## Deployment Steps

1. **Push your code to GitHub**
   Create a new repository and push this code to it.

2. **Import your repository**
   Go to [Netlify Dashboard](https://app.netlify.com/start) and import your GitHub repository.

3. **Configure your build settings**
   - Build command: \`npm install\`
   - Publish directory: \`./\`

4. **Environment Variables**
   If your MCP server requires API keys, add them in the Environment Variables section.

5. **Deploy**
   Click "Deploy site" and wait for your project to build.

## Alternatively: Deploy with Netlify CLI

\`\`\`bash
# Install Netlify CLI if you haven't already
npm i -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy from your project directory
cd your-project-directory
netlify init
netlify deploy
\`\`\`

**Note:** Since this is a server application rather than a static site, you'll need to use Netlify Functions or Edge Functions to properly handle the server functionality.

Your MCP server will be available at the URL provided by Netlify after deployment.
`;
      break;
    
    case 'fly':
      instructions += `
## Prerequisites
- A [Fly.io account](https://fly.io/)
- The [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/) installed

## Deployment Steps

1. **Login to Fly.io**
   \`\`\`bash
   fly auth login
   \`\`\`

2. **Launch the application**
   Navigate to your project directory and run:
   \`\`\`bash
   fly launch
   \`\`\`
   
   This will guide you through creating a new application on Fly.io.
   - Choose a name for your app or use the auto-generated one
   - Select a region close to your users
   - Skip adding a PostgreSQL database, unless your MCP server needs one
   - Skip adding a Redis database, unless your MCP server needs one

3. **Deploy your application**
   \`\`\`bash
   fly deploy
   \`\`\`

4. **Environment Variables**
   If your MCP server requires API keys, add them:
   \`\`\`bash
   fly secrets set API_KEY=your_api_key
   \`\`\`

Your MCP server will be available at https://your-app-name.fly.dev after deployment.
`;
      break;
    
    case 'docker':
      instructions += `
## Prerequisites
- [Docker](https://www.docker.com/get-started) installed on your machine

## Deployment Steps

1. **Build the Docker image**
   \`\`\`bash
   docker build -t ${serverConfig.serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')} .
   \`\`\`

2. **Run the container**
   \`\`\`bash
   docker run -p 3000:3000 ${serverConfig.serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
   \`\`\`
   
   Your MCP server will be available at http://localhost:3000

3. **Environment Variables**
   If your MCP server requires API keys, add them when running the container:
   \`\`\`bash
   docker run -p 3000:3000 -e API_KEY=your_api_key ${serverConfig.serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
   \`\`\`

## Deploying to a cloud provider

You can push your Docker image to Docker Hub or another container registry:

\`\`\`bash
# Tag your image
docker tag ${serverConfig.serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')} yourusername/${serverConfig.serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')}

# Push to Docker Hub
docker push yourusername/${serverConfig.serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
\`\`\`

Then deploy using your cloud provider's container service (AWS ECS, Google Cloud Run, Azure Container Apps, etc.)
`;
      break;
    
    default:
      instructions += `Please visit ${platform.setupUrl} for detailed instructions on how to deploy your MCP server to ${platform.name}.`;
  }

  return instructions;
}

// Generate platform-specific configuration files
export async function generateDeploymentFiles(platformId: string, buildId: string, targetDir: string) {
  const platform = platforms.find(p => p.id === platformId);
  if (!platform) {
    throw new Error(`Platform ${platformId} not supported`);
  }

  // Common function to get server info from directory
  const getServerInfo = () => {
    // Try to read package.json if exists for JS/TS projects
    let serverName = 'mcp-server';
    let serverType = 'javascript';
    
    try {
      if (fs.existsSync(path.join(targetDir, 'package.json'))) {
        const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
        serverName = packageJson.name || 'mcp-server';
        serverType = 'javascript';
      } else if (fs.existsSync(path.join(targetDir, 'server.py'))) {
        // Check for Python file
        serverType = 'python';
        
        // Try to extract name from comments in the file
        const content = fs.readFileSync(path.join(targetDir, 'server.py'), 'utf8');
        const nameMatch = content.match(/# Name: (.+)/);
        if (nameMatch) {
          serverName = nameMatch[1];
        } else {
          serverName = 'mcp-server';
        }
      }
    } catch (error) {
      console.warn('Error detecting server info:', error);
    }
    
    return { serverName, serverType };
  };

  const { serverName, serverType } = getServerInfo();

  // Generate platform-specific files
  switch (platformId) {
    case 'vercel':
      fs.writeFileSync(path.join(targetDir, 'vercel.json'), JSON.stringify({
        "version": 2,
        "builds": [
          { 
            "src": "server.js",
            "use": "@vercel/node" 
          }
        ],
        "routes": [
          { "src": "/(.*)", "dest": "server.js" }
        ]
      }, null, 2));
      break;
      
    case 'railway':
      fs.writeFileSync(path.join(targetDir, 'railway.json'), JSON.stringify({
        "$schema": "https://railway.app/railway.schema.json",
        "build": {
          "builder": serverType === 'python' ? "NIXPACKS" : "DOCKERFILE",
          "buildCommand": serverType === 'python' ? "pip install -r requirements.txt" : "npm install"
        },
        "deploy": {
          "startCommand": serverType === 'python' ? "python server.py" : "node server.js",
          "restartPolicyType": "ON_FAILURE",
          "restartPolicyMaxRetries": 3
        }
      }, null, 2));
      break;
      
    case 'render':
      fs.writeFileSync(path.join(targetDir, 'render.yaml'), `
services:
  - type: web
    name: ${serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
    env: ${serverType === 'python' ? 'python' : 'node'}
    buildCommand: ${serverType === 'python' ? 'pip install -r requirements.txt' : 'npm install'}
    startCommand: ${serverType === 'python' ? 'python server.py' : 'node server.js'}
    envVars:
      - key: PORT
        value: 3000
`);
      break;
      
    case 'netlify':
      fs.writeFileSync(path.join(targetDir, 'netlify.toml'), `
[build]
  command = "${serverType === 'python' ? 'pip install -r requirements.txt' : 'npm install'}"
  functions = "netlify/functions"

[dev]
  command = "${serverType === 'python' ? 'python server.py' : 'node server.js'}"
  port = 3000

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
`);
      
      // Create Netlify function wrapper
      fs.ensureDirSync(path.join(targetDir, 'netlify/functions'));
      fs.writeFileSync(path.join(targetDir, 'netlify/functions/server.js'), `
// This is a wrapper for your MCP server to run on Netlify Functions
const serverPath = '${serverType === 'python' ? './server.py' : '../../server.js'}';
const handler = require(serverPath);

exports.handler = async (event, context) => {
  try {
    // Call your server logic
    return await handler(event, context);
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to execute function' })
    };
  }
};
`);
      break;
      
    case 'fly':
      fs.writeFileSync(path.join(targetDir, 'fly.toml'), `
app = "${serverName.toLowerCase().replace(/[^a-z0-9]/g, '-')}"
primary_region = "ord"

[build]
  builder = "${serverType === 'python' ? 'paketobuildpacks/builder:base' : 'heroku/buildpacks:20'}"

[env]
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
`);
      break;
      
    case 'docker':
      // Docker-compose.yml is already generated by default for all servers
      // Additional Docker specific instructions can be added to the README
      fs.writeFileSync(path.join(targetDir, 'docker-compose.yml'), `
version: '3'
services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    restart: unless-stopped
`);
      break;
  }

  // Generate deployment instructions
  const instructions = generateDeploymentInstructions(platformId, { serverName, serverType });
  fs.writeFileSync(path.join(targetDir, 'DEPLOYMENT.md'), instructions);

  return { success: true, platformId, files: platform.configFiles };
}