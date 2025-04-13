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
  
  // Handle Docker deployment
  const handleDockerDeploy = async () => {
    try {
      setLoading(true);
      
      // Get the Docker logo
      const logoUrl = await fetchLogoUrl('docker');
      
      // Set up dialog content with Docker-specific instructions
      setSelectedPlatform({
        id: "docker",
        name: "Docker",
        description: "Package your MCP server as a Docker container for easy deployment anywhere",
        logoUrl, // Dynamic logo from our API
        requiresCredentials: false
      });
      
      // Send API request to prepare the deployment package
      const res = await apiRequest('POST', '/api/deploy', {
        buildId,
        platformId: 'docker',
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
        description: "Docker deployment package created with auto-setup scripts!",
      });
      
      // Open the deployment dialog
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error deploying to Docker:', error);
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
      
      {/* Docker Deployment Card */}
      <div className="mb-4 p-4 border-2 border-primary/20 bg-primary/5 rounded-lg hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-transparent bg-clip-text">Deploy with Docker</h3>
            <p className="text-sm text-neutral-600 mb-2">
              Containerized deployment for any platform with Docker
            </p>
            <div className="space-y-1">
              <p className="text-xs text-green-600 font-medium">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Optimized Dockerfile with all dependencies bundled
                </span>
              </p>
              <p className="text-xs text-green-600 font-medium">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Auto-generated run scripts for Windows and macOS/Linux
                </span>
              </p>
              <p className="text-xs text-green-600 font-medium">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Works with Docker Desktop, Docker Engine, and remote hosts
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="default"
                size="sm"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                onClick={handleDockerDeploy}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5.5H11V7.5H13V5.5Z" fill="currentColor"/>
                  <path d="M13 8.5H11V10.5H13V8.5Z" fill="currentColor"/>
                  <path d="M10 8.5H8V10.5H10V8.5Z" fill="currentColor"/>
                  <path d="M7 8.5H5V10.5H7V8.5Z" fill="currentColor"/>
                  <path d="M10 5.5H8V7.5H10V5.5Z" fill="currentColor"/>
                  <path d="M16 11.5H14V13.5H16V11.5Z" fill="currentColor"/>
                  <path d="M7 11.5H5V13.5H7V11.5Z" fill="currentColor"/>
                  <path d="M10 11.5H8V13.5H10V11.5Z" fill="currentColor"/>
                  <path d="M13 11.5H11V13.5H13V11.5Z" fill="currentColor"/>
                  <path d="M22.9164 10.4331C22.7764 10.2531 22.4164 10.0131 21.6964 10.0031C21.6764 10.0031 21.6364 10.0031 21.6164 10.0031C21.5364 9.95309 20.9564 9.70309 20.8364 9.22309C20.7764 8.97309 20.7664 8.70309 20.8064 8.47309C20.8264 8.36309 20.8664 8.26309 20.8864 8.20309C20.9264 8.09309 20.8964 7.97309 20.8064 7.90309C20.7464 7.85309 20.6764 7.82309 20.6064 7.82309C20.5564 7.82309 20.5064 7.83309 20.4564 7.86309C20.1064 8.01309 19.8064 8.24309 19.5664 8.51309C19.2964 8.81309 19.0964 9.13309 18.9364 9.44309C18.8864 9.55309 18.8364 9.67309 18.7964 9.78309C18.4264 9.81309 17.9764 9.89309 17.5064 10.0631C17.4064 10.0931 17.3464 10.1831 17.3564 10.2831C17.3864 10.5531 17.5064 10.7931 17.6764 10.9831C17.8764 11.2131 18.1564 11.3631 18.4164 11.3631C18.4264 11.3631 18.4464 11.3631 18.4564 11.3631C18.5564 11.3531 18.6864 11.3431 18.8364 11.3231L18.8664 11.3531L19.2264 11.9031C19.0664 13.2231 18.8164 15.8731 19.0664 16.9831C19.0864 17.0831 19.1764 17.1531 19.2764 17.1531C19.2864 17.1531 19.2964 17.1531 19.3064 17.1531C19.4164 17.1331 19.4964 17.0331 19.4764 16.9231C19.2564 15.9231 19.4864 13.2831 19.6564 11.9831L19.6964 11.7631C19.7064 11.6931 19.6864 11.6431 19.6864 11.6331C19.6663 11.5631 19.6164 11.5131 19.5464 11.4931L19.3864 11.4431C19.3764 11.4331 19.3664 11.4331 19.3564 11.4231C19.3064 11.4031 19.0464 11.3431 18.5164 11.3631C18.3564 11.3631 18.1764 11.2731 18.0564 11.1331C17.9964 11.0531 17.9364 10.9431 17.9464 10.8231C18.2964 10.7231 18.6264 10.6831 18.8864 10.6831C18.9064 10.6831 18.9164 10.6831 18.9364 10.6831C19.0264 10.6831 19.1164 10.6131 19.1264 10.5231C19.1464 10.4331 19.1764 10.3431 19.2164 10.2631C19.4264 9.81309 19.7864 9.39309 20.3064 9.13309C20.2964 9.25309 20.2964 9.37309 20.3064 9.50309C20.4764 10.2831 21.2964 10.7131 21.6664 10.8731C22.0864 10.8731 22.3264 10.9731 22.4264 11.0731C22.2164 11.3831 21.4764 12.2431 20.1964 12.2431H17.8664C17.1664 12.2431 16.5064 12.1131 15.9264 11.8731C15.8364 11.8131 15.5964 11.6331 15.3864 11.4731C15.3664 11.4531 15.3364 11.4331 15.3064 11.4131C16.8464 11.0431 17.9864 9.74309 17.9864 8.18309V3.18309H2.98636V8.19309C2.98636 9.76309 4.13636 11.0631 5.68636 11.4131C5.46636 11.5731 5.28636 11.7031 5.26636 11.7231C4.67636 12.1131 3.91636 12.2431 3.13636 12.2431H0.0563602C-0.0136398 12.9631 -0.0136398 13.7131 0.103601 14.4731C0.45636 16.7231 1.68636 18.7031 3.42636 20.0531L3.42636 20.0531C5.38636 21.5831 7.96636 22.3531 11.1164 22.3531C13.4764 22.3531 15.5764 21.8731 17.3864 20.9131C19.1363 19.9931 20.5864 18.6931 21.7064 17.0131C22.9364 15.1431 23.6864 13.2631 23.9764 11.2931C24.0164 10.9831 23.0564 10.6131 22.9164 10.4331Z" fill="currentColor"/>
                </svg>
                Deploy with Docker
              </Button>
            </div>
          </div>
          <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-white p-2 shadow-sm">
            <img 
              id="dockerLogo" 
              src="/logos/docker.svg" 
              alt="Docker Logo" 
              className="max-w-full max-h-full"
              onError={(e) => {
                // Fallback SVG if image fails to load
                const target = e.target as HTMLImageElement;
                target.outerHTML = `
                  <svg width="24" height="24" viewBox="0 0 24 24" class="w-10 h-10 text-blue-500" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 5.5H11V7.5H13V5.5Z" fill="currentColor"/>
                    <path d="M13 8.5H11V10.5H13V8.5Z" fill="currentColor"/>
                    <path d="M10 8.5H8V10.5H10V8.5Z" fill="currentColor"/>
                    <path d="M7 8.5H5V10.5H7V8.5Z" fill="currentColor"/>
                    <path d="M10 5.5H8V7.5H10V5.5Z" fill="currentColor"/>
                    <path d="M16 11.5H14V13.5H16V11.5Z" fill="currentColor"/>
                    <path d="M7 11.5H5V13.5H7V11.5Z" fill="currentColor"/>
                    <path d="M10 11.5H8V13.5H10V11.5Z" fill="currentColor"/>
                    <path d="M13 11.5H11V13.5H13V11.5Z" fill="currentColor"/>
                    <path d="M22.9164 10.4331C22.7764 10.2531 22.4164 10.0131 21.6964 10.0031C21.6764 10.0031 21.6364 10.0031 21.6164 10.0031C21.5364 9.95309 20.9564 9.70309 20.8364 9.22309C20.7764 8.97309 20.7664 8.70309 20.8064 8.47309C20.8264 8.36309 20.8664 8.26309 20.8864 8.20309C20.9264 8.09309 20.8964 7.97309 20.8064 7.90309C20.7464 7.85309 20.6764 7.82309 20.6064 7.82309C20.5564 7.82309 20.5064 7.83309 20.4564 7.86309C20.1064 8.01309 19.8064 8.24309 19.5664 8.51309C19.2964 8.81309 19.0964 9.13309 18.9364 9.44309C18.8864 9.55309 18.8364 9.67309 18.7964 9.78309C18.4264 9.81309 17.9764 9.89309 17.5064 10.0631C17.4064 10.0931 17.3464 10.1831 17.3564 10.2831C17.3864 10.5531 17.5064 10.7931 17.6764 10.9831C17.8764 11.2131 18.1564 11.3631 18.4164 11.3631C18.4264 11.3631 18.4464 11.3631 18.4564 11.3631C18.5564 11.3531 18.6864 11.3431 18.8364 11.3231L18.8664 11.3531L19.2264 11.9031C19.0664 13.2231 18.8164 15.8731 19.0664 16.9831C19.0864 17.0831 19.1764 17.1531 19.2764 17.1531C19.2864 17.1531 19.2964 17.1531 19.3064 17.1531C19.4164 17.1331 19.4964 17.0331 19.4764 16.9231C19.2564 15.9231 19.4864 13.2831 19.6564 11.9831L19.6964 11.7631C19.7064 11.6931 19.6864 11.6431 19.6864 11.6331C19.6663 11.5631 19.6164 11.5131 19.5464 11.4931L19.3864 11.4431C19.3764 11.4331 19.3664 11.4331 19.3564 11.4231C19.3064 11.4031 19.0464 11.3431 18.5164 11.3631C18.3564 11.3631 18.1764 11.2731 18.0564 11.1331C17.9964 11.0531 17.9364 10.9431 17.9464 10.8231C18.2964 10.7231 18.6264 10.6831 18.8864 10.6831C18.9064 10.6831 18.9164 10.6831 18.9364 10.6831C19.0264 10.6831 19.1164 10.6131 19.1264 10.5231C19.1464 10.4331 19.1764 10.3431 19.2164 10.2631C19.4264 9.81309 19.7864 9.39309 20.3064 9.13309C20.2964 9.25309 20.2964 9.37309 20.3064 9.50309C20.4764 10.2831 21.2964 10.7131 21.6664 10.8731C22.0864 10.8731 22.3264 10.9731 22.4264 11.0731C22.2164 11.3831 21.4764 12.2431 20.1964 12.2431H17.8664C17.1664 12.2431 16.5064 12.1131 15.9264 11.8731C15.8364 11.8131 15.5964 11.6331 15.3864 11.4731C15.3664 11.4531 15.3364 11.4331 15.3064 11.4131C16.8464 11.0431 17.9864 9.74309 17.9864 8.18309V3.18309H2.98636V8.19309C2.98636 9.76309 4.13636 11.0631 5.68636 11.4131C5.46636 11.5731 5.28636 11.7031 5.26636 11.7231C4.67636 12.1131 3.91636 12.2431 3.13636 12.2431H0.0563602C-0.0136398 12.9631 -0.0136398 13.7131 0.103601 14.4731C0.45636 16.7231 1.68636 18.7031 3.42636 20.0531L3.42636 20.0531C5.38636 21.5831 7.96636 22.3531 11.1164 22.3531C13.4764 22.3531 15.5764 21.8731 17.3864 20.9131C19.1363 19.9931 20.5864 18.6931 21.7064 17.0131C22.9364 15.1431 23.6864 13.2631 23.9764 11.2931C24.0164 10.9831 23.0564 10.6131 22.9164 10.4331Z" fill="currentColor"/>
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
                    {selectedPlatform?.id === 'docker' && (
                      <>
                        <li className="font-medium text-blue-600">
                          <span className="flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2 py-0.5 rounded">NEW</span> 
                            Run the Docker helper script for automated setup:
                          </span>
                          <ul className="list-disc ml-5 text-sm mt-1">
                            <li>Windows: Double-click <code className="bg-gray-100 px-1 rounded text-blue-600">run-docker-deploy.bat</code></li>
                            <li>Mac/Linux: Run <code className="bg-gray-100 px-1 rounded text-blue-600">./run-docker-deploy.sh</code></li>
                          </ul>
                        </li>
                        <li className="text-green-600">
                          The script will build and start your containerized MCP server with all dependencies bundled and configured!
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