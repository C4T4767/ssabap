# 멀티캠퍼스 식단 자동화 시스템

멀티캠퍼스 20층 및 10층 식당의 식단 정보를 자동으로 수집하고 제공하는 시스템입니다.

## 📋 개요

- **20층 식단**: Welstory API를 통해 자동으로 7일치 식단 데이터 수집
- **10층 식단**: PNG 이미지를 OpenAI GPT-4 Vision으로 파싱하여 JSON 변환

## 🏗️ 프로젝트 구조

```
.
├── .github/
│   └── workflows/
│       ├── fetch-menu.yml          # 20층 식단 자동 수집
│       └── parse-10f-menu.yml      # 10층 식단 PNG 파싱
├── data/                           # 20층 식단 JSON 파일 (YYYY-MM-DD.json)
├── data-10f/                       # 10층 식단 JSON 파일 (YYYY-MM-DD.json)
├── images/                         # 10층 식단 PNG 이미지 업로드 폴더
├── multicampus-menu-extension/     # Chrome Extension
├── fetch-menu.js                   # 20층 식단 수집 스크립트
└── parse-10f-menu.js              # 10층 식단 파싱 스크립트
```

## 🚀 설정 방법

### 1. GitHub Secrets 설정

#### 20층 식단용 (Welstory API)
- `WELSTORY_USERNAME`: Welstory 계정 아이디
- `WELSTORY_PASSWORD`: Welstory 계정 비밀번호

#### 10층 식단용 (OpenAI API)
1. [OpenAI Platform](https://platform.openai.com/)에서 계정 생성
2. API Keys 페이지에서 새 API 키 생성
3. GitHub Secrets에 `OPENAI_API_KEY` 추가

> 💡 **비용**: GPT-4o-mini 사용 시 이미지당 약 $0.001-0.003 (매우 저렴)

### 2. 20층 식단 자동 수집

**자동 실행**: 매일 오전 6시 (KST) 자동으로 실행되어 7일치 식단 데이터를 `data/` 폴더에 저장합니다.

**수동 실행**: GitHub Actions 탭에서 "Fetch Menu Data" 워크플로우를 수동으로 실행할 수 있습니다.

### 3. 10층 식단 PNG 파싱

**사용 방법**:
1. 10층 식단 PNG 이미지를 `images/` 폴더에 추가
2. Git에 커밋 및 푸시
3. GitHub Actions가 자동으로 실행되어 PNG를 파싱하고 JSON 생성
4. 생성된 JSON 파일이 `data-10f/` 폴더에 자동으로 커밋됨

**예시**:
```bash
# PNG 파일을 images/ 폴더에 복사
cp "멀티캠퍼스(10층)_공존식단_26년_1월_2주차.png" images/

# Git에 추가 및 푸시
git add images/
git commit -m "Add 10F menu for week 2"
git push
```

## 📊 JSON 데이터 형식

### 20층 식단 (data/YYYY-MM-DD.json)
```json
{
  "date": "2026-01-06",
  "restaurant": "멀티캠퍼스",
  "mealTime": "점심",
  "meals": [
    {
      "name": "대파육개장",
      "courseName": "A:한식",
      "setName": "대파육개장&오징어완자전",
      "photoUrl": "http://...",
      "nutrition": [
        {
          "name": "대파육개장",
          "isMain": true,
          "calorie": 253,
          "carbohydrate": 8,
          "protein": 18,
          ...
        }
      ]
    }
  ],
  "updatedAt": "2026-01-06T04:26:27.220Z"
}
```

### 10층 식단 (data-10f/YYYY-MM-DD.json)
```json
{
  "date": "2026-01-06",
  "restaurant": "멀티캠퍼스 10층",
  "mealTime": "점심",
  "meals": [
    {
      "name": "메뉴 이름",
      "courseName": "10층 식단",
      "setName": "공존식단",
      "photoUrl": "",
      "nutrition": []
    }
  ],
  "updatedAt": "2026-01-06T04:26:27.220Z"
}
```

## 🔧 로컬 테스트

### 20층 식단 수집
```bash
# 환경 변수 설정
export WELSTORY_USERNAME="your_username"
export WELSTORY_PASSWORD="your_password"

# 스크립트 실행
node fetch-menu.js
```

### 10층 식단 파싱
```bash
# OpenAI API 키 설정
export OPENAI_API_KEY="your_openai_api_key"

# 스크립트 실행
node parse-10f-menu.js images/멀티캠퍼스(10층)_공존식단_26년_1월_2주차.png
```

## 🌐 Chrome Extension

`multicampus-menu-extension/` 폴더에 있는 Chrome Extension을 사용하면 브라우저에서 식단을 편리하게 확인할 수 있습니다.

자세한 설치 방법은 `multicampus-menu-extension/README.md`를 참고하세요.

## 📝 라이선스

MIT License

## 🤝 기여

이슈 및 Pull Request를 환영합니다!
