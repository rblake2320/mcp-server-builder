
#!/bin/bash
# Installation script for Python MCP server

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows, use: venv\Scripts\activate

# Install required dependencies
pip install mcp-client-sdk pydantic==2.4.2 asyncio aiohttp

# Install optional but recommended dependencies
pip install mcp-security mcp-test-suite

# Create requirements.txt for future reference
cat > requirements.txt << EOL
mcp-client-sdk>=0.6.0
pydantic>=2.4.2
asyncio>=3.4.3
aiohttp>=3.8.5
mcp-security>=0.1.0
mcp-test-suite>=0.3.0
EOL

echo "Installation complete! To start the server:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the server: python server.py"
echo ""
echo "To validate your MCP server against the protocol spec:"
echo "mcp-test validate --server python server.py --spec mcp-1.2.0"
