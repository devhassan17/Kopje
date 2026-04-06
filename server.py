import http.server
import socketserver
import json
import os
import datetime

PORT = 3000
DB_FILE = "leaderboard.json"

class LeaderboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/leaderboard':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if os.path.exists(DB_FILE):
                with open(DB_FILE, 'r') as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError:
                        data = []
            else:
                data = []
            
            # Sort by score descending and take top 10
            data.sort(key=lambda x: x.get('score', 0), reverse=True)
            self.wfile.write(json.dumps(data[:10]).encode())
        else:
            # Serve static files for everything else
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/submit':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                new_entry = json.loads(post_data.decode('utf-8'))
                name = new_entry.get('name')
                score = new_entry.get('score')
                
                if not name or score is None:
                    raise ValueError("Missing name or score")
                
                # Load existing data
                if os.path.exists(DB_FILE):
                    with open(DB_FILE, 'r') as f:
                        try:
                            data = json.load(f)
                        except json.JSONDecodeError:
                            data = []
                else:
                    data = []
                
                # Add new entry
                new_entry['timestamp'] = datetime.datetime.now().isoformat()
                data.append(new_entry)
                
                # Save to file
                with open(DB_FILE, 'w') as f:
                    json.dump(data, f, indent=2)
                
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"message": "Score submitted successfully!"}).encode())
                
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_error(404, "Not Found")

    def do_OPTIONS(self):
        # Support CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# Change to the project directory before serving
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), LeaderboardHandler) as httpd:
    print(f"Kopje gooien + Moyee Leaderboard server serving at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()
