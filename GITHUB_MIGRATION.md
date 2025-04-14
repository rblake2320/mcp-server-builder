# MCP Server Builder GitHub Migration Guide

This guide explains how to migrate your MCP Server Builder from Replit to GitHub and how to set it up on a new environment.

## Step 1: Export from Replit

1. In your Replit project, run this command to create a zip of your project (excluding node_modules):
   ```bash
   find . -type d -not -path "*/node_modules/*" -not -path "*/.*" | zip -r mcp-server-builder.zip -@
   ```

2. Download the zip file using the Files panel in Replit.

## Step 2: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in.
2. Click the "+" in the top right corner and select "New repository".
3. Name your repository (e.g., "mcp-server-builder").
4. Add a description: "A comprehensive web application for building MCP servers".
5. Choose the visibility (public or private).
6. Do NOT initialize with any files.
7. Click "Create repository".

## Step 3: Push Code to GitHub

Unzip the downloaded file on your local machine and run:

```bash
cd mcp-server-builder
git init
git add .
git commit -m "Initial commit from Replit"
git branch -M main
git remote add origin https://github.com/yourusername/mcp-server-builder.git
git push -u origin main
```

## Step 4: Set Up GitHub Secrets

For GitHub Actions to work, you need to set up secrets:

1. Go to your repository on GitHub.
2. Navigate to "Settings" > "Secrets and variables" > "Actions".
3. Click "New repository secret".
4. Add the following secrets:
   - `DATABASE_URL` (for production database)
   - `SESSION_SECRET` (for production sessions)
   - `GITHUB_CLIENT_ID` (for GitHub OAuth)
   - `GITHUB_CLIENT_SECRET` (for GitHub OAuth)

## Step 5: Set Up GitHub OAuth

To use the GitHub authentication feature:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Click "New OAuth App".
3. Fill in the details:
   - Application name: "MCP Server Builder"
   - Homepage URL: Your application URL
   - Authorization callback URL: `https://yourdomain.com/auth/github/callback`
4. Register the application.
5. You'll get a Client ID and can generate a Client Secret.
6. Add these to your environment variables.

## Step 6: Local Development Setup

On your development machine:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mcp-server-builder.git
   cd mcp-server-builder
   ```

2. Run the setup script:
   ```bash
   ./setup.sh
   ```

3. This script will:
   - Create necessary directories
   - Install dependencies
   - Set up environment variables
   - Offer to run database migrations

4. Start the development server:
   ```bash
   npm run dev
   ```

## Step 7: Deployment Options

### Option 1: Traditional Hosting

1. Set up a PostgreSQL database.
2. Build the application:
   ```bash
   npm run build
   ```
3. Start in production mode:
   ```bash
   npm start
   ```

### Option 2: Docker Deployment

1. Make sure Docker and Docker Compose are installed.
2. Run:
   ```bash
   docker-compose up -d
   ```

### Option 3: Cloud Platforms

The MCP Server Builder can be deployed to:

- **Heroku**: Use the Heroku Postgres add-on.
- **Railway**: Automatic detection of Node.js and PostgreSQL.
- **Render**: Use blueprint for Node.js with PostgreSQL.
- **Digital Ocean App Platform**: Supports Node.js and managed PostgreSQL.

## Troubleshooting

- **Database Connection Issues**: Ensure the DATABASE_URL is correctly formatted.
- **GitHub OAuth Problems**: Verify the callback URL is exactly as registered.
- **Missing Environment Variables**: Check that all required variables are set.
- **Build Errors**: Make sure Node.js version 18+ is being used.

Need further assistance? Open an issue on GitHub or refer to the documentation in the README.md file.