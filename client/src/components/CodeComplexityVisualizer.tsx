import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, ZoomIn, ZoomOut, BarChart3 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

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

export function CodeComplexityVisualizer({ initialCode = '' }: ComplexityVisualizerProps) {
  const [code, setCode] = useState<string>(initialCode);
  const [zoom, setZoom] = useState<number>(1);
  const [activeView, setActiveView] = useState<'chart' | 'summary'>('chart');

  const analyzeComplexity = useMutation({
    mutationFn: async (codeToAnalyze: string) => {
      const res = await apiRequest('POST', '/api/analyze-complexity', { code: codeToAnalyze });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to analyze code complexity');
      }
      return res.json() as Promise<ComplexityResult>;
    },
    onSuccess: () => {
      // No need to invalidate any queries since this is a one-off analysis
    }
  });

  const handleAnalyze = () => {
    if (!code.trim()) return;
    analyzeComplexity.mutate(code);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Code Complexity Analyzer</CardTitle>
        <CardDescription>
          Analyze your code and visualize its complexity using AI
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea 
          value={code} 
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..."
          className="min-h-[200px] font-mono"
        />

        {analyzeComplexity.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {analyzeComplexity.error instanceof Error 
                ? analyzeComplexity.error.message 
                : 'Failed to analyze code complexity'}
            </AlertDescription>
          </Alert>
        )}

        {analyzeComplexity.isSuccess && (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button 
                variant={activeView === 'chart' ? 'default' : 'outline'} 
                onClick={() => setActiveView('chart')}
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" /> 
                Visualization
              </Button>
              <Button 
                variant={activeView === 'summary' ? 'default' : 'outline'} 
                onClick={() => setActiveView('summary')}
                size="sm"
              >
                Summary
              </Button>
              <div className="ml-auto flex space-x-1">
                <Button size="icon" variant="outline" onClick={zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {activeView === 'chart' && (
              <div 
                className="border rounded-md p-4 overflow-auto" 
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: analyzeComplexity.data.visualization }} 
                  className="min-w-full"
                />
              </div>
            )}

            {activeView === 'summary' && (
              <div className="border rounded-md p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted p-3 rounded-md text-center">
                    <div className="text-sm text-muted-foreground">Cyclomatic Complexity</div>
                    <div className="text-2xl font-bold">{analyzeComplexity.data.cyclomatic}</div>
                  </div>
                  <div className="bg-muted p-3 rounded-md text-center">
                    <div className="text-sm text-muted-foreground">Cognitive Complexity</div>
                    <div className="text-2xl font-bold">{analyzeComplexity.data.cognitive}</div>
                  </div>
                  <div className="bg-muted p-3 rounded-md text-center">
                    <div className="text-sm text-muted-foreground">Lines of Code</div>
                    <div className="text-2xl font-bold">{analyzeComplexity.data.lines}</div>
                  </div>
                </div>

                <div className="prose max-w-full">
                  <h4>Analysis Summary</h4>
                  <p>{analyzeComplexity.data.summary}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Function Complexity</h4>
                  <div className="space-y-2">
                    {analyzeComplexity.data.functions.map((func, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border rounded-md">
                        <div className="flex-grow font-mono text-sm">{func.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Line {func.startLine}-{func.endLine}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          func.complexity > 15 ? 'bg-destructive text-destructive-foreground' :
                          func.complexity > 10 ? 'bg-warning text-warning-foreground' :
                          'bg-success/20 text-success-foreground'
                        }`}>
                          {func.complexity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleAnalyze} 
          disabled={!code.trim() || analyzeComplexity.isPending}
          className="w-full"
        >
          {analyzeComplexity.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Analyze Code Complexity
        </Button>
      </CardFooter>
    </Card>
  );
}