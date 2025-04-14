import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Github, AlertTriangle } from "lucide-react";
import { FormEvent, useState, useEffect } from "react";
import { Redirect, useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location] = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Parse URL parameters for error messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const message = params.get('message');
    
    if (error) {
      let errorMessage = "Authentication failed";
      
      if (error === 'github_auth_failed') {
        errorMessage = "GitHub authentication failed. Please try again.";
      } else if (error === 'github_error' && message) {
        errorMessage = `GitHub error: ${message}`;
      } else if (error === 'login_failed' && message) {
        errorMessage = `Login error: ${message}`;
      } else if (error === 'unexpected' && message) {
        errorMessage = `Unexpected error: ${message}`;
      } else if (message) {
        errorMessage = message;
      }
      
      setAuthError(errorMessage);
    } else {
      setAuthError(null);
    }
  }, [location]);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Form submission handlers
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: loginUsername,
      password: loginPassword
    });
  };
  
  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== confirmPassword) {
      return; // Add validation or toast here
    }
    
    registerMutation.mutate({
      username: registerUsername,
      password: registerPassword
    });
  };
  
  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Sign in to your account to manage your MCP servers.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input 
                        id="login-username" 
                        type="text" 
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input 
                        id="login-password" 
                        type="password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Sign In
                    </Button>
                  </CardFooter>
                </form>
                
                <div className="px-6 pb-4">
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  
                  <a href="/auth/github" className="w-full">
                    <Button variant="outline" className="w-full" type="button">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>
                  </a>
                  
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      type="button"
                      onClick={() => setShowTokenLogin(prev => !prev)}
                    >
                      <Github className="mr-2 h-4 w-4" />
                      Login with GitHub Token
                    </Button>
                  </div>
                  
                  {showTokenLogin && (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                        <Input
                          id="github-token"
                          type="password"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          placeholder="ghp_..."
                        />
                      </div>
                      <Button 
                        variant="default" 
                        className="w-full" 
                        disabled={!githubToken || tokenLoginLoading}
                        onClick={handleTokenLogin}
                      >
                        {tokenLoginLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Login with Token
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Create a token with <span className="font-mono">user:email</span> and <span className="font-mono">repo</span> scopes at{" "}
                        <a 
                          href="https://github.com/settings/tokens/new" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          GitHub Developer Settings
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register a new account to start building MCP servers.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input 
                        id="register-username" 
                        type="text" 
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input 
                        id="register-password" 
                        type="password" 
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Create Account
                    </Button>
                  </CardFooter>
                </form>
                
                <div className="px-6 pb-4">
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
                    </div>
                  </div>
                  
                  <a href="/auth/github" className="w-full">
                    <Button variant="outline" className="w-full" type="button">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>
                  </a>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Hero section */}
      <div className="flex-1 bg-muted p-12 hidden lg:flex flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-6">MCP Server Builder</h1>
          <p className="text-xl mb-6">
            Build, customize, and deploy MCP (Model Context Protocol) servers without coding knowledge.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center mr-3">✓</div>
              <span>Create Python or TypeScript MCP servers</span>
            </li>
            <li className="flex items-center">
              <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center mr-3">✓</div>
              <span>Define custom tools with parameters</span>
            </li>
            <li className="flex items-center">
              <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center mr-3">✓</div>
              <span>Download and deploy instantly</span>
            </li>
            <li className="flex items-center">
              <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center mr-3">✓</div>
              <span>Save and manage your server configurations</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}