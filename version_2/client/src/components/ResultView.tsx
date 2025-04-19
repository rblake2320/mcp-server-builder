import { Link } from "wouter";
import { GeneratedServer } from "@/types";
import { CheckCircle2 } from "lucide-react";
import DeploymentOptions from "./DeploymentOptions";

interface ResultViewProps {
  generatedServer: GeneratedServer;
  onEditServer: () => void;
  onCreateAnother: () => void;
}

const ResultView = ({ generatedServer, onEditServer, onCreateAnother }: ResultViewProps) => {
  const isTypescript = generatedServer.serverType === 'typescript';

  return (
    <div id="resultView" className="bg-white shadow-md rounded-lg p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="font-heading font-semibold text-2xl text-neutral-800 mb-2">Success!</h2>
        <p className="text-neutral-600">Your MCP server has been created successfully!</p>
      </div>
      
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
        <h3 className="font-heading font-medium text-lg text-neutral-800 mb-2">Next Steps</h3>
        <ol className="list-decimal list-inside space-y-2 text-neutral-700">
          <li>Download your MCP server package</li>
          <li>Extract the ZIP file to a folder on your computer</li>
          <li>Run the installation script: <code className="bg-neutral-200 px-1 py-0.5 rounded">./install.sh</code></li>
          <li>Start your server using the instructions in README.md</li>
        </ol>
      </div>
      
      <div className="mb-6">
        <a 
          href={generatedServer.downloadUrl} 
          className="w-full flex items-center justify-center px-4 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          download={`${generatedServer.serverName.replace(/\s+/g, '-').toLowerCase()}-mcp-server.zip`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Server Package
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <h3 className="font-heading font-medium text-lg text-neutral-800 mb-2">Key Features</h3>
          <ul className="list-disc list-inside space-y-1 text-neutral-700 text-sm">
            <li>Parameter validation with {isTypescript ? 'Zod' : 'Pydantic'}</li>
            <li>Robust error handling</li>
            <li>Authentication support</li>
            <li>Docker configuration</li>
            <li>API documentation</li>
            <li>Test suite setup</li>
          </ul>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <h3 className="font-heading font-medium text-lg text-neutral-800 mb-2">Included Files</h3>
          <ul className="list-disc list-inside space-y-1 text-neutral-700 text-sm">
            <li><span className="font-medium">server.{isTypescript ? 'js' : 'py'}</span> - The MCP server implementation</li>
            <li><span className="font-medium">Dockerfile</span> - For containerization</li>
            <li><span className="font-medium">install.sh</span> - Setup script</li>
            <li><span className="font-medium">README.md</span> - Documentation</li>
            {isTypescript && <li><span className="font-medium">package.json</span> - Dependencies configuration</li>}
            {!isTypescript && <li><span className="font-medium">requirements.txt</span> - Dependencies list</li>}
          </ul>
        </div>
      </div>
      
      {/* Cloud Deployment Options */}
      <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 mb-6">
        <DeploymentOptions buildId={generatedServer.buildId} serverName={generatedServer.serverName} />
      </div>

      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
        <h3 className="font-heading font-medium text-lg text-neutral-800 mb-2">Setting Up With AI Assistants</h3>
        
        <div className="mb-4 pb-3 border-b border-neutral-200">
          <h4 className="font-medium mb-2 text-primary">Step 1: Extract & Install Your MCP Server</h4>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700 text-sm pl-2">
            <li>Extract the downloaded ZIP file to a folder on your computer</li>
            <li>Open a terminal/command prompt in the extracted folder</li>
            <li>Run the included setup script: <code className="bg-neutral-200 px-1 py-0.5 rounded">./install.sh</code></li>
          </ol>
        </div>
        
        <div className="space-y-5 text-neutral-700 text-sm">
          <div className="p-3 bg-neutral-100 rounded-md">
            <h4 className="font-medium mb-2 flex items-center text-base">
              <svg viewBox="0 0 168 168" className="w-5 h-5 mr-1 inline-block" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M50.4,120.54c0,6.47,5.25,11.72,11.72s11.72-5.25,11.72-11.72H50.4z"/>
                <path d="M84,36c-12.14,0-22,9.86-22,22v28h44V58C106,45.86,96.14,36,84,36z"/>
                <path d="M94.4,120.54c0,6.47,5.25,11.72,11.72,11.72c6.47,0,11.72-5.25,11.72-11.72H94.4z"/>
              </svg>
              Claude Desktop &amp; Cursor Setup
            </h4>
            
            <div className="rounded-md bg-white p-3 shadow-sm mb-3">
              <h5 className="font-medium mb-1 text-neutral-700">Option 1: Direct Configuration</h5>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>
                  <span className="font-medium">Locate config file:</span>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>macOS: <code className="bg-neutral-200 px-1 py-0.5 rounded text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                    <li>Windows: <code className="bg-neutral-200 px-1 py-0.5 rounded text-xs">%APPDATA%\Claude\claude_desktop_config.json</code></li>
                  </ul>
                </li>
                <li>
                  <span className="font-medium">Add the following to your configuration:</span>
                  <pre className="bg-neutral-200 p-2 rounded text-xs font-mono overflow-auto max-h-24 mt-1">
{`{
  "mcpServers": {
    "${generatedServer.serverName.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "${isTypescript ? 'node' : 'python'}",
      "args": ["/absolute/path/to/extracted/folder/server.${isTypescript ? 'js' : 'py'}"]
    }
  }
}`}
                  </pre>
                </li>
                <li><span className="font-medium">Restart Claude Desktop</span> to apply changes</li>
              </ol>
            </div>
            
            <div className="rounded-md bg-white p-3 shadow-sm">
              <h5 className="font-medium mb-1 text-neutral-700">Option 2: Docker Setup (Recommended)</h5>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>
                  <span className="font-medium">Build the Docker image:</span>
                  <pre className="bg-neutral-200 p-1 rounded text-xs font-mono mt-1">docker build -t ${generatedServer.serverName.toLowerCase().replace(/\s+/g, '-')} /path/to/extracted/folder</pre>
                </li>
                <li>
                  <span className="font-medium">Add to claude_desktop_config.json:</span>
                  <pre className="bg-neutral-200 p-2 rounded text-xs font-mono overflow-auto max-h-24 mt-1">
{`{
  "mcpServers": {
    "${generatedServer.serverName.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "${generatedServer.serverName.toLowerCase().replace(/\s+/g, '-')}"]
    }
  }
}`}
                  </pre>
                </li>
                <li><span className="font-medium">Restart Claude Desktop</span> to apply changes</li>
              </ol>
            </div>
            
            <div className="rounded-md bg-white p-3 shadow-sm mt-3">
              <h5 className="font-medium mb-1 text-neutral-700">Option 3: Cursor IDE Setup</h5>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>
                  <span className="font-medium">Locate Cursor config file:</span>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>macOS: <code className="bg-neutral-200 px-1 py-0.5 rounded text-xs">~/Library/Application Support/Cursor/cursor_config.json</code></li>
                    <li>Windows: <code className="bg-neutral-200 px-1 py-0.5 rounded text-xs">%APPDATA%\Cursor\cursor_config.json</code></li>
                    <li>Linux: <code className="bg-neutral-200 px-1 py-0.5 rounded text-xs">~/.config/Cursor/cursor_config.json</code></li>
                  </ul>
                </li>
                <li>
                  <span className="font-medium">Add the following to your configuration:</span>
                  <pre className="bg-neutral-200 p-2 rounded text-xs font-mono overflow-auto max-h-24 mt-1">
{`{
  "mcpServers": {
    "${generatedServer.serverName.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "${isTypescript ? 'node' : 'python'}",
      "args": ["/absolute/path/to/extracted/folder/server.${isTypescript ? 'js' : 'py'}"]
    }
  }
}`}
                  </pre>
                </li>
                <li><span className="font-medium">Restart Cursor IDE</span> to apply changes</li>
              </ol>
            </div>
          </div>
          
          <div className="p-3 bg-neutral-100 rounded-md">
            <h4 className="font-medium mb-2 flex items-center text-base">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-1 inline-block">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Claude Web & Other AI Assistants
            </h4>
            
            <div className="rounded-md bg-white p-3 shadow-sm">
              <p className="mb-2">Install the HTTP adapter to expose your server via an API endpoint:</p>
              
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>
                  <span className="font-medium">Install the MCP HTTP adapter:</span>
                  <pre className="bg-neutral-200 p-1 rounded text-xs font-mono mt-1">
{isTypescript ? "npm install -g mcp-http-adapter" : "pip install mcp-http-adapter"}
                  </pre>
                </li>
                <li>
                  <span className="font-medium">Start the adapter:</span>
                  <pre className="bg-neutral-200 p-1 rounded text-xs font-mono mt-1">
{isTypescript 
  ? `npx mcp-http-adapter --command "node /path/to/extracted/folder/server.js" --port 8080` 
  : `mcp-http-adapter --command "python /path/to/extracted/folder/server.py" --port 8080`}
                  </pre>
                </li>
                <li>
                  <span className="font-medium">Use the HTTP endpoint</span> <code className="bg-neutral-200 px-1 py-0.5 rounded text-xs">http://localhost:8080</code> in web-based assistants
                </li>
              </ol>
              
              <div className="mt-3 pt-2 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 italic">Note: The adapter translates between HTTP and the MCP protocol, allowing web-based AI assistants to use your MCP server.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4 mt-6">
        <button 
          onClick={onEditServer}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Server
        </button>
        <button 
          onClick={onCreateAnother}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Another Server
        </button>
      </div>
    </div>
  );
};

export default ResultView;
