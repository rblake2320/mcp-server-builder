import { useState, useEffect } from "react";
import { ServerConfig, ServerType } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ServerDetailsFormProps {
  serverConfig: ServerConfig;
  onConfigChange: (config: Partial<ServerConfig>) => void;
}

const ServerDetailsForm = ({ serverConfig, onConfigChange }: ServerDetailsFormProps) => {
  const [name, setName] = useState(serverConfig.serverName);
  const [type, setType] = useState<ServerType>(serverConfig.serverType);
  const [description, setDescription] = useState(serverConfig.description);

  // Update parent component when form values change
  useEffect(() => {
    onConfigChange({
      serverName: name,
      serverType: type,
      description: description
    });
  }, [name, type, description, onConfigChange]);

  return (
    <div id="serverDetails" className="mb-8">
      <h2 className="font-heading font-semibold text-xl text-neutral-800 mb-4">Server Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-1">
            <label htmlFor="serverName" className="block text-sm font-medium text-neutral-700">Server Name</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <HelpCircle className="h-4 w-4 text-neutral-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">The name of your MCP server that will be used in generated code and documentation. Choose something descriptive and relevant to its function.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <input 
            type="text" 
            id="serverName" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
            placeholder="e.g., Weather Data Provider"
          />
          <p className="mt-1 text-sm text-neutral-500">Choose a descriptive name for your MCP server</p>
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label htmlFor="serverType" className="block text-sm font-medium text-neutral-700">Server Type</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <HelpCircle className="h-4 w-4 text-neutral-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">The programming language your MCP server will be implemented in. Python is generally easier for beginners, while TypeScript (Node.js) may offer better performance for complex applications.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <select 
            id="serverType" 
            value={type}
            onChange={(e) => setType(e.target.value as ServerType)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="python">Python</option>
            <option value="typescript">TypeScript (Node.js)</option>
          </select>
          <p className="mt-1 text-sm text-neutral-500">Select the technology for your server implementation</p>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center mb-1">
            <label htmlFor="serverDescription" className="block text-sm font-medium text-neutral-700">Description</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <HelpCircle className="h-4 w-4 text-neutral-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">A clear description of your server's purpose and capabilities. This helps Claude and other AI assistants understand when and how to use the tools provided by your server.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <textarea 
            id="serverDescription" 
            rows={3} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
            placeholder="Describe what your server does"
          />
          <p className="mt-1 text-sm text-neutral-500">Explain what your MCP server does (helps AI understand its purpose)</p>
        </div>
      </div>
    </div>
  );
};

export default ServerDetailsForm;
