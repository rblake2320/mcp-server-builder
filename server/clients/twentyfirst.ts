import axios from 'axios';

// 21st.dev API client
export class TwentyfirstClient {
  private apiKey: string;
  private baseUrl = 'https://api.21st.dev';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Get available MCP servers from 21st.dev
   */
  async getMcpServers() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/magic/mcp/servers`, 
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching 21st.dev MCP servers:', error);
      throw new Error('Failed to fetch MCP servers from 21st.dev');
    }
  }
  
  /**
   * Get a specific MCP server by ID
   */
  async getMcpServer(serverId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/magic/mcp/servers/${serverId}`, 
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching 21st.dev MCP server ${serverId}:`, error);
      throw new Error('Failed to fetch MCP server from 21st.dev');
    }
  }
  
  /**
   * Get MCP server code by ID
   */
  async getMcpServerCode(serverId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/magic/mcp/servers/${serverId}/code`, 
        { 
          headers: this.headers,
          responseType: 'text' 
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching 21st.dev MCP server code ${serverId}:`, error);
      throw new Error('Failed to fetch MCP server code from 21st.dev');
    }
  }
  
  /**
   * Import MCP server from 21st.dev
   */
  async importMcpServer(serverId: string) {
    try {
      // First get the server details
      const serverInfo = await this.getMcpServer(serverId);
      
      // Then get the server code
      const serverCode = await this.getMcpServerCode(serverId);
      
      return {
        info: serverInfo,
        code: serverCode
      };
    } catch (error) {
      console.error(`Error importing 21st.dev MCP server ${serverId}:`, error);
      throw new Error('Failed to import MCP server from 21st.dev');
    }
  }
}

// Create a singleton instance using the API key from environment variables
const apiKey = process.env.TWENTYFIRST_API_KEY;

// Only initialize if API key is available
let client: TwentyfirstClient | null = null;

if (apiKey) {
  client = new TwentyfirstClient(apiKey);
} else {
  console.warn('TWENTYFIRST_API_KEY not found in environment variables. 21st.dev integration disabled.');
}

export default client;