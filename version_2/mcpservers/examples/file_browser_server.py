#!/usr/bin/env python3
"""
File Browser MCP Server

This server provides a simple interface for browsing files and directories on the host system.
It follows the Model Context Protocol (MCP) specification.
"""

import os
import json
import mimetypes
import base64
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Server configuration
HOST = "0.0.0.0"
PORT = 8000
ALLOWED_DIRS = [os.path.expanduser("~"), "/tmp"]  # Directories that can be browsed
MAX_FILE_SIZE = 1024 * 1024  # 1MB max file size for reading

class MCPServer(BaseHTTPRequestHandler):
    def _set_headers(self, content_type="application/json"):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
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
                    "name": "File Browser MCP Server",
                    "version": "1.0.0",
                    "description": "Browse and access files on the host system",
                    "vendor": "MCP Server Builder",
                    "host": f"{HOST}:{PORT}"
                },
                "tools": [
                    {
                        "name": "list_directory",
                        "description": "List files and directories in a specified path",
                        "parameters": [
                            {
                                "name": "path",
                                "description": "Directory path to list",
                                "type": "string",
                                "required": True
                            }
                        ]
                    },
                    {
                        "name": "read_file",
                        "description": "Read the contents of a file",
                        "parameters": [
                            {
                                "name": "path",
                                "description": "File path to read",
                                "type": "string",
                                "required": True
                            }
                        ]
                    },
                    {
                        "name": "get_file_info",
                        "description": "Get metadata about a file",
                        "parameters": [
                            {
                                "name": "path",
                                "description": "File path to analyze",
                                "type": "string",
                                "required": True
                            }
                        ]
                    }
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
        
        if tool_path == "list_directory":
            self._handle_list_directory(params)
        elif tool_path == "read_file":
            self._handle_read_file(params)
        elif tool_path == "get_file_info":
            self._handle_get_file_info(params)
        else:
            self.send_error(404, "Tool not found")
    
    def _is_path_allowed(self, path):
        """Check if the path is within allowed directories"""
        path = os.path.abspath(path)
        return any(path.startswith(allowed_dir) for allowed_dir in ALLOWED_DIRS)
    
    def _handle_list_directory(self, params):
        """Handle the list_directory tool"""
        if "path" not in params:
            self.send_error(400, "Path parameter is required")
            return
        
        path = params["path"]
        
        if not self._is_path_allowed(path):
            self._set_headers()
            self.wfile.write(json.dumps({
                "error": "Path not allowed",
                "allowed_dirs": ALLOWED_DIRS
            }).encode())
            return
        
        try:
            entries = os.listdir(path)
            result = []
            
            for entry in entries:
                full_path = os.path.join(path, entry)
                try:
                    stat_info = os.stat(full_path)
                    entry_type = "directory" if os.path.isdir(full_path) else "file"
                    
                    result.append({
                        "name": entry,
                        "type": entry_type,
                        "size": stat_info.st_size,
                        "modified": stat_info.st_mtime,
                        "path": full_path
                    })
                except (PermissionError, FileNotFoundError):
                    # Skip entries we can't access
                    pass
            
            self._set_headers()
            self.wfile.write(json.dumps({
                "path": path,
                "entries": result,
                "count": len(result)
            }).encode())
        except (FileNotFoundError, NotADirectoryError):
            self._set_headers()
            self.wfile.write(json.dumps({
                "error": "Directory not found or not a directory",
                "path": path
            }).encode())
        except PermissionError:
            self._set_headers()
            self.wfile.write(json.dumps({
                "error": "Permission denied",
                "path": path
            }).encode())
    
    def _handle_read_file(self, params):
        """Handle the read_file tool"""
        if "path" not in params:
            self.send_error(400, "Path parameter is required")
            return
        
        path = params["path"]
        
        if not self._is_path_allowed(path):
            self._set_headers()
            self.wfile.write(json.dumps({
                "error": "Path not allowed",
                "allowed_dirs": ALLOWED_DIRS
            }).encode())
            return
        
        try:
            # Check file size before reading
            file_size = os.path.getsize(path)
            if file_size > MAX_FILE_SIZE:
                self._set_headers()
                self.wfile.write(json.dumps({
                    "error": "File too large to read",
                    "path": path,
                    "size": file_size,
                    "max_size": MAX_FILE_SIZE
                }).encode())
                return
            
            mime_type, _ = mimetypes.guess_type(path)
            is_binary = mime_type and not mime_type.startswith(('text/', 'application/json'))
            
            with open(path, 'rb' if is_binary else 'r') as f:
                content = f.read()
            
            if is_binary:
                # For binary files, base64 encode the content
                content_base64 = base64.b64encode(content).decode('utf-8')
                self._set_headers()
                self.wfile.write(json.dumps({
                    "path": path,
                    "content_type": mime_type or "application/octet-stream",
                    "encoding": "base64",
                    "size": file_size,
                    "content": content_base64
                }).encode())
            else:
                # For text files, return as-is
                if isinstance(content, bytes):
                    content = content.decode('utf-8', errors='replace')
                self._set_headers()
                self.wfile.write(json.dumps({
                    "path": path,
                    "content_type": mime_type or "text/plain",
                    "encoding": "utf-8",
                    "size": file_size,
                    "content": content
                }).encode())
                
        except FileNotFoundError:
            self._set_headers()
            self.wfile.write(json.dumps({
                "error": "File not found",
                "path": path
            }).encode())
        except PermissionError:
            self._set_headers()
            self.wfile.write(json.dumps({
                "error": "Permission denied",
                "path": path
            }).encode())
        except IsADirectoryError:
            self._set_headers()
            self.wfile.write(json.dumps({
                "error": "Path is a directory, not a file",
                "path": path
            }).encode())
    
    def _handle_get_file_info(self, params):
        """Handle the get_file_info tool"""
        if "path" not in params:
            self.send_error(400, "Path parameter is required")
            return
        
        path = params["path"]
        
        if not self._is_path_allowed(path):
            self._set_headers()
            self.wfile.write(json.dumps({
                "error": "Path not allowed",
                "allowed_dirs": ALLOWED_DIRS
            }).encode())
            return
        
        try:
            stat_info = os.stat(path)
            mime_type, _ = mimetypes.guess_type(path)
            
            info = {
                "path": path,
                "exists": True,
                "is_file": os.path.isfile(path),
                "is_dir": os.path.isdir(path),
                "size": stat_info.st_size,
                "created": stat_info.st_ctime,
                "modified": stat_info.st_mtime,
                "accessed": stat_info.st_atime,
                "mime_type": mime_type
            }
            
            self._set_headers()
            self.wfile.write(json.dumps(info).encode())
        except FileNotFoundError:
            self._set_headers()
            self.wfile.write(json.dumps({
                "path": path,
                "exists": False,
                "error": "File not found"
            }).encode())
        except PermissionError:
            self._set_headers()
            self.wfile.write(json.dumps({
                "path": path,
                "exists": True,
                "error": "Permission denied"
            }).encode())

def run_server():
    """Start the MCP server"""
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, MCPServer)
    print(f"MCP File Browser Server running at http://{HOST}:{PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()