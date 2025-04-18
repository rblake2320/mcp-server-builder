import { Request, Response } from 'express';
import { createAnthropicService } from './anthropicService';
import { z } from 'zod';

// Validation schema for tool generation requests
const GenerateToolSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  language: z.enum(['python', 'typescript']).optional(),
  complexity: z.enum(['simple', 'advanced']).optional(),
  apiKey: z.string().optional(),
});

// Validation schema for code analysis requests
const AnalyzeCodeSchema = z.object({
  code: z.string().min(10, 'Code must be at least 10 characters'),
  apiKey: z.string().optional(),
});

// Validation schema for documentation generation requests
const GenerateDocumentationSchema = z.object({
  code: z.string().min(10, 'Code must be at least 10 characters'),
  format: z.enum(['markdown', 'html']).optional(),
  includeExamples: z.boolean().optional(),
  apiKey: z.string().optional(),
});

/**
 * Handle requests to generate MCP tool code using Anthropic Claude
 */
export const generateToolHandler = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = GenerateToolSchema.parse(req.body);
    
    // Use either the provided API key or the environment variable
    const apiKey = validatedData.apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Anthropic API key is required',
      });
    }
    
    // Create Anthropic service
    const anthropicService = createAnthropicService(apiKey);
    
    // Generate tool code
    const generatedCode = await anthropicService.generateTool(
      validatedData.prompt,
      {
        language: validatedData.language,
        complexity: validatedData.complexity,
      }
    );
    
    return res.json({
      success: true,
      generatedCode,
      message: 'Tool generated successfully with Anthropic Claude',
    });
  } catch (error) {
    console.error('Error generating tool with Anthropic:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
};

/**
 * Handle requests to analyze MCP server code using Anthropic Claude
 */
export const analyzeCodeHandler = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = AnalyzeCodeSchema.parse(req.body);
    
    // Use either the provided API key or the environment variable
    const apiKey = validatedData.apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Anthropic API key is required',
      });
    }
    
    // Create Anthropic service
    const anthropicService = createAnthropicService(apiKey);
    
    // Analyze code
    const analysis = await anthropicService.analyzeCode(validatedData.code);
    
    return res.json({
      success: true,
      analysis,
      message: 'Code analyzed successfully with Anthropic Claude',
    });
  } catch (error) {
    console.error('Error analyzing code with Anthropic:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
};

/**
 * Handle requests to generate documentation for MCP server code using Anthropic Claude
 */
export const generateDocumentationHandler = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = GenerateDocumentationSchema.parse(req.body);
    
    // Use either the provided API key or the environment variable
    const apiKey = validatedData.apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Anthropic API key is required',
      });
    }
    
    // Create Anthropic service
    const anthropicService = createAnthropicService(apiKey);
    
    // Generate documentation
    const documentation = await anthropicService.generateDocumentation(
      validatedData.code,
      {
        format: validatedData.format,
        includeExamples: validatedData.includeExamples,
      }
    );
    
    return res.json({
      success: true,
      documentation,
      message: 'Documentation generated successfully with Anthropic Claude',
    });
  } catch (error) {
    console.error('Error generating documentation with Anthropic:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
};