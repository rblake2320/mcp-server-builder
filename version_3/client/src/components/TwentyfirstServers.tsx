import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MagicMCPServer {
  id: string;
  name: string;
  description: string;
  tools: any[];
  status: string;
  author: string;
  lastUpdated: string;
}

export function TwentyfirstServers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  // Query to fetch 21st.dev MCP servers
  const {
    data: servers = [],
    isLoading,
    error,
  } = useQuery<MagicMCPServer[]>({
    queryKey: ['/api/twentyfirst/mcp-servers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/twentyfirst/mcp-servers');
      return await res.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Mutation for importing a server
  const importMutation = useMutation({
    mutationFn: async (serverId: string) => {
      const res = await apiRequest('POST', `/api/twentyfirst/import/${serverId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Successfully imported "${data.server.name}" from 21st.dev`,
      });
      
      // Invalidate the MCPServers cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/mcp-servers'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import server from 21st.dev',
        variant: 'destructive',
      });
    },
  });

  if (error) {
    // Check if it's an API key error
    const isApiKeyError = error instanceof Error && 
      error.message.includes('TWENTYFIRST_API_KEY not configured');
    
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <span className="mr-2">21st.dev Magic MCP Servers</span>
            <Badge variant="outline" className="ml-2">Integration</Badge>
          </CardTitle>
          <CardDescription>Access high-quality MCP servers from 21st.dev's Magic platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-md border text-center">
            {isApiKeyError ? (
              <>
                <p className="font-medium mb-2">API Key Not Configured</p>
                <p className="text-sm text-muted-foreground">
                  To access 21st.dev Magic MCP servers, please add your TWENTYFIRST_API_KEY to the environment variables.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium mb-2">Error Loading Servers</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'Failed to load servers from 21st.dev'}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <span className="mr-2">21st.dev Magic MCP Servers</span>
          <Badge variant="outline" className="ml-2">Integration</Badge>
        </CardTitle>
        <CardDescription>Access high-quality MCP servers from 21st.dev's Magic platform</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : servers.length === 0 ? (
          <div className="p-4 bg-muted/50 rounded-md border text-center">
            <p className="font-medium">No Servers Available</p>
            <p className="text-sm text-muted-foreground mt-1">
              There are currently no MCP servers available from 21st.dev.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {servers.map((server) => (
              <Card key={server.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg">{server.name}</CardTitle>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {server.tools?.length || 0} tools
                    </Badge>
                    {server.status && (
                      <Badge variant={server.status === 'verified' ? 'default' : 'outline'} className="text-xs">
                        {server.status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {server.description}
                  </p>
                  {expandedServer === server.id && (
                    <div className="mt-2 text-sm">
                      <div className="mt-2">
                        <p className="font-medium text-xs">Author</p>
                        <p className="text-muted-foreground">{server.author || '21st.dev'}</p>
                      </div>
                      <div className="mt-2">
                        <p className="font-medium text-xs">Last Updated</p>
                        <p className="text-muted-foreground">{server.lastUpdated || 'Unknown'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedServer(expandedServer === server.id ? null : server.id)}
                  >
                    {expandedServer === server.id ? 'Less Info' : 'More Info'}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => importMutation.mutate(server.id)}
                      disabled={importMutation.isPending && importMutation.variables === server.id}
                    >
                      {importMutation.isPending && importMutation.variables === server.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Import
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Powered by 21st.dev Magic MCP technology
        </p>
        <Button 
          variant="outline" 
          size="sm"
          asChild
        >
          <a 
            href="https://21st.dev/magic" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center"
          >
            Visit 21st.dev <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}