import { Parameter, ParameterConstraint } from "@/types";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ParameterFormProps {
  parameter: Parameter;
  onUpdate: (updatedParameter: Parameter) => void;
  onRemove: () => void;
}

const ParameterForm = ({ parameter, onUpdate, onRemove }: ParameterFormProps) => {
  const [name, setName] = useState(parameter.name);
  const [type, setType] = useState(parameter.type);
  const [description, setDescription] = useState(parameter.description);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [constraints, setConstraints] = useState<ParameterConstraint>(
    parameter.constraints || {}
  );
  const [enumValues, setEnumValues] = useState<string>(
    parameter.constraints?.enum ? parameter.constraints.enum.join(',') : ''
  );

  // Update parent component when form values change
  useEffect(() => {
    // Update parameter with constraints only if they're defined
    const updatedParameter: Parameter = {
      ...parameter,
      name,
      type,
      description
    };

    // Only add constraints if there are any defined
    if (Object.keys(constraints).length > 0) {
      updatedParameter.constraints = constraints;
    }

    onUpdate(updatedParameter);
  }, [name, type, description, constraints]);

  // Handle parameter name change with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to snake_case (lowercase with underscores)
    const value = e.target.value.replace(/\s+/g, '_').toLowerCase();
    setName(value);
  };

  // Handle constraint changes
  const updateConstraint = <K extends keyof ParameterConstraint>(
    key: K, 
    value: ParameterConstraint[K] | undefined
  ) => {
    setConstraints(prev => {
      const newConstraints = { ...prev };
      
      if (value === undefined || value === "" || value === null) {
        delete newConstraints[key];
      } else {
        newConstraints[key] = value;
      }
      
      return newConstraints;
    });
  };

  // Handle enum values change
  const handleEnumValuesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEnumValues(value);
    
    if (value.trim()) {
      // Split by comma and trim each value
      const enumArray = value.split(',').map(item => item.trim());
      updateConstraint('enum', enumArray);
    } else {
      updateConstraint('enum', undefined);
    }
  };

  // Render constraint fields based on parameter type
  const renderConstraintFields = () => {
    switch (type) {
      case 'string':
      case 'email':
      case 'url':
        return (
          <>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <Label className="text-xs">Min Length</Label>
                <Input 
                  type="number"
                  min="0"
                  className="text-xs h-8"
                  value={constraints.minLength || ''}
                  onChange={(e) => updateConstraint('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label className="text-xs">Max Length</Label>
                <Input 
                  type="number"
                  min="0"
                  className="text-xs h-8"
                  value={constraints.maxLength || ''}
                  onChange={(e) => updateConstraint('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="mb-2">
              <Label className="text-xs">Pattern (Regex)</Label>
              <Input 
                type="text"
                className="text-xs h-8"
                value={constraints.pattern || ''}
                onChange={(e) => updateConstraint('pattern', e.target.value || undefined)}
                placeholder="e.g., ^[A-Za-z0-9]+$"
              />
            </div>
            <div className="mb-2">
              <Label className="text-xs">Default Value</Label>
              <Input 
                type="text"
                className="text-xs h-8"
                value={constraints.default || ''}
                onChange={(e) => updateConstraint('default', e.target.value || undefined)}
                placeholder="Optional default value"
              />
            </div>
          </>
        );
      
      case 'number':
      case 'integer':
        return (
          <>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <Label className="text-xs">Minimum Value</Label>
                <Input 
                  type="number"
                  className="text-xs h-8"
                  value={constraints.minimum || ''}
                  onChange={(e) => updateConstraint('minimum', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label className="text-xs">Maximum Value</Label>
                <Input 
                  type="number"
                  className="text-xs h-8"
                  value={constraints.maximum || ''}
                  onChange={(e) => updateConstraint('maximum', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="mb-2">
              <Label className="text-xs">Default Value</Label>
              <Input 
                type="number"
                className="text-xs h-8"
                value={constraints.default || ''}
                onChange={(e) => updateConstraint('default', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Optional default value"
              />
            </div>
          </>
        );
      
      case 'enum':
        return (
          <div className="mb-2">
            <Label className="text-xs">Enum Values (comma-separated)</Label>
            <Input 
              type="text"
              className="text-xs h-8"
              value={enumValues}
              onChange={handleEnumValuesChange}
              placeholder="e.g., red,green,blue"
            />
            <p className="text-xs text-neutral-500 mt-1">Enter possible values separated by commas</p>
          </div>
        );
      
      case 'boolean':
        return (
          <div className="mb-2">
            <Label className="text-xs">Default Value</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Checkbox 
                id={`${parameter.id}-default-true`}
                checked={constraints.default === true}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateConstraint('default', true);
                  } else {
                    updateConstraint('default', undefined);
                  }
                }}
              />
              <Label htmlFor={`${parameter.id}-default-true`} className="text-xs">True</Label>
              
              <Checkbox 
                id={`${parameter.id}-default-false`}
                checked={constraints.default === false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateConstraint('default', false);
                  } else {
                    updateConstraint('default', undefined);
                  }
                }}
              />
              <Label htmlFor={`${parameter.id}-default-false`} className="text-xs">False</Label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
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
                  <p className="w-80">The data type of this parameter. Choose the most specific type that applies to your parameter.</p>
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
            <option value="integer">integer</option>
            <option value="boolean">boolean</option>
            <option value="object">object</option>
            <option value="array">array</option>
            <option value="date">date</option>
            <option value="email">email</option>
            <option value="url">url</option>
            <option value="enum">enum (select from options)</option>
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
      
      {/* Advanced options collapsible section */}
      <Collapsible 
        open={showAdvanced} 
        onOpenChange={setShowAdvanced}
        className="mt-2 border-t border-dashed border-neutral-200 pt-2"
      >
        <CollapsibleTrigger className="flex items-center text-xs text-neutral-600 hover:text-primary focus:outline-none cursor-pointer">
          <Settings className="h-3 w-3 mr-1" />
          Advanced Options
          {showAdvanced ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 pl-2 border-l-2 border-neutral-100">
          <div className="flex items-center mb-2">
            <Checkbox 
              id={`${parameter.id}-required`}
              checked={constraints.required === true}
              onCheckedChange={(checked) => {
                updateConstraint('required', checked ? true : undefined);
              }}
            />
            <Label htmlFor={`${parameter.id}-required`} className="ml-2 text-xs">
              Required parameter
            </Label>
          </div>
          
          {renderConstraintFields()}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ParameterForm;
