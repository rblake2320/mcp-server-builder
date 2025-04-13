import { DeploymentOptions, DeploymentService } from './DeploymentService';
import { VercelDeploymentService } from './VercelDeploymentService';
import { RailwayDeploymentService } from './RailwayDeploymentService';

/**
 * Factory to create platform-specific deployment services
 */
export function createDeploymentService(options: DeploymentOptions): DeploymentService | null {
  switch (options.platformId) {
    case 'vercel':
      return new VercelDeploymentService(options);
    case 'railway':
      return new RailwayDeploymentService(options);
    // Add more platform services here
    default:
      return null;
  }
}