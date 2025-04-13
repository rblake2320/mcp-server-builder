import { Link } from "wouter";
import { GeneratedServer } from "@/types";
import { CheckCircle2 } from "lucide-react";

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
      
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
        <h3 className="font-heading font-medium text-lg text-neutral-800 mb-2">Connect to AI Assistants</h3>
        <div className="space-y-4 text-neutral-700 text-sm">
          <div className="mb-3">
            <h4 className="font-medium mb-1">Claude Desktop</h4>
            <p className="mb-2">Claude Desktop requires manual configuration file editing:</p>
            
            <div className="mb-2">
              <h5 className="font-medium text-xs">1. Locate Configuration File:</h5>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>macOS: <code className="bg-neutral-200 px-1 py-0.5 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                <li>Windows: <code className="bg-neutral-200 px-1 py-0.5 rounded">%APPDATA%\Claude\claude_desktop_config.json</code></li>
              </ul>
            </div>
            
            <div className="mb-2">
              <h5 className="font-medium text-xs">2. Edit JSON File:</h5>
              <p className="mb-1">Add the following to your configuration:</p>
              <pre className="bg-neutral-200 p-2 rounded text-xs font-mono overflow-auto max-h-32">
{`{
  "mcpServers": {
    "${generatedServer.serverName.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "${isTypescript ? 'node' : 'python'}",
      "args": ["/absolute/path/to/server.${isTypescript ? 'js' : 'py'}"]
    }
  }
}`}
              </pre>
            </div>
            
            <div className="mb-2">
              <h5 className="font-medium text-xs">3. Docker Alternative (Recommended):</h5>
              <p className="mb-1">For better isolation, use Docker:</p>
              <pre className="bg-neutral-200 p-2 rounded text-xs font-mono overflow-auto max-h-32">
{`# Build the Docker image
docker build -t ${generatedServer.serverName.toLowerCase().replace(/\s+/g, '-')} /path/to/extracted/folder

# Add to claude_desktop_config.json
{
  "mcpServers": {
    "${generatedServer.serverName.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "${generatedServer.serverName.toLowerCase().replace(/\s+/g, '-')}"]
    }
  }
}`}
              </pre>
            </div>
            
            <div>
              <h5 className="font-medium text-xs">4. Restart Claude Desktop</h5>
              <p>Close and reopen Claude Desktop to apply changes.</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Claude Web or Other Assistants</h4>
            <p className="mb-1">Install the HTTP adapter to expose your server via API:</p>
            <pre className="bg-neutral-200 p-2 rounded text-xs font-mono">
{isTypescript 
  ? `# Install the adapter
npm install -g mcp-http-adapter

# Run the adapter
npx mcp-http-adapter --command "node /path/to/server.js" --port 8080` 
  : `# Install the adapter
pip install mcp-http-adapter

# Run the adapter
mcp-http-adapter --command "python /path/to/server.py" --port 8080`}
            </pre>
            <p className="mt-1">This creates an HTTP endpoint at <code className="bg-neutral-200 px-1 py-0.5 rounded">http://localhost:8080</code> that you can reference in web-based assistants.</p>
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
