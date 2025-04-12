import { Link } from "wouter";
import { GeneratedServer } from "@/types";

interface ResultViewProps {
  generatedServer: GeneratedServer;
  onEditServer: () => void;
  onCreateAnother: () => void;
}

const ResultView = ({ generatedServer, onEditServer, onCreateAnother }: ResultViewProps) => {
  return (
    <div id="resultView" className="bg-white shadow-md rounded-lg p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <i className="fas fa-check text-3xl text-primary-600"></i>
        </div>
        <h2 className="font-heading font-semibold text-2xl text-neutral-800 mb-2">Your MCP Server is Ready!</h2>
        <p className="text-neutral-600">Your MCP server package has been created successfully.</p>
      </div>
      
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
        <h3 className="font-heading font-medium text-lg text-neutral-800 mb-2">Next Steps</h3>
        <ol className="list-decimal list-inside space-y-2 text-neutral-700">
          <li>Download your MCP server package</li>
          <li>Extract the ZIP file to a folder on your computer</li>
          <li>Follow the setup instructions in the README.md file</li>
          <li>Connect your server to Claude Desktop (see instructions below)</li>
        </ol>
      </div>
      
      <div className="mb-6">
        <a 
          href={generatedServer.downloadUrl} 
          className="w-full flex items-center justify-center px-4 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          download={`${generatedServer.serverName.replace(/\s+/g, '-').toLowerCase()}-mcp-server.zip`}
        >
          <i className="fas fa-download mr-2"></i> Download Server Package
        </a>
      </div>
      
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <h3 className="font-heading font-medium text-lg text-neutral-800 mb-2">Connecting to Claude Desktop</h3>
        <div className="space-y-3 text-neutral-700 text-sm">
          <p>1. Open Claude Desktop</p>
          <p>2. Go to Settings and navigate to the MCP section</p>
          <p>3. Click "Add Server"</p>
          <p>4. Configure the server:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Name: Enter a name for your server</li>
              <li>Type: Select "command"</li>
              <li>Command: Enter the command to run your server
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>For Python: <code className="bg-neutral-200 px-1 py-0.5 rounded">python /path/to/your/server.py</code></li>
                  <li>For TypeScript: <code className="bg-neutral-200 px-1 py-0.5 rounded">node /path/to/your/server.js</code></li>
                </ul>
              </li>
            </ul>
          </p>
          <p>5. Save the configuration and restart Claude Desktop</p>
        </div>
      </div>
      
      <div className="flex justify-center mt-6">
        <button 
          onClick={onEditServer}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <i className="fas fa-pen mr-2"></i> Edit Server
        </button>
        <button 
          onClick={onCreateAnother}
          className="ml-4 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <i className="fas fa-plus mr-2"></i> Create Another Server
        </button>
      </div>
    </div>
  );
};

export default ResultView;
