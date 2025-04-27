import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Download, ExternalLink, Terminal } from "lucide-react";
import { useState } from "react";

const TerminalTool = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const downloadMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      // Simulate generation/download process
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsGenerating(false);
      
      // In a real implementation, this would download a zip file
      const url = "/api/tools/terminal/download";
      const a = document.createElement("a");
      a.href = url;
      a.download = "mcp-terminal-server.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Terminal Access</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Terminal className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <h2 className="text-xl font-bold mb-2">Terminal Access</h2>
                <p className="text-muted-foreground mb-4">
                  Execute shell commands on the host system
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Features</h3>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                      <li>Run arbitrary shell commands</li>
                      <li>Stream command output</li>
                      <li>Control process termination</li>
                      <li>Environment variable access</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Install Command</h3>
                    <div className="bg-muted p-2 rounded mt-2 font-mono text-sm">
                      npx -y @anthropic-ai/mcp-server-terminal
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                    <Button 
                      onClick={() => downloadMutation.mutate()}
                      disabled={downloadMutation.isPending}
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Package
                    </Button>
                    <Button variant="outline" onClick={() => window.open("/docs/terminal-tool", "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Docs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">Installation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Option 1: Using NPX</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  For a quick start, run this command in your terminal:
                </p>
                <div className="bg-muted p-2 rounded font-mono text-sm">
                  npx -y @anthropic-ai/mcp-server-terminal
                </div>
              </div>
              
              <div>
                <h3 className="font-medium">Option 2: Manual Installation</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Install the package globally:
                </p>
                <div className="bg-muted p-2 rounded font-mono text-sm">
                  npm install -g @anthropic-ai/mcp-server-terminal
                </div>
                <p className="text-sm text-muted-foreground mt-2 mb-2">
                  Then start the server:
                </p>
                <div className="bg-muted p-2 rounded font-mono text-sm">
                  mcp-terminal
                </div>
              </div>
              
              <div>
                <h3 className="font-medium">Option 3: Direct Download</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Download the package from this page and follow the README instructions for manual setup.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => downloadMutation.mutate()}
                  disabled={downloadMutation.isPending}
                  className="mt-2"
                >
                  Download ZIP
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">Connecting to Claude</h2>
            <p className="mb-4">
              After starting the MCP Terminal Server, follow these steps to connect it to Claude:
            </p>
            
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                <strong>Start the MCP Terminal Server</strong> using one of the installation methods above.
                <div className="bg-muted p-2 rounded mt-2 font-mono text-sm">
                  Terminal Server running on: http://localhost:3000
                </div>
              </li>
              
              <li>
                <strong>In Claude Desktop:</strong> Go to Settings &gt; MCP.
              </li>
              
              <li>
                <strong>Add the server:</strong> Click "Add Server" and enter <code>http://localhost:3000</code>
              </li>
              
              <li>
                <strong>Connect and use:</strong> Click "Connect" and start using the terminal tool in your conversations with Claude.
              </li>
            </ol>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Caution:</strong> This tool gives Claude access to your terminal. Only use with trusted content and be mindful of commands executed.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TerminalTool;