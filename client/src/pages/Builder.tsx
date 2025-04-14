import { useState, useEffect } from "react";
import StepIndicator from "@/components/StepIndicator";
import ServerDetailsForm from "@/components/ServerDetailsForm";
import ToolDefinitionForm from "@/components/ToolDefinitionForm";
import CodePreview from "@/components/CodePreview";
import ResultView from "@/components/ResultView";
import AIAssistant from "@/components/AIAssistant";
import { Step, ServerConfig, Tool, GeneratedServer, Parameter } from "@/types/index";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save, Download, Github, Sparkles } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Builder = () => {
  const { toast } = useToast();
  
  // State for managing the current step
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, name: 'Server Details', status: 'current' },
    { id: 2, name: 'Define Tools', status: 'upcoming' },
    { id: 3, name: 'Generate & Download', status: 'upcoming' }
  ]);
  
  // State for the server configuration
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    serverName: "Weather Data Provider",
    serverType: "python",
    description: "A server that provides up-to-date weather forecast data for any location",
    tools: []
  });
  
  // State for the server generation result
  const [generatedServer, setGeneratedServer] = useState<GeneratedServer | null>(null);
  
  // State for loading status
  const [isCreating, setIsCreating] = useState(false);
  
  // State for URL import
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // State for AI Assistant
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // Handle importing server from URL
  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a repository URL",
        variant: "destructive"
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      const res = await apiRequest('POST', '/api/import-from-url', { url: importUrl });
      const data = await res.json();
      
      if (data.success) {
        setServerConfig(data.config);
        setIsImportDialogOpen(false);
        
        toast({
          title: "Import Successful",
          description: "Server configuration has been imported successfully"
        });
      } else {
        throw new Error(data.error || "Failed to import server configuration");
      }
    } catch (error) {
      console.error("Error importing server:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import server from URL",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Initialize with a default tool when the component mounts
  useEffect(() => {
    // Add a default tool if no tools exist
    if (serverConfig.tools.length === 0) {
      const defaultTool: Tool = {
        id: uuidv4(),
        name: "get_weather_forecast",
        description: "Retrieves weather forecast data for a specific location",
        parameters: [
          {
            id: uuidv4(),
            name: "location",
            type: "string",
            description: "City name or zip code"
          },
          {
            id: uuidv4(),
            name: "days",
            type: "number",
            description: "Number of days to forecast (1-7)"
          }
        ]
      };
      
      setServerConfig(prev => ({
        ...prev,
        tools: [defaultTool]
      }));
    }
  }, []);
  
  // Update server configuration
  const handleConfigChange = (updates: Partial<ServerConfig>) => {
    setServerConfig(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  // Update tools configuration
  const handleToolsChange = (tools: Tool[]) => {
    setServerConfig(prev => ({
      ...prev,
      tools
    }));
  };
  
  // Navigate to a specific step
  const goToStep = (stepNumber: number) => {
    setSteps(steps.map(step => ({
      ...step,
      status: 
        step.id < stepNumber ? 'completed' :
        step.id === stepNumber ? 'current' : 'upcoming'
    })));
  };
  
  // Create MCP server
  const handleCreateServer = async () => {
    // Validate form
    if (!serverConfig.serverName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a server name",
        variant: "destructive"
      });
      return;
    }
    
    if (!serverConfig.description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a server description",
        variant: "destructive"
      });
      return;
    }
    
    if (serverConfig.tools.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one tool",
        variant: "destructive"
      });
      return;
    }
    
    // Validate tools
    for (const tool of serverConfig.tools) {
      if (!tool.name.trim()) {
        toast({
          title: "Error",
          description: `Please enter a name for tool #${serverConfig.tools.indexOf(tool) + 1}`,
          variant: "destructive"
        });
        return;
      }
      
      if (!tool.description.trim()) {
        toast({
          title: "Error",
          description: `Please enter a description for tool "${tool.name}"`,
          variant: "destructive"
        });
        return;
      }
      
      if (tool.parameters.length === 0) {
        toast({
          title: "Error",
          description: `Please add at least one parameter for tool "${tool.name}"`,
          variant: "destructive"
        });
        return;
      }
      
      // Validate parameters
      for (const param of tool.parameters) {
        if (!param.name.trim()) {
          toast({
            title: "Error",
            description: `Please enter a name for a parameter in tool "${tool.name}"`,
            variant: "destructive"
          });
          return;
        }
        
        if (!param.description.trim()) {
          toast({
            title: "Error",
            description: `Please enter a description for parameter "${param.name}" in tool "${tool.name}"`,
            variant: "destructive"
          });
          return;
        }
      }
    }
    
    // All validation passed, proceed with server creation
    setIsCreating(true);
    
    try {
      const res = await apiRequest('POST', '/api/create-server', serverConfig);
      const data = await res.json();
      
      if (data.success) {
        setGeneratedServer({
          buildId: data.buildId,
          downloadUrl: data.downloadUrl,
          serverName: serverConfig.serverName,
          serverType: serverConfig.serverType
        });
        
        // Update steps to show completion
        goToStep(3);
        
        toast({
          title: "Success",
          description: "Your MCP server has been created successfully!",
        });
      } else {
        throw new Error(data.message || "Failed to create server");
      }
    } catch (error) {
      console.error("Error creating server:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Edit the current server (go back to step 1)
  const handleEditServer = () => {
    setGeneratedServer(null);
    goToStep(1);
  };
  
  // Create a new server (reset form and go to step 1)
  const handleCreateAnother = () => {
    setServerConfig({
      serverName: "",
      serverType: "python",
      description: "",
      tools: []
    });
    setGeneratedServer(null);
    goToStep(1);
  };
  
  // Handle AI-generated tool code
  const handleGeneratedTool = (toolCode: string) => {
    try {
      // Parse the Python code to extract tool information
      const toolNameMatch = toolCode.match(/class\s+(\w+)_params/);
      const toolDescMatch = toolCode.match(/"""([^"]+)"""/);
      
      if (!toolNameMatch || !toolDescMatch) {
        throw new Error("Could not parse tool from generated code");
      }
      
      const toolNameRaw = toolNameMatch[1];
      const toolName = toolNameRaw.replace(/^get_/, '').replace(/_params$/, '');
      const toolDescription = toolDescMatch[1].trim();
      
      // Extract parameters from the code - use regular for loop to avoid downlevelIteration issues
      const regex = /(\w+):\s*(str|int|bool|float|dict|list)\s*=\s*Field\(description="([^"]+)"\)/g;
      const paramMatches: Array<RegExpExecArray> = [];
      let match: RegExpExecArray | null;
      
      while ((match = regex.exec(toolCode)) !== null) {
        paramMatches.push(match);
      }
      
      if (paramMatches.length === 0) {
        throw new Error("No parameters found in the generated tool");
      }
      
      // Create parameters from the parsed information with correct typing
      const parameters: Parameter[] = paramMatches.map(match => {
        let paramType: Parameter['type'] = 'string'; // Default
        
        // Map Python types to our parameter types
        if (match[2] === 'str') paramType = 'string';
        else if (match[2] === 'int') paramType = 'number';
        else if (match[2] === 'bool') paramType = 'boolean';
        else if (match[2] === 'dict') paramType = 'object';
        else if (match[2] === 'list') paramType = 'array';
        
        return {
          id: uuidv4(),
          name: match[1],
          type: paramType,
          description: match[3]
        };
      });
      
      // Create the new tool
      const newTool: Tool = {
        id: uuidv4(),
        name: toolNameRaw,
        description: toolDescription,
        parameters
      };
      
      // Add the new tool to the server config
      setServerConfig(prev => ({
        ...prev,
        tools: [...prev.tools, newTool]
      }));
      
      // Show success message
      toast({
        title: "Tool Added",
        description: `AI-generated tool "${toolNameRaw}" has been added to your server`,
      });
      
      // Close the AI Assistant
      setShowAIAssistant(false);
      
    } catch (error) {
      console.error("Error parsing generated tool:", error);
      toast({
        title: "Error",
        description: "Failed to parse the AI-generated tool. Please try again with a different prompt.",
        variant: "destructive"
      });
    }
  };
  
  // If a server has been generated, show the result view
  if (generatedServer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="font-heading font-semibold text-3xl text-neutral-900">Build Your MCP Server</h1>
          <p className="mt-2 text-neutral-600">Create a custom Model Context Protocol server without writing any code</p>
        </div>
        
        <StepIndicator steps={steps} />
        
        <ResultView 
          generatedServer={generatedServer}
          onEditServer={handleEditServer}
          onCreateAnother={handleCreateAnother}
        />
      </div>
    );
  }
  
  // Otherwise, show the builder form
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="font-heading font-semibold text-3xl text-neutral-900">Build Your MCP Server</h1>
        <p className="mt-2 text-neutral-600">Create a custom Model Context Protocol server without writing any code</p>
      </div>
      
      <StepIndicator steps={steps} />
      
      {/* Server Builder Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <ServerDetailsForm 
          serverConfig={serverConfig}
          onConfigChange={handleConfigChange}
        />
        
        <ToolDefinitionForm 
          tools={serverConfig.tools}
          onToolsChange={handleToolsChange}
        />
        
        <CodePreview serverConfig={serverConfig} />
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save as Template
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Load Template
            </Button>
            
            {/* URL Import Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Github className="h-4 w-4 mr-2" />
                  Import from URL
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Import MCP Server from URL</DialogTitle>
                  <DialogDescription>
                    Enter the URL of a GitHub, GitLab, or Bitbucket repository containing an MCP server implementation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="import-url">Repository URL</Label>
                    <Input
                      id="import-url"
                      placeholder="https://github.com/username/repository"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsImportDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportFromUrl}
                    disabled={isImporting || !importUrl.trim()}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Import Server
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* AI Assistant Dialog */}
            <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                  AI Tool Generator
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>AI Tool Generator</DialogTitle>
                  <DialogDescription>
                    Describe the tool you want to create and let AI generate it for you. You'll need a Google Studio API key.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <AIAssistant onGeneratedTool={handleGeneratedTool} />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAIAssistant(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <button 
            id="createServer" 
            onClick={handleCreateServer}
            disabled={isCreating}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 inline animate-spin" /> Creating Server...
              </>
            ) : (
              <>Create MCP Server</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Builder;
