import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Download, FileCode, Github, Copy, Server, Loader2, Cloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TwentyfirstServers } from "@/components/TwentyfirstServers";
import DeploymentSelector from "@/components/DeploymentSelector";

// Define types for our server index
interface MCPServer {
  name: string;
  path: string;
  language: string;
  description: string;
  difficulty: string;
  dependencies: string[];
  tools: string[];
  requires_api_key?: boolean;
  api_provider?: string;
}

interface ServerIndex {
  templates: MCPServer[];
  examples: MCPServer[];
}

const MCPServers = () => {
  const [serverIndex, setServerIndex] = useState<ServerIndex | null>(null);
  const [activeTab, setActiveTab] = useState("examples");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [serverCode, setServerCode] = useState<string>("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [serverStats, setServerStats] = useState<{
    totalCount: number;
    upCount: number;
    downCount: number;
    byType: {
      templates: number;
      examples: number;
      imported: number;
    }
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch server index from our API
        const indexResponse = await fetch('/api/mcp-servers');
        
        if (!indexResponse.ok) {
          throw new Error(`API request failed with status ${indexResponse.status}`);
        }
        
        const indexData = await indexResponse.json();
        setServerIndex(indexData);
        
        // Fetch server stats
        const statsResponse = await fetch('/api/mcp-servers/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setServerStats(statsData);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching server data:", error);
        
        // Fallback to hardcoded data if API request fails
        const fallbackData = {
          templates: [
            {
              name: "Basic JavaScript MCP Server",
              path: "templates/basic_mcp_server.js",
              language: "javascript",
              description: "A minimal JavaScript MCP server template using Express",
              difficulty: "beginner",
              dependencies: ["express", "cors", "body-parser"],
              tools: ["hello_world"]
            },
            {
              name: "Basic Python MCP Server",
              path: "templates/basic_mcp_server.py",
              language: "python",
              description: "A minimal Python MCP server template using http.server",
              difficulty: "beginner",
              dependencies: [],
              tools: ["hello_world"]
            }
          ],
          examples: [
            {
              name: "File Browser MCP Server",
              path: "examples/file_browser_server.py",
              language: "python",
              description: "Browse files and directories on the host system",
              difficulty: "intermediate",
              dependencies: [],
              tools: ["list_directory", "read_file", "get_file_info"]
            },
            {
              name: "Weather API Server",
              path: "examples/weather_api_server.js",
              language: "javascript",
              description: "Get weather data and forecasts for any location",
              difficulty: "intermediate",
              dependencies: ["express", "cors", "axios"],
              requires_api_key: true,
              api_provider: "OpenWeatherMap",
              tools: ["get_current_weather", "get_weather_forecast"]
            }
          ]
        };
        
        setServerIndex(fallbackData);
        
        // Fallback stats
        setServerStats({
          totalCount: 4,
          upCount: 4,
          downCount: 0,
          byType: {
            templates: 2,
            examples: 2,
            imported: 0
          }
        });
        
        setIsLoading(false);
      }
    };
    
    // Set up an interval to refresh the stats periodically
    fetchData();
    
    const statsInterval = setInterval(() => {
      fetch('/api/mcp-servers/stats')
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('Failed to fetch stats');
        })
        .then(data => {
          setServerStats(data);
        })
        .catch(error => {
          console.error('Error refreshing server stats:', error);
        });
    }, 10000); // Refresh every 10 seconds
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(statsInterval);
  }, []);

  const handleDownload = async (server: MCPServer) => {
    // Log the download request
    console.log("Downloading server:", server.name);
    
    try {
      // First get the build ID from the API
      const response = await fetch(`/api/mcp-servers/build/${server.path}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // If we have a build ID, enable deployment options
        if (data.buildId) {
          setBuildId(data.buildId);
          setServerType(server.language);
          setShowDeployment(true);
        }
      }
      
      // Trigger download using our API endpoint
      window.location.href = `/api/mcp-servers/download/${server.path}`;
    } catch (error) {
      console.error("Error preparing for deployment:", error);
      
      // Still trigger the download even if deployment prep fails
      window.location.href = `/api/mcp-servers/download/${server.path}`;
    }
  };
  
  const handleCopyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      alert("Command copied to clipboard!");
    });
  };
  
  const handleViewCode = async (server: MCPServer) => {
    try {
      setSelectedServer(server);
      setCodeLoading(true);
      
      // Fetch the server code from the API
      const response = await fetch(`/api/mcp-servers/${server.path}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setServerCode(data.content || "// Code not available");
      setCodeLoading(false);
    } catch (error) {
      console.error("Error fetching server code:", error);
      setServerCode("// Error loading code: " + (error instanceof Error ? error.message : String(error)));
      setCodeLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-500";
      case "intermediate":
        return "bg-yellow-500";
      case "advanced":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  const getLanguageColor = (language: string) => {
    switch (language.toLowerCase()) {
      case "javascript":
        return "bg-yellow-400 text-black";
      case "python":
        return "bg-blue-600";
      case "typescript":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Import server from URL
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  // State for deployment
  const [buildId, setBuildId] = useState<string | null>(null);
  const [serverType, setServerType] = useState<string>("javascript");
  const [showDeployment, setShowDeployment] = useState<boolean>(false);
  
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    
    setImportLoading(true);
    setImportError(null);
    
    try {
      const response = await fetch('/api/mcp-servers/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: importUrl }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import server');
      }
      
      // Refresh server list
      const indexResponse = await fetch('/api/mcp-servers');
      if (indexResponse.ok) {
        const data = await indexResponse.json();
        setServerIndex(data);
      }
      
      // Close dialog and reset form
      setImportDialogOpen(false);
      setImportUrl('');
      
      // Show success toast
      alert('Server imported successfully!');
    } catch (error) {
      console.error('Error importing server:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import server');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-7xl">
      {/* Header with logo & nav */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl flex items-center">
            <Server className="h-6 w-6 mr-2" />
            MCP Servers
          </div>
          <div className="flex space-x-4">
            <Button variant="link" className="text-foreground">Home</Button>
            <Button variant="link" className="text-foreground">Remote Servers</Button>
            <Button variant="link" className="text-foreground">Resources</Button>
          </div>
        </div>
        <div>
          <Button>Submit</Button>
        </div>
      </div>
      
      {/* New tag */}
      <div className="flex justify-center mb-6">
        <div className="bg-muted/50 text-sm px-4 py-2 rounded-full flex items-center">
          <span className="text-amber-500 mr-2">✨</span> 
          New: Remote MCP Servers
        </div>
      </div>
      
      {/* Main title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">Awesome MCP Servers</h1>
        <p className="text-muted-foreground">
          A collection of servers for the Model Context Protocol.
        </p>
        
        {/* Stats display */}
        {serverStats && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <Badge className="text-base px-3 py-1 bg-primary/80">
              {serverStats.totalCount.toLocaleString()} Servers
            </Badge>
            <Badge className="text-base px-3 py-1 bg-green-500/90">
              {serverStats.upCount.toLocaleString()} Up
            </Badge>
            <Badge className="text-base px-3 py-1 bg-red-500/90">
              {serverStats.downCount.toLocaleString()} Down
            </Badge>
          </div>
        )}
      </div>
      
      {/* Filter categories */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <Button variant="default" className="rounded-full bg-slate-900">All</Button>
        <Button variant="outline" className="rounded-full flex items-center">
          Official <span className="text-amber-500 ml-1">✨</span>
        </Button>
        <Button variant="outline" className="rounded-full">Search</Button>
        <Button variant="outline" className="rounded-full">Web Scraping</Button>
        <Button variant="outline" className="rounded-full">Communication</Button>
        <Button variant="outline" className="rounded-full">Productivity</Button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <Button variant="outline" className="rounded-full">Development</Button>
        <Button variant="outline" className="rounded-full">Database</Button>
        <Button variant="outline" className="rounded-full">Cloud Service</Button>
        <Button variant="outline" className="rounded-full">File System</Button>
        <Button variant="outline" className="rounded-full">Cloud Storage</Button>
        <Button variant="outline" className="rounded-full">Version Control</Button>
        <Button variant="outline" className="rounded-full">Other</Button>
      </div>
      
      {/* Import & GitHub buttons */}
      <div className="flex justify-end mb-6">
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Import URL
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import MCP Server</DialogTitle>
                <DialogDescription>
                  Import an MCP server from a GitHub repository, Gist, or direct file URL.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleImportSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Server URL</Label>
                    <Input 
                      id="url" 
                      placeholder="https://github.com/username/repo/blob/main/server.js" 
                      value={importUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImportUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported: GitHub files, Gists, or raw file URLs
                    </p>
                  </div>
                  
                  {importError && (
                    <div className="text-sm font-medium text-destructive">
                      {importError}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={importLoading || !importUrl}>
                    {importLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Import Server
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => window.open("https://github.com/anthropics/anthropic-cookbook/tree/main/mcp", "_blank")}>
            <Github className="h-4 w-4 mr-2" />
            MCP Resources
          </Button>
        </div>
      </div>
      
      {/* Deployment UI */}
      {showDeployment && buildId && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Cloud className="h-5 w-5 mr-2" />
              Deploy MCP Server
            </CardTitle>
            <CardDescription>
              Deploy your downloaded MCP server to one of these hosting platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeploymentSelector 
              buildId={buildId}
              serverType={serverType}
              onDeploymentComplete={(deploymentId: string, platformId: string) => {
                console.log(`Deployment ${deploymentId} to ${platformId} completed`);
              }}
            />
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setShowDeployment(false)}>
              Hide Deployment Options
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Server cards in grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Sample server card 1 - Brave Search */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Brave Search</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Web and local search using Brave's Search API
            </p>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button variant="outline" size="sm" className="mr-2">
              <FileCode className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </CardFooter>
        </Card>
        
        {/* Sample server card 2 - Fetch */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Fetch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Web content fetching and conversion for efficient LLM usage
            </p>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button variant="outline" size="sm" className="mr-2">
              <FileCode className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </CardFooter>
        </Card>
        
        {/* Sample server card 3 - GitHub Integration */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">GitHub Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Access repositories, create PRs, and manage issues programmatically
            </p>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button variant="outline" size="sm" className="mr-2">
              <FileCode className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </CardFooter>
        </Card>
        
        {/* Sample server card 4 - Database Query Assistant */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Database Query Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Generate and execute SQL queries across various database systems
            </p>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button variant="outline" size="sm" className="mr-2">
              <FileCode className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default MCPServers;