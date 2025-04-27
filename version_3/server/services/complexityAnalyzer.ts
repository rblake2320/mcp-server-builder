import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import * as d3 from 'd3';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { z } from 'zod';

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Define the response schema for complexity analysis
export const ComplexityResultSchema = z.object({
  cyclomatic: z.number(),
  cognitive: z.number(),
  lines: z.number(),
  functions: z.array(
    z.object({
      name: z.string(),
      complexity: z.number(),
      startLine: z.number(),
      endLine: z.number(),
    })
  ),
  visualization: z.string(), // SVG data
  summary: z.string(),
});

export type ComplexityResult = z.infer<typeof ComplexityResultSchema>;

/**
 * Calculate cyclomatic complexity from code
 * A simple approximation based on control flow statements
 */
function calculateCyclomaticComplexity(code: string): number {
  try {
    // Count decision points in the code
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
    });
    
    let complexity = 1; // Base complexity
    
    traverse(ast, {
      IfStatement() { complexity++; },
      ConditionalExpression() { complexity++; },
      LogicalExpression({ node }) { 
        if (node.operator === '&&' || node.operator === '||') complexity++;
      },
      ForStatement() { complexity++; },
      ForInStatement() { complexity++; },
      ForOfStatement() { complexity++; },
      WhileStatement() { complexity++; },
      DoWhileStatement() { complexity++; },
      SwitchCase() { complexity++; },
      CatchClause() { complexity++; },
    });
    
    return complexity;
  } catch (error) {
    // Fallback if parsing fails
    const ifCount = (code.match(/if\s*\(/g) || []).length;
    const elseIfCount = (code.match(/else\s+if\s*\(/g) || []).length;
    const elseCount = (code.match(/else\s*\{/g) || []).length;
    const ternaryCount = (code.match(/\?.*:/g) || []).length;
    const forCount = (code.match(/for\s*\(/g) || []).length;
    const whileCount = (code.match(/while\s*\(/g) || []).length;
    const doWhileCount = (code.match(/do\s*\{/g) || []).length;
    const switchCount = (code.match(/switch\s*\(/g) || []).length;
    const caseCount = (code.match(/case\s+/g) || []).length;
    const catchCount = (code.match(/catch\s*\(/g) || []).length;
    const andOrCount = (code.match(/&&|\|\|/g) || []).length;
    
    return 1 + ifCount + elseIfCount + elseCount + ternaryCount + forCount + 
           whileCount + doWhileCount + switchCount + caseCount + catchCount + andOrCount;
  }
}

/**
 * Estimate cognitive complexity
 * A more sophisticated complexity metric that considers nested structures
 */
function estimateCognitiveComplexity(code: string): number {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
    });
    
    let complexity = 0;
    let nestingLevel = 0;
    
    traverse(ast, {
      enter(path) {
        // Increment complexity for control flow statements
        if (
          path.isIfStatement() || 
          path.isForStatement() || 
          path.isWhileStatement() || 
          path.isDoWhileStatement() ||
          path.isSwitchStatement() ||
          path.isTryStatement()
        ) {
          // Add base complexity
          complexity += 1;
          // Add nesting level for nested structures
          complexity += nestingLevel;
          nestingLevel++;
        }
        
        // Special handling for logical expressions (&&, ||)
        if (path.isLogicalExpression()) {
          complexity += 1;
        }
      },
      exit(path) {
        if (
          path.isIfStatement() || 
          path.isForStatement() || 
          path.isWhileStatement() || 
          path.isDoWhileStatement() ||
          path.isSwitchStatement() ||
          path.isTryStatement()
        ) {
          nestingLevel--;
        }
      }
    });
    
    return complexity;
  } catch (error) {
    // Fallback - use a simpler estimation
    return Math.floor(calculateCyclomaticComplexity(code) * 1.2);
  }
}

/**
 * Extract functions and their complexity from code
 */
function extractFunctions(code: string): { name: string; complexity: number; startLine: number; endLine: number }[] {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
    });
    
    const functions: { name: string; complexity: number; startLine: number; endLine: number }[] = [];
    
    traverse(ast, {
      FunctionDeclaration(path) {
        const name = path.node.id?.name || 'anonymous';
        const startLine = path.node.loc?.start.line || 0;
        const endLine = path.node.loc?.end.line || 0;
        
        // Get the function's code to calculate its complexity
        const functionCode = code.split('\n').slice(startLine - 1, endLine).join('\n');
        const complexity = calculateCyclomaticComplexity(functionCode);
        
        functions.push({ name, complexity, startLine, endLine });
      },
      ArrowFunctionExpression(path) {
        let name = 'arrow';
        
        // Try to find variable name if it's assigned to a variable
        if (path.parent.type === 'VariableDeclarator' && path.parent.id.type === 'Identifier') {
          name = path.parent.id.name;
        }
        
        const startLine = path.node.loc?.start.line || 0;
        const endLine = path.node.loc?.end.line || 0;
        
        // Get the function's code to calculate its complexity
        const functionCode = code.split('\n').slice(startLine - 1, endLine).join('\n');
        const complexity = calculateCyclomaticComplexity(functionCode);
        
        functions.push({ name, complexity, startLine, endLine });
      },
    });
    
    return functions;
  } catch (error) {
    // Return an empty array if parsing fails
    return [];
  }
}

/**
 * Generate a visualization of code complexity
 */
function generateComplexityVisualization(functions: { name: string; complexity: number; startLine: number; endLine: number }[]): string {
  // Simple SVG bar chart using D3
  const margin = { top: 20, right: 30, bottom: 40, left: 90 };
  const width = 600 - margin.left - margin.right;
  const height = Math.max(100, functions.length * 30) - margin.top - margin.bottom;
  
  // Create a JSDOM instance to use with D3
  // Or use D3 to directly create an SVG string
  let svg = d3.create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Create scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(functions, (d) => d.complexity) || 10])
    .range([0, width]);
  
  const y = d3.scaleBand()
    .domain(functions.map((d) => d.name))
    .range([0, height])
    .padding(0.1);
  
  // Color scale
  const colorScale = d3.scaleThreshold<number, string>()
    .domain([5, 10, 15])
    .range(["#4ade80", "#facc15", "#fb923c", "#f87171"]);
  
  // Add X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");
  
  // Add Y axis
  svg.append("g")
    .call(d3.axisLeft(y));
  
  // Add bars
  svg.selectAll("myRect")
    .data(functions)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d) => y(d.name) || 0)
    .attr("width", (d) => x(d.complexity))
    .attr("height", y.bandwidth())
    .attr("fill", (d) => colorScale(d.complexity));
  
  // Add labels
  svg.selectAll(".label")
    .data(functions)
    .join("text")
    .attr("class", "label")
    .attr("x", (d) => x(d.complexity) + 5)
    .attr("y", (d) => (y(d.name) || 0) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .text((d) => d.complexity);
  
  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Function Complexity");
  
  return svg.node()?.outerHTML || '';
}

/**
 * Generate an AI-powered analysis of code complexity
 */
async function generateAIAnalysis(code: string, complexityData: any, apiKey: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      safetySettings
    });

    const prompt = `
      Analyze the complexity of this code without showing the code itself. Focus on:
      
      1. Complexity metrics: cyclomatic (${complexityData.cyclomatic}) and cognitive (${complexityData.cognitive})
      2. Function complexities: ${JSON.stringify(complexityData.functions)}
      3. Overall code quality and maintainability
      4. Suggestions for improvement
      
      Provide a concise, professional analysis in 2-3 paragraphs. 
      Be constructive, educational, and focus on actionable insights.
      
      Code to analyze (but don't include it in your response):
      \`\`\`
      ${code}
      \`\`\`
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    return `Analysis could not be generated with AI. The code has cyclomatic complexity of ${complexityData.cyclomatic} and cognitive complexity of ${complexityData.cognitive}.`;
  }
}

/**
 * Main function to analyze code complexity
 */
export async function analyzeCodeComplexity(code: string, apiKey: string): Promise<ComplexityResult> {
  // Calculate basic metrics
  const cyclomatic = calculateCyclomaticComplexity(code);
  const cognitive = estimateCognitiveComplexity(code);
  const lines = code.split('\n').length;
  
  // Extract function information
  const functions = extractFunctions(code);
  
  // Generate visualization
  const visualization = generateComplexityVisualization(functions);
  
  // Prepare the complexity data
  const complexityData = {
    cyclomatic,
    cognitive,
    lines,
    functions
  };
  
  // Generate AI analysis
  const summary = await generateAIAnalysis(code, complexityData, apiKey);
  
  return {
    ...complexityData,
    visualization,
    summary
  };
}