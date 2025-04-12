import { Parameter } from "@/types";
import { useState, useEffect } from "react";

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

  return (
    <div className="p-3 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-neutral-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">Type</label>
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
            <label className="block text-xs font-medium text-neutral-700 mb-1">Description</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-neutral-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
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
