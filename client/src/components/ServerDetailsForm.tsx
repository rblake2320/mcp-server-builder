import { useState, useEffect } from "react";
import { ServerConfig, ServerType } from "@/types";

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
          <label htmlFor="serverName" className="block text-sm font-medium text-neutral-700 mb-1">Server Name</label>
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
          <label htmlFor="serverType" className="block text-sm font-medium text-neutral-700 mb-1">Server Type</label>
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
          <label htmlFor="serverDescription" className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
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
