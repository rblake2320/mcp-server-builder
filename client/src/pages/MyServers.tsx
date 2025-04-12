import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Server } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Download, Edit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MyServers() {
  const { data: servers, isLoading, error } = useQuery<Server[]>({
    queryKey: ["/api/my-servers"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Servers</h1>
          <p className="mb-6">{error.message}</p>
          <Link href="/builder">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create a New Server
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My MCP Servers</h1>
        <Link href="/builder">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Server
          </Button>
        </Link>
      </div>

      {servers && servers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <Card key={server.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{server.serverName}</CardTitle>
                    <CardDescription className="mt-1">
                      {server.description}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={server.serverType === 'python' ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {server.serverType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mt-2">
                  <div className="text-sm text-neutral-500">
                    Created: {new Date(server.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Tools:</h4>
                    <div className="space-y-1">
                      {Array.isArray(server.tools) ? 
                        server.tools.map((tool: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            • {tool.name}
                          </div>
                        )) : 
                        <div className="text-sm italic text-neutral-500">
                          Tool data not available
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <a href={`/api/download/${server.buildId}`} download>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
                <Link href={`/builder?id=${server.buildId}`}>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-neutral-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">No servers found</h2>
          <p className="mb-6 text-neutral-600">
            You haven't created any MCP servers yet. Start building your first server now!
          </p>
          <Link href="/builder">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Server
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}