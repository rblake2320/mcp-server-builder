import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info, Download, ExternalLink, CloudIcon, Server, CloudCog } from 'lucide-react';
import axios from 'axios';

// Define types
type Platform = {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  supports: string[];
  docsUrl: string;
};

type DeploymentStatus = {
  buildId: string;
  platformId: string;
  status: 'pending' | 'complete' | 'failed';
  error?: string;
  downloadUrl?: string;
  timestamp: number;
};

type DeploymentSelectorProps = {
  buildId: string;
  serverType: string;
  onDeploymentComplete?: (deploymentId: string, platformId: string) => void;
};

export default function DeploymentSelector({ buildId, serverType, onDeploymentComplete }: DeploymentSelectorProps) {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<number | null>(null);

  // Load platforms
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await axios.get('/api/deployment/platforms');
        setPlatforms(response.data);
      } catch (error) {
        console.error('Error fetching platforms:', error);
        toast({
          title: 'Error',
          description: 'Failed to load deployment platforms',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, [toast]);

  // Filter platforms by server type compatibility
  const compatiblePlatforms = platforms.filter(platform => 
    platform.supports.includes(serverType === 'typescript' ? 'javascript' : serverType)
  );

  // Handle platform selection
  const handleSelectPlatform = (platform: Platform) => {
    setSelectedPlatform(platform);
    setDeployDialogOpen(true);
  };

  // Handle deployment to selected platform
  const handleDeploy = async () => {
    if (!selectedPlatform) return;
    
    setDeploying(true);
    
    try {
      const response = await axios.post(`/api/deployment/deploy/${buildId}`, {
        platformId: selectedPlatform.id
      });
      
      // Get deployment ID and start checking status
      const { deploymentId, status } = response.data;
      setDeploymentId(deploymentId);
      
      // Start periodic status check
      const intervalId = window.setInterval(() => {
        checkDeploymentStatus(deploymentId);
      }, 2000); // Check every 2 seconds
      
      setStatusCheckInterval(intervalId);
      
      toast({
        title: 'Deployment initiated',
        description: `Preparing ${selectedPlatform.name} deployment...`,
      });
    } catch (error) {
      console.error('Error initiating deployment:', error);
      toast({
        title: 'Deployment failed',
        description: 'Failed to initiate deployment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeploying(false);
    }
  };

  // Check deployment status
  const checkDeploymentStatus = async (deploymentId: string) => {
    try {
      const response = await axios.get(`/api/deployment/status/${deploymentId}`);
      setDeploymentStatus(response.data);
      
      // If deployment is complete or failed, stop checking
      if (response.data.status === 'complete' || response.data.status === 'failed') {
        if (statusCheckInterval) {
          window.clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        
        // Call the completion callback if provided
        if (response.data.status === 'complete' && onDeploymentComplete) {
          onDeploymentComplete(deploymentId, response.data.platformId);
        }
        
        // Show success or error toast
        if (response.data.status === 'complete') {
          toast({
            title: 'Deployment ready',
            description: `Your ${selectedPlatform?.name} deployment is ready to download.`,
          });
        } else {
          toast({
            title: 'Deployment failed',
            description: response.data.error || 'An unknown error occurred',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error checking deployment status:', error);
      // Stop the interval if there's an error checking status
      if (statusCheckInterval) {
        window.clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        window.clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Close dialog and reset state
  const handleCloseDialog = () => {
    // Don't reset everything if we're in the middle of deployment
    if (!deploying && (!deploymentStatus || deploymentStatus.status !== 'pending')) {
      setDeployDialogOpen(false);
      
      // Only reset these if we're done with deployment
      if (deploymentStatus?.status === 'complete' || deploymentStatus?.status === 'failed') {
        setTimeout(() => {
          setSelectedPlatform(null);
          setDeploymentId(null);
          setDeploymentStatus(null);
        }, 300); // Add a small delay to avoid UI flicker
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <CloudCog className="mr-2 h-5 w-5" />
        Deploy to Hosting Platforms
      </h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {compatiblePlatforms.map((platform) => (
            <Card key={platform.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <img 
                      src={platform.logoUrl} 
                      alt={`${platform.name} logo`} 
                      className="w-6 h-6 mr-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logos/default.svg';
                      }}
                    />
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">{platform.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button onClick={() => handleSelectPlatform(platform)} className="w-full">
                  <CloudIcon className="h-4 w-4 mr-2" />
                  Deploy with {platform.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Deployment Dialog */}
      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedPlatform && (
                <img 
                  src={selectedPlatform.logoUrl} 
                  alt={`${selectedPlatform.name} logo`} 
                  className="w-5 h-5 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logos/default.svg';
                  }}
                />
              )}
              Deploy to {selectedPlatform?.name}
            </DialogTitle>
            <DialogDescription>
              Prepare your MCP server for deployment to {selectedPlatform?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {/* Deployment Status */}
            {deploymentStatus && (
              <div className="mb-6">
                <Alert variant={
                  deploymentStatus.status === 'complete' ? 'default' :
                  deploymentStatus.status === 'failed' ? 'destructive' : 
                  'default'
                }>
                  <div className="flex items-center">
                    {deploymentStatus.status === 'pending' && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <AlertTitle>
                      {deploymentStatus.status === 'complete' ? 'Deployment Ready' :
                       deploymentStatus.status === 'failed' ? 'Deployment Failed' :
                       'Preparing Deployment...'}
                    </AlertTitle>
                  </div>
                  <AlertDescription>
                    {deploymentStatus.status === 'complete' ? 
                      'Your deployment files are ready to download.' :
                      deploymentStatus.status === 'failed' ?
                      deploymentStatus.error || 'An error occurred during deployment preparation.' :
                      'Generating configuration files for your MCP server...'}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {/* Platform Information */}
            {selectedPlatform && !deploymentStatus && (
              <div className="mb-6">
                <p className="mb-2">{selectedPlatform.description}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    Supports {selectedPlatform.supports.join(', ')}
                  </Badge>
                  <a 
                    href={selectedPlatform.docsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center"
                  >
                    Documentation <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
            
            {/* Deployment Explanation */}
            {!deploymentStatus && (
              <Alert variant="default" className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>What happens next?</AlertTitle>
                <AlertDescription>
                  This will generate the necessary configuration files for deploying your MCP server
                  to {selectedPlatform?.name}. You'll receive a ZIP file with everything needed to deploy.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            {/* Show different buttons based on deployment status */}
            {deploymentStatus?.status === 'complete' ? (
              <div className="flex justify-between w-full">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Close
                </Button>
                <a 
                  href={deploymentStatus.downloadUrl}
                  download
                >
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download Deployment
                  </Button>
                </a>
              </div>
            ) : deploymentStatus?.status === 'failed' ? (
              <Button variant="outline" onClick={handleCloseDialog}>
                Close
              </Button>
            ) : deploymentStatus?.status === 'pending' ? (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Preparing Deployment...
              </Button>
            ) : (
              <div className="flex justify-between w-full">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleDeploy} disabled={deploying}>
                  {deploying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initiating Deployment...
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4 mr-2" />
                      Deploy to {selectedPlatform?.name}
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}