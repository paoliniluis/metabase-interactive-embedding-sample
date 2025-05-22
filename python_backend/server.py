from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode
from pathlib import Path

import jwt

# Constants
HOSTNAME = 'localhost'
PORT = 9090
STATIC_PATH = Path(__file__).parent.parent / "frontend"
JWT_SIGNING_KEY_INTERACTIVE_EMBEDDING = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
METABASE_URL = 'http://localhost:3000'

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        url_parts = urlparse(f"http://localhost:3000{self.path}")
        
        if url_parts.path == '/api/health':
            self._handle_health_check()
        elif url_parts.path == '/api/auth':
            self._handle_auth(url_parts)
        else:
            self._handle_static_files()

    def _handle_health_check(self):
        """Handle health check endpoint"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()

    def _handle_auth(self, url_parts):
        """Handle authentication endpoint"""
        query_params = parse_qs(url_parts.query)
        
        # User information for SSO
        user = {
            "email": "someone@somedomain.com",
            "first_name": "Someone",
            "last_name": "Somebody",
            "exp": int(time.time()) + 60 * 60,  # 1 hour expiration
            "groups": ["viewer"]
        }

        # Create JWT token
        token = sign_user_token(user)
        
        # Build redirect URL
        redirect_params = {
            'jwt': token
        }
        if 'return_to' in query_params:
            redirect_params['return_to'] = query_params['return_to'][0]

        redirect_url = f"{METABASE_URL}/auth/sso?{urlencode(redirect_params)}"
        
        # Send redirect response
        self.send_response(302)
        self.send_header('Location', redirect_url)
        self.end_headers()

    def _handle_static_files(self):
        """Handle serving static files"""
        try:
            file_path = self._prepare_file()
            if file_path['found']:
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=UTF-8')
                self.end_headers()
                with open(file_path['stream_path'], 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'text/html; charset=UTF-8')
                self.end_headers()
                with open(STATIC_PATH / "404.html", 'rb') as f:
                    self.wfile.write(f.read())
            
            print(f"{self.command} {self.path} {200 if file_path['found'] else 404}")
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            print(f"Error serving static file: {e}")

    def _prepare_file(self):
        """Prepare file for serving"""
        file_path = f'{STATIC_PATH}/{self.path}'[:-1]
        
        if self.path.endswith('/'):
            file_path = f'{file_path}/index.html'

        # Check for path traversal

        exists = Path(file_path).exists()
        print( STATIC_PATH)
        stream_path = file_path if exists else STATIC_PATH / "404.html"
        ext = stream_path[stream_path.find('.',0):len(stream_path)] if len(stream_path) else ''

        return {
            'found': exists,
            'ext': ext,
            'stream_path': stream_path
        }

def sign_user_token(user):
    """
    Generate a JWT token for a user
    
    Args:
        user (dict): User information including email, names, expiration, and groups
    
    Returns:
        str: Signed JWT token
    """
    return jwt.encode(
        {
            'email': user['email'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'exp': user['exp'],
            'groups': user['groups']
        },
        JWT_SIGNING_KEY_INTERACTIVE_EMBEDDING,
        algorithm='HS256'
    )

if __name__ == '__main__':
    import time
    
    server = HTTPServer((HOSTNAME, PORT), RequestHandler)
    print(f"Server running at http://{HOSTNAME}:{PORT}/")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.server_close()