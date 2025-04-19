import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, HardDrive, Terminal, Code } from "lucide-react";

interface PrebuiltServerProps {
  title: string;
  description: string;
  installCommand: string;
  features: string[];
  icon: React.ReactNode;
  type: 'official' | 'community';
}

const PrebuiltServerCard: React.FC<PrebuiltServerProps> = ({ 
  title, 
  description, 
  installCommand, 
  features, 
  icon,
  type
}) => (
  <Card className="overflow-hidden transition-all hover:shadow-md">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="mr-3 bg-primary/10 p-2 rounded-md">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
        <Badge variant={type === 'official' ? "default" : "outline"}>
          {type === 'official' ? 'Official' : 'Community'}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="mt-2">
        <h4 className="text-sm font-medium mb-2">Features</h4>
        <ul className="text-sm space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Install Command</h4>
        <div className="bg-neutral-50 p-2 rounded text-sm font-mono overflow-x-auto">
          {installCommand}
        </div>
      </div>
    </CardContent>
    <CardFooter className="pt-2 flex justify-between">
      <Button variant="outline" size="sm" className="text-xs">
        View Docs
      </Button>
      <Button variant="default" size="sm" className="text-xs">
        Add to Project
      </Button>
    </CardFooter>
  </Card>
);

const PrebuiltServers = () => {
  const servers: PrebuiltServerProps[] = [
    {
      title: "Filesystem Server",
      description: "Access and manipulate files on the host system",
      installCommand: "npx -y @anthropic-ai/mcp-server-filesystem",
      features: [
        "Read and write files",
        "List directory contents",
        "Create and delete directories",
        "Check file existence and permissions"
      ],
      icon: <FileText className="h-5 w-5 text-primary" />,
      type: 'official'
    },
    {
      title: "Memory Storage",
      description: "In-memory key-value storage for AI session persistence",
      installCommand: "npx -y @anthropic-ai/mcp-server-memory",
      features: [
        "Store and retrieve data across conversations",
        "Set expiration for stored values",
        "List all stored keys",
        "Clear specific keys or entire storage"
      ],
      icon: <HardDrive className="h-5 w-5 text-primary" />,
      type: 'official'
    },
    {
      title: "Terminal Access",
      description: "Execute shell commands on the host system",
      installCommand: "npx -y @anthropic-ai/mcp-server-terminal",
      features: [
        "Run arbitrary shell commands",
        "Stream command output",
        "Control process termination",
        "Environment variable access"
      ],
      icon: <Terminal className="h-5 w-5 text-primary" />,
      type: 'official'
    },
    {
      title: "Code Interpreter",
      description: "Execute and interpret code in various languages",
      installCommand: "npx -y @anthropic-ai/mcp-server-code-interpreter",
      features: [
        "Execute Python, JavaScript, and more",
        "Isolated execution environment",
        "Image and chart generation",
        "Package installation support"
      ],
      icon: <Code className="h-5 w-5 text-primary" />,
      type: 'community'
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Pre-built MCP Servers</h2>
        <p className="text-neutral-600">
          Ready-to-use MCP servers that provide common functionality. These can be used standalone or combined with your custom server.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servers.map((server, index) => (
          <PrebuiltServerCard key={index} {...server} />
        ))}
      </div>
      
      <div className="mt-10 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-start">
          <Code className="h-6 w-6 text-primary mr-3 mt-1" />
          <div>
            <h3 className="font-medium mb-1">Tip: Combine Multiple Servers</h3>
            <p className="text-sm text-neutral-600">
              Claude can use multiple MCP servers at once. Configure your Claude Desktop settings.json to include multiple servers
              under different names, and Claude will have access to all their tools simultaneously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrebuiltServers;
