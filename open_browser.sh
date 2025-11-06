#!/bin/bash

echo "======================================"
echo "  System Monitor 접속 가이드"
echo "======================================"
echo ""
echo "✅ 서버 실행 중:"
echo "   - 백엔드: http://localhost:5000"
echo "   - 프론트엔드: http://localhost:8000"
echo ""
echo "======================================"
echo "  접속 방법"
echo "======================================"
echo ""
echo "방법 1: 로컬 브라우저에서"
echo "   주소창에 입력: http://localhost:8000"
echo ""
echo "방법 2: 원격 서버라면 (로컬 컴퓨터에서 실행)"
echo "   ssh -L 8000:localhost:8000 -L 5000:localhost:5000 사용자@서버주소"
echo "   그 다음: http://localhost:8000"
echo ""
echo "방법 3: Claude Code 사용 중이라면"
echo "   화면 아래 [PORTS] 탭 → 포트 8000 클릭"
echo ""
echo "======================================"
echo "  테스트"
echo "======================================"
echo ""
echo "터미널에서 테스트:"
echo "   curl http://localhost:8000"
echo ""

read -p "브라우저를 열까요? (y/n): " choice
if [ "$choice" = "y" ] || [ "$choice" = "Y" ]; then
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:8000
        echo "✅ 브라우저가 열렸습니다!"
    elif command -v open > /dev/null; then
        open http://localhost:8000
        echo "✅ 브라우저가 열렸습니다!"
    else
        echo "❌ 브라우저를 자동으로 열 수 없습니다."
        echo "수동으로 http://localhost:8000 을 열어주세요."
    fi
fi
