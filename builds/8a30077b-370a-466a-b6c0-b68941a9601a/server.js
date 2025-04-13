
import { MCPServer, Tool, ToolParameter } from '@modelcontextprotocol/mcp';
import { z } from 'zod';  // You may need to install this: npm install zod
import * as fs from 'fs';
import * as path from 'path';
// For API calls, uncomment: import axios from 'axios'; // You may need to install: npm install axios

// Initialize the MCP server with configuration
const server = new MCPServer({
  name: "Weather Forecast API",
  description: "A simple MCP server for weather forecasts",
  // Uncomment to enable authentication
  // auth: {
  //   apiKeys: process.env.API_KEYS?.split(',') || ["your-secret-key"],
  // }
});

// Define middleware if needed (logging, auth, etc.)
// server.use(async (ctx, next) => {
//   console.log('Request received:', ctx.requestId);
//   const result = await next();
//   console.log('Response sent:', ctx.requestId);
//   return result;
// });

// Define tools
// Parameter schema for get_weather_forecast
const get_weather_forecastSchema = z.object({
  location: z.string().describe("City name or zip code"),
  days: z.number().describe("Number of days to forecast (1-7)")
});

server.registerTool({
  name: "get_weather_forecast",
  description: "Retrieves weather forecast data for a specific location",
  parameters: {
    location: {
      type: "string",
      description: "City name or zip code"
    },
    days: {
      type: "number",
      description: "Number of days to forecast (1-7)"
    }
  },
  handler: async ({location, days}) => {
    // Validate parameters using zod
    const params = get_weather_forecastSchema.parse({
      location,
      days
    });
    
    // TODO: Implement tool functionality
    
    /* IMPLEMENTATION HINTS:
    
    // 1. For API calls (using axios):
    // import axios from 'axios';
    // const response = await axios.get(`https://api.example.com/data?param=${paramName}`);
    // return { result: response.data };
    
    // 2. For file operations:
    // const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    // return { result: data };
    
    // 3. For database operations (using Prisma as example):
    // import { PrismaClient } from '@prisma/client';
    // const prisma = new PrismaClient();
    // const results = await prisma.yourModel.findMany({
    //   where: { field: paramValue }
    // });
    // return { result: results };
    
    // 4. For secure operations with OAuth:
    // import { OAuthClient } from '@oauth/client';
    // const client = new OAuthClient({
    //   clientId: process.env.CLIENT_ID,
    //   clientSecret: process.env.CLIENT_SECRET
    // });
    // const data = await client.authorizedRequest(url);
    // return { result: data };
    
    */
    
    // Example implementation (replace with your actual logic):
    return {
      result: `get_weather_forecast executed with parameters: ${location}, ${days}`
    };
  }
});

// Start the server with error handling and graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
});

server.start().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});
