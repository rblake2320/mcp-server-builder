# MCP Server Docker Deployment

## Automatic Deployment

This package includes automated deployment scripts to help you quickly deploy your MCP server using Docker:

- **Windows**: Double-click `run-docker-deploy.bat`
- **Mac/Linux**: Run `./run-docker-deploy.sh` in a terminal

## Prerequisites

Before deploying, make sure you have:

1. Docker installed and running
2. Docker Compose installed (optional, for using docker-compose.yml)

## Manual Deployment

If the automated scripts don't work, you can manually deploy using Docker:

1. Build the Docker image:
   ```
   docker build -t 19ec2f3f-00b0-4b4f-b0a8-f609ba639794 .
   ```

2. Run the Docker container:
   ```
   docker run -p 8080:8080 19ec2f3f-00b0-4b4f-b0a8-f609ba639794
   ```

   Or with Docker Compose:
   ```
   docker-compose up
   ```

3. Access your MCP server at http://localhost:8080

## Important Files

- `Dockerfile`: Configuration for building the Docker image
- `docker-compose.yml`: Configuration for running with Docker Compose
- `server.js`: The main MCP server file
- `package.json`: Project dependencies

## Customization

You can customize the Docker configuration by editing the Dockerfile or docker-compose.yml files.
