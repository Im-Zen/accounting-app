"""
This script serves the Android project zip file for download
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
from urllib.parse import quote

PORT = 8000
ZIP_FILE = "accounting-android-project.zip"

class DownloadHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            # HTML page with download link
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>دانلود پروژه اندروید</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        background-color: #121212;
                        color: #ffffff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        direction: rtl;
                    }}
                    .container {{
                        text-align: center;
                        background-color: #1e1e1e;
                        padding: 2rem;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        max-width: 500px;
                        width: 100%;
                    }}
                    h1 {{
                        color: #0eead9;
                        margin-bottom: 1rem;
                    }}
                    p {{
                        margin-bottom: 1.5rem;
                        font-size: 1.1rem;
                        line-height: 1.5;
                    }}
                    .download-btn {{
                        background-color: #0eead9;
                        color: #121212;
                        border: none;
                        padding: 0.8rem 1.5rem;
                        font-size: 1.2rem;
                        font-weight: bold;
                        border-radius: 4px;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-block;
                        transition: background-color 0.3s;
                    }}
                    .download-btn:hover {{
                        background-color: #0ac2b2;
                    }}
                    .file-info {{
                        margin-top: 1rem;
                        font-size: 0.9rem;
                        color: #bbbbbb;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>دانلود پروژه اندروید اپلیکیشن حسابداری</h1>
                    <p>
                        فایل پروژه اندروید برای ساخت APK آماده دانلود است. پس از دانلود، فایل را استخراج کرده و طبق راهنمای
                        <code>ANDROID_BUILD_INSTRUCTIONS.md</code> برای ساخت فایل APK اقدام کنید.
                    </p>
                    <a href="/download" class="download-btn">دانلود فایل پروژه اندروید</a>
                    <p class="file-info">
                        حجم فایل: {os.path.getsize(ZIP_FILE) / 1024:.1f} کیلوبایت
                    </p>
                </div>
            </body>
            </html>
            """
            self.wfile.write(html.encode())
            
        elif self.path == "/download":
            # Serve the zip file for download
            if os.path.exists(ZIP_FILE):
                self.send_response(200)
                self.send_header("Content-type", "application/zip")
                self.send_header("Content-Disposition", f"attachment; filename={quote(ZIP_FILE)}")
                self.end_headers()
                
                with open(ZIP_FILE, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(b"404 - File not found")
        else:
            # Serve 404 for any other paths
            self.send_response(404)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"404 - Page not found")

def run_server():
    """Start the HTTP server to serve the download page"""
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, DownloadHandler)
    
    print(f"Starting download server at http://localhost:{PORT}")
    print(f"Press Ctrl+C to stop the server.")
    
    # Open the browser automatically if not running in Replit
    if 'REPL_ID' not in os.environ:
        webbrowser.open(f"http://localhost:{PORT}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()

if __name__ == "__main__":
    if not os.path.exists(ZIP_FILE):
        print(f"Error: {ZIP_FILE} does not exist.")
        sys.exit(1)
    
    run_server()