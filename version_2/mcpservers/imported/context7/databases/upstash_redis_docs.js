/**
 * DocGen MCP Server: docs
 * 
 * This MCP server provides access to docs documentation and code snippets.
 * It allows AI assistants to search, retrieve, and use documentation and
 * code examples from upstash/docs.
 * 
 * Data sourced from Context7
 */

const express = require('express');
const cors = require('cors');

// Create Express server
const app = express();
app.use(express.json());
app.use(cors());

// MCP Protocol version
const MCP_PROTOCOL_VERSION = '0.1';

// Documentation data
const DOC_DATA = {
  "name": "docs",
  "owner": "upstash",
  "repo": "upstash/docs",
  "sections": [
    {
      "title": "Introduction"
    },
    {
      "title": "API Reference"
    },
    {
      "title": "Examples"
    },
    {
      "title": "FAQ"
    }
  ],
  "metadata": {
    "language": "javascript",
    "version": "4.9.4",
    "lastUpdate": "2025-04-27T01:40:35.179Z"
  }
};

// Documentation sections
const SECTIONS = [
  {
    "title": "Introduction",
    "content": "# docs\n\nThis is the documentation for docs. It provides an overview of key features and how to use them.\n\n## Installation\n\n```bash\nnpm install docs\n```\n\n## Getting Started\n\nHere's a simple example to get started:"
  },
  {
    "title": "API Reference",
    "content": "# API Reference\n\nThis section documents the docs API.\n\n## Core APIs\n\nThe core functionality is exposed through these main functions and classes.\n\n### `function1(param1, param2)`\n\nDescription of function1 and its parameters.\n\n### `class Class1`\n\nDescription of Class1 and its methods."
  },
  {
    "title": "Examples",
    "content": "# Examples\n\nHere are some examples of common use cases for docs.\n\n## Basic Example\n\n```javascript\n// Example code here\n```\n\n## Advanced Example\n\n```javascript\n// Advanced example code here\n```"
  },
  {
    "title": "FAQ",
    "content": "# Frequently Asked Questions\n\n## How do I install docs?\n\nYou can install docs using npm or yarn.\n\n## How do I contribute to docs?\n\nContributions are welcome! Please read our contribution guidelines."
  }
];

// Code snippets
const CODE_SNIPPETS = [
  {
    "title": "Example 1",
    "code": "// Example 1 for docs\nconst docs = require('docs');\n\nfunction example1() {\n  // Function implementation\n  return docs.doSomething();\n}",
    "language": "javascript"
  },
  {
    "title": "Example 2",
    "code": "// Example 2 for docs\nconst docs = require('docs');\n\nfunction example2() {\n  // Function implementation\n  return docs.doSomething();\n}",
    "language": "javascript"
  },
  {
    "title": "Example 3",
    "code": "# Example 3 for docs\nimport docs\n\ndef example3():\n    # Function implementation\n    return docs.do_something()",
    "language": "python"
  },
  {
    "title": "Example 4",
    "code": "// Example 4 for docs\nconst docs = require('docs');\n\nfunction example4() {\n  // Function implementation\n  return docs.doSomething();\n}",
    "language": "javascript"
  },
  {
    "title": "Example 5",
    "code": "// Example 5 for docs\nconst docs = require('docs');\n\nfunction example5() {\n  // Function implementation\n  return docs.doSomething();\n}",
    "language": "javascript"
  },
  {
    "title": "Example 6",
    "code": "# Example 6 for docs\nimport docs\n\ndef example6():\n    # Function implementation\n    return docs.do_something()",
    "language": "python"
  },
  {
    "title": "Example 7",
    "code": "// Example 7 for docs\nconst docs = require('docs');\n\nfunction example7() {\n  // Function implementation\n  return docs.doSomething();\n}",
    "language": "javascript"
  },
  {
    "title": "Example 8",
    "code": "// Example 8 for docs\nconst docs = require('docs');\n\nfunction example8() {\n  // Function implementation\n  return docs.doSomething();\n}",
    "language": "javascript"
  },
  {
    "title": "Example 9",
    "code": "# Example 9 for docs\nimport docs\n\ndef example9():\n    # Function implementation\n    return docs.do_something()",
    "language": "python"
  },
  {
    "title": "Example 10",
    "code": "// Example 10 for docs\nconst docs = require('docs');\n\nfunction example10() {\n  // Function implementation\n  return docs.doSomething();\n}",
    "language": "javascript"
  }
];

// Available tools
const TOOLS = [
  {
    name: 'search_docs',
    description: 'Search the docs documentation',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 5
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_section',
    description: 'Get a specific documentation section',
    parameters: {
      type: 'object',
      properties: {
        section_title: {
          type: 'string',
          description: 'Title of the section to retrieve'
        }
      },
      required: ['section_title']
    }
  },
  {
    name: 'list_sections',
    description: 'List all available documentation sections',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_code_examples',
    description: 'Get code examples from the docs documentation',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to search for in code examples'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of examples to return',
          default: 3
        },
        language: {
          type: 'string',
          description: 'Filter by programming language',
          default: ''
        }
      },
      required: ['keyword']
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
  
  return errors;
}

/**
 * Search documentation
 */
function searchDocs(query, maxResults = 5) {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  // Search in section titles and content
  for (const section of SECTIONS) {
    const titleMatch = section.title.toLowerCase().includes(lowerQuery);
    const contentMatch = section.content.toLowerCase().includes(lowerQuery);
    
    if (titleMatch || contentMatch) {
      // Extract matching context with the query term highlighted
      let context = '';
      
      if (contentMatch) {
        const lowerContent = section.content.toLowerCase();
        const index = lowerContent.indexOf(lowerQuery);
        const start = Math.max(0, index - 100);
        const end = Math.min(section.content.length, index + query.length + 100);
        
        context = section.content.substring(start, end);
        
        // Add ellipsis if we're not at the beginning/end
        if (start > 0) context = '...' + context;
        if (end < section.content.length) context += '...';
      }
      
      results.push({
        section: section.title,
        context: context || section.content.substring(0, 200) + '...',
        relevance: titleMatch ? 2 : 1
      });
    }
  }
  
  // Sort by relevance and limit results
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
}

/**
 * Get a specific documentation section
 */
function getSection(sectionTitle) {
  const section = SECTIONS.find(s => 
    s.title.toLowerCase() === sectionTitle.toLowerCase()
  );
  
  if (!section) {
    return {
      error: `Section "${sectionTitle}" not found`,
      available_sections: SECTIONS.map(s => s.title)
    };
  }
  
  return {
    title: section.title,
    content: section.content
  };
}

/**
 * List all documentation sections
 */
function listSections() {
  return {
    sections: SECTIONS.map(s => ({
      title: s.title,
      preview: s.content.substring(0, 100) + '...'
    }))
  };
}

/**
 * Get code examples
 */
function getCodeExamples(keyword, maxResults = 3, language = '') {
  const lowerKeyword = keyword.toLowerCase();
  
  // Filter snippets by keyword and language
  const filteredSnippets = CODE_SNIPPETS.filter(snippet => {
    const matchesKeyword = snippet.code.toLowerCase().includes(lowerKeyword) ||
                           snippet.title.toLowerCase().includes(lowerKeyword);
    const matchesLanguage = !language || 
                           snippet.language.toLowerCase() === language.toLowerCase();
    
    return matchesKeyword && matchesLanguage;
  });
  
  // Sort by relevance (title matches are more relevant than code matches)
  const sortedSnippets = filteredSnippets.sort((a, b) => {
    const aTitleMatch = a.title.toLowerCase().includes(lowerKeyword) ? 2 : 1;
    const bTitleMatch = b.title.toLowerCase().includes(lowerKeyword) ? 2 : 1;
    
    return bTitleMatch - aTitleMatch;
  });
  
  return {
    examples: sortedSnippets.slice(0, maxResults),
    total_matches: filteredSnippets.length,
    showing: Math.min(maxResults, filteredSnippets.length)
  };
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
      case 'search_docs':
        result = searchDocs(
          parameters.query,
          parameters.max_results
        );
        break;
        
      case 'get_section':
        result = getSection(parameters.section_title);
        break;
        
      case 'list_sections':
        result = listSections();
        break;
        
      case 'get_code_examples':
        result = getCodeExamples(
          parameters.keyword,
          parameters.max_results,
          parameters.language
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
    name: 'docs Documentation Server',
    description: 'An MCP server providing access to docs documentation',
    version: '1.0.0',
    protocol: 'mcp',
    protocol_version: MCP_PROTOCOL_VERSION,
    source: 'Context7',
    repository: 'upstash/docs',
    metadata: DOC_DATA.metadata
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`docs Documentation Server running on port ${PORT}`);
});
