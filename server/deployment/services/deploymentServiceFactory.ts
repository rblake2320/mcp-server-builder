import { DeploymentOptions, DeploymentService } from './DeploymentService';
import { DockerDeploymentService } from './DockerDeploymentService';

/**
 * Factory to create platform-specific deployment services
 */
export function createDeploymentService(options: DeploymentOptions): DeploymentService | null {
  switch (options.platformId) {
    case 'docker':
      return new DockerDeploymentService(options);
      
    // For now, we'll return Docker deployment for all platforms
    // as we implement one platform at a time
    case 'cursor':
    case 'vercel':
    case 'railway':
    case 'manual':
      return new DockerDeploymentService(options);
      
    default:
      console.error(`Unsupported platform: ${options.platformId}`);
      return null;
  }
}