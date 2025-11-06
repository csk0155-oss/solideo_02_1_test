# System Resource Monitor

실시간 PC 시스템 리소스 모니터링 시스템

## 기능

- **실시간 모니터링**: CPU, 메모리, 디스크, 네트워크, 온도 등 모든 시스템 리소스 추적
- **시각화**: 직관적인 차트와 그래프로 데이터 표시
- **자동 수집**: 10초 간격으로 자동 데이터 수집
- **표시 윈도우**: 최근 3분 (18개 데이터 포인트) 표시
- **자동 종료**: 5분 후 자동 모니터링 중지
- **PDF 리포트**: 수집된 데이터를 그래프와 표가 포함된 PDF로 다운로드

## 모니터링 항목

### CPU
- 사용률 (%)
- 코어/스레드 수
- 현재/최대 주파수
- 온도 (가능한 경우)

### 메모리
- 사용률 (%)
- 총 메모리/사용 중/사용 가능
- 스왑 메모리 정보

### 디스크
- 파티션별 사용률
- 총 용량/사용 중/여유 공간
- 읽기/쓰기 통계

### 네트워크
- 업로드/다운로드 속도 (실시간)
- 총 전송/수신 데이터
- 네트워크 인터페이스 정보

### 온도
- CPU 온도
- GPU 온도 (가능한 경우)
- GPU 사용률 및 메모리

## 기술 스택

### Backend
- Python 3.x
- Flask (웹 서버)
- Flask-SocketIO (실시간 통신)
- psutil (시스템 정보 수집)
- GPUtil (GPU 정보)
- ReportLab (PDF 생성)
- Matplotlib (차트 생성)

### Frontend
- React 18
- Chart.js (실시간 차트)
- Socket.IO Client (WebSocket 통신)
- Axios (HTTP 요청)

## 설치 및 실행

### 1. Backend 설정

```bash
cd backend

# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python app.py
```

Backend 서버는 `http://localhost:5000`에서 실행됩니다.

### 2. Frontend 설정

새 터미널에서:

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

Frontend 애플리케이션은 `http://localhost:3000`에서 실행됩니다.

## 사용 방법

1. Backend와 Frontend 서버를 모두 실행합니다
2. 브라우저에서 `http://localhost:3000`을 엽니다
3. "Start Monitoring" 버튼을 클릭하여 모니터링을 시작합니다
4. 실시간 차트와 통계를 확인합니다
5. 5분 동안 데이터가 자동으로 수집됩니다 (또는 수동으로 중지 가능)
6. "Download PDF Report" 버튼을 클릭하여 리포트를 다운로드합니다

## 특징

### 실시간 업데이트
- 10초마다 시스템 데이터 수집
- WebSocket을 통한 즉각적인 데이터 전송
- 부드러운 차트 애니메이션

### 데이터 표시
- 최근 3분간의 데이터를 차트로 표시
- 현재 시스템 상태를 카드 형태로 표시
- 상세 정보를 테이블로 표시

### PDF 리포트
- 수집된 모든 데이터의 통계 요약
- 각 메트릭별 그래프
- 최소/최대/평균 값 테이블
- 전문적인 레이아웃

## API 엔드포인트

### REST API
- `GET /api/health` - 서버 상태 확인
- `GET /api/status` - 모니터링 상태 확인
- `POST /api/generate_pdf` - PDF 리포트 생성 및 다운로드

### WebSocket Events
- `connect` - 클라이언트 연결
- `start_monitoring` - 모니터링 시작
- `stop_monitoring` - 모니터링 중지
- `get_current_data` - 현재 데이터 요청
- `system_data` - 시스템 데이터 수신 (서버→클라이언트)
- `monitoring_status` - 모니터링 상태 변경 알림

## 시스템 요구사항

- Python 3.7+
- Node.js 14+
- 모던 웹브라우저 (Chrome, Firefox, Safari, Edge)

## 주의사항

- 일부 시스템에서는 온도 정보를 읽을 수 없을 수 있습니다 (권한 필요)
- GPU 정보는 NVIDIA GPU가 있을 때만 사용 가능합니다
- Linux에서는 일부 센서 정보에 root 권한이 필요할 수 있습니다

## 라이선스

이 프로젝트는 오픈소스입니다.

## 개발자

System Resource Monitor v1.0
