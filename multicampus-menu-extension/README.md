# 멀티캠퍼스 식단 확장 프로그램

## 📦 설치 방법

1. **GitHub 저장소 URL 설정**
   - `popup.js` 파일 6번 줄 수정:
   ```javascript
   const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/ssabap/main/data'
   ```
   - `YOUR_USERNAME`을 본인의 GitHub 사용자명으로 변경

2. **크롬 확장 프로그램 로드**
   - 크롬에서 `chrome://extensions/` 열기
   - 우측 상단 "개발자 모드" ON
   - "압축해제된 확장 프로그램을 로드합니다" 클릭
   - 이 폴더(`multicampus-menu-extension`) 선택

## 🎯 사용 방법

1. 확장 프로그램 아이콘 클릭
2. 날짜 선택 (기본값: 오늘)
3. 화살표 버튼(◀ ▶)으로 날짜 이동
4. 영양 정보 버튼 클릭하여 상세 정보 확인

## ✨ 특징

- ✅ 로그인 불필요
- ✅ GitHub에서 데이터 로드 (빠르고 안정적)
- ✅ 간단한 UI
- ✅ 영양 정보 포함
