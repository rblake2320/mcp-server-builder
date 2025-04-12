import { Parameter } from "@/types";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ParameterFormProps {
  parameter: Parameter;
  onUpdate: (updatedParameter: Parameter) => void;
  onRemove: () => void;
}

const ParameterForm = ({ parameter, onUpdate, onRemove }: ParameterFormProps) => {
  const [name, setName] = useState(parameter.name);
  const [type, setType] = useState(parameter.type);
  const [description, setDescription] = useState(parameter.description);

  // Update parent component when form values change
  useEffect(() => {
    onUpdate({
      ...parameter,
      name,
      type,
      description
    });
  }, [name, type, description]);

  // Handle parameter name change with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to snake_case (lowercase with underscores)
    const value = e.target.value.replace(/\s+/g, '_').toLowerCase();
    setName(value);
  };

  return (
    <div className="p-3 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="flex items-center mb-1">
            <label className="block text-xs font-medium text-neutral-700">Name</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <HelpCircle className="h-3 w-3 text-neutral-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">Parameter name in snake_case format. This will be used as a variable name in the code.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <input 
            type="text" 
            value={name}
            onChange={handleNameChange}
            className="w-full px-2 py-1 text-sm border border-neutral-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
            placeholder="e.g., location"
          />
        </div>
        <div>
          <div className="flex items-center mb-1">
            <label className="block text-xs font-medium text-neutral-700">Type</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <HelpCircle className="h-3 w-3 text-neutral-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">The data type of this parameter. String for text, number for numerical values, boolean for true/false, object for JSON objects, array for lists.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value as Parameter['type'])}
            className="w-full px-2 py-1 text-sm border border-neutral-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="object">object</option>
            <option value="array">array</option>
          </select>
        </div>
        <div className="flex">
          <div className="flex-grow">
            <div className="flex items-center mb-1">
              <label className="block text-xs font-medium text-neutral-700">Description</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 cursor-help">
                      <HelpCircle className="h-3 w-3 text-neutral-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-80">A clear description of what this parameter does, its purpose, and expected values. This helps Claude understand how to use this parameter.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-neutral-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
              placeholder="e.g., City name or zip code"
            />
          </div>
          <button 
            onClick={onRemove}
            className="ml-2 mt-6 text-neutral-400 hover:text-error-500 focus:outline-none" 
            title="Remove Parameter"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterForm;
