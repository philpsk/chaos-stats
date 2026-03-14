import http.server
import socketserver
import urllib.request
import urllib.parse
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # /api/record 접근 시 (웹에서 특정 유저 클릭 시 여기로 요청이 옴)
        if self.path.startswith('/api/record'):
            parsed_path = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_path.query)
            ano = query.get('ano', [''])[0]
            
            if ano:
                target_url = f"http://www.chaosonline.co.kr:8081/ClientJson/RecordInfo.aspx?tabType=A&ano={ano}"
                try:
                    req = urllib.request.Request(target_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req) as response:
                        data = response.read()
                        
                        # 사용자팀의 훌륭한 아이디어: JSON으로 로컬에 직접 저장 (캐싱 역할)
                        cache_dir = os.path.join(DIRECTORY, 'cache')
                        if not os.path.exists(cache_dir):
                            os.makedirs(cache_dir)
                            
                        cache_file = os.path.join(cache_dir, f"{ano}_realtime.json")
                        with open(cache_file, 'wb') as f:
                            f.write(data)
                            
                        print(f"[알림] {ano} 유저의 실시간 전적을 가져와 {cache_file} 에 저장 완료!")

                        # 곧바로 웹 브라우저로 쏴준다
                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(data)
                        return
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(str(e).encode('utf-8'))
                    return
            
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Missing ano')
            return
            
        return super().do_GET()

socketserver.TCPServer.allow_reuse_address = True

try:
    with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
        print(f"🚀 자체 API 프록시가 내장된 웹 서버가 포트 {PORT}에서 실행 중입니다...")
        print("👉 브라우저에서 접속: http://localhost:8000")
        httpd.serve_forever()
except OSError as e:
    print(f"❌ 포트 {PORT}가 이미 사용 중입니다. 기존 파이썬 서버를 완전히 종료 후 다시 시도하세요.")
