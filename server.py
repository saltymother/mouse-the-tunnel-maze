#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
import subprocess
import webbrowser
import socket
import threading

PORT = 8095
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def open_browser(url):
    chrome_path = "/Applications/Google Chrome.app"
    if os.path.exists(chrome_path):
        try:
            res = subprocess.run(["open", "-a", "Google Chrome", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode == 0:
                print(f"🐭 Opened in Google Chrome: {url}")
                return
        except Exception:
            pass
    try:
        subprocess.run(["open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"🐭 Opened in default browser: {url}")
    except Exception:
        try:
            webbrowser.open(url)
        except Exception:
            pass

def main():
    global PORT
    while is_port_in_use(PORT):
        PORT += 1

    url = f"http://localhost:{PORT}/index.html"
    print(f"🐭 MOUSE: THE TUNNEL MAZE server running at: {url}")
    print(f"📂 Serving directory: {DIRECTORY}")

    threading.Timer(0.8, open_browser, args=[url]).start()

    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        print("💡 Press Ctrl+C to terminate the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.shutdown()

if __name__ == "__main__":
    main()
