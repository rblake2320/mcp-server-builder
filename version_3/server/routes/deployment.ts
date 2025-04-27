import { Router } from 'express';
import { platforms } from '../deployment/platforms';
import { 
  initiatePlatformDeployment, 
  getDeploymentStatus, 
  downloadDeployment 
} from '../deployment/deploymentController';

const router = Router();

// Get available deployment platforms
router.get('/platforms', (req, res) => {
  try {
    // Return platform information excluding internal details
    const platformsInfo = platforms.map(({ id, name, description, logoUrl, supports, docsUrl }) => ({
      id,
      name,
      description,
      logoUrl,
      supports,
      docsUrl
    }));
    
    res.json(platformsInfo);
  } catch (error) {
    console.error('Error listing deployment platforms:', error);
    res.status(500).json({ 
      error: 'Failed to list deployment platforms',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get specific platform information
router.get('/platforms/:id', (req, res) => {
  try {
    const platformId = req.params.id;
    const platform = platforms.find(p => p.id === platformId);
    
    if (!platform) {
      return res.status(404).json({ error: `Platform ${platformId} not found` });
    }
    
    // Return platform information excluding internal details
    const { id, name, description, logoUrl, supports, docsUrl, setupUrl } = platform;
    
    res.json({
      id,
      name,
      description,
      logoUrl,
      supports,
      docsUrl,
      setupUrl
    });
  } catch (error) {
    console.error(`Error getting platform ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to get platform information',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Initiate deployment to a specific platform
router.post('/deploy/:buildId', async (req, res) => {
  try {
    const { buildId } = req.params;
    const { platformId } = req.body;
    
    if (!platformId) {
      return res.status(400).json({ error: 'Platform ID is required' });
    }
    
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) {
      return res.status(404).json({ error: `Platform ${platformId} not found` });
    }
    
    // Initiate deployment
    const result = await initiatePlatformDeployment(buildId, platformId);
    
    res.status(202).json({
      ...result,
      checkStatusUrl: `/api/deployment/status/${result.deploymentId}`
    });
  } catch (error) {
    console.error('Error initiating deployment:', error);
    res.status(500).json({ 
      error: 'Failed to initiate deployment',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Check deployment status
router.get('/status/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const status = getDeploymentStatus(deploymentId);
    
    res.json(status);
  } catch (error) {
    console.error(`Error checking deployment status ${req.params.deploymentId}:`, error);
    res.status(404).json({ 
      error: 'Failed to get deployment status',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Download deployment files
router.get('/download/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deploymentPath = downloadDeployment(deploymentId);
    
    res.download(deploymentPath, `mcp-server-deployment.zip`);
  } catch (error) {
    console.error(`Error downloading deployment ${req.params.deploymentId}:`, error);
    res.status(404).json({ 
      error: 'Failed to download deployment',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;