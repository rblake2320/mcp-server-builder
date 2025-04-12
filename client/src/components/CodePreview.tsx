import { ServerConfig } from "@/types";
import { pythonTemplate, typescriptTemplate } from "@/lib/templates";
import { useEffect, useState } from "react";

interface CodePreviewProps {
  serverConfig: ServerConfig;
}

const CodePreview = ({ serverConfig }: CodePreviewProps) => {
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
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

  return (
    <div id="codePreview" className="mb-8">
      <h2 className="font-heading font-semibold text-xl text-neutral-800 mb-4">Generated Code Preview</h2>
      
      <div className="bg-neutral-800 rounded-lg overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-neutral-900">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="ml-3 text-sm text-neutral-400">{fileName}</span>
        </div>
        
        <div className="p-4 overflow-x-auto">
          <pre className="text-neutral-100 text-sm"><code>{code}</code></pre>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
