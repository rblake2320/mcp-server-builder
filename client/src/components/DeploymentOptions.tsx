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
      
      // Use the one-click deployment endpoint
      // This generates the deployment package with platform-specific automated scripts
      const res = await apiRequest('POST', '/api/deploy', {
        buildId,
        platformId: selectedPlatform.id,
        serverName,
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
    try {
      setLoading(true);
      
      // Get the Cursor logo
      const logoUrl = await fetchLogoUrl('cursor');
      
      // Set up dialog content with Cursor-specific instructions
      setSelectedPlatform({
        id: "cursor",
        name: "Cursor IDE",
        description: "Deploy your MCP server to Cursor IDE with zero-configuration setup",
        logoUrl, // Dynamic logo from our API
        requiresCredentials: false
      });
      
      // Send API request to prepare the deployment package
      const res = await apiRequest('POST', '/api/deploy', {
        buildId,
        platformId: 'cursor',
        serverName,
        credentials: {}
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Deployment preparation failed');
      }
      
      setDeploymentResult(result);
      
      toast({
        title: "Success",
        description: "Cursor deployment package created with auto-setup scripts!",
      });
      
      // Open the deployment dialog
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error deploying to Cursor:', error);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Deploy to Cloud</h3>
      
      {/* Cursor IDE Deployment Card */}
      <div className="mb-4 p-4 border-2 border-primary/20 bg-primary/5 rounded-lg hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Deploy to Cursor IDE</h3>
            <p className="text-sm text-neutral-600 mb-2">
              One-click deployment with fully automated setup
            </p>
            <div className="space-y-1">
              <p className="text-xs text-green-600 font-medium">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  NEW: Zero-configuration deployment assistant
                </span>
              </p>
              <p className="text-xs text-green-600 font-medium">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Automatic dependency installation & config setup
                </span>
              </p>
              <p className="text-xs text-green-600 font-medium">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Interactive guided setup process
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="default"
                size="sm"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={handleCursorDeploy}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" fill="currentColor"/>
                  <path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .4.8l3 2a1 1 0 0 0 1.2-1.6L13 11.5V7a1 1 0 0 0-1-1z" fill="currentColor"/>
                </svg>
                Deploy to Cursor IDE
              </Button>
            </div>
          </div>
          <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-white p-2 shadow-sm">
            <img 
              id="cursorLogo" 
              src="/logos/cursor.svg" 
              alt="Cursor IDE Logo" 
              className="max-w-full max-h-full"
              onError={(e) => {
                // Fallback SVG if image fails to load
                const target = e.target as HTMLImageElement;
                target.outerHTML = `
                  <svg viewBox="0 0 24 24" class="w-10 h-10 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 8l10 8-10 8V8z" fill="currentColor"/>
                    <path d="M7 0v6.4L14 12 7 17.6V24h2l12-12L9 0H7z" fill="currentColor"/>
                  </svg>
                `;
              }}
            />
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
                  <div className="bg-green-50 p-3 rounded-md mb-4 border border-green-200 flex items-start">
                    <div className="text-green-600 mr-3 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-green-800">Automated Setup Enabled</h5>
                      <p className="text-xs text-green-700 mt-1">This package includes automated dependency installation and configuration scripts to minimize manual steps.</p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-2">Quick Start Instructions</h4>
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>
                      <a
                        href={deploymentResult.deploymentUrl}
                        className="flex items-center text-primary hover:underline font-medium"
                        download
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download deployment package
                      </a>
                    </li>
                    {selectedPlatform?.id === 'cursor' && (
                      <>
                        <li className="font-medium text-blue-600">
                          <span className="flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2 py-0.5 rounded">NEW</span> 
                            Run the auto-deployment assistant:
                          </span>
                          <ul className="list-disc ml-5 text-sm mt-1">
                            <li>Windows: Double-click <code className="bg-gray-100 px-1 rounded text-blue-600">deploy-to-cursor.bat</code></li>
                            <li>Mac/Linux: Run <code className="bg-gray-100 px-1 rounded text-blue-600">./deploy-to-cursor.sh</code></li>
                          </ul>
                        </li>
                        <li className="text-green-600">
                          The assistant will automatically install dependencies, configure Cursor IDE, and guide you through any remaining steps!
                        </li>
                      </>
                    )}
                    {deploymentResult.setupInstructions?.map((instruction, index) => (
                      <li key={index} className={index === 0 || index === 1 ? "font-medium" : ""}>{instruction}</li>
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