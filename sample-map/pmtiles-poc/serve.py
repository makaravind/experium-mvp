#!/usr/bin/env python3
"""HTTP server with range-request support — required for PMTiles byte serving."""
import http.server, os, re, sys

class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().do_GET()

        range_header = self.headers.get('Range')
        if not range_header:
            return super().do_GET()

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404)
            return

        file_len = os.fstat(f.fileno()).st_size
        m = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not m:
            f.close()
            return super().do_GET()

        start  = int(m.group(1))
        end    = int(m.group(2)) if m.group(2) else file_len - 1
        end    = min(end, file_len - 1)
        length = end - start + 1

        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{file_len}')
        self.send_header('Content-Length', str(length))
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()

        remaining = length
        while remaining:
            chunk = f.read(min(65536, remaining))
            if not chunk:
                break
            self.wfile.write(chunk)
            remaining -= len(chunk)
        f.close()

    def log_message(self, fmt, *args):
        pass

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f'Serving on http://localhost:{port}')
    http.server.test(HandlerClass=RangeHandler, port=port, bind='')
