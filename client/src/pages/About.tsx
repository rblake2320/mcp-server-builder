import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="font-heading font-semibold text-3xl text-neutral-900">About MCP Server Builder</h1>
        <p className="mt-2 text-neutral-600">Learn about our mission, the MCP protocol, and how this project came to be</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="mb-4">
              The MCP Server Builder was created to make Model Context Protocol (MCP) technology accessible to everyone, regardless of technical background. We believe that by democratizing access to AI extension capabilities, we can unlock new possibilities for innovation and problem-solving.
            </p>
            <p className="mb-4">
              Our tool eliminates the need for coding knowledge, allowing anyone to create powerful MCP servers that extend the capabilities of AI assistants like Claude. Whether you're a business professional, educator, researcher, or enthusiast, MCP Server Builder puts the power of custom AI tools in your hands.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8">About Model Context Protocol</h2>
            <p className="mb-4">
              Model Context Protocol (MCP) is an open standard that enables AI systems to securely connect with external data sources and tools. It provides a standardized way for AI assistants to access capabilities beyond their core functions.
            </p>
            <p className="mb-4">
              Key benefits of MCP include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Extensibility</strong>: Add new capabilities to AI systems without retraining</li>
              <li><strong>Security</strong>: Well-defined boundaries and permissions for AI tool access</li>
              <li><strong>Standardization</strong>: Common interface across different AI systems and tools</li>
              <li><strong>Privacy</strong>: Keep sensitive data on your systems while still allowing AI to work with it</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
            <ul className="space-y-3">
              <li>
                <a href="https://modelcontextprotocol.ai" className="text-primary hover:underline flex items-center" target="_blank" rel="noopener noreferrer">
                  <i className="fas fa-external-link-alt mr-2"></i>
                  MCP Protocol Official Site
                </a>
              </li>
              <li>
                <a href="https://github.com/mcp-protocol" className="text-primary hover:underline flex items-center" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-github mr-2"></i>
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="https://discord.gg/mcp-protocol" className="text-primary hover:underline flex items-center" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-discord mr-2"></i>
                  Join our Discord
                </a>
              </li>
              <li>
                <a href="https://mcpservers.org" className="text-primary hover:underline flex items-center" target="_blank" rel="noopener noreferrer">
                  <i className="fas fa-server mr-2"></i>
                  MCPServers Directory
                </a>
              </li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8">Contact Us</h2>
            <p className="mb-4">Have questions, suggestions, or feedback? We'd love to hear from you!</p>
            <a href="mailto:contact@mcpserverbuilder.org" className="text-primary hover:underline flex items-center">
              <i className="fas fa-envelope mr-2"></i>
              contact@mcpserverbuilder.org
            </a>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">What can I do with an MCP server?</h3>
              <p>MCP servers can extend AI capabilities in numerous ways, including retrieving real-time data, interacting with other services, accessing databases and local files, performing calculations or specialized functions, and controlling IoT devices or software.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Do I need to know how to code to use the MCP Server Builder?</h3>
              <p>No, you can create the structure of an MCP server without coding knowledge. However, implementing the actual functionality of your tools will require some programming. The generated server provides placeholders where you or a developer can add the specific code for each tool.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I modify my server after generating it?</h3>
              <p>Yes, you can edit the generated code to add or modify functionality. The code is clearly commented to make it easy to identify where changes should be made.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Is the MCP Server Builder free to use?</h3>
              <p>Yes, the MCP Server Builder is open-source and free to use.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I deploy my MCP server to the cloud?</h3>
              <p>Yes, the generated server includes a Dockerfile and can be deployed to any platform that supports Python or Node.js applications, including cloud providers like AWS, Google Cloud, Microsoft Azure, and Heroku.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
