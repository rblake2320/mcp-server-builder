import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, Sparkles, Key } from "lucide-react";

interface AIAssistantProps {
  onGeneratedTool?: (toolCode: string) => void;
}

const AIAssistant = ({ onGeneratedTool }: AIAssistantProps) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyIsSet, setApiKeyIsSet] = useState(false);

  const handleAskAI = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt to generate a tool",
        variant: "destructive"
      });
      return;
    }

    if (!apiKeyIsSet) {
      setShowApiKeyInput(true);
      return;
    }

    try {
      setLoading(true);
      setResponse("");

      const res = await fetch('/api/ai/generate-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          apiKey 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate tool');
      }

      const data = await res.json();
      setResponse(data.generatedCode);

      // If callback function provided, pass the generated code
      if (onGeneratedTool) {
        onGeneratedTool(data.generatedCode);
      }

      toast({
        title: "Tool generated",
        description: "AI has generated a tool based on your prompt",
      });
    } catch (error) {
      console.error('Error generating tool:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate tool",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Google Studio API key",
        variant: "destructive"
      });
      return;
    }

    // Store API key in state only (not in localStorage for security)
    setApiKeyIsSet(true);
    setShowApiKeyInput(false);
    
    toast({
      title: "API Key Set",
      description: "Your API key has been set for this session",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-primary" />
          Google AI Studio Tool Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showApiKeyInput ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Google AI Studio API Key</Label>
              <div className="flex mt-1.5">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your Google AI Studio API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSaveApiKey} 
                  className="ml-2"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Save Key
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Your Google AI Studio API key is stored only for the current session and never saved to the server.
                You can get an API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a>.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Label htmlFor="prompt">What kind of tool do you want to create?</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the tool you want to create, e.g., 'Create a weather forecast tool that takes a location and number of days as parameters'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1.5 min-h-[100px]"
              />
            </div>

            {response && (
              <div className="mt-4">
                <Label>Generated Tool Code</Label>
                <div className="bg-black/95 text-green-400 p-4 rounded-md mt-1.5 font-mono text-sm overflow-auto max-h-[300px]">
                  <pre>{response}</pre>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {!showApiKeyInput && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowApiKeyInput(true)}
              className="text-xs"
            >
              <Key className="w-3 h-3 mr-1" />
              {apiKeyIsSet ? "Change API Key" : "Set API Key"}
            </Button>
            
            <Button
              onClick={handleAskAI}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Generate Tool
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default AIAssistant;