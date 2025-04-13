import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import archiver from 'archiver';
import { createDeploymentService } from './services/deploymentServiceFactory';
import { DeploymentOptions, DeploymentResult } from './services/DeploymentService';
import { platforms, generateDeploymentInstructions } from './platforms';

// Store deployments temporarily for download
const deployments = new Map<string, { path: string; platformId: string; }>();

/**
 * Initialize deployment for a specific platform
 */
export async function initiatePlatformDeployment(req: Request, res: Response) {
  try {
    const { buildId, serverName, platformId, credentials } = req.body;

    if (!buildId || !serverName || !platformId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Check if platform exists
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }

    // Create deployment directory
    const tmpDir = path.join(process.cwd(), 'tmp');
    const deploymentDir = path.join(tmpDir, 'builds', buildId);
    
    // Ensure deployment directory exists
    if (!fs.existsSync(deploymentDir)) {
      return res.status(404).json({
        success: false,
        message: 'Build not found'
      });
    }

    // Skip generating platform-specific files for now
    // We'll handle this in each deployment service's generateConfig method

    // Get deployment service
    const deploymentOptions: DeploymentOptions = {
      buildId,
      serverName,
      platformId,
      credentials: credentials || {},
      deploymentDir
    };

    const deploymentService = createDeploymentService(deploymentOptions);
    if (!deploymentService) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported platform'
      });
    }

    // Execute deployment
    const result = await deploymentService.execute();

    // If successful, prepare for download
    if (result.success && result.deploymentId) {
      // Create a zip file for the deployment
      const deploymentFileName = `dp_${result.deploymentId}.zip`;
      const zipPath = path.join(tmpDir, 'downloads', deploymentFileName);
      
      // Ensure downloads directory exists
      if (!fs.existsSync(path.join(tmpDir, 'downloads'))) {
        fs.mkdirSync(path.join(tmpDir, 'downloads'), { recursive: true });
      }

      // Create a zip file of the deployment
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      archive.pipe(output);
      archive.directory(path.join(tmpDir, 'deployments', result.deploymentId), false);
      await archive.finalize();

      // Store the deployment for download
      deployments.set(result.deploymentId, {
        path: zipPath,
        platformId
      });

      // Add download URL and setup instructions to the result
      result.deploymentUrl = `/api/download/deployment/${result.deploymentId}`;
      
      // Get platform-specific setup instructions
      const { generateDeploymentInstructions } = await import('./platforms');
      result.setupInstructions = generateDeploymentInstructions(platformId, buildId, serverName);
    }

    return res.json(result);
  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Deployment failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Download deployment package
 */
export function downloadDeployment(req: Request, res: Response) {
  const { deploymentId } = req.params;
  
  if (!deploymentId || !deployments.has(deploymentId)) {
    return res.status(404).json({
      success: false,
      message: 'Deployment package not found'
    });
  }

  const deployment = deployments.get(deploymentId);
  if (!deployment) {
    return res.status(404).json({
      success: false,
      message: 'Deployment package not found'
    });
  }

  const zipPath = deployment.path;
  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({
      success: false,
      message: 'Deployment package file not found'
    });
  }

  // Get platform for filename
  const platform = platforms.find(p => p.id === deployment.platformId);
  const platformName = platform?.name || 'platform';

  // Set headers
  res.set('Content-Type', 'application/zip');
  res.set('Content-Disposition', `attachment; filename="mcp-server-${platformName.toLowerCase()}.zip"`);

  // Stream the file
  const fileStream = fs.createReadStream(zipPath);
  fileStream.pipe(res);
}

/**
 * Clean up old deployments (can be run periodically)
 */
export function cleanupDeployments() {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();

  // Remove old deployments
  const tmpDir = path.join(process.cwd(), 'tmp');
  const downloadsDir = path.join(tmpDir, 'downloads');
  
  if (fs.existsSync(downloadsDir)) {
    fs.readdirSync(downloadsDir).forEach(file => {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        
        // Remove from deployments map
        deployments.forEach((deployment, id) => {
          if (deployment.path === filePath) {
            deployments.delete(id);
          }
        });
      }
    });
  }

  // Also clean up deployments directory
  const deploymentsDir = path.join(tmpDir, 'deployments');
  if (fs.existsSync(deploymentsDir)) {
    fs.readdirSync(deploymentsDir).forEach(dir => {
      const dirPath = path.join(deploymentsDir, dir);
      const stats = fs.statSync(dirPath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    });
  }
}