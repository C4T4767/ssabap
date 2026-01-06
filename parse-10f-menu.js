const { GoogleGenerativeAI } = require('@google/generative-ai')
const fs = require('fs')
const path = require('path')

async function parseMenuImage(imagePath) {
    // Google Gemini API 클라이언트 생성
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    console.log(`Parsing image: ${imagePath}`)

    try {
        // 이미지를 base64로 인코딩
        const imageBuffer = fs.readFileSync(imagePath)
        const base64Image = imageBuffer.toString('base64')
        const imageExtension = path.extname(imagePath).substring(1).toLowerCase()

        // MIME 타입 결정
        let mimeType = 'image/png'
        if (imageExtension === 'jpg' || imageExtension === 'jpeg') {
            mimeType = 'image/jpeg'
        }

        console.log('Sending image to Gemini...')

        const prompt = `이 이미지는 멀티캠퍼스 10층 식당의 주간 식단표입니다.

이미지를 분석해서 각 요일(월요일~금요일)의 식단을 JSON 형식으로 정리해주세요.

각 요일마다 다음 정보를 추출해주세요:
- 날짜 (예: "1.6")
- 도시락 메뉴 (여러 개)
- 브런치 메뉴 (여러 개)
- 샐러드 메뉴 (여러 개)

JSON 형식:
{
  "weekInfo": "26년 1월 2주차",
  "days": [
    {
      "dayOfWeek": "월요일",
      "date": "1.6",
      "meals": {
        "도시락": ["메뉴1", "메뉴2", ...],
        "브런치": ["메뉴1", "메뉴2", ...],
        "샐러드": ["메뉴1", "메뉴2", ...]
      }
    },
    ...
  ]
}

메뉴 이름은 이미지에 표시된 그대로 정확하게 적어주세요.
JSON만 출력하고 다른 설명은 하지 마세요.`

        // Gemini API 호출
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ])

        const response = await result.response
        const content = response.text()

        console.log('Gemini Response:')
        console.log(content)
        console.log('\n---\n')

        // JSON 파싱 (```json ... ``` 형식도 처리)
        let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
            const menuData = JSON.parse(jsonMatch[1])
            return menuData
        }

        // 일반 JSON 형식
        jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Failed to extract JSON from Gemini response')
        }

        const menuData = JSON.parse(jsonMatch[0])
        return menuData
    } catch (error) {
        console.error('Error parsing image:', error.message)
        throw error
    }
}

function convertToDateBasedJSON(menuData) {
    // 주차 정보에서 연도, 월, 주차 추출
    const weekPattern = /(\d+)년\s*(\d+)월\s*(\d+)주차/
    const match = menuData.weekInfo.match(weekPattern)

    if (!match) {
        throw new Error('Failed to parse week info')
    }

    const year = 2000 + parseInt(match[1])
    const month = parseInt(match[2])
    const week = parseInt(match[3])

    console.log(`Week info: ${year}년 ${month}월 ${week}주차`)

    // 해당 월의 첫 날 찾기
    const firstDay = new Date(year, month - 1, 1)

    // 첫 번째 월요일 찾기
    const firstMonday = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7
    firstMonday.setDate(firstDay.getDate() + daysUntilMonday)

    // N주차의 월요일 계산
    const weekStartDate = new Date(firstMonday)
    weekStartDate.setDate(firstMonday.getDate() + (week - 1) * 7)

    console.log(`Week starts on: ${weekStartDate.toISOString().split('T')[0]}`)

    // 각 요일별로 JSON 생성
    const result = []

    menuData.days.forEach((day, index) => {
        const date = new Date(weekStartDate)
        date.setDate(weekStartDate.getDate() + index)
        const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD

        // meals 배열 생성
        const meals = []

        // 도시락
        if (day.meals['도시락'] && day.meals['도시락'].length > 0) {
            meals.push({
                name: day.meals['도시락'].join(', '),
                courseName: '도시락',
                setName: '10층 공존식단',
                photoUrl: '',
                nutrition: [],
                items: day.meals['도시락']
            })
        }

        // 브런치
        if (day.meals['브런치'] && day.meals['브런치'].length > 0) {
            meals.push({
                name: day.meals['브런치'].join(', '),
                courseName: '브런치',
                setName: '10층 공존식단',
                photoUrl: '',
                nutrition: [],
                items: day.meals['브런치']
            })
        }

        // 샐러드
        if (day.meals['샐러드'] && day.meals['샐러드'].length > 0) {
            meals.push({
                name: day.meals['샐러드'].join(', '),
                courseName: '샐러드',
                setName: '10층 공존식단',
                photoUrl: '',
                nutrition: [],
                items: day.meals['샐러드']
            })
        }

        result.push({
            date: dateStr,
            dayOfWeek: day.dayOfWeek,
            restaurant: '멀티캠퍼스 10층',
            mealTime: '점심',
            meals: meals,
            updatedAt: new Date().toISOString()
        })
    })

    return result
}

async function main() {
    const args = process.argv.slice(2)

    if (args.length === 0) {
        console.error('Usage: node parse-10f-menu.js <image-path>')
        process.exit(1)
    }

    const imagePath = args[0]

    if (!fs.existsSync(imagePath)) {
        console.error(`Image not found: ${imagePath}`)
        process.exit(1)
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY environment variable is not set')
        process.exit(1)
    }

    try {
        const menuData = await parseMenuImage(imagePath)

        if (!menuData || !menuData.days || menuData.days.length === 0) {
            console.error('Failed to parse menu data')
            process.exit(1)
        }

        // 날짜 기반 JSON으로 변환
        const dateBasedMenus = convertToDateBasedJSON(menuData)

        // data-10f 디렉토리 생성
        const dataDir = path.join(__dirname, 'data-10f')
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true })
        }

        // 각 날짜별로 JSON 파일 저장
        for (const dayMenu of dateBasedMenus) {
            const filePath = path.join(dataDir, `${dayMenu.date}.json`)
            fs.writeFileSync(filePath, JSON.stringify(dayMenu, null, 2), 'utf-8')
            console.log(`✓ Saved to ${filePath}`)
        }

        console.log('\n✓ All done!')
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

main()
