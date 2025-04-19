/**
 * Weather API MCP Server
 * 
 * This server provides a simple interface for getting weather data.
 * Note: Requires a valid OpenWeatherMap API key to function.
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'your_api_key_here';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MCP manifest endpoint
app.get('/', (req, res) => {
  const manifest = {
    protocol: {
      schema: "mcp",
      version: "0.1.0"
    },
    server: {
      name: "Weather API MCP Server",
      version: "1.0.0",
      description: "Get weather data for any location",
      vendor: "MCP Server Builder",
      host: req.headers.host || `${HOST}:${PORT}`
    },
    tools: [
      {
        name: "get_current_weather",
        description: "Get current weather for a location",
        parameters: [
          {
            name: "location",
            description: "City name or location (e.g., 'London', 'New York, US')",
            type: "string",
            required: true
          },
          {
            name: "units",
            description: "Units of measurement (metric, imperial, standard)",
            type: "string",
            required: false
          }
        ]
      },
      {
        name: "get_weather_forecast",
        description: "Get 5-day weather forecast for a location",
        parameters: [
          {
            name: "location",
            description: "City name or location (e.g., 'London', 'New York, US')",
            type: "string",
            required: true
          },
          {
            name: "units",
            description: "Units of measurement (metric, imperial, standard)",
            type: "string",
            required: false
          }
        ]
      }
    ]
  };
  
  res.json(manifest);
});

// Get current weather tool
app.post('/get_current_weather', async (req, res) => {
  try {
    const { location, units = 'metric' } = req.body;
    
    if (!location) {
      return res.status(400).json({
        error: "Missing required parameter: location"
      });
    }
    
    // Check if API key is set
    if (WEATHER_API_KEY === 'your_api_key_here') {
      return res.status(500).json({
        error: "OpenWeatherMap API key not configured",
        message: "Please set the OPENWEATHER_API_KEY environment variable"
      });
    }
    
    // Make API request to OpenWeatherMap
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: location,
        units: units,
        appid: WEATHER_API_KEY
      }
    });
    
    // Format the response
    const weather = response.data;
    const result = {
      location: {
        name: weather.name,
        country: weather.sys.country,
        coordinates: {
          lat: weather.coord.lat,
          lon: weather.coord.lon
        }
      },
      weather: {
        description: weather.weather[0].description,
        icon: weather.weather[0].icon,
        main: weather.weather[0].main
      },
      temperature: {
        current: weather.main.temp,
        feels_like: weather.main.feels_like,
        min: weather.main.temp_min,
        max: weather.main.temp_max
      },
      wind: {
        speed: weather.wind.speed,
        direction: weather.wind.deg
      },
      humidity: weather.main.humidity,
      pressure: weather.main.pressure,
      visibility: weather.visibility,
      timestamp: weather.dt,
      units: units
    };
    
    res.json(result);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        error: "Location not found",
        message: "The specified location could not be found"
      });
    }
    
    console.error('Error fetching weather data:', error);
    res.status(500).json({
      error: "Failed to fetch weather data",
      message: error.message
    });
  }
});

// Get weather forecast tool
app.post('/get_weather_forecast', async (req, res) => {
  try {
    const { location, units = 'metric' } = req.body;
    
    if (!location) {
      return res.status(400).json({
        error: "Missing required parameter: location"
      });
    }
    
    // Check if API key is set
    if (WEATHER_API_KEY === 'your_api_key_here') {
      return res.status(500).json({
        error: "OpenWeatherMap API key not configured",
        message: "Please set the OPENWEATHER_API_KEY environment variable"
      });
    }
    
    // Make API request to OpenWeatherMap
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: {
        q: location,
        units: units,
        appid: WEATHER_API_KEY
      }
    });
    
    // Format the response
    const forecast = response.data;
    
    // Group forecast by day
    const dailyForecasts = {};
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0];
      
      if (!dailyForecasts[day]) {
        dailyForecasts[day] = [];
      }
      
      dailyForecasts[day].push({
        time: date.toISOString(),
        temperature: item.main.temp,
        feels_like: item.main.feels_like,
        weather: {
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          main: item.weather[0].main
        },
        wind: {
          speed: item.wind.speed,
          direction: item.wind.deg
        },
        humidity: item.main.humidity,
        pressure: item.main.pressure
      });
    });
    
    const result = {
      location: {
        name: forecast.city.name,
        country: forecast.city.country,
        coordinates: {
          lat: forecast.city.coord.lat,
          lon: forecast.city.coord.lon
        }
      },
      forecast: Object.keys(dailyForecasts).map(day => ({
        date: day,
        entries: dailyForecasts[day]
      })),
      units: units
    };
    
    res.json(result);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        error: "Location not found",
        message: "The specified location could not be found"
      });
    }
    
    console.error('Error fetching weather forecast:', error);
    res.status(500).json({
      error: "Failed to fetch weather forecast",
      message: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Weather API MCP Server running at http://${HOST}:${PORT}`);
  if (WEATHER_API_KEY === 'your_api_key_here') {
    console.warn('⚠️ WARNING: OpenWeatherMap API key not set. Set OPENWEATHER_API_KEY environment variable for full functionality.');
  }
});