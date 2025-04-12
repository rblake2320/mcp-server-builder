export type ServerType = 'python' | 'typescript';

export interface Parameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
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
