import { DeploymentOptions, DeploymentService } from './DeploymentService';
import { CursorDeploymentService } from './CursorDeploymentService';
import { VercelDeploymentService } from './VercelDeploymentService';
import { RailwayDeploymentService } from './RailwayDeploymentService';
import { ManualDeploymentService } from './ManualDeploymentService';

/**
 * Factory to create platform-specific deployment services
 */
export function createDeploymentService(options: DeploymentOptions): DeploymentService | null {
  switch (options.platformId) {
    case 'cursor':
      return new CursorDeploymentService(options);
      
    case 'vercel':
      return new VercelDeploymentService(options);
      
    case 'railway':
      return new RailwayDeploymentService(options);
      
    case 'manual':
      return new ManualDeploymentService(options);
      
    default:
      console.error(`Unsupported platform: ${options.platformId}`);
      return null;
  }
}