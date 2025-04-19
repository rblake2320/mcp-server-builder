import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  setupUrl: string;
  docsUrl: string;
  supports: string[];
  requiresCredentials?: boolean;
  credentialFields?: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
  }>;
}

interface DeploymentSelectorProps {
  buildId: string;
  serverType: string;
  onDeploymentComplete?: (deploymentId: string, platformId: string) => void;
}

const DeploymentSelector = ({ buildId, serverType, onDeploymentComplete }: DeploymentSelectorProps) => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [deploymentMessage, setDeploymentMessage] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await fetch('/api/deployment/platforms');
        if (!response.ok) {
          throw new Error('Failed to fetch deployment platforms');
        }
        const data = await response.json();
        setPlatforms(data.platforms || []);
        
        // Set default selected platform if available and compatible
        if (data.platforms && data.platforms.length > 0) {
          const compatiblePlatforms = data.platforms.filter((p: Platform) => 
            p.supports.includes(serverType) || p.supports.includes('all')
          );
          if (compatiblePlatforms.length > 0) {
            setSelectedPlatform(compatiblePlatforms[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching deployment platforms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, [serverType]);

  const handleDeploy = async () => {
    if (!selectedPlatform) return;
    
    setDeploymentStatus('pending');
    setDeploymentMessage('Starting deployment process...');
    
    try {
      const response = await fetch(`/api/deployment/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildId,
          platformId: selectedPlatform,
          credentials
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Deployment failed');
      }
      
      setDeploymentStatus('success');
      setDeploymentMessage(data.message || 'Deployment successful!');
      
      if (data.deploymentUrl) {
        setDeploymentUrl(data.deploymentUrl);
      }
      
      if (onDeploymentComplete && data.deploymentId) {
        onDeploymentComplete(data.deploymentId, selectedPlatform);
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus('error');
      setDeploymentMessage(error instanceof Error ? error.message : 'Unknown deployment error');
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isCompatible = (platform: Platform) => {
    return platform.supports.includes(serverType) || platform.supports.includes('all');
  };

  const isDeployButtonDisabled = () => {
    if (deploymentStatus === 'pending') return true;
    if (!selectedPlatform) return true;
    
    // If the platform requires credentials, check if all required fields are filled
    const platform = platforms.find(p => p.id === selectedPlatform);
    if (platform?.requiresCredentials && platform.credentialFields) {
      return platform.credentialFields
        .filter(field => field.required)
        .some(field => !credentials[field.name]);
    }
    
    return false;
  };

  const renderDeploymentForm = () => {
    const platform = platforms.find(p => p.id === selectedPlatform);
    if (!platform) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <img 
            src={platform.logoUrl || `/logos/${platform.id}.svg`} 
            alt={platform.name} 
            className="h-8 w-8 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logos/default.svg';
            }}
          />
          <div>
            <h3 className="text-lg font-semibold">{platform.name}</h3>
            <p className="text-sm text-muted-foreground">{platform.description}</p>
          </div>
        </div>
        
        {platform.requiresCredentials && platform.credentialFields && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Platform Credentials</h4>
            {platform.credentialFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}{field.required && ' *'}</Label>
                <Input
                  id={field.name}
                  type={field.type === 'password' ? 'password' : 'text'}
                  placeholder={`Enter your ${field.label.toLowerCase()}`}
                  value={credentials[field.name] || ''}
                  onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                  required={field.required}
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="space-x-2">
            <Button
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(platform.docsUrl, '_blank')}
            >
              Documentation
              <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
            <Button
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(platform.setupUrl, '_blank')}
            >
              Setup Account
              <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <Button 
            type="button"
            onClick={handleDeploy}
            disabled={isDeployButtonDisabled()}
          >
            {deploymentStatus === 'pending' && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Deploy to {platform.name}
          </Button>
        </div>
        
        {deploymentStatus !== 'idle' && (
          <Alert variant={deploymentStatus === 'error' ? 'destructive' : (deploymentStatus === 'success' ? 'default' : 'default')}>
            {deploymentStatus === 'error' && <AlertCircle className="h-4 w-4" />}
            {deploymentStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
            <AlertTitle>
              {deploymentStatus === 'pending' && 'Deployment in progress'}
              {deploymentStatus === 'success' && 'Deployment successful'}
              {deploymentStatus === 'error' && 'Deployment failed'}
            </AlertTitle>
            <AlertDescription>{deploymentMessage}</AlertDescription>
            
            {deploymentUrl && deploymentStatus === 'success' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={() => window.open(deploymentUrl, '_blank')}
              >
                View Deployment
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            )}
          </Alert>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const compatiblePlatforms = platforms.filter(isCompatible);

  if (compatiblePlatforms.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No compatible platforms</AlertTitle>
        <AlertDescription>
          No deployment platforms are available for {serverType} servers.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs 
      defaultValue={selectedPlatform || compatiblePlatforms[0].id} 
      value={selectedPlatform || undefined}
      onValueChange={setSelectedPlatform}
      className="w-full"
    >
      <TabsList className="mb-4 flex flex-wrap">
        {compatiblePlatforms.map((platform) => (
          <TabsTrigger 
            key={platform.id} 
            value={platform.id}
            className="flex items-center space-x-2"
          >
            <img 
              src={platform.logoUrl || `/logos/${platform.id}.svg`} 
              alt={platform.name} 
              className="h-4 w-4 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logos/default.svg';
              }}
            />
            <span>{platform.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      
      {compatiblePlatforms.map((platform) => (
        <TabsContent key={platform.id} value={platform.id} className="border rounded-lg p-4">
          {renderDeploymentForm()}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default DeploymentSelector;