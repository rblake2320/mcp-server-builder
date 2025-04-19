/**
 * MCP Server with LLM Integration Template
 * 
 * This template demonstrates how to create an MCP server that integrates
 * with Large Language Models (LLMs) like OpenAI's GPT or Anthropic's Claude.
 * 
 * Features:
 * - Text analysis tools (summarization, classification, extraction)
 * - LLM-powered tools with configurable model parameters
 * - Caching for performance and cost optimization
 * - Error handling and retry mechanisms
 * 
 * Dependencies:
 * - express: Web server framework
 * - dotenv: Environment variable management
 * - node-cache: In-memory caching
 * - openai or @anthropic-ai/sdk: LLM API client (uncomment your choice)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
// Uncomment one of the following depending on your preferred LLM provider:
// const OpenAI = require('openai');
// const Anthropic = require('@anthropic-ai/sdk');

// Create Express server
const app = express();
app.use(express.json());
app.use(cors());

// Initialize cache with TTL of 30 minutes
const cache = new NodeCache({ stdTTL: 1800 });

// Initialize LLM client
// Uncomment one of the following depending on your preferred LLM provider:
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// MCP Protocol version
const MCP_PROTOCOL_VERSION = '0.1';

// Available tools
const TOOLS = [
  {
    name: 'summarize_text',
    description: 'Generate a concise summary of the provided text',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to summarize'
        },
        max_length: {
          type: 'number',
          description: 'Maximum length of summary in words',
          default: 100
        },
        format: {
          type: 'string',
          enum: ['paragraph', 'bullets'],
          description: 'Format of the summary',
          default: 'paragraph'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'extract_entities',
    description: 'Extract named entities (people, organizations, locations, etc.) from text',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to analyze'
        },
        entity_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['person', 'organization', 'location', 'date', 'product', 'event', 'all']
          },
          description: 'Types of entities to extract',
          default: ['all']
        }
      },
      required: ['text']
    }
  },
  {
    name: 'classify_text',
    description: 'Classify text into predefined or custom categories',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to classify'
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of categories for classification',
          default: ['positive', 'negative', 'neutral']
        },
        multi_label: {
          type: 'boolean',
          description: 'Whether multiple categories can be assigned',
          default: false
        }
      },
      required: ['text']
    }
  },
  {
    name: 'answer_question',
    description: 'Answer a question based on the provided context',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The question to answer'
        },
        context: {
          type: 'string',
          description: 'Context information to base the answer on'
        },
        model_params: {
          type: 'object',
          properties: {
            temperature: {
              type: 'number',
              description: 'Controls randomness (0.0 to 1.0)',
              default: 0.7
            },
            max_tokens: {
              type: 'number',
              description: 'Maximum length of response',
              default: 300
            }
          }
        }
      },
      required: ['question', 'context']
    }
  }
];

/**
 * Helper function to validate parameters against a tool's schema
 */
function validateParameters(tool, params) {
  const schema = tool.parameters;
  const errors = [];
  
  // Check required parameters
  for (const required of schema.required || []) {
    if (params[required] === undefined) {
      errors.push(`Missing required parameter: ${required}`);
    }
  }
  
  // Check parameter types and enums
  for (const [param, value] of Object.entries(params)) {
    const paramSchema = schema.properties[param];
    
    if (!paramSchema) {
      errors.push(`Unknown parameter: ${param}`);
      continue;
    }
    
    // Type checking
    if (paramSchema.type === 'string' && typeof value !== 'string') {
      errors.push(`Parameter ${param} must be a string`);
    } else if (paramSchema.type === 'number' && typeof value !== 'number') {
      errors.push(`Parameter ${param} must be a number`);
    } else if (paramSchema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Parameter ${param} must be a boolean`);
    } else if (paramSchema.type === 'array' && !Array.isArray(value)) {
      errors.push(`Parameter ${param} must be an array`);
    } else if (paramSchema.type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
      errors.push(`Parameter ${param} must be an object`);
    }
    
    // Enum validation
    if (paramSchema.enum && !paramSchema.enum.includes(value)) {
      errors.push(`Parameter ${param} must be one of: ${paramSchema.enum.join(', ')}`);
    }
  }
  
  return errors;
}

/**
 * Summarize text using LLM
 */
async function summarizeText(text, maxLength = 100, format = 'paragraph') {
  // Create cache key
  const cacheKey = `summarize_${text.substring(0, 100)}_${maxLength}_${format}`;
  
  // Check cache
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    // Example implementation using OpenAI (uncomment and adjust as needed)
    /*
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Summarize the following text in ${format === 'paragraph' ? 'a single paragraph' : 'bullet points'} 
                    with a maximum of ${maxLength} words. Focus on the key points and main ideas.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });
    
    const summary = response.choices[0].message.content.trim();
    */
    
    // Example implementation using Anthropic (uncomment and adjust as needed)
    /*
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      system: `Summarize the following text in ${format === 'paragraph' ? 'a single paragraph' : 'bullet points'} 
               with a maximum of ${maxLength} words. Focus on the key points and main ideas.`,
      messages: [
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });
    
    const summary = response.content[0].text;
    */
    
    // Mock implementation for demonstration
    const words = text.split(/\s+/);
    let summary;
    
    if (format === 'paragraph') {
      summary = words.slice(0, Math.min(maxLength, words.length)).join(' ');
    } else {
      // Create bullet points from first sentences
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      summary = sentences.slice(0, Math.min(5, sentences.length))
        .map(s => '• ' + s.trim())
        .join('\n');
    }
    
    const result = {
      summary,
      original_length: words.length,
      summary_length: summary.split(/\s+/).length,
      format
    };
    
    // Cache the result
    cache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Summarization error:', error);
    throw new Error('Failed to summarize text: ' + error.message);
  }
}

/**
 * Extract entities from text using LLM
 */
async function extractEntities(text, entityTypes = ['all']) {
  // Create cache key
  const cacheKey = `entities_${text.substring(0, 100)}_${entityTypes.join('_')}`;
  
  // Check cache
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    // Example implementation using OpenAI (uncomment and adjust as needed)
    /*
    const types = entityTypes.includes('all') 
      ? 'all entity types (people, organizations, locations, dates, products, events)'
      : entityTypes.join(', ');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Extract ${types} from the following text. 
                   Return a JSON object with entity types as keys and arrays of entities as values.`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.3,
    });
    
    const entities = JSON.parse(response.choices[0].message.content);
    */
    
    // Mock implementation for demonstration
    const entities = {
      person: ['John Doe', 'Jane Smith'],
      organization: ['Acme Corp', 'Global Industries'],
      location: ['New York', 'London'],
      date: ['January 15, 2025', 'Next week'],
      product: ['New Product X', 'Service Y'],
      event: ['Annual Conference', 'Product Launch']
    };
    
    // Filter types if not 'all'
    if (!entityTypes.includes('all')) {
      for (const type in entities) {
        if (!entityTypes.includes(type)) {
          delete entities[type];
        }
      }
    }
    
    const result = {
      entities,
      entity_count: Object.values(entities).flat().length,
      types_found: Object.keys(entities)
    };
    
    // Cache the result
    cache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Entity extraction error:', error);
    throw new Error('Failed to extract entities: ' + error.message);
  }
}

/**
 * Classify text using LLM
 */
async function classifyText(text, categories = ['positive', 'negative', 'neutral'], multiLabel = false) {
  // Create cache key
  const cacheKey = `classify_${text.substring(0, 100)}_${categories.join('_')}_${multiLabel}`;
  
  // Check cache
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    // Example implementation using OpenAI (uncomment and adjust as needed)
    /*
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Classify the following text into ${multiLabel ? 'one or more of' : 'exactly one of'} 
                   these categories: ${categories.join(', ')}. 
                   Return a JSON object with 'categories' (array of assigned categories), 
                   'confidence' (number from 0-1 for each category), and 'explanation' (brief reason).`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3,
    });
    
    const classification = JSON.parse(response.choices[0].message.content);
    */
    
    // Mock implementation for demonstration
    let classification;
    
    if (multiLabel) {
      // Randomly select 1-3 categories
      const selectedCategories = categories
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.ceil(Math.random() * Math.min(3, categories.length)));
      
      classification = {
        categories: selectedCategories,
        confidence: Object.fromEntries(
          selectedCategories.map(cat => [cat, Number((0.7 + Math.random() * 0.3).toFixed(2))])
        ),
        explanation: `The text contains elements of ${selectedCategories.join(', ')}.`
      };
    } else {
      // Select just one category
      const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
      
      classification = {
        categories: [selectedCategory],
        confidence: {
          [selectedCategory]: Number((0.7 + Math.random() * 0.3).toFixed(2))
        },
        explanation: `The text is primarily ${selectedCategory}.`
      };
    }
    
    // Cache the result
    cache.set(cacheKey, classification);
    
    return classification;
  } catch (error) {
    console.error('Classification error:', error);
    throw new Error('Failed to classify text: ' + error.message);
  }
}

/**
 * Answer a question based on context using LLM
 */
async function answerQuestion(question, context, modelParams = {}) {
  // Default model parameters
  const temperature = modelParams.temperature || 0.7;
  const maxTokens = modelParams.max_tokens || 300;
  
  // Create cache key
  const cacheKey = `answer_${question}_${context.substring(0, 100)}_${temperature}_${maxTokens}`;
  
  // Check cache
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    // Example implementation using OpenAI (uncomment and adjust as needed)
    /*
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Answer the question based solely on the information in the provided context. 
                   If the context doesn't contain the information needed to answer the question, 
                   say "I can't answer this based on the provided context."`
        },
        {
          role: "user",
          content: `Context: ${context}\n\nQuestion: ${question}`
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    });
    
    const answer = response.choices[0].message.content.trim();
    */
    
    // Mock implementation for demonstration
    let answer;
    
    if (context.length < 50 || !context.toLowerCase().includes(question.toLowerCase().replace(/[?.,]/g, ''))) {
      answer = "I can't answer this based on the provided context.";
    } else {
      // Extract a sentence that might contain the answer
      const sentences = context.match(/[^.!?]+[.!?]+/g) || [];
      const relevantSentence = sentences.find(s => 
        question.toLowerCase().split(' ').some(word => 
          word.length > 3 && s.toLowerCase().includes(word.toLowerCase())
        )
      ) || sentences[0];
      
      answer = `Based on the context, ${relevantSentence.trim()}`;
    }
    
    const result = {
      answer,
      question,
      model_parameters: {
        temperature,
        max_tokens: maxTokens
      }
    };
    
    // Cache the result
    cache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Question answering error:', error);
    throw new Error('Failed to answer question: ' + error.message);
  }
}

// MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    const requestData = req.body;
    
    // Validate MCP request format
    if (!requestData || !requestData.tool || !requestData.parameters) {
      return res.status(400).json({
        error: 'Invalid MCP request format'
      });
    }
    
    const { tool: toolName, parameters } = requestData;
    
    // Find the requested tool
    const tool = TOOLS.find(t => t.name === toolName);
    
    if (!tool) {
      return res.status(404).json({
        error: `Tool not found: ${toolName}`
      });
    }
    
    // Validate parameters
    const validationErrors = validateParameters(tool, parameters);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Parameter validation failed',
        details: validationErrors
      });
    }
    
    // Execute the appropriate tool
    let result;
    
    switch (toolName) {
      case 'summarize_text':
        result = await summarizeText(
          parameters.text,
          parameters.max_length,
          parameters.format
        );
        break;
        
      case 'extract_entities':
        result = await extractEntities(
          parameters.text,
          parameters.entity_types
        );
        break;
        
      case 'classify_text':
        result = await classifyText(
          parameters.text,
          parameters.categories,
          parameters.multi_label
        );
        break;
        
      case 'answer_question':
        result = await answerQuestion(
          parameters.question,
          parameters.context,
          parameters.model_params
        );
        break;
        
      default:
        return res.status(500).json({
          error: `Tool implementation missing: ${toolName}`
        });
    }
    
    // Return successful response
    res.json({
      tool: toolName,
      result
    });
  } catch (error) {
    console.error('MCP request error:', error);
    
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// MCP capabilities endpoint
app.get('/mcp', (req, res) => {
  res.json({
    protocol: 'mcp',
    version: MCP_PROTOCOL_VERSION,
    tools: TOOLS
  });
});

// Root endpoint for info
app.get('/', (req, res) => {
  res.json({
    name: 'LLM Integration MCP Server',
    description: 'An MCP server that integrates with Large Language Models',
    version: '1.0.0',
    protocol: 'mcp',
    protocol_version: MCP_PROTOCOL_VERSION,
    endpoints: {
      '/': 'This info page',
      '/mcp': 'MCP capabilities (GET) and tool execution (POST)'
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LLM Integration MCP Server running on port ${PORT}`);
});