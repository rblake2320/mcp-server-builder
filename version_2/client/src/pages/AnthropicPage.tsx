import { useState } from "react";
import AnthropicAssistant from "@/components/AnthropicAssistant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Code, FileText, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AnthropicPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("assistant");
  
  return (
    <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-8 w-8 text-purple-500" />
            Claude AI Assistant
          </h1>
          <p className="text-gray-500 mt-2">
            Build better MCP servers with the help of Anthropic's Claude AI
          </p>
        </div>
        
        <div className="flex space-x-4">
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.open('https://www.anthropic.com/claude', '_blank')}
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            About Claude
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>AI Assistant Dashboard</CardTitle>
            <CardDescription>
              Use Claude AI to help you generate tools, analyze code, and create documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="assistant" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="assistant" className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Claude Assistant
                </TabsTrigger>
                <TabsTrigger value="tools" className="flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  AI Tools
                </TabsTrigger>
                <TabsTrigger value="docs" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Documentation
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="assistant">
                <div className="grid grid-cols-1 gap-6">
                  <div className="col-span-1">
                    <AnthropicAssistant />
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                    <h3 className="text-lg font-medium text-purple-800 mb-2">
                      Why Use Claude for MCP Development?
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span>Generate production-ready MCP tool code with proper validation, documentation, and error handling</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span>Analyze your MCP server code for quality, best practices, and improvement opportunities</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span>Create comprehensive documentation for your tools and servers automatically</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span>Get expert guidance on implementing advanced MCP features in your code</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tools">
                <div className="space-y-6">
                  <p className="text-gray-600">
                    Claude can help you build a variety of advanced MCP tools. Here are some examples of what you can create:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Natural Language Processing</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Create tools for sentiment analysis, entity extraction, keyword identification, 
                          text summarization, translation, and content moderation.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Data Processing</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Build tools to validate, transform, enrich, filter, and analyze various data formats
                          including JSON, CSV, XML, and more.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Integration Connectors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Generate tools that connect to external APIs, databases, or services,
                          with proper authentication and error handling.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Domain-Specific Tools</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Create specialized tools for finance, healthcare, e-commerce, content management,
                          or any other domain with industry-specific logic.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="docs">
                <div className="space-y-6">
                  <p className="text-gray-600">
                    Claude can generate comprehensive documentation for your MCP servers and tools, saving you time and ensuring clarity.
                  </p>
                  
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Documentation Features
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>Comprehensive API references</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>Parameter details with types and constraints</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>Implementation details and architecture</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>Usage examples and code snippets</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Format Options</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>Markdown for GitHub and general documentation</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>HTML for web-based documentation</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>Examples with or without code samples</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>Customizable level of detail</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}