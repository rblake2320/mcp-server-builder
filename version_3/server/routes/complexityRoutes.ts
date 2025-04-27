import { Router, Request, Response } from 'express';
import { analyzeCodeComplexity, ComplexityResultSchema } from '../services/complexityAnalyzer';
import { z } from 'zod';

const complexityRouter = Router();

// Schema for validation
const AnalyzeRequestSchema = z.object({
  code: z.string().min(1, "Code is required").max(50000, "Code is too large"),
  apiKey: z.string().optional()
});

/**
 * Route to analyze code complexity
 * POST /api/analyze-complexity
 */
complexityRouter.post('/analyze-complexity', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = AnalyzeRequestSchema.parse(req.body);
    
    // Check if Google API key is available
    // First try to get it from request body (if provided by frontend)
    // Then fallback to environment variable
    const apiKey = req.body.apiKey || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        message: "Server configuration error: Google API key is missing" 
      });
    }
    
    // Analyze code complexity
    const result = await analyzeCodeComplexity(validatedData.code, apiKey);
    
    // Validate the result against our schema
    const validatedResult = ComplexityResultSchema.parse(result);
    
    return res.status(200).json(validatedResult);
  } catch (error) {
    console.error('Error analyzing code complexity:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid request format", 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to analyze code complexity",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default complexityRouter;