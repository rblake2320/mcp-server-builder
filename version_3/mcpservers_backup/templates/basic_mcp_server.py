#!/usr/bin/env python3
"""
Basic MCP Server Template in Python

This template provides a minimal implementation of an MCP server
with a single example tool. Use this as a starting point for your own servers.
"""

import os
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Configuration
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", 8000))

class MCPServer(BaseHTTPRequestHandler):
    def _set_headers(self, content_type="application/json"):
        """Set common headers for responses"""
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        """Handle preflight requests for CORS"""
        self._set_headers()

    def do_GET(self):
        """Handle GET requests - serves the MCP manifest"""
        if self.path == "/" or self.path == "":
            self._set_headers()
            manifest = {
                "protocol": {
                    "schema": "mcp",
                    "version": "0.1.0"
                },
                "server": {
                    "name": "Basic MCP Server in Python",
                    "version": "1.0.0",
                    "description": "A simple MCP server template written in Python",
                    "vendor": "MCP Server Builder",
                    "host": f"{HOST}:{PORT}"
                },
                "tools": [
                    {
                        "name": "hello_world",
                        "description": "Return a greeting message",
                        "parameters": [
                            {
                                "name": "name",
                                "description": "Name to greet",
                                "type": "string",
                                "required": True
                            }
                        ]
                    },
                    # Add more tools here as needed
                ]
            }
            self.wfile.write(json.dumps(manifest).encode())
        else:
            self.send_error(404, "Not Found")

    def do_POST(self):
        """Handle POST requests - execute the requested tool"""
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length).decode("utf-8")
        
        try:
            params = json.loads(post_data)
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return
        
        tool_path = self.path.strip("/")
        
        if tool_path == "hello_world":
            self._handle_hello_world(params)
        else:
            self.send_error(404, "Tool not found")
    
    def _handle_hello_world(self, params):
        """Handle the hello_world tool"""
        if "name" not in params:
            self.send_error(400, "Name parameter is required")
            return
        
        name = params["name"]
        
        self._set_headers()
        response = {
            "message": f"Hello, {name}! Welcome to MCP.",
            "timestamp": time.time()
        }
        self.wfile.write(json.dumps(response).encode())

def run_server():
    """Start the MCP server"""
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, MCPServer)
    print(f"MCP Server running at http://{HOST}:{PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()