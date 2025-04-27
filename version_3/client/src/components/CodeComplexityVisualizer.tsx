import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, Check, Code, BarChart2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ComplexityVisualizerProps {
  initialCode?: string;
}

interface ComplexityResult {
  cyclomatic: number;
  cognitive: number;
  lines: number;
  functions: {
    name: string;
    complexity: number;
    startLine: number;
    endLine: number;
  }[];
  visualization: string; // SVG data
  summary: string;
}

const defaultCode = `// Paste your MCP server function or tool code here
function processData(input) {
  let result = [];
  
  if (input && input.items) {
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      
      // Process each item based on type
      if (item.type === 'text') {
        result.push({ 
          id: item.id,
          processed: item.content.toUpperCase() 
        });
      } else if (item.type === 'number') {
        result.push({ 
          id: item.id,
          processed: item.content * 2 
        });
      } else {
        // Handle unknown types
        result.push({ 
          id: item.id,
          processed: null,
          error: 'Unknown type'
        });
      }
    }
  }
  
  return result;
}`;

export function CodeComplexityVisualizer({ initialCode = '' }: ComplexityVisualizerProps) {
  const { toast } = useToast();
  const [code, setCode] = useState<string>(initialCode || defaultCode);
  const [isApiKeyPromptOpen, setIsApiKeyPromptOpen] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const svgContainerRef = useRef<HTMLDivElement>(null);
  
  // State to manage current tab
  const [activeTab, setActiveTab] = useState<string>('code');
  
  // Mutation for analyzing code complexity
  const complexityMutation = useMutation({
    mutationFn: async (codeToAnalyze: string) => {
      // Try to get API key from localStorage first
      const savedApiKey = localStorage.getItem('google_api_key');
      
      const response = await apiRequest('POST', '/api/analyze-complexity', { 
        code: codeToAnalyze,
        apiKey: savedApiKey || undefined
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze code complexity');
      }
      return response.json() as Promise<ComplexityResult>;
    },
    onSuccess: () => {
      toast({
        title: 'Analysis Complete',
        description: 'Code complexity analysis has been successfully completed.',
        variant: 'default',
      });
      
      // Automatically switch to the analysis tab
      setActiveTab('analysis');
    },
    onError: (error: Error) => {
      // Check if error is related to missing API key
      if (error.message.includes('Google API key is missing')) {
        setIsApiKeyPromptOpen(true);
      } else {
        toast({
          title: 'Analysis Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  });
  
  // Query for the complexity result (only runs after mutation succeeds)
  const { data: complexityResult, isLoading: isResultLoading } = useQuery({
    queryKey: ['/api/complexity-result'],
    queryFn: () => complexityMutation.data,
    enabled: complexityMutation.isSuccess,
    staleTime: Infinity, // Don't refetch automatically
  });
  
  // Handle form submission
  const handleAnalyze = () => {
    if (!code.trim()) {
      toast({
        title: 'No Code Provided',
        description: 'Please enter some code to analyze.',
        variant: 'destructive',
      });
      return;
    }
    
    complexityMutation.mutate(code);
  };
  
  // Handle API key submission
  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast({
        title: 'API Key Required',
        description: 'Please enter a Google API key to continue.',
        variant: 'destructive',
      });
      return;
    }
    
    // Store API key in localStorage for future uses
    localStorage.setItem('google_api_key', apiKey);
    
    // Close prompt and retry analysis
    setIsApiKeyPromptOpen(false);
    complexityMutation.mutate(code);
  };
  
  // Render code complexity score indicator
  const renderComplexityScore = (score: number, max: number = 15) => {
    let color = 'bg-green-500';
    let label = 'Low';
    
    if (score > max * 0.7) {
      color = 'bg-red-500';
      label = 'High';
    } else if (score > max * 0.4) {
      color = 'bg-amber-500';
      label = 'Moderate';
    }
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{label} Complexity</span>
          <span>{score} / {max}</span>
        </div>
        <Progress value={(score / max) * 100} className={color} />
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="code" className="flex items-center">
            <Code className="w-4 h-4 mr-2" />
            Code Input
          </TabsTrigger>
          <TabsTrigger 
            value="analysis" 
            disabled={!complexityResult}
            className="flex items-center"
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="code" className="space-y-4">
          <div className="bg-muted rounded-md p-4">
            <div className="mb-2 flex items-center text-sm text-muted-foreground">
              <Info className="h-4 w-4 mr-2" />
              <p>Paste your code below and click "Analyze" to generate a complexity report.</p>
            </div>
            
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="font-mono text-sm min-h-[300px] bg-background"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleAnalyze}
              disabled={complexityMutation.isPending || !code.trim()}
              className="w-32"
            >
              {complexityMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis">
          {complexityMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing code complexity...</p>
            </div>
          ) : complexityResult ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-2">Cyclomatic Complexity</h3>
                    {renderComplexityScore(complexityResult.cyclomatic)}
                    <p className="text-sm text-muted-foreground mt-2">
                      Measures the number of independent paths through the code.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-2">Cognitive Complexity</h3>
                    {renderComplexityScore(complexityResult.cognitive, 20)}
                    <p className="text-sm text-muted-foreground mt-2">
                      Measures how difficult the code is to understand.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-2">Code Size</h3>
                    <div className="text-3xl font-bold">{complexityResult.lines}</div>
                    <p className="text-sm text-muted-foreground">Lines of code</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Function Complexity</h3>
                  <div 
                    ref={svgContainerRef} 
                    dangerouslySetInnerHTML={{ __html: complexityResult.visualization }}
                    className="w-full overflow-auto"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">AI Analysis</h3>
                  <div className="prose max-w-none">
                    <p>{complexityResult.summary}</p>
                  </div>
                </CardContent>
              </Card>
              
              {complexityResult.functions.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Function Details</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Function Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Complexity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Line Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {complexityResult.functions.map((func, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm font-medium">{func.name}</td>
                              <td className="px-4 py-2 text-sm">
                                <span 
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    func.complexity > 10 
                                      ? 'bg-red-100 text-red-800' 
                                      : func.complexity > 5 
                                        ? 'bg-amber-100 text-amber-800' 
                                        : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {func.complexity}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm">{func.startLine} - {func.endLine}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-destructive mb-4" />
              <p className="text-muted-foreground">Failed to analyze code. Please try again.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* API Key Prompt Dialog */}
      {isApiKeyPromptOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Google API Key Required</h2>
            <p className="mb-4 text-muted-foreground">
              To analyze your code with AI, we need a Google API key. 
              Your key is used securely and never stored on our servers.
            </p>
            
            <Textarea
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google API key"
              className="mb-4"
            />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsApiKeyPromptOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApiKeySubmit}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}