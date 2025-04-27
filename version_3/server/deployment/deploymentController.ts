import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { generateDeploymentFiles } from './platforms';

// Keep track of deployments
const deployments: Record<string, {
  buildId: string;
  platformId: string;
  status: 'pending' | 'complete' | 'failed';
  downloadPath?: string;
  error?: string;
  timestamp: number;
}> = {};

/**
 * Initiate deployment to a specific platform
 */
export async function initiatePlatformDeployment(buildId: string, platformId: string) {
  try {
    // Create a unique deployment ID
    const deploymentId = uuidv4();
    
    // Create temp directory for this deployment
    const baseDir = path.join(process.cwd(), 'deployments');
    const deploymentDir = path.join(baseDir, deploymentId);
    
    // Save deployment info
    deployments[deploymentId] = {
      buildId,
      platformId,
      status: 'pending',
      timestamp: Date.now()
    };
    
    // Ensure directory exists
    fs.ensureDirSync(deploymentDir);
    
    // Extract the original build files to the deployment directory
    const buildZipPath = path.join(process.cwd(), 'downloads', `${buildId}.zip`);
    if (!fs.existsSync(buildZipPath)) {
      throw new Error(`Build ${buildId} not found`);
    }
    
    // Create a background (non-blocking) process for the rest of the operation
    setTimeout(async () => {
      try {
        // Extract the original zip to the deployment directory
        await new Promise<void>(async (resolve, reject) => {
          try {
            const extract = (await import('extract-zip')).default;
            await extract(buildZipPath, { dir: deploymentDir });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        
        // Generate platform-specific files
        await generateDeploymentFiles(platformId, buildId, deploymentDir);
        
        // Create a zip file with the deployment files
        const archiver = (await import('archiver')).default;
        const deploymentZipPath = path.join(baseDir, `${deploymentId}.zip`);
        const output = fs.createWriteStream(deploymentZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.pipe(output);
        archive.directory(deploymentDir, false);
        
        await new Promise<void>((resolve, reject) => {
          output.on('close', () => resolve());
          archive.on('error', reject);
          archive.finalize();
        });
        
        // Update deployment status
        deployments[deploymentId] = {
          ...deployments[deploymentId],
          status: 'complete',
          downloadPath: deploymentZipPath
        };
      } catch (error) {
        console.error(`Error preparing deployment ${deploymentId}:`, error);
        // Update deployment status with error
        deployments[deploymentId] = {
          ...deployments[deploymentId],
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }, 0);
    
    return {
      deploymentId,
      status: 'pending',
      message: `Deployment to ${platformId} initiated`
    };
  } catch (error) {
    console.error('Error initiating deployment:', error);
    throw error;
  }
}

/**
 * Get deployment status and download URL
 */
export function getDeploymentStatus(deploymentId: string) {
  const deployment = deployments[deploymentId];
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }
  
  return {
    ...deployment,
    downloadUrl: deployment.status === 'complete' ? `/api/deployment/download/${deploymentId}` : undefined
  };
}

/**
 * Download deployment files
 */
export function downloadDeployment(deploymentId: string) {
  const deployment = deployments[deploymentId];
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }
  
  if (deployment.status !== 'complete' || !deployment.downloadPath) {
    throw new Error(`Deployment ${deploymentId} is not ready for download`);
  }
  
  return deployment.downloadPath;
}

/**
 * Cleanup old deployments (called periodically)
 */
export function cleanupDeployments() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  // Find old deployments
  const oldDeploymentIds = Object.entries(deployments)
    .filter(([_, info]) => now - info.timestamp > maxAge)
    .map(([id, _]) => id);
  
  // Remove old deployments
  for (const id of oldDeploymentIds) {
    const deployment = deployments[id];
    
    // Remove deployment file if it exists
    if (deployment.downloadPath && fs.existsSync(deployment.downloadPath)) {
      fs.unlinkSync(deployment.downloadPath);
    }
    
    // Remove deployment directory
    const deploymentDir = path.join(process.cwd(), 'deployments', id);
    if (fs.existsSync(deploymentDir)) {
      fs.removeSync(deploymentDir);
    }
    
    // Remove from deployments object
    delete deployments[id];
  }
  
  return oldDeploymentIds.length;
}

// Set up a periodic cleanup
setInterval(cleanupDeployments, 60 * 60 * 1000); // Cleanup every hour