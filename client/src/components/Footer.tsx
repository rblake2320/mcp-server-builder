import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-neutral-400 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading font-semibold text-white text-lg mb-4">MCP Server Builder</h3>
            <p className="text-sm">A user-friendly interface for building Model Context Protocol servers without technical knowledge.</p>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-white text-lg mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/documentation" className="hover:text-white">Documentation</Link></li>
              <li><a href="https://modelcontextprotocol.ai/docs/spec" className="hover:text-white" target="_blank" rel="noopener noreferrer">MCP Protocol Spec</a></li>
              <li><Link href="/documentation#deployment" className="hover:text-white">Deployment Guide</Link></li>
              <li><Link href="/documentation#examples" className="hover:text-white">Examples</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-white text-lg mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://github.com/mcp-protocol" className="hover:text-white" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://discord.gg/mcp-protocol" className="hover:text-white" target="_blank" rel="noopener noreferrer">Discord Community</a></li>
              <li><a href="https://github.com/mcp-protocol/issues/new" className="hover:text-white" target="_blank" rel="noopener noreferrer">Report Issues</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-700 mt-8 pt-6 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} MCP Server Builder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
