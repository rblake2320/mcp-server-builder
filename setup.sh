#!/bin/bash

# MCP Server Builder Setup Script
# This script helps set up the MCP Server Builder application from GitHub

set -e

echo "=== MCP Server Builder Setup ==="
echo "This script will help you set up the MCP Server Builder application."

# Create necessary directories
mkdir -p builds downloads tmp public/logos
chmod -R 755 builds downloads tmp public

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed. Please install Node.js v18 or newer."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Node.js version 18 or higher is required. Current version: $(node -v)"
    echo "Please upgrade your Node.js installation."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "npm is required but not installed. Please install npm."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if .env file exists, if not create it from example
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit the .env file with your actual configuration details."
fi

# Database setup prompt
echo ""
echo "Do you want to set up the database now? (y/n)"
read -r SETUP_DB
if [ "$SETUP_DB" = "y" ] || [ "$SETUP_DB" = "Y" ]; then
    echo "Running database migrations..."
    npm run db:push
    echo "Database setup completed."
else
    echo "Skipping database setup. You can run it later with: npm run db:push"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the development server:"
echo "npm run dev"
echo ""
echo "To build for production:"
echo "npm run build"
echo ""
echo "To run in production mode:"
echo "npm start"
echo ""
echo "To deploy with Docker:"
echo "docker-compose up -d"
echo ""
echo "Enjoy using the MCP Server Builder!"