import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Documentation = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="font-heading font-semibold text-3xl text-neutral-900">Documentation</h1>
        <p className="mt-2 text-neutral-600">Learn how to use the MCP Server Builder and deploy your servers</p>
      </div>

      <Tabs defaultValue="overview" className="mb-10">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="builder">Using the Builder</TabsTrigger>
          <TabsTrigger value="deployment" id="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="examples" id="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">What is MCP?</h2>
              <p className="mb-4">Model Context Protocol (MCP) is an open standard that allows AI systems to securely connect with external data sources and tools. Think of it like a USB port for AI - it provides a standardized way for AI assistants to access and use tools outside of their core capabilities.</p>
              
              <h2 className="text-2xl font-semibold mb-4 mt-8">Why Use MCP Server Builder?</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>No coding required</strong>: Create powerful MCP servers through a simple interface</li>
                <li><strong>Full customization</strong>: Define exactly what tools and capabilities you want to provide</li>
                <li><strong>Easy deployment</strong>: Simple installation process with clear instructions</li>
                <li><strong>Works with Claude</strong>: Seamlessly connects with Claude Desktop and other MCP-compatible AI assistants</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">Using the MCP Server Builder</h2>
              
              <h3 className="text-xl font-semibold mb-2 mt-6">Step 1: Basic Server Configuration</h3>
              <p className="mb-4">Start by providing some basic information about your MCP server:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Server Name</strong>: Enter a descriptive name for your MCP server (e.g., "Weather Data Provider")</li>
                <li><strong>Description</strong>: Write a brief description explaining what your server does</li>
                <li><strong>Server Type</strong>: Choose between Python or TypeScript implementation</li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-2 mt-6">Step 2: Define Your Tools</h3>
              <p className="mb-4">Tools are the functions that your MCP server will expose to AI assistants. Each tool represents a specific capability your server will provide.</p>
              <p className="mb-4">For each tool:</p>
              <ol className="list-decimal pl-6 space-y-2 mb-4">
                <li>Click the "Add Tool" button</li>
                <li>Fill in the tool details:
                  <ul className="list-disc pl-6 mt-2">
                    <li><strong>Tool Name</strong>: Give your tool a descriptive name (e.g., "get_weather_forecast")</li>
                    <li><strong>Description</strong>: Explain what the tool does - this helps the AI understand when to use it</li>
                  </ul>
                </li>
                <li>Define the parameters your tool will accept:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Click "Add Parameter" for each input your tool needs</li>
                    <li>For each parameter, specify the name, type, and description</li>
                  </ul>
                </li>
              </ol>
              
              <h3 className="text-xl font-semibold mb-2 mt-6">Step 3: Generate and Download</h3>
              <p className="mb-4">Once you've configured your server and defined your tools:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Click the "Create MCP Server" button</li>
                <li>Wait for the server to be generated</li>
                <li>When complete, download your MCP server package</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">Deploying Your MCP Server</h2>
              <p className="mb-4">After downloading your MCP server package, you'll need to deploy it to make it accessible to AI assistants.</p>
              
              <h3 className="text-xl font-semibold mb-2 mt-6">Local Deployment</h3>
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-2">For Python Server</h4>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Extract the ZIP file to a folder on your computer</li>
                  <li>Open a terminal/command prompt and navigate to the extracted folder</li>
                  <li>Create a virtual environment (optional but recommended):
                    <pre className="bg-neutral-100 p-2 rounded mt-2 overflow-x-auto">
                      python -m venv venv
                      source venv/bin/activate  # On Windows: venv\Scripts\activate
                    </pre>
                  </li>
                  <li>Install dependencies:
                    <pre className="bg-neutral-100 p-2 rounded mt-2 overflow-x-auto">
                      pip install mcp-client-sdk
                    </pre>
                  </li>
                  <li>Start the server:
                    <pre className="bg-neutral-100 p-2 rounded mt-2 overflow-x-auto">
                      python server.py
                    </pre>
                  </li>
                </ol>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-2">For TypeScript Server</h4>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Extract the ZIP file to a folder on your computer</li>
                  <li>Open a terminal/command prompt and navigate to the extracted folder</li>
                  <li>Install dependencies:
                    <pre className="bg-neutral-100 p-2 rounded mt-2 overflow-x-auto">
                      npm install
                    </pre>
                  </li>
                  <li>Start the server:
                    <pre className="bg-neutral-100 p-2 rounded mt-2 overflow-x-auto">
                      npm start
                    </pre>
                  </li>
                </ol>
              </div>
              
              <h3 className="text-xl font-semibold mb-2 mt-8">Connecting to Claude Desktop</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Open Claude Desktop</li>
                <li>Go to Settings</li>
                <li>Navigate to the MCP section</li>
                <li>Click "Add Server"</li>
                <li>Configure the server:
                  <ul className="list-disc pl-6 mt-2">
                    <li><strong>Name</strong>: Enter a name for your server</li>
                    <li><strong>Type</strong>: Select "command"</li>
                    <li><strong>Command</strong>: Enter the command to run your server
                      <ul className="list-disc pl-6 mt-1">
                        <li>For Python: <code className="bg-neutral-200 px-1 py-0.5 rounded">python /path/to/your/server.py</code></li>
                        <li>For TypeScript: <code className="bg-neutral-200 px-1 py-0.5 rounded">node /path/to/your/server.js</code></li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>Save the configuration</li>
                <li>Restart Claude Desktop</li>
              </ol>
              
              <h3 className="text-xl font-semibold mb-2 mt-8">Cloud Deployment</h3>
              <p className="mb-4">For a more permanent solution, you can deploy your MCP server to a cloud provider:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Replit</strong>: Upload your files and run in the browser</li>
                <li><strong>Heroku</strong>: Deploy using the included Procfile</li>
                <li><strong>AWS, Google Cloud, or Azure</strong>: Deploy as a containerized application</li>
              </ul>
              <p className="mt-4">When deploying to the cloud, make sure to update your Claude Desktop configuration to use the "sse" type with your server's URL instead of the "command" type.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-6">Example MCP Server Templates</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition">
                  <h3 className="text-xl font-semibold mb-2">Weather Data Provider</h3>
                  <p className="text-neutral-600 mb-4">Provides weather forecast data for locations around the world.</p>
                  <h4 className="font-medium mb-2">Tools:</h4>
                  <ul className="list-disc pl-6 space-y-1 mb-4">
                    <li>get_weather_forecast</li>
                    <li>get_current_conditions</li>
                  </ul>
                  <button className="text-primary hover:underline">Use Template</button>
                </div>
                
                <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition">
                  <h3 className="text-xl font-semibold mb-2">Stock Market Data</h3>
                  <p className="text-neutral-600 mb-4">Get stock quotes, price history, and market news.</p>
                  <h4 className="font-medium mb-2">Tools:</h4>
                  <ul className="list-disc pl-6 space-y-1 mb-4">
                    <li>get_stock_quote</li>
                    <li>get_price_history</li>
                    <li>get_market_news</li>
                  </ul>
                  <button className="text-primary hover:underline">Use Template</button>
                </div>
                
                <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition">
                  <h3 className="text-xl font-semibold mb-2">Web Search Tool</h3>
                  <p className="text-neutral-600 mb-4">Search the web and retrieve relevant information.</p>
                  <h4 className="font-medium mb-2">Tools:</h4>
                  <ul className="list-disc pl-6 space-y-1 mb-4">
                    <li>search_web</li>
                    <li>get_page_content</li>
                  </ul>
                  <button className="text-primary hover:underline">Use Template</button>
                </div>
                
                <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition">
                  <h3 className="text-xl font-semibold mb-2">Calendar Integration</h3>
                  <p className="text-neutral-600 mb-4">Manage calendar events and appointments.</p>
                  <h4 className="font-medium mb-2">Tools:</h4>
                  <ul className="list-disc pl-6 space-y-1 mb-4">
                    <li>get_events</li>
                    <li>create_event</li>
                    <li>update_event</li>
                  </ul>
                  <button className="text-primary hover:underline">Use Template</button>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">What Can I Do With MCP Servers?</h3>
                <p className="mb-4">MCP servers can extend AI capabilities in numerous ways:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Retrieving real-time data (weather, stocks, news)</li>
                  <li>Interacting with other services (email, calendar, social media)</li>
                  <li>Accessing databases and local files</li>
                  <li>Performing calculations or specialized functions</li>
                  <li>Controlling IoT devices or software</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documentation;
