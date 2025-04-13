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
   docker build -t weather-data-provider .
   ```

2. Run the Docker container:
   ```
   docker run -p 8080:8080 weather-data-provider
   ```

   Or with Docker Compose:
   ```
   docker-compose up
   ```

3. Access your MCP server at http://localhost:8080

## Important Files

- `Dockerfile`: Configuration for building the Docker image
- `docker-compose.yml`: Configuration for running with Docker Compose
- `server.py`: The main MCP server file
- `requirements.txt`: Project dependencies

## Customization

You can customize the Docker configuration by editing the Dockerfile or docker-compose.yml files.

## Troubleshooting

If you encounter any issues:

1. Make sure Docker is properly installed and running.
2. Check that ports are not already in use (8080 is required).
3. For permission issues on Linux/Mac, you may need to use `sudo` with Docker commands.
4. If the container fails to start, check the logs with: `docker logs weather-data-provider`
