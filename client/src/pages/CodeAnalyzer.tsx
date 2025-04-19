import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2, BarChart2, Brain, Code2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'wouter';

interface CodeMetric {
  name: string;
  value: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface AnalysisResult {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  functionCount: number;
  longFunctions: Array<{ name: string; lineCount: number; complexity: number }>;
  nestedDepth: number;
  metrics: CodeMetric[];
  suggestions: string[];
}

const CodeAnalyzer = () => {
  const [code, setCode] = useState<string>(`// Paste your MCP server function or tool code here
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
      }
    }
  }
  
  return result;
}`);

  const [activeTab, setActiveTab] = useState('analyzer');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/code-analyzer/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze code');
      }

      const data = await response.json();
      setAnalysisResult(data);
      setActiveTab('metrics');
    } catch (error) {
      console.error('Error analyzing code:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-green-500 bg-green-50';
      case 'medium':
        return 'text-amber-500 bg-amber-50';
      case 'high':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold">Code Complexity Analyzer</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Analyze Your MCP Server Code</CardTitle>
          <CardDescription>
            Our AI-powered code complexity analyzer helps you understand and improve your MCP server code. Paste your code below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="analyzer">Code Analyzer</TabsTrigger>
              <TabsTrigger value="metrics" disabled={!analysisResult}>
                Complexity Metrics
              </TabsTrigger>
              <TabsTrigger value="insights" disabled={!analysisResult}>
                AI Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analyzer">
              <Tabs defaultValue="code">
                <TabsList className="mb-4">
                  <TabsTrigger value="code">Code Input</TabsTrigger>
                  <TabsTrigger value="analysis" disabled={!analysisResult}>
                    Analysis
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="code">
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Tip</AlertTitle>
                      <AlertDescription>
                        Paste your code below and click "Analyze" to generate a complexity report.
                      </AlertDescription>
                    </Alert>

                    <div className="relative">
                      <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="min-h-80 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Analysis Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={analyzeCode} disabled={analyzing}>
                        {analyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          'Analyze'
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analysis">
                  {analysisResult && (
                    <div className="space-y-4">
                      <Alert variant="default">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Analysis Complete</AlertTitle>
                        <AlertDescription>
                          Your code has been analyzed successfully. Check the metrics tab for detailed results.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Cyclomatic Complexity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{analysisResult.cyclomaticComplexity}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {analysisResult.cyclomaticComplexity < 10
                                ? 'Good: Easy to understand and maintain'
                                : analysisResult.cyclomaticComplexity < 20
                                ? 'Moderate: Consider refactoring complex parts'
                                : 'High: Refactoring recommended'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Cognitive Complexity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{analysisResult.cognitiveComplexity}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {analysisResult.cognitiveComplexity < 15
                                ? 'Good: Easy to understand and maintain'
                                : analysisResult.cognitiveComplexity < 30
                                ? 'Moderate: Consider simplifying logic'
                                : 'High: Logic is too complex'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Nesting Depth</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{analysisResult.nestedDepth}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {analysisResult.nestedDepth < 3
                                ? 'Good: Flat structure is easy to follow'
                                : analysisResult.nestedDepth < 5
                                ? 'Moderate: Consider reducing nesting'
                                : 'High: Too much nesting makes code hard to read'}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="metrics">
              {analysisResult && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="flex flex-col items-center justify-center p-6">
                      <BarChart2 className="h-8 w-8 mb-2 text-primary" />
                      <div className="text-xl font-bold">{analysisResult.cyclomaticComplexity}</div>
                      <div className="text-sm font-medium mb-1">Cyclomatic Complexity</div>
                      <p className="text-xs text-center text-muted-foreground">
                        Measures the number of linearly independent paths through your code
                      </p>
                    </Card>

                    <Card className="flex flex-col items-center justify-center p-6">
                      <Brain className="h-8 w-8 mb-2 text-primary" />
                      <div className="text-xl font-bold">{analysisResult.cognitiveComplexity}</div>
                      <div className="text-sm font-medium mb-1">Cognitive Complexity</div>
                      <p className="text-xs text-center text-muted-foreground">
                        Measures how difficult your code is to understand
                      </p>
                    </Card>

                    <Card className="flex flex-col items-center justify-center p-6">
                      <Function className="h-8 w-8 mb-2 text-primary" />
                      <div className="text-xl font-bold">{analysisResult.functionCount}</div>
                      <div className="text-sm font-medium mb-1">Function Count</div>
                      <p className="text-xs text-center text-muted-foreground">
                        Total number of functions in your code
                      </p>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Metrics</CardTitle>
                      <CardDescription>
                        Breakdown of various complexity metrics in your code
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisResult.metrics.map((metric, index) => (
                          <div key={index} className="flex items-center justify-between border-b pb-2">
                            <div>
                              <div className="font-medium">{metric.name}</div>
                              <div className="text-sm text-muted-foreground">{metric.description}</div>
                            </div>
                            <div className={`px-2 py-1 rounded text-sm ${getSeverityColor(metric.severity)}`}>
                              {metric.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {analysisResult.longFunctions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Complex Functions</CardTitle>
                        <CardDescription>
                          These functions might benefit from refactoring
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysisResult.longFunctions.map((func, index) => (
                            <div key={index} className="flex items-center justify-between border-b pb-2">
                              <div>
                                <div className="font-medium">{func.name || 'Anonymous function'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {func.lineCount} lines, complexity score: {func.complexity}
                                </div>
                              </div>
                              <div
                                className={`px-2 py-1 rounded text-sm ${
                                  func.complexity < 10
                                    ? 'text-green-500 bg-green-50'
                                    : func.complexity < 20
                                    ? 'text-amber-500 bg-amber-50'
                                    : 'text-red-500 bg-red-50'
                                }`}
                              >
                                {func.complexity < 10 ? 'Low' : func.complexity < 20 ? 'Medium' : 'High'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights">
              {analysisResult && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Insights</CardTitle>
                      <CardDescription>
                        Suggestions for improving your MCP server code
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisResult.suggestions.map((suggestion, index) => (
                          <Alert key={index}>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Suggestion {index + 1}</AlertTitle>
                            <AlertDescription>{suggestion}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cyclomatic Complexity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Measures the number of linearly independent paths through a program's source code, indicating control flow
              complexity. Lower values are generally better, with values under 10 considered easy to maintain.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cognitive Complexity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Measures how difficult code is to understand, focusing on nested structures and the cognitive load required to
              comprehend the code. It penalizes nested control flow, jumps, and breaks in linear flow.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Function Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Identifies complex functions that may benefit from refactoring, helping you focus optimization efforts where
              they matter most. Functions with high complexity and many lines are prime candidates for simplification.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CodeAnalyzer;