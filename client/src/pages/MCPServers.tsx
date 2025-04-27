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
  DialogTrigger
} from "@/components/ui/dialog";
import { Download, FileCode, Github, ExternalLink, Copy, Server, Loader2, Cloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">MCP Server Collection</h1>
            {serverStats && (
              <div className="flex items-center gap-2 ml-4">
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
          <p className="text-muted-foreground mt-2">
            Browse and download ready-to-use Model Context Protocol servers for Claude
          </p>
          {serverStats && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="bg-background/80">
                {serverStats.byType.templates} Templates
              </Badge>
              <Badge variant="outline" className="bg-background/80">
                {serverStats.byType.examples} Examples
              </Badge>
              <Badge variant="outline" className="bg-background/80">
                {serverStats.byType.imported} Imported
              </Badge>
            </div>
          )}
        </div>
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
              onDeploymentComplete={(deploymentId, platformId) => {
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
      
      <Tabs defaultValue="examples" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="examples">Example Servers</TabsTrigger>
          <TabsTrigger value="templates">Starter Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="examples">
          {/* 21st.dev Magic MCP Servers Integration */}
          <TwentyfirstServers />
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {serverIndex?.examples.map((server, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{server.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={getLanguageColor(server.language)}>
                          {server.language}
                        </Badge>
                        <Badge variant="secondary" className={getDifficultyColor(server.difficulty)}>
                          {server.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{server.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Includes tools:</h4>
                      <div className="flex flex-wrap gap-2">
                        {server.tools.map((tool, toolIndex) => (
                          <Badge key={toolIndex} variant="outline">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {server.requires_api_key && (
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-4">
                        <p className="text-amber-800 text-sm">
                          Requires API key from {server.api_provider}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Run with:</h4>
                      <div className="bg-muted p-2 rounded text-sm font-mono flex items-center justify-between">
                        <code>{server.language === "javascript" ? "node server.js" : "python server.py"}</code>
                        <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(server.language === "javascript" ? "node server.js" : "python server.py")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button onClick={() => handleDownload(server)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => handleViewCode(server)}>
                          <FileCode className="h-4 w-4 mr-2" />
                          View Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>{selectedServer?.name}</DialogTitle>
                          <DialogDescription>
                            {selectedServer?.description}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="overflow-auto flex-grow my-4">
                          {codeLoading ? (
                            <div className="flex justify-center py-12">
                              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                            </div>
                          ) : (
                            <pre className="bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {serverCode}
                            </pre>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => handleCopyToClipboard(serverCode)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Code
                          </Button>
                          <Button onClick={() => selectedServer && handleDownload(selectedServer)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
              
              {serverIndex?.examples.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">No example servers found</h3>
                  <p className="text-muted-foreground">Try checking the templates tab to create your own server</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="templates">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {serverIndex?.templates.map((template, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{template.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={getLanguageColor(template.language)}>
                          {template.language}
                        </Badge>
                        <Badge variant="secondary" className={getDifficultyColor(template.difficulty)}>
                          {template.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{template.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Dependencies:</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.dependencies.length > 0 ? (
                          template.dependencies.map((dep, depIndex) => (
                            <Badge key={depIndex} variant="outline">
                              {dep}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No external dependencies</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Starting point:</h4>
                      <div className="bg-muted p-2 rounded text-sm font-mono">
                        <code>
                          {template.language === "javascript" 
                            ? "const app = express();\n\napp.get('/', (req, res) => { /* ... */ });" 
                            : "class MCPServer(BaseHTTPRequestHandler):\n    def do_GET(self):\n        # ..."}
                        </code>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button onClick={() => handleDownload(template)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => handleViewCode(template)}>
                          <FileCode className="h-4 w-4 mr-2" />
                          View Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>{selectedServer?.name}</DialogTitle>
                          <DialogDescription>
                            {selectedServer?.description}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="overflow-auto flex-grow my-4">
                          {codeLoading ? (
                            <div className="flex justify-center py-12">
                              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                            </div>
                          ) : (
                            <pre className="bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {serverCode}
                            </pre>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => handleCopyToClipboard(serverCode)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Code
                          </Button>
                          <Button onClick={() => selectedServer && handleDownload(selectedServer)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
              
              {serverIndex?.templates.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <FileCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">No templates found</h3>
                  <p className="text-muted-foreground">Check back later for starter templates</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="mt-12 py-8 border-t">
        <h2 className="text-2xl font-bold mb-4">Using MCP Servers with Claude</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">How to Connect</h3>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Download and run your selected MCP server</li>
              <li>Open Claude Desktop and go to <strong>Settings</strong></li>
              <li>Click on the <strong>MCP</strong> tab</li>
              <li>Click <strong>Add Server</strong> and enter the server URL (typically http://localhost:3000)</li>
              <li>Click <strong>Connect</strong> and start using the tools in your conversations</li>
            </ol>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://docs.anthropic.com/claude/docs/model-context-protocol" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  MCP Protocol Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/anthropics/anthropic-cookbook/tree/main/mcp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  <Github className="h-4 w-4 mr-2" />
                  Anthropic MCP Cookbook
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.anthropic.com/claude/docs/model-context-protocol" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  MCP Examples and Use Cases
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPServers;