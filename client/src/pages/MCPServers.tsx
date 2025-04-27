import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Download, FileCode, Github, Copy, Server, Loader2, Cloud, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TwentyfirstServers } from "@/components/TwentyfirstServers";
import DeploymentSelector from "@/components/DeploymentSelector";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "@/hooks/use-toast";

// Define types for our server index
interface MCPServer {
  id: string | number;
  name: string;
  path: string;
  language: string;
  description: string;
  difficulty?: string;
  category?: string;
  dependencies?: string[];
  tools?: string[];
  type?: string;
  status?: string;
  author?: string;
  source?: string;
  tags?: string[];
  requires_api_key?: boolean;
  api_provider?: string;
}

interface ServerResponse {
  servers: MCPServer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    types: string[];
    languages: string[];
    categories: string[];
    difficulties: string[];
  };
}

interface ServerStats {
  totalCount: number;
  upCount: number;
  downCount: number;
}

const MCPServers = () => {
  // Pagination and filtering state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterLanguage, setFilterLanguage] = useState<string | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [filterDifficulty, setFilterDifficulty] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // React Query for fetching servers with pagination and filtering
  const { data: serverData, isLoading, error } = useQuery<ServerResponse>({
    queryKey: [
      '/api/mcp-servers', 
      page, 
      limit, 
      sortBy, 
      sortDirection, 
      filterType, 
      filterLanguage, 
      filterCategory, 
      filterDifficulty, 
      searchQuery
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortDirection
      });
      
      if (filterType) params.append('type', filterType);
      if (filterLanguage) params.append('language', filterLanguage);
      if (filterCategory) params.append('category', filterCategory);
      if (filterDifficulty) params.append('difficulty', filterDifficulty);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/mcp-servers?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return response.json();
    }
  });
  
  // React Query for server stats
  const { data: serverStats } = useQuery<ServerStats>({
    queryKey: ['/api/mcp-servers/stats'],
    queryFn: async () => {
      const response = await fetch('/api/mcp-servers/stats');
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });
  
  // State for server details
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [serverCode, setServerCode] = useState<string>("");
  const [codeLoading, setCodeLoading] = useState(false);
  
  // Import server from URL
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  // State for deployment
  const [buildId, setBuildId] = useState<string | null>(null);
  const [serverType, setServerType] = useState<string>("javascript");
  const [showDeployment, setShowDeployment] = useState<boolean>(false);
  
  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle sorting change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle direction if clicking on the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set to ascending by default for a new field
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string | undefined) => {
    switch (filterType) {
      case 'type':
        setFilterType(value);
        break;
      case 'language':
        setFilterLanguage(value);
        break;
      case 'category':
        setFilterCategory(value);
        break;
      case 'difficulty':
        setFilterDifficulty(value);
        break;
      default:
        break;
    }
    // Reset to first page when changing filters
    setPage(1);
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setPage(1);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterType(undefined);
    setFilterLanguage(undefined);
    setFilterCategory(undefined);
    setFilterDifficulty(undefined);
    setSearchQuery('');
    setSortBy('name');
    setSortDirection('asc');
    setPage(1);
  };
  
  // Handle downloading a server
  const handleDownload = async (server: MCPServer) => {
    try {
      // First get the build ID from the API
      const response = await fetch(`/api/mcp-servers/build/${server.path}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // If we have a build ID, enable deployment options
        if (data.buildId) {
          setBuildId(data.buildId);
          setServerType(server.language || 'javascript');
          setShowDeployment(true);
        }
      }
      
      // Trigger download using our API endpoint
      window.location.href = `/api/mcp-servers/download/${server.path}`;
      
      toast({
        title: "Download started",
        description: `${server.name} is being downloaded`,
      });
    } catch (error) {
      console.error("Error preparing for deployment:", error);
      
      // Still trigger the download even if deployment prep fails
      window.location.href = `/api/mcp-servers/download/${server.path}`;
      
      toast({
        title: "Download started",
        description: "Server is being downloaded, but deployment options may be limited",
        variant: "destructive"
      });
    }
  };
  
  // Copy code to clipboard
  const handleCopyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Code has been copied to your clipboard"
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard",
        variant: "destructive"
      });
    });
  };
  
  // View server code
  const handleViewCode = async (server: MCPServer) => {
    try {
      setSelectedServer(server);
      setCodeLoading(true);
      
      // Fetch the server code from the API
      const response = await fetch(`/api/mcp-servers/server/${server.path}`);
      
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
      
      toast({
        title: "Failed to load code",
        description: "There was an error loading the server code",
        variant: "destructive"
      });
    }
  };
  
  // Get CSS classes for difficulty levels
  const getDifficultyColor = (difficulty: string = '') => {
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
  
  // Get CSS classes for programming languages
  const getLanguageColor = (language: string = '') => {
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
  
  // Get status color (up/down)
  const getStatusColor = (status: string = '') => {
    return status.toLowerCase() === 'up' ? "bg-green-500" : "bg-red-500";
  };
  
  // Import a server from URL
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
      
      // Close dialog and reset form
      setImportDialogOpen(false);
      setImportUrl('');
      
      toast({
        title: "Server imported successfully",
        description: "The server has been added to your collection"
      });
    } catch (error) {
      console.error('Error importing server:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import server');
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : 'Failed to import server',
        variant: "destructive"
      });
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
      
      {/* Search and filtering section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search input */}
          <div className="w-full md:w-1/3">
            <form onSubmit={handleSearch} className="relative">
              <Input
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 w-full md:w-2/3">
            {/* Type filter */}
            {serverData?.filters?.types && (
              <Select 
                value={filterType || 'all'} 
                onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {serverData.filters.types.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Language filter */}
            {serverData?.filters?.languages && (
              <Select 
                value={filterLanguage || 'all'} 
                onValueChange={(value) => handleFilterChange('language', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {serverData.filters.languages.map(language => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Category filter */}
            {serverData?.filters?.categories && (
              <Select 
                value={filterCategory || 'all'} 
                onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {serverData.filters.categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Difficulty filter */}
            {serverData?.filters?.difficulties && (
              <Select 
                value={filterDifficulty || 'all'} 
                onValueChange={(value) => handleFilterChange('difficulty', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {serverData.filters.difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Reset filters button */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={resetFilters}
              title="Reset all filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Active filter pills */}
        {(filterType || filterLanguage || filterCategory || filterDifficulty || searchQuery) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filterType && (
              <Badge variant="outline" className="flex items-center gap-1">
                Type: {filterType}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 ml-1" 
                  onClick={() => handleFilterChange('type', undefined)}
                >
                  ✕
                </Button>
              </Badge>
            )}
            
            {filterLanguage && (
              <Badge variant="outline" className="flex items-center gap-1">
                Language: {filterLanguage}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 ml-1" 
                  onClick={() => handleFilterChange('language', undefined)}
                >
                  ✕
                </Button>
              </Badge>
            )}
            
            {filterCategory && (
              <Badge variant="outline" className="flex items-center gap-1">
                Category: {filterCategory}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 ml-1" 
                  onClick={() => handleFilterChange('category', undefined)}
                >
                  ✕
                </Button>
              </Badge>
            )}
            
            {filterDifficulty && (
              <Badge variant="outline" className="flex items-center gap-1">
                Difficulty: {filterDifficulty}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 ml-1" 
                  onClick={() => handleFilterChange('difficulty', undefined)}
                >
                  ✕
                </Button>
              </Badge>
            )}
            
            {searchQuery && (
              <Badge variant="outline" className="flex items-center gap-1">
                Search: {searchQuery}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 ml-1" 
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading servers...</span>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="text-center py-10">
          <p className="text-destructive text-lg mb-4">Failed to load servers</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}
      
      {/* Results count */}
      {!isLoading && !error && serverData && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {serverData.servers.length} of {serverData.pagination.total} servers
        </div>
      )}
      
      {/* Server cards grid */}
      {!isLoading && !error && serverData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {serverData.servers.map((server) => (
            <Card key={server.id} className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{server.name}</CardTitle>
                  {server.status && (
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`} 
                         title={`Status: ${server.status}`} />
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {server.language && (
                    <Badge variant="secondary" className={getLanguageColor(server.language)}>
                      {server.language}
                    </Badge>
                  )}
                  {server.type && (
                    <Badge variant="outline">
                      {server.type}
                    </Badge>
                  )}
                  {server.difficulty && (
                    <Badge className={getDifficultyColor(server.difficulty)}>
                      {server.difficulty}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-2 h-10">
                  {server.description}
                </p>
                
                {server.tools && server.tools.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Tools:</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(server.tools) 
                        ? server.tools.slice(0, 3).map((tool, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {typeof tool === 'string' ? tool : 'tool'}
                            </Badge>
                          ))
                        : null
                      }
                      {Array.isArray(server.tools) && server.tools.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{server.tools.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewCode(server)}
                  className="text-xs"
                >
                  <FileCode className="h-3 w-3 mr-1" />
                  View Code
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => handleDownload(server)}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!isLoading && !error && serverData && serverData.pagination.totalPages > 1 && (
        <Pagination className="my-8">
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
              </PaginationItem>
            )}
            
            {[...Array(Math.min(5, serverData.pagination.totalPages))].map((_, i) => {
              const pageNumber = i + 1;
              return (
                <PaginationItem key={i}>
                  <PaginationLink 
                    isActive={pageNumber === page}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {serverData.pagination.totalPages > 5 && page < 3 && (
              <>
                <PaginationItem>
                  <div className="px-4 py-2 text-sm text-muted-foreground">...</div>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink 
                    onClick={() => handlePageChange(serverData.pagination.totalPages)}
                  >
                    {serverData.pagination.totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            {serverData.pagination.totalPages > 5 && page >= 3 && page <= serverData.pagination.totalPages - 2 && (
              <>
                <PaginationItem>
                  <div className="px-4 py-2 text-sm text-muted-foreground">...</div>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink 
                    onClick={() => handlePageChange(page)}
                    isActive={true}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <div className="px-4 py-2 text-sm text-muted-foreground">...</div>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink 
                    onClick={() => handlePageChange(serverData.pagination.totalPages)}
                  >
                    {serverData.pagination.totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            {serverData.pagination.totalPages > 5 && page > serverData.pagination.totalPages - 2 && (
              <>
                <PaginationItem>
                  <div className="px-4 py-2 text-sm text-muted-foreground">...</div>
                </PaginationItem>
              </>
            )}
            
            {page < serverData.pagination.totalPages && (
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
      {/* Code viewer dialog */}
      <Dialog open={selectedServer !== null} onOpenChange={(open) => !open && setSelectedServer(null)}>
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
              <Copy className="h-4 w-4 mr-1" />
              Copy Code
            </Button>
            <Button onClick={() => selectedServer && handleDownload(selectedServer)}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MCPServers;