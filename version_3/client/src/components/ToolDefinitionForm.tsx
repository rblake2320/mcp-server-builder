import { Tool, Parameter } from "@/types";
import { v4 as uuidv4 } from "uuid";
import ParameterForm from "./ParameterForm";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ToolDefinitionFormProps {
  tools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

const ToolDefinitionForm = ({ tools, onToolsChange }: ToolDefinitionFormProps) => {
  // Add a new tool to the list
  const handleAddTool = () => {
    const newTool: Tool = {
      id: uuidv4(),
      name: "",
      description: "",
      parameters: []
    };
    onToolsChange([...tools, newTool]);
  };

  // Remove a tool from the list
  const handleRemoveTool = (toolId: string) => {
    onToolsChange(tools.filter(tool => tool.id !== toolId));
  };

  // Update a tool's properties
  const handleToolChange = (toolId: string, field: keyof Tool, value: string) => {
    onToolsChange(
      tools.map(tool => 
        tool.id === toolId 
          ? { ...tool, [field]: value } 
          : tool
      )
    );
  };

  // Add a parameter to a tool
  const handleAddParameter = (toolId: string) => {
    const newParameter: Parameter = {
      id: uuidv4(),
      name: "",
      type: "string",
      description: ""
    };
    
    onToolsChange(
      tools.map(tool => 
        tool.id === toolId 
          ? { ...tool, parameters: [...tool.parameters, newParameter] } 
          : tool
      )
    );
  };

  // Update a parameter's properties
  const handleParameterUpdate = (toolId: string, updatedParameter: Parameter) => {
    onToolsChange(
      tools.map(tool => 
        tool.id === toolId 
          ? { 
              ...tool, 
              parameters: tool.parameters.map(param => 
                param.id === updatedParameter.id ? updatedParameter : param
              ) 
            } 
          : tool
      )
    );
  };

  // Remove a parameter from a tool
  const handleRemoveParameter = (toolId: string, paramId: string) => {
    onToolsChange(
      tools.map(tool => 
        tool.id === toolId 
          ? { ...tool, parameters: tool.parameters.filter(param => param.id !== paramId) } 
          : tool
      )
    );
  };

  return (
    <div id="toolDefinition" className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-semibold text-xl text-neutral-800">Define Your Tools</h2>
        <button 
          id="addTool" 
          onClick={handleAddTool}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <i className="fas fa-plus mr-2"></i> Add Tool
        </button>
      </div>
      
      {tools.length === 0 ? (
        <div className="text-center p-8 bg-neutral-50 border border-dashed border-neutral-300 rounded-lg">
          <p className="text-neutral-600">No tools defined yet. Click "Add Tool" to get started.</p>
        </div>
      ) : (
        tools.map((tool, index) => (
          <div key={tool.id} className="tool-card bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-heading font-medium text-lg text-neutral-800">Tool #{index + 1}</h3>
              <button 
                onClick={() => handleRemoveTool(tool.id)}
                className="text-neutral-400 hover:text-error-500 focus:outline-none" 
                title="Remove Tool"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center mb-1">
                  <label className="block text-sm font-medium text-neutral-700">Tool Name</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 cursor-help">
                          <HelpCircle className="h-4 w-4 text-neutral-400" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-80">Use a descriptive name in snake_case format (e.g., get_weather_data). This will be the function name that Claude calls.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input 
                  type="text" 
                  value={tool.name}
                  onChange={(e) => {
                    // Validate tool name to follow snake_case format
                    const value = e.target.value.replace(/\s+/g, '_').toLowerCase();
                    handleToolChange(tool.id, 'name', value);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                  placeholder="e.g., get_weather_forecast"
                />
                <p className="mt-1 text-xs text-neutral-500">Use snake_case (lowercase with underscores)</p>
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <label className="block text-sm font-medium text-neutral-700">Description</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 cursor-help">
                          <HelpCircle className="h-4 w-4 text-neutral-400" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-80">A clear description of what this tool does. Be specific about inputs and outputs to help Claude understand when to use this tool.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input 
                  type="text" 
                  value={tool.description}
                  onChange={(e) => handleToolChange(tool.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                  placeholder="What this tool does"
                />
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-neutral-700">Parameters</label>
                <button 
                  onClick={() => handleAddParameter(tool.id)}
                  className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  <i className="fas fa-plus mr-1"></i> Add Parameter
                </button>
              </div>
              
              <div className="parameter-list border border-neutral-200 rounded-md divide-y divide-neutral-200">
                {tool.parameters.length === 0 ? (
                  <div className="p-3 bg-white text-center">
                    <p className="text-sm text-neutral-500">No parameters added yet</p>
                  </div>
                ) : (
                  tool.parameters.map((param) => (
                    <ParameterForm 
                      key={param.id} 
                      parameter={param} 
                      onUpdate={(updatedParam) => handleParameterUpdate(tool.id, updatedParam)}
                      onRemove={() => handleRemoveParameter(tool.id, param.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ToolDefinitionForm;
