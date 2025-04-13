@echo off
echo ===================================================================
echo Docker MCP Server Deployment Assistant
echo ===================================================================
echo.
echo This script will help you deploy your MCP server using Docker
echo.
echo Prerequisites:
echo  1. Docker installed and running
echo  2. Docker Compose installed (if you want to use docker-compose.yml)
echo.
echo Press any key to continue...
pause > nul

echo.
echo [1/3] Setting up Docker environment...
if not exist "Dockerfile" (
  echo Error: Dockerfile not found
  pause
  exit /b 1
)

echo.
echo [2/3] Building Docker image...
echo.
docker build -t weather-data-provider .
if ERRORLEVEL 1 (
  echo Error building Docker image
  pause
  exit /b 1
)

echo.
echo [3/3] Running Docker container...
echo.
echo You can use either of these methods:
echo.
echo 1. Run with Docker:
echo    docker run -p 8080:8080 weather-data-provider
echo.
echo 2. Run with Docker Compose:
echo    docker-compose up
echo.
echo Your MCP server will be available at: http://localhost:8080
echo.
echo Would you like to run the container now? (Y/N)
set /p RUNDOCKER=

if /i "%RUNDOCKER%"=="Y" (
  echo.
  echo Starting container...
  docker run -d -p 8080:8080 --name weather-data-provider weather-data-provider
  echo.
  echo Container started! Your MCP server is running at http://localhost:8080
)

echo.
echo Deployment complete!
echo.
pause
