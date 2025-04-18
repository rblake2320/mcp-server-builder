import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Loader2, LogOut, User } from "lucide-react";

const NavBar = () => {
  const [location] = useLocation();
  const { user, isLoading, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
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
              <Link href="/enhancements" className={`px-3 py-2 ${location === '/enhancements' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-700 font-medium hover:text-primary'}`}>
                Enhancements
              </Link>
              <Link href="/anthropic" className={`px-3 py-2 ${location === '/anthropic' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-700 font-medium hover:text-primary'}`}>
                Claude AI
              </Link>
              <Link href="/complexity" className={`px-3 py-2 ${location === '/complexity' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-700 font-medium hover:text-primary'}`}>
                Code Analyzer
              </Link>
              <Link href="/documentation" className={`px-3 py-2 ${location === '/documentation' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-700 font-medium hover:text-primary'}`}>
                Documentation
              </Link>
              <Link href="/about" className={`px-3 py-2 ${location === '/about' ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-700 font-medium hover:text-primary'}`}>
                About
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <a 
              href="https://github.com/mcp-protocol" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-neutral-500 hover:text-neutral-700 mr-4"
            >
              <i className="fab fa-github text-xl"></i>
            </a>
            
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>{user.username}</span>
                  </DropdownMenuItem>
                  <Link href="/my-servers">
                    <DropdownMenuItem>My Servers</DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                    {logoutMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
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
