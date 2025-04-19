import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { Node, Statement, Expression, Identifier } from '@babel/types';

// TypeScript type for node with ID
type NodeWithId = Node & {
  id?: { name: string };
};

// Interface for the analysis result
interface AnalysisResult {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  functionCount: number;
  longFunctions: Array<{ name: string; lineCount: number; complexity: number }>;
  nestedDepth: number;
  metrics: Array<{
    name: string;
    value: number;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  suggestions: string[];
}

/**
 * Analyzes code complexity for MCP server functions
 */
export async function analyzeCode(code: string): Promise<AnalysisResult> {
  try {
    // Parse code
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    // Initialize metrics
    let cyclomaticComplexity = 1; // Base complexity is 1
    let cognitiveComplexity = 0;
    let functionCount = 0;
    let maxNestedDepth = 0;
    const longFunctions: Array<{ name: string; lineCount: number; complexity: number }> = [];
    
    // Tracking variables
    let currentNestingLevel = 0;
    
    // Helper to calculate line count from node
    const getLineCount = (node: Node): number => {
      if (!node.loc) return 0;
      return node.loc.end.line - node.loc.start.line + 1;
    };
    
    // Helper to get function name
    const getFunctionName = (node: NodeWithId): string => {
      if (node.id && node.id.name) {
        return node.id.name;
      }
      return 'Anonymous function';
    };

    // Traverse the AST
    traverse(ast, {
      // Track function/method declarations
      enter(path) {
        // Track nesting level
        if (
          path.isIfStatement() ||
          path.isForStatement() ||
          path.isWhileStatement() ||
          path.isDoWhileStatement() ||
          path.isSwitchStatement() ||
          path.isTryStatement() ||
          path.isBlockStatement()
        ) {
          currentNestingLevel++;
          maxNestedDepth = Math.max(maxNestedDepth, currentNestingLevel);
        }
      },
      
      exit(path) {
        // Decrease nesting level on exit
        if (
          path.isIfStatement() ||
          path.isForStatement() ||
          path.isWhileStatement() ||
          path.isDoWhileStatement() ||
          path.isSwitchStatement() ||
          path.isTryStatement() ||
          path.isBlockStatement()
        ) {
          currentNestingLevel--;
        }
      },
      
      // Count functions
      FunctionDeclaration(path) {
        functionCount++;
        
        // Calculate function complexity
        let fnCyclomaticComplexity = 1; // Base is 1
        let fnCognitiveComplexity = 0;
        
        // Find complexity within this function
        path.traverse({
          IfStatement() {
            fnCyclomaticComplexity++; // +1 for each if
            fnCognitiveComplexity++; // +1 for each if
          },
          ConditionalExpression() {
            fnCyclomaticComplexity++; // +1 for each ternary
            fnCognitiveComplexity++; // +1 for each ternary
          },
          LogicalExpression({ node }) {
            if (node.operator === '&&' || node.operator === '||') {
              fnCyclomaticComplexity++; // +1 for each logical operator
              fnCognitiveComplexity += 0.5; // +0.5 for logical operators
            }
          },
          SwitchCase() {
            fnCyclomaticComplexity++; // +1 for each case
            fnCognitiveComplexity += 0.5; // +0.5 for each case
          },
          ForStatement() {
            fnCyclomaticComplexity++; // +1 for each for loop
            fnCognitiveComplexity++; // +1 for for loops
          },
          WhileStatement() {
            fnCyclomaticComplexity++; // +1 for each while loop
            fnCognitiveComplexity++; // +1 for while loops
          },
          DoWhileStatement() {
            fnCyclomaticComplexity++; // +1 for each do-while loop
            fnCognitiveComplexity++; // +1 for do-while loops
          },
          CatchClause() {
            fnCyclomaticComplexity++; // +1 for each catch
            fnCognitiveComplexity++; // +1 for catch blocks
          },
        });
        
        // Add to global complexity
        cyclomaticComplexity += fnCyclomaticComplexity;
        cognitiveComplexity += fnCognitiveComplexity;
        
        // Check if it's a long/complex function
        const lineCount = getLineCount(path.node);
        if (lineCount > 15 || fnCyclomaticComplexity > 5) {
          longFunctions.push({
            name: getFunctionName(path.node),
            lineCount,
            complexity: fnCyclomaticComplexity,
          });
        }
      },
      
      // Handle arrow functions
      ArrowFunctionExpression(path) {
        functionCount++;
        
        // Calculate function complexity
        let fnCyclomaticComplexity = 1; // Base is 1
        let fnCognitiveComplexity = 0;
        
        // Find complexity within this function
        path.traverse({
          IfStatement() {
            fnCyclomaticComplexity++; // +1 for each if
            fnCognitiveComplexity++; // +1 for each if
          },
          ConditionalExpression() {
            fnCyclomaticComplexity++; // +1 for each ternary
            fnCognitiveComplexity++; // +1 for each ternary
          },
          LogicalExpression({ node }) {
            if (node.operator === '&&' || node.operator === '||') {
              fnCyclomaticComplexity++; // +1 for each logical operator
              fnCognitiveComplexity += 0.5; // +0.5 for logical operators
            }
          },
          SwitchCase() {
            fnCyclomaticComplexity++; // +1 for each case
            fnCognitiveComplexity += 0.5; // +0.5 for each case
          },
          ForStatement() {
            fnCyclomaticComplexity++; // +1 for each for loop
            fnCognitiveComplexity++; // +1 for for loops
          },
          WhileStatement() {
            fnCyclomaticComplexity++; // +1 for each while loop
            fnCognitiveComplexity++; // +1 for while loops
          },
          DoWhileStatement() {
            fnCyclomaticComplexity++; // +1 for each do-while loop
            fnCognitiveComplexity++; // +1 for do-while loops
          },
          CatchClause() {
            fnCyclomaticComplexity++; // +1 for each catch
            fnCognitiveComplexity++; // +1 for catch blocks
          },
        });
        
        // Add to global complexity
        cyclomaticComplexity += fnCyclomaticComplexity;
        cognitiveComplexity += fnCognitiveComplexity;
        
        // Check if it's a long/complex function
        const lineCount = getLineCount(path.node);
        if (lineCount > 15 || fnCyclomaticComplexity > 5) {
          const parentPath = path.findParent(p => p.isVariableDeclarator());
          let name = 'Anonymous arrow function';
          
          if (parentPath && parentPath.node.id && 'name' in parentPath.node.id) {
            name = (parentPath.node.id as any).name;
          }
          
          longFunctions.push({
            name,
            lineCount,
            complexity: fnCyclomaticComplexity,
          });
        }
      },
      
      // Handle function expressions
      FunctionExpression(path) {
        functionCount++;
        
        // Calculate function complexity
        let fnCyclomaticComplexity = 1; // Base is 1
        let fnCognitiveComplexity = 0;
        
        // Find complexity within this function
        path.traverse({
          IfStatement() {
            fnCyclomaticComplexity++; // +1 for each if
            fnCognitiveComplexity++; // +1 for each if
          },
          ConditionalExpression() {
            fnCyclomaticComplexity++; // +1 for each ternary
            fnCognitiveComplexity++; // +1 for each ternary
          },
          LogicalExpression({ node }) {
            if (node.operator === '&&' || node.operator === '||') {
              fnCyclomaticComplexity++; // +1 for each logical operator
              fnCognitiveComplexity += 0.5; // +0.5 for logical operators
            }
          },
          SwitchCase() {
            fnCyclomaticComplexity++; // +1 for each case
            fnCognitiveComplexity += 0.5; // +0.5 for each case
          },
          ForStatement() {
            fnCyclomaticComplexity++; // +1 for each for loop
            fnCognitiveComplexity++; // +1 for for loops
          },
          WhileStatement() {
            fnCyclomaticComplexity++; // +1 for each while loop
            fnCognitiveComplexity++; // +1 for while loops
          },
          DoWhileStatement() {
            fnCyclomaticComplexity++; // +1 for each do-while loop
            fnCognitiveComplexity++; // +1 for do-while loops
          },
          CatchClause() {
            fnCyclomaticComplexity++; // +1 for each catch
            fnCognitiveComplexity++; // +1 for catch blocks
          },
        });
        
        // Add to global complexity
        cyclomaticComplexity += fnCyclomaticComplexity;
        cognitiveComplexity += fnCognitiveComplexity;
        
        // Check if it's a long/complex function
        const lineCount = getLineCount(path.node);
        if (lineCount > 15 || fnCyclomaticComplexity > 5) {
          const parentPath = path.findParent(p => p.isVariableDeclarator());
          let name = 'Anonymous function expression';
          
          if (parentPath && parentPath.node.id && 'name' in parentPath.node.id) {
            name = (parentPath.node.id as any).name;
          } else if (path.node.id && path.node.id.name) {
            name = path.node.id.name;
          }
          
          longFunctions.push({
            name,
            lineCount,
            complexity: fnCyclomaticComplexity,
          });
        }
      },
    });
    
    // Round complexity values
    cyclomaticComplexity = Math.round(cyclomaticComplexity);
    cognitiveComplexity = Math.round(cognitiveComplexity);
    
    // Generate more metrics
    const metrics = [
      {
        name: 'Cyclomatic Complexity',
        value: cyclomaticComplexity,
        description: 'Number of independent paths through the code',
        severity: cyclomaticComplexity < 10 ? 'low' : cyclomaticComplexity < 20 ? 'medium' : 'high',
      },
      {
        name: 'Cognitive Complexity',
        value: cognitiveComplexity,
        description: 'How difficult the code is to understand',
        severity: cognitiveComplexity < 15 ? 'low' : cognitiveComplexity < 30 ? 'medium' : 'high',
      },
      {
        name: 'Function Count',
        value: functionCount,
        description: 'Total number of functions and methods',
        severity: functionCount < 5 ? 'low' : functionCount < 10 ? 'medium' : 'high',
      },
      {
        name: 'Maximum Nesting Depth',
        value: maxNestedDepth,
        description: 'Deepest level of nested blocks',
        severity: maxNestedDepth < 3 ? 'low' : maxNestedDepth < 5 ? 'medium' : 'high',
      },
      {
        name: 'Complex Functions',
        value: longFunctions.length,
        description: 'Functions that may need refactoring',
        severity: longFunctions.length < 2 ? 'low' : longFunctions.length < 5 ? 'medium' : 'high',
      },
    ];
    
    // Generate improvement suggestions
    const suggestions: string[] = [];
    
    if (cyclomaticComplexity > 10) {
      suggestions.push(
        'Consider breaking down complex functions into smaller, more focused functions with a single responsibility.'
      );
    }
    
    if (cognitiveComplexity > 15) {
      suggestions.push(
        'Simplify nested conditions using early returns or helper functions to make the code more readable.'
      );
    }
    
    if (maxNestedDepth > 3) {
      suggestions.push(
        'Reduce nesting depth by extracting logic into separate functions or using guard clauses.'
      );
    }
    
    if (longFunctions.length > 0) {
      suggestions.push(
        `Refactor the following functions to reduce their complexity: ${longFunctions.map(f => f.name).join(', ')}.`
      );
    }
    
    // Add MCP-specific suggestions
    suggestions.push(
      'Ensure each MCP tool function has a clear, single purpose and comprehensive documentation.',
      'Consider making your tool functions pure and deterministic where possible to improve testability.',
      'Add error handling to provide clear feedback when tool inputs are invalid or when operations fail.'
    );
    
    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      functionCount,
      longFunctions,
      nestedDepth: maxNestedDepth,
      metrics,
      suggestions,
    };
  } catch (error) {
    console.error('Code analysis error:', error);
    throw new Error(`Failed to analyze code complexity: ${error instanceof Error ? error.message : String(error)}`);
  }
}