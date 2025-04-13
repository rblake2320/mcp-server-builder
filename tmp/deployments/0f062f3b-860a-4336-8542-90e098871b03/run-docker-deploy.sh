#!/bin/bash
echo "==================================================================="
echo "Docker MCP Server Deployment Assistant"
echo "==================================================================="
echo
echo "This script will help you deploy your MCP server using Docker"
echo
echo "Prerequisites:"
echo "  1. Docker installed and running"
echo "  2. Docker Compose installed (if you want to use docker-compose.yml)"
echo
read -p "Press Enter to continue..."

echo
echo "[1/3] Setting up Docker environment..."
if [ ! -f "Dockerfile" ]; then
  echo "Error: Dockerfile not found"
  read -p "Press Enter to exit..."
  exit 1
fi

echo
echo "[2/3] Building Docker image..."
echo
docker build -t weather-data-provider .
if [ $? -ne 0 ]; then
  echo "Error building Docker image"
  read -p "Press Enter to exit..."
  exit 1
fi

echo
echo "[3/3] Running Docker container..."
echo
echo "You can use either of these methods:"
echo
echo "1. Run with Docker:"
echo "   docker run -p 8080:8080 weather-data-provider"
echo
echo "2. Run with Docker Compose:"
echo "   docker-compose up"
echo
echo "Your MCP server will be available at: http://localhost:8080"
echo
read -p "Would you like to run the container now? (y/n): " RUNDOCKER

if [[ $RUNDOCKER =~ ^[Yy]$ ]]; then
  echo
  echo "Starting container..."
  docker run -d -p 8080:8080 --name weather-data-provider weather-data-provider
  echo
  echo "Container started! Your MCP server is running at http://localhost:8080"
fi

echo
echo "Deployment complete!"
echo
read -p "Press Enter to exit..."
