import os
import psutil

PORT = 8000
killed_any = False

for conn in psutil.net_connections():
    if conn.laddr.port == PORT:
        pid = conn.pid
        if pid:
            try:
                p = psutil.Process(pid)
                p.terminate()
                print(f"포트 {PORT}를 사용 중인 프로세스(PID: {pid})를 종료했습니다.")
                killed_any = True
            except psutil.AccessDenied:
                print(f"PID {pid} 종료 권한이 없습니다.")
            except Exception as e:
                print(f"오류: {e}")

if not killed_any:
    print("종료할 기존 서버 프로세스가 없습니다.")
