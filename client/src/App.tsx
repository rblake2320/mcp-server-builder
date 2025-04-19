import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Builder from "@/pages/Builder";
import Documentation from "@/pages/Documentation";
import About from "@/pages/About";
import AuthPage from "@/pages/AuthPage";
import MyServers from "@/pages/MyServers";
import Enhancements from "@/pages/Enhancements";
import ComplexityPage from "@/pages/ComplexityPage";
import AnthropicPage from "@/pages/AnthropicPage";
import TerminalTool from "@/pages/TerminalTool";
import MCPServers from "@/pages/MCPServers";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <ProtectedRoute path="/builder" component={Builder} />
      <ProtectedRoute path="/my-servers" component={MyServers} />
      <Route path="/enhancements" component={Enhancements} />
      <Route path="/complexity" component={ComplexityPage} />
      <Route path="/anthropic" component={AnthropicPage} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/about" component={About} />
      <Route path="/terminal-tool" component={TerminalTool} />
      <Route path="/mcp-servers" component={MCPServers} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <NavBar />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
