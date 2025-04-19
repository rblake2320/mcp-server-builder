import { Link } from "wouter";

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4 font-heading">MCP Server Builder</h1>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Create custom Model Context Protocol servers without writing any code. 
            Extend Claude's capabilities with your own tools and integrations.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/builder" className="bg-white text-primary font-semibold px-6 py-3 rounded-md hover:bg-neutral-100 transition">
              Start Building
            </Link>
            <Link href="/documentation" className="border border-white text-white font-semibold px-6 py-3 rounded-md hover:bg-primary-800 transition">
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 font-heading">Why Use MCP Server Builder?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-primary text-3xl mb-4">
                <i className="fas fa-code-branch"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-heading">No Coding Required</h3>
              <p className="text-neutral-600">Create powerful MCP servers through a simple interface, without any programming knowledge.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-primary text-3xl mb-4">
                <i className="fas fa-tools"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-heading">Custom Tools</h3>
              <p className="text-neutral-600">Define exactly what tools and capabilities you want Claude to have access to.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-primary text-3xl mb-4">
                <i className="fas fa-rocket"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-heading">Easy Deployment</h3>
              <p className="text-neutral-600">Simple installation process with clear instructions for connecting to Claude Desktop.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 font-heading">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl mb-4">1</div>
              <h3 className="text-lg font-semibold mb-2 font-heading">Configure Your Server</h3>
              <p className="text-neutral-600">Set a name and description for your server and choose Python or TypeScript.</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl mb-4">2</div>
              <h3 className="text-lg font-semibold mb-2 font-heading">Define Your Tools</h3>
              <p className="text-neutral-600">Create tools with parameters that Claude can use to interact with your server.</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl mb-4">3</div>
              <h3 className="text-lg font-semibold mb-2 font-heading">Download & Deploy</h3>
              <p className="text-neutral-600">Download your server package and follow the simple setup instructions.</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl mb-4">4</div>
              <h3 className="text-lg font-semibold mb-2 font-heading">Connect to Claude</h3>
              <p className="text-neutral-600">Add your MCP server to Claude Desktop and start using your custom tools.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 font-heading">Ready to Get Started?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Create your first MCP server in minutes and extend Claude's capabilities.
          </p>
          <Link href="/builder" className="bg-white text-primary font-semibold px-6 py-3 rounded-md hover:bg-neutral-100 transition">
            Build Your MCP Server
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
