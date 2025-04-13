import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface DeploymentCredentials {
  [key: string]: string;
}

export interface DeploymentResult {
  success: boolean;
  message: string;
  deploymentId?: string;
  deploymentUrl?: string;
  platformId?: string;
  error?: string;
  setupInstructions?: string[];
}

export interface DeploymentOptions {
  buildId: string;
  serverName: string;
  platformId: string;
  credentials: DeploymentCredentials;
  deploymentDir: string;
}

/**
 * Base abstract deployment service class
 * All platform-specific deployment services will extend this class
 */
export abstract class DeploymentService {
  protected options: DeploymentOptions;
  protected tempDir: string;
  protected deploymentId: string;

  constructor(options: DeploymentOptions) {
    this.options = options;
    this.deploymentId = uuidv4();
    this.tempDir = path.join(process.cwd(), 'tmp', 'deployments', this.deploymentId);
  }

  /**
   * Prepare the deployment environment
   */
  protected async prepare(): Promise<void> {
    // Create temporary directory for deployment
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Copy deployment files to temporary directory
    fs.cpSync(this.options.deploymentDir, this.tempDir, { recursive: true });
  }

  /**
   * Generate platform-specific configuration files
   */
  protected abstract generateConfig(): Promise<void>;

  /**
   * Deploy to the platform
   */
  protected abstract deploy(): Promise<DeploymentResult>;

  /**
   * Execute the deployment process
   */
  public async execute(): Promise<DeploymentResult> {
    try {
      await this.prepare();
      await this.generateConfig();
      return await this.deploy();
    } catch (error) {
      return {
        success: false,
        message: 'Deployment failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        platformId: this.options.platformId
      };
    }
  }

  /**
   * Clean up resources after deployment
   */
  public cleanup(): void {
    // Remove temporary directory
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }
}