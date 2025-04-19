import Anthropic from '@anthropic-ai/sdk';

/**
 * AnthropicService provides integration with Claude AI via Anthropic's API
 * This service enables text generation, summarization, and other AI capabilities
 */
export class AnthropicService {
  private client: Anthropic;
  
  /**
   * Initialize the Anthropic client with the provided API key
   * @param apiKey - Anthropic API key
   */
  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
  }
  
  /**
   * Generate a text completion using Claude
   * @param prompt - The prompt to use for text generation
   * @param options - Additional options for the completion
   * @returns The generated text response
   */
  async generateText(
    prompt: string, 
    options: {
      maxTokens?: number;
      temperature?: number;
      system?: string;
    } = {}
  ): Promise<string> {
    try {
      const { maxTokens = 1024, temperature = 0.7, system } = options;
      
      // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      const response = await this.client.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: maxTokens,
        temperature,
        system: system,
        messages: [
          { role: 'user', content: prompt }
        ],
      });
      
      // Check if we have content and it's a text block
      const firstContent = response.content[0];
      if (firstContent && 'type' in firstContent && firstContent.type === 'text' && 'text' in firstContent) {
        return firstContent.text;
      }
      
      return 'Unable to extract text from Anthropic response';
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error generating text with Anthropic Claude:', errorMessage);
      throw new Error(`Failed to generate text: ${errorMessage}`);
    }
  }
  
  /**
   * Generate MCP server tool code using Claude
   * @param description - Description of the tool to generate
   * @param options - Additional generation options
   * @returns Generated tool code
   */
  async generateTool(
    description: string,
    options: {
      language?: 'python' | 'typescript';
      complexity?: 'simple' | 'advanced';
    } = {}
  ): Promise<string> {
    const { language = 'typescript', complexity = 'simple' } = options;
    
    const systemPrompt = `You are an expert MCP server tool developer. 
Your task is to create well-structured, functional tool code following the MCP protocol.
Generate ${complexity} and well-documented ${language} code with proper error handling.`;
    
    const userPrompt = `Create an MCP server tool based on this description:
${description}

Requirements:
1. Follow MCP protocol standards
2. Include parameter validation
3. Add comprehensive error handling
4. Write clear documentation comments
5. Use ${language} best practices
6. Make the tool ${complexity === 'simple' ? 'simple and focused' : 'comprehensive with advanced features'}

Return ONLY the code without any explanations or markdown formatting.`;
    
    return this.generateText(userPrompt, {
      maxTokens: 2048,
      temperature: 0.2, // Lower temperature for more deterministic code generation
      system: systemPrompt
    });
  }
  
  /**
   * Analyze and provide feedback on MCP server code
   * @param code - The code to analyze
   * @returns Analysis and improvement suggestions
   */
  async analyzeCode(code: string): Promise<{
    quality: number;
    strengths: string[];
    improvements: string[];
    summary: string;
  }> {
    const systemPrompt = `You are an expert code reviewer specializing in MCP server implementations.
Analyze code quality, identify strengths and potential improvements for MCP servers.
Always return JSON format with the keys: quality (0-10 rating), strengths (array), improvements (array), and summary (string).`;
    
    const userPrompt = `Analyze this MCP server code and provide constructive feedback:
\`\`\`
${code}
\`\`\`

Provide a quality rating (0-10), list of strengths, suggested improvements, and a brief summary.
Format your response as valid JSON with the keys: quality, strengths, improvements, and summary.`;
    
    try {
      const responseText = await this.generateText(userPrompt, {
        maxTokens: 1536,
        temperature: 0.3,
        system: systemPrompt
      });
      
      // Parse JSON response
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error analyzing code:', error);
      return {
        quality: 5,
        strengths: ['Unable to analyze code strengths'],
        improvements: ['API error occurred during analysis'],
        summary: 'Code analysis failed due to an error with the Anthropic API'
      };
    }
  }
  
  /**
   * Generate documentation for an MCP server or tool
   * @param code - The code to document
   * @param options - Documentation options
   * @returns Generated documentation in Markdown format
   */
  async generateDocumentation(
    code: string,
    options: {
      format?: 'markdown' | 'html';
      includeExamples?: boolean;
    } = {}
  ): Promise<string> {
    const { format = 'markdown', includeExamples = true } = options;
    
    const systemPrompt = `You are a technical documentation expert specializing in MCP servers.
Create comprehensive, clear documentation in ${format} format.
${includeExamples ? 'Include practical usage examples.' : 'Focus on functionality without examples.'}`;
    
    const userPrompt = `Generate documentation for this MCP server code:
\`\`\`
${code}
\`\`\`

Include:
- Overview of functionality
- Parameter descriptions
- Return value details
- Error handling information
${includeExamples ? '- Usage examples' : ''}

Format as ${format}.`;
    
    return this.generateText(userPrompt, {
      maxTokens: 2048,
      temperature: 0.4,
      system: systemPrompt
    });
  }
}

/**
 * Initialize an Anthropic service with the provided API key
 * @param apiKey - Anthropic API key
 * @returns Initialized AnthropicService instance
 */
export function createAnthropicService(apiKey: string): AnthropicService {
  return new AnthropicService(apiKey);
}