import { ServerConfig } from "@/types";
import { pythonTemplate, typescriptTemplate } from "@/lib/templates";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Maximize2, Copy, Check, ChevronRight, ChevronDown } from "lucide-react";

interface CodePreviewProps {
  serverConfig: ServerConfig;
}

const CodePreview = ({ serverConfig }: CodePreviewProps) => {
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [expandedView, setExpandedView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("code");
  const [showHelp, setShowHelp] = useState(false);
  
  // Function to generate code
  const generateCode = useCallback(() => {
    // Only generate code when we have a valid configuration
    if (serverConfig.serverName && serverConfig.serverType && serverConfig.tools.length > 0) {
      if (serverConfig.serverType === 'python') {
        setCode(pythonTemplate(serverConfig));
        setFileName('server.py');
      } else {
        setCode(typescriptTemplate(serverConfig));
        setFileName('server.js');
      }
    } else {
      setCode("# Please complete the server configuration and add at least one tool");
      setFileName('preview');
    }
  }, [serverConfig]);

  // Generate code whenever config changes (if auto-refresh is enabled)
  useEffect(() => {
    if (autoRefresh) {
      generateCode();
    }
  }, [serverConfig, autoRefresh, generateCode]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    generateCode();
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Toggle expanded view
  const toggleExpandedView = () => {
    setExpandedView(!expandedView);
  };

  // Generate highlighted line count for code
  const codeWithLineNumbers = code.split('\n').map((line, i) => (
    <div key={i} className="table-row">
      <div className="table-cell text-right pr-4 text-neutral-500 select-none w-10">{i + 1}</div>
      <div className="table-cell">{line || " "}</div>
    </div>
  ));

  return (
    <div 
      id="codePreview" 
      className={`mb-8 transition-all duration-300 ${expandedView ? 'fixed inset-4 z-50 bg-white p-6 rounded-lg shadow-2xl overflow-auto' : ''}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-semibold text-xl text-neutral-800">Code Preview</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "text-green-600 border-green-600" : ""}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "text-green-600" : ""} ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleExpandedView}>
            <Maximize2 className="h-4 w-4 mr-2" />
            {expandedView ? "Exit Fullscreen" : "Fullscreen"}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="code" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-2">
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="hints">Implementation Hints</TabsTrigger>
        </TabsList>
        
        <TabsContent value="code" className="mt-0">
          <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900">
              <div className="flex items-center">
                <div className="flex space-x-1.5 mr-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-sm text-neutral-400 font-mono">{fileName}</span>
              </div>
              <div>
                <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-8 text-neutral-400 hover:text-white">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 text-neutral-400 hover:text-white">
                  {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            
            <div className="p-4 overflow-x-auto bg-[#1e1e1e]" style={{ maxHeight: expandedView ? "calc(100vh - 200px)" : "500px" }}>
              <div className="font-mono text-sm text-neutral-100 table">
                {codeWithLineNumbers}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="hints" className="mt-0">
          <div className="bg-white rounded-lg overflow-hidden border border-neutral-200 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-100 border-b border-neutral-200">
              <h3 className="font-medium text-neutral-800">Implementation Guidelines</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)} className="h-8">
                {showHelp ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                {showHelp ? "Hide Details" : "Show Details"}
              </Button>
            </div>
            
            <div className="p-4" style={{ maxHeight: expandedView ? "calc(100vh - 200px)" : "500px", overflowY: "auto" }}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-neutral-800 mb-2 flex items-center">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2">1</div>
                    API Integration
                  </h4>
                  <p className="text-neutral-600 mb-2">Implement external API calls to fetch data for your tools.</p>
                  <div className="bg-neutral-50 p-3 rounded border border-neutral-200 font-mono text-sm">
                    {serverConfig.serverType === 'python' ? (
                      <div className="text-blue-700">
                        <p>import requests</p>
                        <p>response = requests.get("https://api.example.com/data")</p>
                        <p>data = response.json()</p>
                        <p>return data</p>
                      </div>
                    ) : (
                      <div className="text-blue-700">
                        <p>import axios from 'axios';</p>
                        <p>const response = await axios.get("https://api.example.com/data");</p>
                        <p>return response.data;</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-neutral-800 mb-2 flex items-center">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2">2</div>
                    Parameter Validation
                  </h4>
                  <p className="text-neutral-600 mb-2">The generated code already includes parameter validation using {serverConfig.serverType === 'python' ? 'Pydantic' : 'Zod'}.</p>
                  {showHelp && (
                    <div className="bg-neutral-50 p-3 rounded border border-neutral-200 font-mono text-sm">
                      {serverConfig.serverType === 'python' ? (
                        <div className="text-green-700">
                          <p># Custom validation</p>
                          <p>@validator("param_name")</p>
                          <p>def validate_param(cls, v):</p>
                          <p>&nbsp;&nbsp;if not valid_condition:</p>
                          <p>&nbsp;&nbsp;&nbsp;&nbsp;raise ValueError("Validation error message")</p>
                          <p>&nbsp;&nbsp;return v</p>
                        </div>
                      ) : (
                        <div className="text-green-700">
                          <p>// Custom validation with Zod</p>
                          <p>const paramSchema = z.object({`{`}</p>
                          <p>&nbsp;&nbsp;value: z.string().refine(isValid, {`{`}message: "Custom error message"{`}`})</p>
                          <p>{`}`});</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {showHelp && (
                  <>
                    <div>
                      <h4 className="font-medium text-neutral-800 mb-2 flex items-center">
                        <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2">3</div>
                        Error Handling
                      </h4>
                      <p className="text-neutral-600 mb-2">Implement proper error handling to ensure graceful failures:</p>
                      <div className="bg-neutral-50 p-3 rounded border border-neutral-200 font-mono text-sm">
                        {serverConfig.serverType === 'python' ? (
                          <div className="text-red-700">
                            <p>try:</p>
                            <p>&nbsp;&nbsp;# Your code here</p>
                            <p>&nbsp;&nbsp;result = perform_operation()</p>
                            <p>&nbsp;&nbsp;return {`{`}"result": result{`}`}</p>
                            <p>except Exception as e:</p>
                            <p>&nbsp;&nbsp;return {`{`}"error": str(e){`}`}</p>
                          </div>
                        ) : (
                          <div className="text-red-700">
                            <p>try {`{`}</p>
                            <p>&nbsp;&nbsp;// Your code here</p>
                            <p>&nbsp;&nbsp;const result = await performOperation();</p>
                            <p>&nbsp;&nbsp;return {`{`}result{`}`};</p>
                            <p>{`}`} catch (error) {`{`}</p>
                            <p>&nbsp;&nbsp;return {`{`}error: error.message{`}`};</p>
                            <p>{`}`}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-neutral-800 mb-2 flex items-center">
                        <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2">4</div>
                        Testing Your Server
                      </h4>
                      <p className="text-neutral-600">After downloading your server:</p>
                      <ol className="list-decimal ml-5 space-y-1 text-neutral-600">
                        <li>Run the server: {serverConfig.serverType === 'python' ? 'python server.py' : 'node server.js'}</li>
                        <li>Connect to it from Claude with the MCP protocol</li>
                        <li>Test your tools by asking Claude to use them</li>
                      </ol>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CodePreview;