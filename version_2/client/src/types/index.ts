export type ServerType = 'python' | 'typescript';

export interface ParameterConstraint {
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  enum?: string[];
  default?: any;
  required?: boolean;
}

export interface Parameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'integer' | 'date' | 'email' | 'url' | 'enum';
  description: string;
  constraints?: ParameterConstraint;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Parameter[];
}

export interface ServerConfig {
  serverName: string;
  serverType: ServerType;
  description: string;
  tools: Tool[];
}

export interface GeneratedServer {
  buildId: string;
  downloadUrl: string;
  serverName: string;
  serverType: ServerType;
}

export type StepStatus = 'completed' | 'current' | 'upcoming';

export interface Step {
  id: number;
  name: string;
  status: StepStatus;
}
