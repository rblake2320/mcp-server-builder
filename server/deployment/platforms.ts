// Deployment platform configurations

export interface DeploymentPlatform {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  requiresCredentials: boolean;
  credentialFields?: {
    id: string;
    name: string;
    description: string;
    type: 'text' | 'password';
    required: boolean;
  }[];
}

/**
 * List of supported deployment platforms
 * Note: The logo URLs will be dynamically fetched from the server
 */
export const platforms: DeploymentPlatform[] = [
  {
    id: "vercel",
    name: "Vercel",
    description: "Deploy to Vercel for serverless hosting with global CDN",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "token",
        name: "Vercel API Token",
        description: "Your Vercel API token from vercel.com/account/tokens",
        type: "password",
        required: true
      },
      {
        id: "scope",
        name: "Project Scope",
        description: "Team or personal account name (optional)",
        type: "text",
        required: false
      }
    ]
  },
  {
    id: "railway",
    name: "Railway",
    description: "One-click deployment to Railway with automatic CI/CD",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "apiKey",
        name: "Railway API Key",
        description: "Your Railway API key from railway.app",
        type: "password",
        required: true
      }
    ]
  },
  {
    id: "render",
    name: "Render",
    description: "Deploy to Render with automatic builds and scaling",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "apiKey",
        name: "Render API Key",
        description: "Your Render API key from render.com/dashboard",
        type: "password",
        required: true
      },
      {
        id: "serviceType",
        name: "Service Type",
        description: "web or background service",
        type: "text",
        required: false
      }
    ]
  },
  {
    id: "netlify",
    name: "Netlify",
    description: "Deploy your MCP server to Netlify with serverless functions",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "personalAccessToken",
        name: "Personal Access Token",
        description: "Your Netlify Personal Access Token",
        type: "password",
        required: true
      },
      {
        id: "siteId",
        name: "Site ID",
        description: "Your Netlify Site ID (optional)",
        type: "text",
        required: false
      }
    ]
  },
  {
    id: "flyio",
    name: "Fly.io",
    description: "Global deployment on Fly.io's application platform",
    requiresCredentials: true,
    credentialFields: [
      {
        id: "accessToken",
        name: "Access Token",
        description: "Your Fly.io access token",
        type: "password",
        required: true
      },
      {
        id: "org",
        name: "Organization",
        description: "Your Fly.io organization name",
        type: "text",
        required: false
      }
    ]
  },
  {
    id: "cursor",
    name: "Cursor IDE",
    description: "Configure MCP server for Cursor IDE integration",
    requiresCredentials: false,
  }
];

/**
 * Generate deployment instructions based on the platform
 */
export function generateDeploymentInstructions(platformId: string, buildId: string, serverName: string): string[] {
  const instructions: Record<string, string[]> = {
    "vercel": [
      "Extract the downloaded ZIP file to a local directory",
      "Open a terminal in that directory",
      "Run `npm install` to install dependencies",
      "Run `vercel deploy` or connect your GitHub repository to Vercel",
      "Once deployed, your MCP server will be available at the provided URL"
    ],
    "railway": [
      "Extract the downloaded ZIP file",
      "Create a new project on Railway",
      "Push the code to a GitHub repository",
      "Connect the repository to Railway",
      "Railway will automatically deploy your MCP server"
    ],
    "render": [
      "Extract the downloaded ZIP file",
      "Create a new Web Service on Render",
      "Connect to your GitHub repository with the extracted code",
      "Set the build command to `npm install`",
      "Set the start command to `node server.js` or `python server.py` based on your server type",
      "Deploy and access your MCP server through the provided Render URL"
    ],
    "netlify": [
      "Extract the downloaded ZIP file",
      "Push the code to a GitHub repository",
      "Create a new site on Netlify from the repository",
      "In Site Settings, configure the build command to `npm install`",
      "Add a `netlify.toml` file with your function configuration",
      "Deploy and access your MCP server through Netlify Functions"
    ],
    "flyio": [
      "Extract the downloaded ZIP file",
      "Install the Fly CLI with `curl -L https://fly.io/install.sh | sh`",
      "Navigate to the extracted directory",
      "Run `fly launch` to create a new app",
      "Run `fly deploy` to deploy your MCP server",
      "Your API will be accessible at `https://your-app-name.fly.dev`"
    ],
    "cursor": [
      "1. Extract the downloaded ZIP file to a local directory",
      "2. Install dependencies - Navigate to the extracted folder and run:",
      `   ${serverName.includes("Python") ? "pip install -r requirements.txt" : "npm install"}`,
      "3. Locate your Cursor IDE config file:",
      "   • macOS: ~/Library/Application Support/Cursor/cursor_config.json",
      "   • Windows: %APPDATA%\\Cursor\\cursor_config.json",
      "   • Linux: ~/.config/Cursor/cursor_config.json",
      "4. Create or edit the config file to add your MCP server:",
      `{
  "mcpServers": {
    "${serverName.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "${serverName.includes("Python") ? "python" : "node"}",
      "args": ["/absolute/path/to/extracted/folder/server.${serverName.includes("Python") ? "py" : "js"}"]
    }
  }
}`,
      "5. Replace '/absolute/path/to/extracted/folder/' with the actual path where you extracted the files",
      "6. Restart Cursor IDE to apply the changes",
      "7. Open Cursor IDE and click on the MCP icon in the sidebar to connect to your server",
      "8. Select your server from the dropdown and click 'Connect'",
      "9. You can now use your custom MCP server with Cursor IDE!"
    ]
  };

  return instructions[platformId] || [
    "Extract the downloaded ZIP file",
    "Follow the hosting platform's documentation to deploy",
    "Set the entry point to server.js or server.py depending on your server type"
  ];
}