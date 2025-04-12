import { Link, useLocation } from "wouter";

const NavBar = () => {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <i className="fas fa-server text-primary text-2xl mr-2"></i>
                <span className="font-heading font-semibold text-xl text-neutral-800">MCP Server Builder</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Link href="/" className={`px-3 py-2 ${location === '/' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-700 font-medium hover:text-primary'}`}>
                Home
              </Link>
              <Link href="/builder" className={`px-3 py-2 ${location === '/builder' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-700 font-medium hover:text-primary'}`}>
                Builder
              </Link>
              <Link href="/documentation" className={`px-3 py-2 ${location === '/documentation' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-700 font-medium hover:text-primary'}`}>
                Documentation
              </Link>
              <Link href="/about" className={`px-3 py-2 ${location === '/about' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-700 font-medium hover:text-primary'}`}>
                About
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <a href="https://github.com/mcp-protocol" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-700">
              <i className="fab fa-github text-xl"></i>
            </a>
          </div>
          <div className="flex items-center sm:hidden">
            {/* Mobile menu button - in a real implementation, this would toggle a mobile menu */}
            <button type="button" className="text-neutral-500 hover:text-neutral-700 focus:outline-none">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
