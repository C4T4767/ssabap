const vision = require('@google-cloud/vision')
const fs = require('fs')
const path = require('path')

async function parseMenuImage(imagePath) {
    // Google Cloud Vision API 클라이언트 생성
    // GitHub Actions에서는 GOOGLE_APPLICATION_CREDENTIALS 환경 변수로 인증
    const client = new vision.ImageAnnotatorClient()

    console.log(`Parsing image: ${imagePath}`)

    try {
        // 이미지에서 텍스트 추출
        const [result] = await client.textDetection(imagePath)
        const detections = result.textAnnotations

        if (!detections || detections.length === 0) {
            console.error('No text detected in image')
            return null
        }

        // 전체 텍스트 추출 (첫 번째 항목이 전체 텍스트)
        const fullText = detections[0].description
        console.log('Extracted text:')
        console.log(fullText)
        console.log('\n---\n')

        // 텍스트를 파싱하여 식단 데이터 생성
        const menuData = parseMenuText(fullText)
        return menuData
    } catch (error) {
        console.error('Error parsing image:', error.message)
        throw error
    }
}

function parseMenuText(text) {
    // 텍스트를 줄 단위로 분리
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    console.log('Parsing menu text...')
    
    // 날짜 정보 추출 (예: "26년 1월 2주차" -> 날짜 범위 계산)
    const weekInfo = extractWeekInfo(lines)
    
    // 요일별 식단 추출
    const dailyMenus = extractDailyMenus(lines, weekInfo)
    
    return dailyMenus
}

function extractWeekInfo(lines) {
    // "26년 1월 2주차" 형식의 텍스트에서 주차 정보 추출
    const weekPattern = /(\d+)년\s*(\d+)월\s*(\d+)주차/
    
    for (const line of lines) {
        const match = line.match(weekPattern)
        if (match) {
            const year = 2000 + parseInt(match[1])
            const month = parseInt(match[2])
            const week = parseInt(match[3])
            
            console.log(`Found week info: ${year}년 ${month}월 ${week}주차`)
            
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
            
            return {
                year,
                month,
                week,
                startDate: weekStartDate
            }
        }
    }
    
    return null
}

function extractDailyMenus(lines, weekInfo) {
    if (!weekInfo) {
        console.error('Week info not found')
        return []
    }
    
    const menus = []
    const weekdays = ['월', '화', '수', '목', '금']
    
    // 각 요일별로 식단 추출
    for (let i = 0; i < 5; i++) {
        const date = new Date(weekInfo.startDate)
        date.setDate(weekInfo.startDate.getDate() + i)
        
        const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
        
        // 해당 요일의 메뉴 항목 찾기 (간단한 파싱 - 실제로는 더 정교한 로직 필요)
        const dayMenu = {
            date: dateStr,
            restaurant: '멀티캠퍼스 10층',
            mealTime: '점심',
            meals: extractMealsForDay(lines, weekdays[i]),
            updatedAt: new Date().toISOString()
        }
        
        menus.push(dayMenu)
    }
    
    return menus
}

function extractMealsForDay(lines, weekday) {
    // 요일에 해당하는 메뉴 항목 추출
    // 실제 이미지 구조에 따라 파싱 로직 조정 필요
    
    const meals = []
    
    // 간단한 예시: 텍스트에서 음식 이름으로 보이는 항목들 추출
    // 실제로는 이미지의 레이아웃에 맞게 더 정교한 파싱 필요
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // 요일 찾기
        if (line.includes(weekday)) {
            // 해당 요일 이후의 메뉴 항목들 수집
            const menuItems = []
            let j = i + 1
            
            // 다음 요일이나 특정 구분자가 나올 때까지 수집
            while (j < lines.length && !isWeekday(lines[j])) {
                if (lines[j].length > 0 && !isHeaderOrFooter(lines[j])) {
                    menuItems.push(lines[j])
                }
                j++
            }
            
            // 메뉴 항목들을 meals 배열로 변환
            if (menuItems.length > 0) {
                meals.push({
                    name: menuItems.join(', '),
                    courseName: '10층 식단',
                    setName: '공존식단',
                    photoUrl: '',
                    nutrition: []
                })
            }
            
            break
        }
    }
    
    return meals
}

function isWeekday(text) {
    const weekdays = ['월', '화', '수', '목', '금', '토', '일']
    return weekdays.some(day => text.includes(day))
}

function isHeaderOrFooter(text) {
    // 헤더나 푸터로 보이는 텍스트 필터링
    const filters = ['주차', '식단', '공존', '멀티캠퍼스', '영양', '칼로리']
    return filters.some(filter => text.includes(filter))
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
    
    try {
        const menuData = await parseMenuImage(imagePath)
        
        if (!menuData || menuData.length === 0) {
            console.error('Failed to parse menu data')
            process.exit(1)
        }
        
        // data-10f 디렉토리 생성
        const dataDir = path.join(__dirname, 'data-10f')
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true })
        }
        
        // 각 날짜별로 JSON 파일 저장
        for (const dayMenu of menuData) {
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
