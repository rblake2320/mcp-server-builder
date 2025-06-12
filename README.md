# MCP Server Builder

A powerful web application for building Model Context Protocol (MCP) servers through an intuitive, developer-friendly interface with advanced deployment capabilities.

## 🚀 Recent Updates (June 2025)

**Critical Authentication Fix**: We've resolved the critical authentication modal issue that was preventing users from accessing the application. The authentication flow now uses an improved inline modal that can be properly closed, allowing users to browse the application freely.

**Key Improvements**:
- ✅ Fixed uncloseable authentication modal (critical blocking issue)
- ✅ Added "Continue browsing without signing in" option
- ✅ Improved accessibility with proper keyboard navigation
- ✅ Enhanced user experience with 95% functionality restored for unauthenticated users

For complete details, see [CHANGELOG.md](./CHANGELOG.md) and [AUDIT.md](./AUDIT.md).

## Features

- Interactive web-based MCP server configuration
- Multi-language support (Python and TypeScript/JavaScript)
- AI-assisted tool generation using Google AI Studio (Gemini)
- GitHub repository integration for importing existing MCP servers
- One-click deployment to popular hosting platforms
- Secure user authentication with GitHub OAuth
- Template management for saving and reusing configurations
- Docker support for containerized deployment

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with GitHub OAuth
- **AI Integration**: Google Gemini API

## Project Structure

```
├── client           # React frontend
├── server           # Express.js backend
├── shared           # Shared types and schemas
├── public           # Static files
├── builds           # Generated MCP server code
├── downloads        # Packaged downloads
```

## Setting Up for Development

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- GitHub OAuth application (for auth features)

### Environment Variables

Create a `.env` file in the root directory with:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mcp_builder

# Session
SESSION_SECRET=your-session-secret-here

# GitHub OAuth (For GitHub login and repository access)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mcp-server-builder.git
   cd mcp-server-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Option 1: Standard Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### Option 2: Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t mcp-server-builder .
   ```

2. Run the container:
   ```bash
   docker run -p 5000:5000 -e DATABASE_URL=your-database-url -e SESSION_SECRET=your-session-secret mcp-server-builder
   ```

## GitHub Integration

To enable GitHub repository integration:

1. Create a GitHub OAuth application at https://github.com/settings/developers
2. Set the Authorization callback URL to `https://your-domain.com/auth/github/callback`
3. Add the Client ID and Secret to your environment variables

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Model Context Protocol (MCP)](https://github.com/anthropics/anthropic-tools) - For the standard specification
- Claude, GPT, Gemini and other AI assistants - For making tool generation possible