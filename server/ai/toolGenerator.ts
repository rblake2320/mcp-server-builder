import Anthropic from '@anthropic-ai/sdk';

// Function to generate MCP tool code based on a prompt
export async function generateTool(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  try {
    // Initialize Anthropic client with user's API key
    const anthropic = new Anthropic({
      apiKey,
    });

    // Create a system prompt that explains the task in detail
    const systemPrompt = `You are an expert MCP (Model Context Protocol) tool developer. 
Your task is to create a valid MCP tool implementation based on user requirements.

Follow these guidelines:
1. Tools should follow the MCP protocol format with a clear function and appropriate parameters
2. Each parameter must have a proper type (string, number, boolean, array, object)
3. Each parameter must have a clear description
4. Use typing for both input parameters and return type
5. Implement the tool logic in a way that makes sense for the requested functionality
6. Return only the code with no explanation, comments, or markdown formatting
7. If the tool would normally require external APIs that need keys, instead of failing, mock reasonable responses

Here's an example of a weather forecast tool:

\`\`\`python
class get_weather_forecast_params(BaseModel):
    location: str = Field(description="City name or zip code") 
    days: int = Field(description="Number of days to forecast (1-7)")

async def get_weather_forecast(location: str, days: int) -> Dict[str, Any]:
    """Retrieves weather forecast data for a specific location"""
    # In a real implementation, this would call a weather API
    # For this example, we'll return mock data
    forecast = []
    
    for i in range(days):
        day = {
            "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
            "temp_high": random.randint(65, 85),
            "temp_low": random.randint(45, 64),
            "condition": random.choice(["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Thunderstorms"]),
            "humidity": random.randint(30, 90),
            "wind_speed": random.randint(0, 15)
        }
        forecast.append(day)
        
    return {
        "location": location,
        "forecast": forecast,
        "units": "fahrenheit"
    }
\`\`\`

Now, implement an MCP tool based on the user's requirements.`;

    // Send prompt to Anthropic API
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      system: systemPrompt,
      max_tokens: 3000,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    // Extract the generated code from the response
    if (response.content && response.content.length > 0) {
      // Access the content safely using type assertion and nullish coalescing
      const text = (response.content[0] as any).text ?? '';
      return text.trim();
    }
    
    // Fallback in case of unexpected content type
    throw new Error('Unexpected response format from Anthropic API');
    
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate tool: ${error.message}`);
    }
    throw new Error('Failed to generate tool');
  }
}