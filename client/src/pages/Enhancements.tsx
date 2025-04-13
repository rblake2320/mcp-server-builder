import React, { useState } from "react";
import { Link } from 'wouter';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import PrebuiltServers from '@/components/PrebuiltServers';
import { MCP_PROTOCOL_VERSION, VALIDATION_INFO } from '@/lib/templates';

const ValidationTab = () => (
  <div className="space-y-6">
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">MCP Protocol Validation</h3>
          <p className="text-neutral-600">Ensure your servers meet the protocol specification.</p>
        </div>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          Version {MCP_PROTOCOL_VERSION}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-1">Protocol Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-neutral-50 p-3 rounded">
              <span className="block text-neutral-500 text-xs">Current Version</span>
              <span className="font-medium">{MCP_PROTOCOL_VERSION}</span>
            </div>
            <div className="bg-neutral-50 p-3 rounded">
              <span className="block text-neutral-500 text-xs">Last Verified</span>
              <span className="font-medium">{VALIDATION_INFO.lastVerified}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-1">Compatible With</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {VALIDATION_INFO.compatibleWith.claude.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
            {VALIDATION_INFO.compatibleWith.otherLLMs.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    
    <div className="max-w-3xl mx-auto mt-8">
      <h3 className="text-lg font-semibold mb-3">Testing Your MCP Server</h3>
      <div className="bg-white rounded-lg p-5 border border-neutral-200">
        <p className="mb-3 text-sm">Validate your server against the MCP protocol specification using these tools:</p>
        
        <div className="grid gap-4 mb-4">
          <div className="bg-neutral-50 p-3 rounded">
            <h4 className="font-medium mb-1">Python Server</h4>
            <pre className="text-xs overflow-x-auto p-2 bg-neutral-100 rounded">
              pip install mcp-test-suite
              mcp-test validate --server python server.py --spec mcp-1.2.0
            </pre>
          </div>
          
          <div className="bg-neutral-50 p-3 rounded">
            <h4 className="font-medium mb-1">TypeScript/Node.js Server</h4>
            <pre className="text-xs overflow-x-auto p-2 bg-neutral-100 rounded">
              npm install -g mcp-test-cli
              mcp-test validate --server node server.js --spec mcp-1.2.0
            </pre>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DeploymentTab = () => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
      <h3 className="text-xl font-semibold mb-4">Deployment Options</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-lg mb-2">Local Development</h4>
          <p className="text-sm mb-3">
            Run your MCP server directly on your local machine. This is the simplest option for development and testing.
          </p>
          <div className="bg-neutral-50 p-3 rounded text-sm">
            <h5 className="font-medium mb-1">Python Server</h5>
            <pre className="text-xs bg-neutral-100 p-2 rounded overflow-x-auto">python server.py</pre>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-lg mb-2">Docker Deployment</h4>
          <p className="text-sm mb-3">
            Use Docker for improved isolation and portability. Your generated server includes a Dockerfile ready to use.
          </p>
          <div className="bg-neutral-50 p-3 rounded text-sm">
            <pre className="text-xs bg-neutral-100 p-2 rounded overflow-x-auto">
{`docker build -t your-server-name .
docker run -i --rm your-server-name`}
            </pre>
            <p className="mt-2 text-xs text-neutral-600">
              The -i flag keeps STDIN open for communication with Claude Desktop.
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-lg mb-2">Web Deployment</h4>
          <p className="text-sm mb-3">
            For use with Claude Web and other web-based AI assistants, you can deploy with HTTP adapters.
          </p>
          <div className="bg-neutral-50 p-3 rounded text-sm">
            <pre className="text-xs bg-neutral-100 p-2 rounded overflow-x-auto">
{`# Install the HTTP adapter
npm install -g mcp-http-adapter

# Run your server with the adapter
npx mcp-http-adapter --command "python server.py" --port 8080`}
            </pre>
            <p className="mt-2 text-xs text-neutral-600">
              Your server will be accessible at http://localhost:8080 or your deployed URL.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Enhancements() {
  const [activeTab, setActiveTab] = useState("tools");
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">MCP Server Enhancements</h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          Enhance your MCP server experience with pre-built tools, validation, and deployment options.
          All tools provided here are free and require no signup.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto mb-8">
          <TabsTrigger value="tools">Pre-built Servers</TabsTrigger>
          <TabsTrigger value="validation">Protocol Validation</TabsTrigger>
          <TabsTrigger value="deployment">Deployment Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tools">
          <PrebuiltServers />
        </TabsContent>
        
        <TabsContent value="validation">
          <ValidationTab />
        </TabsContent>
        
        <TabsContent value="deployment">
          <DeploymentTab />
        </TabsContent>
      </Tabs>
      
      <div className="mt-12 flex justify-center">
        <Link href="/builder">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Your Own Server
          </button>
        </Link>
      </div>
    </div>
  );
}
