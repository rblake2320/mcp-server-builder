import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Loader2, Code, FileText, Key, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AnthropicAssistantProps {
  onGeneratedTool?: (toolCode: string) => void;
  onGeneratedDocs?: (docs: string) => void;
  initialCode?: string;
}

const AnthropicAssistant = ({ 
  onGeneratedTool, 
  onGeneratedDocs, 
  initialCode 
}: AnthropicAssistantProps) => {
  const { toast } = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("generate");
  
  // Generate tool state
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [language, setLanguage] = useState<"python" | "typescript">("python");
  const [complexity, setComplexity] = useState<"simple" | "advanced">("simple");
  
  // Analyze code state
  const [codeToAnalyze, setCodeToAnalyze] = useState(initialCode || "");
  const [codeAnalysis, setCodeAnalysis] = useState<{
    quality: number;
    strengths: string[];
    improvements: string[];
    summary: string;
  } | null>(null);
  
  // Generate docs state
  const [codeToDocument, setCodeToDocument] = useState(initialCode || "");
  const [format, setFormat] = useState<"markdown" | "html">("markdown");
  const [includeExamples, setIncludeExamples] = useState(true);
  const [generatedDocs, setGeneratedDocs] = useState("");
  
  // API key state
  const [apiKey, setApiKey] = useState("");
  const [apiKeyIsSet, setApiKeyIsSet] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  // Loading states
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  // Generate tool
  const handleGenerateTool = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt describing the tool you want to generate",
        variant: "destructive"
      });
      return;
    }

    // Process environment variables are not accessible in the browser
    // User needs to provide an API key if the server doesn't have one
    if (!apiKeyIsSet) {
      setShowApiKeyInput(true);
      return;
    }

    try {
      setLoadingGenerate(true);
      setGeneratedCode("");

      const res = await fetch('/api/ai/anthropic/generate-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          language,
          complexity,
          apiKey: apiKey
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate tool');
      }

      const data = await res.json();
      setGeneratedCode(data.generatedCode);

      // If callback function provided, pass the generated code
      if (onGeneratedTool) {
        onGeneratedTool(data.generatedCode);
      }

      toast({
        title: "Tool generated",
        description: "Claude has generated a tool based on your prompt",
      });
    } catch (error) {
      console.error('Error generating tool:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate tool",
        variant: "destructive"
      });
    } finally {
      setLoadingGenerate(false);
    }
  };
  
  // Analyze code
  const handleAnalyzeCode = async () => {
    if (!codeToAnalyze.trim()) {
      toast({
        title: "Code required",
        description: "Please enter code to analyze",
        variant: "destructive"
      });
      return;
    }

    // Process environment variables are not accessible in the browser
    // User needs to provide an API key if the server doesn't have one
    if (!apiKeyIsSet) {
      setShowApiKeyInput(true);
      return;
    }

    try {
      setLoadingAnalyze(true);
      setCodeAnalysis(null);

      const res = await fetch('/api/ai/anthropic/analyze-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: codeToAnalyze,
          apiKey: apiKey
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to analyze code');
      }

      const data = await res.json();
      setCodeAnalysis(data.analysis);

      toast({
        title: "Analysis complete",
        description: "Claude has analyzed your code",
      });
    } catch (error) {
      console.error('Error analyzing code:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze code",
        variant: "destructive"
      });
    } finally {
      setLoadingAnalyze(false);
    }
  };
  
  // Generate documentation
  const handleGenerateDocumentation = async () => {
    if (!codeToDocument.trim()) {
      toast({
        title: "Code required",
        description: "Please enter code to document",
        variant: "destructive"
      });
      return;
    }

    // Process environment variables are not accessible in the browser
    // User needs to provide an API key if the server doesn't have one
    if (!apiKeyIsSet) {
      setShowApiKeyInput(true);
      return;
    }

    try {
      setLoadingDocs(true);
      setGeneratedDocs("");

      const res = await fetch('/api/ai/anthropic/generate-documentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: codeToDocument,
          format,
          includeExamples,
          apiKey: apiKey
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate documentation');
      }

      const data = await res.json();
      setGeneratedDocs(data.documentation);

      // If callback function provided, pass the generated documentation
      if (onGeneratedDocs) {
        onGeneratedDocs(data.documentation);
      }

      toast({
        title: "Documentation generated",
        description: "Claude has generated documentation for your code",
      });
    } catch (error) {
      console.error('Error generating documentation:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate documentation",
        variant: "destructive"
      });
    } finally {
      setLoadingDocs(false);
    }
  };
  
  // Set API key
  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Anthropic API key",
        variant: "destructive"
      });
      return;
    }

    // Store API key in state only (not in localStorage for security)
    setApiKeyIsSet(true);
    setShowApiKeyInput(false);
    
    toast({
      title: "API Key Set",
      description: "Your Anthropic API key has been set for this session",
    });
  };

  // Render API key input section
  const renderApiKeyInput = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="apiKey">Anthropic API Key</Label>
        <Input
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          type="password"
          placeholder="Enter your Anthropic API key"
          className="mt-1.5"
        />
        <p className="text-xs text-gray-500 mt-1">
          Your API key is only stored in memory for this session and is never saved to disk.
        </p>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setShowApiKeyInput(false)}>
          Cancel
        </Button>
        <Button onClick={handleSaveApiKey}>
          Save API Key
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          Claude AI Assistant
        </CardTitle>
        <CardDescription>
          Use Anthropic's Claude AI to help you build and analyze MCP servers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showApiKeyInput ? (
          renderApiKeyInput()
        ) : (
          <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="generate">Generate Tool</TabsTrigger>
              <TabsTrigger value="analyze">Analyze Code</TabsTrigger>
              <TabsTrigger value="document">Generate Docs</TabsTrigger>
            </TabsList>
            
            {/* Generate Tool Tab */}
            <TabsContent value="generate" className="space-y-4">
              <div>
                <Label htmlFor="prompt">Describe the tool you want to create</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A tool that analyzes text sentiment and returns a score between -1 and 1 along with key emotional words identified"
                  className="min-h-[120px] mt-1.5"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as "python" | "typescript")}
                  >
                    <SelectTrigger id="language" className="mt-1.5">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="complexity">Complexity</Label>
                  <Select
                    value={complexity}
                    onValueChange={(value) => setComplexity(value as "simple" | "advanced")}
                  >
                    <SelectTrigger id="complexity" className="mt-1.5">
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateTool}
                  disabled={loadingGenerate}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                >
                  {loadingGenerate ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Generate with Claude
                    </>
                  )}
                </Button>
              </div>
              
              {generatedCode && (
                <div className="mt-4">
                  <Label>Generated Tool Code</Label>
                  <div className="bg-black/95 text-green-400 p-4 rounded-md mt-1.5 font-mono text-sm overflow-auto max-h-[300px]">
                    <pre>{generatedCode}</pre>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Analyze Code Tab */}
            <TabsContent value="analyze" className="space-y-4">
              <div>
                <Label htmlFor="codeToAnalyze">Paste MCP server code to analyze</Label>
                <Textarea
                  id="codeToAnalyze"
                  value={codeToAnalyze}
                  onChange={(e) => setCodeToAnalyze(e.target.value)}
                  placeholder="Paste your MCP server code here..."
                  className="min-h-[150px] mt-1.5 font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleAnalyzeCode}
                  disabled={loadingAnalyze}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                >
                  {loadingAnalyze ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Code className="w-4 h-4 mr-2" />
                      Analyze with Claude
                    </>
                  )}
                </Button>
              </div>
              
              {codeAnalysis && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Quality Score: {codeAnalysis.quality}/10</Label>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${codeAnalysis.quality * 10}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Summary</Label>
                    <div className="p-4 bg-gray-100 rounded-md mt-1.5">
                      {codeAnalysis.summary}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Strengths</Label>
                      <ul className="list-disc pl-5 mt-1.5 space-y-1">
                        {codeAnalysis.strengths.map((strength, i) => (
                          <li key={i} className="text-sm">{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <Label>Improvements</Label>
                      <ul className="list-disc pl-5 mt-1.5 space-y-1">
                        {codeAnalysis.improvements.map((improvement, i) => (
                          <li key={i} className="text-sm">{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Generate Documentation Tab */}
            <TabsContent value="document" className="space-y-4">
              <div>
                <Label htmlFor="codeToDocument">Paste MCP server code to document</Label>
                <Textarea
                  id="codeToDocument"
                  value={codeToDocument}
                  onChange={(e) => setCodeToDocument(e.target.value)}
                  placeholder="Paste your MCP server code here..."
                  className="min-h-[150px] mt-1.5 font-mono text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format">Documentation Format</Label>
                  <Select
                    value={format}
                    onValueChange={(value) => setFormat(value as "markdown" | "html")}
                  >
                    <SelectTrigger id="format" className="mt-1.5">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col justify-end">
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      id="includeExamples"
                      checked={includeExamples}
                      onCheckedChange={setIncludeExamples}
                    />
                    <Label htmlFor="includeExamples">Include Usage Examples</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateDocumentation}
                  disabled={loadingDocs}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                >
                  {loadingDocs ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Documentation
                    </>
                  )}
                </Button>
              </div>
              
              {generatedDocs && (
                <div className="mt-4">
                  <Label>Generated Documentation</Label>
                  <div className="p-4 bg-gray-50 rounded-md mt-1.5 overflow-auto max-h-[300px]">
                    <pre className="whitespace-pre-wrap">{generatedDocs}</pre>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default AnthropicAssistant;