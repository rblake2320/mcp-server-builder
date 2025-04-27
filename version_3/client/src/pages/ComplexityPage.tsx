import { useState } from 'react';
import { CodeComplexityVisualizer } from '@/components/CodeComplexityVisualizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code, BarChart2, LightbulbIcon } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ComplexityPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('visualizer');
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Code Complexity Analyzer</h1>
      </div>
      
      <div className="bg-card rounded-lg shadow-lg p-6">
        <div className="space-y-2 mb-6">
          <h2 className="text-2xl font-semibold">Analyze Your MCP Server Code</h2>
          <p className="text-muted-foreground">
            Our AI-powered code complexity analyzer helps you understand and improve your MCP server code.
            Paste your code below to get started.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visualizer" className="flex items-center">
              <Code className="w-4 h-4 mr-2" />
              Code Analyzer
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center">
              <BarChart2 className="w-4 h-4 mr-2" />
              Complexity Metrics
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center">
              <LightbulbIcon className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualizer" className="space-y-4">
            <CodeComplexityVisualizer />
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            <div className="min-h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Analyze your code first to see complexity metrics.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <div className="min-h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Analyze your code first to see AI-powered recommendations.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-8 bg-card rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">About Code Complexity Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium">Cyclomatic Complexity</h3>
            <p className="text-sm text-muted-foreground">
              Measures the number of linearly independent paths through a program's source code,
              indicating control flow complexity.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Cognitive Complexity</h3>
            <p className="text-sm text-muted-foreground">
              Measures how difficult code is to understand, focusing on nested structures
              and the cognitive load required to comprehend the code.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Function Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Identifies complex functions that may benefit from refactoring,
              helping you focus optimization efforts where they matter most.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}