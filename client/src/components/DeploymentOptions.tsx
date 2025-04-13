import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink, Download, Rocket } from "lucide-react";

interface DeploymentPlatform {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  requiresCredentials: boolean;
  credentialFields?: {
    id: string;
    name: string;
    description: string;
    type: 'text' | 'password';
    required: boolean;
  }[];
}

interface DeploymentResult {
  success: boolean;
  message: string;
  deploymentId?: string;
  deploymentUrl?: string;
  platformId?: string;
  deploymentTime?: string;
  setupInstructions?: string[];
  error?: string;
}

interface DeploymentOptionsProps {
  buildId: string;
  serverName: string;
}

const DeploymentOptions = ({ buildId, serverName }: DeploymentOptionsProps) => {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<DeploymentPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<DeploymentPlatform | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch logo URL
  const fetchLogoUrl = async (provider: string): Promise<string> => {
    try {
      const res = await fetch(`/api/get-logo?provider=${provider}`);
      const data = await res.json();
      return data.logoUrl;
    } catch (error) {
      console.error('Error fetching logo URL:', error);
      return '/logos/default.svg';
    }
  };

  // Fetch available deployment platforms
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setLoading(true);
        const res = await apiRequest('GET', '/api/deployment/platforms');
        const data = await res.json();
        
        // Fetch logos for each platform
        const platformsWithDynamicLogos = await Promise.all(
          data.map(async (platform: DeploymentPlatform) => {
            try {
              const logoUrl = await fetchLogoUrl(platform.id);
              return { ...platform, logoUrl };
            } catch (error) {
              console.error(`Error fetching logo for ${platform.id}:`, error);
              return platform; // Keep original logo if fetching fails
            }
          })
        );
        
        setPlatforms(platformsWithDynamicLogos);
      } catch (error) {
        console.error('Error fetching deployment platforms:', error);
        toast({
          title: "Error",
          description: "Failed to fetch deployment platforms",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlatforms();
  }, [toast]);
  
  // Handle platform selection
  const handleSelectPlatform = (platform: DeploymentPlatform) => {
    setSelectedPlatform(platform);
    
    // Initialize credentials
    if (platform.credentialFields) {
      const initialCredentials: Record<string, string> = {};
      platform.credentialFields.forEach(field => {
        initialCredentials[field.id] = '';
      });
      setCredentials(initialCredentials);
    } else {
      setCredentials({});
    }
    
    setDeploymentResult(null);
    setIsDialogOpen(true);
  };
  
  // Handle credential change
  const handleCredentialChange = (fieldId: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  // Handle deployment
  const handleDeploy = async () => {
    if (!selectedPlatform) return;
    
    try {
      setLoading(true);
      
      // Validate required credentials
      if (selectedPlatform.requiresCredentials && selectedPlatform.credentialFields) {
        const missingCredentials = selectedPlatform.credentialFields
          .filter(field => field.required && (!credentials[field.id] || credentials[field.id].trim() === ''))
          .map(field => field.name);
        
        if (missingCredentials.length > 0) {
          toast({
            title: "Missing Credentials",
            description: `Please provide ${missingCredentials.join(', ')}`,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }
      
      // For now, we'll use the prepare endpoint instead of direct deployment
      // This generates the deployment package with platform-specific config
      const res = await apiRequest('POST', '/api/deployment/prepare', {
        buildId,
        platformId: selectedPlatform.id,
        credentials
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Deployment preparation failed');
      }
      
      setDeploymentResult(result);
      
      toast({
        title: "Success",
        description: "Deployment package created successfully!",
      });
    } catch (error) {
      console.error('Error deploying server:', error);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Cursor IDE deployment
  const handleCursorDeploy = async () => {
    // Get platform OS-specific config paths
    const configPaths = {
      macOS: "~/Library/Application Support/Cursor/cursor_config.json",
      Windows: "%APPDATA%\\Cursor\\cursor_config.json",
      Linux: "~/.config/Cursor/cursor_config.json"
    };
    
    // Generate a normalized server name for the config
    const normalizedServerName = serverName.toLowerCase().replace(/\s+/g, '-');
    
    // Get the Cursor logo
    const logoUrl = await fetchLogoUrl('cursor');
    
    // Set up dialog content with Cursor-specific instructions
    setSelectedPlatform({
      id: "cursor",
      name: "Cursor IDE",
      description: "Deploy your MCP server to Cursor IDE for seamless integration",
      logoUrl, // Dynamic logo from our API
      requiresCredentials: false
    });
    
    // Prepare deployment result with Cursor config instructions
    setDeploymentResult({
      success: true,
      message: "Cursor IDE deployment package ready!",
      deploymentUrl: `/api/download/${buildId}`, // This should point to your download endpoint
      setupInstructions: [
        `Locate your Cursor IDE config file:`,
        `• macOS: ${configPaths.macOS}`,
        `• Windows: ${configPaths.Windows}`,
        `• Linux: ${configPaths.Linux}`,
        `Add the following to your cursor_config.json:`,
        `{
  "mcpServers": {
    "${normalizedServerName}": {
      "command": "${serverName.includes("Python") ? "python" : "node"}",
      "args": ["/absolute/path/to/extracted/folder/server.${serverName.includes("Python") ? "py" : "js"}"]
    }
  }
}`,
        `Restart Cursor IDE to apply the changes.`
      ]
    });
    
    // Open the deployment dialog
    setIsDialogOpen(true);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Deploy to Cloud</h3>
      
      {/* Cursor IDE Deployment Card */}
      <div className="mb-4 p-4 border-2 border-primary/20 bg-primary/5 rounded-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-1">Deploy to Cursor IDE</h3>
            <p className="text-sm text-neutral-600 mb-2">
              Configure your MCP server in Cursor IDE with a few simple steps
            </p>
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleCursorDeploy}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" fill="currentColor"/>
                <path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .4.8l3 2a1 1 0 0 0 1.2-1.6L13 11.5V7a1 1 0 0 0-1-1z" fill="currentColor"/>
              </svg>
              Deploy to Cursor IDE
            </Button>
          </div>
          <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-white p-2 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 8l10 8-10 8V8z" fill="currentColor"/>
              <path d="M7 0v6.4L14 12 7 17.6V24h2l12-12L9 0H7z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
      
      {loading && platforms.length === 0 ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading deployment options...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map(platform => (
            <Card key={platform.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{platform.name}</CardTitle>
                  {platform.logoUrl && (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img 
                        src={platform.logoUrl} 
                        alt={`${platform.name} logo`} 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => handleSelectPlatform(platform)}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy to {platform.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {selectedPlatform && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {deploymentResult 
                  ? `Deploy to ${selectedPlatform.name} - Setup Instructions` 
                  : `Prepare ${selectedPlatform.name} Deployment Package`
                }
              </DialogTitle>
              <DialogDescription>
                {deploymentResult ? (
                  "Your deployment package is ready! Follow these step-by-step instructions to deploy your MCP server."
                ) : (
                  `Create a deployment package for your "${serverName}" MCP server optimized for ${selectedPlatform.name}.${
                    selectedPlatform.requiresCredentials
                      ? " Please provide your credentials to continue."
                      : ""
                  }`
                )}
              </DialogDescription>
            </DialogHeader>
            
            {!deploymentResult ? (
              // Deployment form
              <>
                {selectedPlatform.requiresCredentials && selectedPlatform.credentialFields && (
                  <div className="grid gap-4 py-4">
                    {selectedPlatform.credentialFields.map(field => (
                      <div key={field.id} className="grid gap-2">
                        <Label htmlFor={field.id}>{field.name}{field.required && <span className="text-red-500 ml-1">*</span>}</Label>
                        <Input
                          id={field.id}
                          type={field.type}
                          placeholder={field.description}
                          value={credentials[field.id] || ''}
                          onChange={e => handleCredentialChange(field.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeploy}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4 mr-2" />
                        Create Deployment Package
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              // Deployment result
              <>
                <div className="py-4">
                  <h4 className="font-medium mb-2">Setup Instructions</h4>
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>
                      <a
                        href={deploymentResult.deploymentUrl}
                        className="flex items-center text-primary hover:underline"
                        download
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download deployment package
                      </a>
                    </li>
                    {deploymentResult.setupInstructions?.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <a
                    href={deploymentResult.deploymentUrl}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    download
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DeploymentOptions;