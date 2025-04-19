import express from 'express';
import { analyzeCode } from '../services/code-analyzer';

const router = express.Router();

// API endpoint for code analysis
router.post('/analyze', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Code is required and must be a string',
      });
    }
    
    const result = await analyzeCode(code);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error analyzing code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze code complexity',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;