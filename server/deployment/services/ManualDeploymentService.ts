import fs from 'fs-extra';
import path from 'path';
import { DeploymentService, DeploymentResult } from './DeploymentService';

/**
 * Deployment service for manual deployment to any platform
 */
export class ManualDeploymentService extends DeploymentService {
  /**
   * Generate configuration files for manual deployment
   */
  protected async generateConfig(): Promise<void> {
    // Create README with instructions
    const isJavaScript = !this.options.serverName.toLowerCase().includes('python');
    const readmeContent = `# MCP Server Manual Deployment

This package contains your MCP server ready for deployment to any hosting provider.

## Quick Start

1. Install dependencies:
   \`\`\`
   ${isJavaScript ? 'npm install' : 'pip install -r requirements.txt'}
   \`\`\`

2. Start the server:
   \`\`\`
   ${isJavaScript ? 'node server.js' : 'python server.py'}
   \`\`\`

## Deployment Instructions

For platform-specific deployment instructions, please refer to your hosting provider's documentation.

### Common Hosting Platforms

#### Heroku
1. Create a new Heroku app
2. Push this code to Heroku Git
3. Make sure to set appropriate buildpacks:
   - For JavaScript: Node.js buildpack
   - For Python: Python buildpack

#### Vercel
1. Import the project to Vercel
2. Set the framework preset to Other
3. Set the build command to \`${isJavaScript ? 'npm install' : 'pip install -r requirements.txt'}\`
4. Set the output directory to \`./\`
5. Set the development command to \`${isJavaScript ? 'node server.js' : 'python server.py'}\`

#### Railway
1. Create a new project
2. Select "Deploy from GitHub" or "Deploy from Template"
3. Connect your repository or upload this code
4. Railway will automatically detect the language and deploy

## Environment Variables

If your MCP server requires specific environment variables, be sure to set them in your hosting provider's control panel.
`;
    
    fs.writeFileSync(path.join(this.tempDir, 'README.md'), readmeContent);
    
    // Create a basic package.json if it doesn't exist and it's a JavaScript server
    if (isJavaScript && !fs.existsSync(path.join(this.tempDir, 'package.json'))) {
      const packageJson = {
        name: this.options.serverName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: `MCP Server: ${this.options.serverName}`,
        main: 'server.js',
        scripts: {
          start: 'node server.js'
        },
        engines: {
          node: '>=14'
        },
        dependencies: {
          // Basic dependencies will be extracted from the original package.json
        }
      };
      
      fs.writeFileSync(
        path.join(this.tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    }
  }

  /**
   * Prepare deployment package for manual deployment
   */
  protected async deploy(): Promise<DeploymentResult> {
    return {
      success: true,
      message: 'Manual deployment package created successfully!',
      deploymentId: this.deploymentId,
      platformId: this.options.platformId,
      setupInstructions: [
        'Extract the downloaded package to a local folder',
        'Follow the instructions in README.md for deployment options',
        'Choose the deployment platform that best suits your needs',
        'For JavaScript servers, use `npm install` and `node server.js`',
        'For Python servers, use `pip install -r requirements.txt` and `python server.py`'
      ]
    };
  }
}