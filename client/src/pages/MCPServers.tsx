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
      
      {/* Main title with server statistics */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2">Awesome MCP Servers</h1>
        <p className="text-muted-foreground mb-4">
          A collection of servers for the Model Context Protocol.
        </p>
        
        {/* Server statistics display */}
        {serverStats && (
          <div className="flex justify-center mt-4 mb-2">
            <div className="bg-slate-900 text-white py-2 px-6 rounded-md flex items-center gap-8">
              <div className="flex items-center">
                <span className="font-bold text-lg">{serverStats.totalCount.toLocaleString()}</span>
                <span className="ml-2">Total Servers</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="font-medium">{serverStats.upCount.toLocaleString()} Up</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="font-medium">{serverStats.downCount.toLocaleString()} Down</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* This div is intentionally left empty because filter categories are now handled differently */}
      
      {/* Hidden - not in the image */}
      
      {/* Hidden - not in the image */}
      
      {/* Filter categories in a single row */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <Button variant="default" className="rounded-md bg-slate-900">All</Button>
        <Button variant="outline" className="rounded-md flex items-center">
          Official <span className="text-amber-500 ml-1">✨</span>
        </Button>
        <Button variant="outline" className="rounded-md">Search</Button>
        <Button variant="outline" className="rounded-md">Web Scraping</Button>
        <Button variant="outline" className="rounded-md">Communication</Button>
        <Button variant="outline" className="rounded-md">Productivity</Button>
        <Button variant="outline" className="rounded-md">Development</Button>
        <Button variant="outline" className="rounded-md">Database</Button>
        <Button variant="outline" className="rounded-md">Cloud Service</Button>
        <Button variant="outline" className="rounded-md">File System</Button>
        <Button variant="outline" className="rounded-md">Cloud Storage</Button>
        <Button variant="outline" className="rounded-md">Version Control</Button>
        <Button variant="outline" className="rounded-md">Other</Button>
      </div>
      
      {/* Server cards in grid - exact match to image */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {/* Card 1 - Brave Search */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Brave Search</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Web and local search using Brave's Search API
            </p>
          </CardContent>
        </Card>
        
        {/* Card 2 - Fetch */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Fetch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Web content fetching and conversion for efficient LLM usage
            </p>
          </CardContent>
        </Card>
        
        {/* Card 3 - Filesystem */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Filesystem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Secure file operations with configurable access controls
            </p>
          </CardContent>
        </Card>
        
        {/* Card 4 - Git */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Git</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Tools to read, search, and manipulate Git repositories
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MCPServers;