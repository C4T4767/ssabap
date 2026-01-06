const { WelstoryClient } = require('welstory-api-wrapper')
const fs = require('fs')
const path = require('path')

async function fetchMenuData() {
    const client = new WelstoryClient()

    // 환경 변수에서 로그인 정보 가져오기
    const username = process.env.WELSTORY_USERNAME
    const password = process.env.WELSTORY_PASSWORD

    if (!username || !password) {
        console.error('Error: WELSTORY_USERNAME and WELSTORY_PASSWORD must be set')
        process.exit(1)
    }

    try {
        // 로그인
        console.log('Logging in...')
        await client.login({ username, password })

        // 멀티캠퍼스 식당 검색
        console.log('Searching for 멀티캠퍼스...')
        const restaurants = await client.searchRestaurant('멀티캠퍼스')

        if (restaurants.length === 0) {
            console.error('No restaurants found')
            process.exit(1)
        }

        const restaurant = restaurants[0]
        console.log(`Found: ${restaurant.name} (${restaurant.id})`)

        // 식당 등록 확인
        const isRegistered = await restaurant.checkIsRegistered()
        if (!isRegistered) {
            console.log('Registering restaurant...')
            await restaurant.register()
        }

        // 식사 시간 목록 (중식만 필요)
        const mealTimes = await restaurant.listMealTimes()
        const lunchTime = mealTimes.find(m => m.name.includes('중식')) || mealTimes[1]
        console.log(`Lunch time ID: ${lunchTime.id}`)

        // data 디렉토리 생성
        const dataDir = path.join(__dirname, 'data')
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true })
        }

        // 오늘부터 7일치 메뉴 가져오기
        const today = new Date()

        for (let i = 0; i < 7; i++) {
            const targetDate = new Date(today)
            targetDate.setDate(today.getDate() + i)

            const dateStr = targetDate.toISOString().split('T')[0] // YYYY-MM-DD
            const dateNum = parseInt(dateStr.replace(/-/g, '')) // YYYYMMDD

            console.log(`Fetching menu for ${dateStr}...`)

            try {
                const meals = await restaurant.listMeal(dateNum, lunchTime.id)

                // 영양 정보도 함께 가져오기
                const mealsWithNutrition = await Promise.all(
                    meals.map(async (meal) => {
                        try {
                            const nutrition = await meal.listMealMenus()
                            return {
                                name: meal.name,
                                courseName: meal.menuCourseName,
                                setName: meal.setName,
                                photoUrl: meal.photoUrl,
                                nutrition: nutrition
                            }
                        } catch (e) {
                            console.log(`  - Nutrition data not available for ${meal.name}`)
                            return {
                                name: meal.name,
                                courseName: meal.menuCourseName,
                                setName: meal.setName,
                                photoUrl: meal.photoUrl,
                                nutrition: []
                            }
                        }
                    })
                )

                // JSON 파일로 저장
                const data = {
                    date: dateStr,
                    restaurant: restaurant.name,
                    mealTime: lunchTime.name,
                    meals: mealsWithNutrition,
                    updatedAt: new Date().toISOString()
                }

                const filePath = path.join(dataDir, `${dateStr}.json`)
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
                console.log(`  ✓ Saved to ${filePath} (${mealsWithNutrition.length} meals)`)
            } catch (error) {
                console.log(`  ✗ Failed to fetch menu for ${dateStr}: ${error.message}`)

                // 빈 데이터라도 저장
                const data = {
                    date: dateStr,
                    restaurant: restaurant.name,
                    mealTime: lunchTime.name,
                    meals: [],
                    error: error.message,
                    updatedAt: new Date().toISOString()
                }

                const filePath = path.join(dataDir, `${dateStr}.json`)
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
            }
        }

        console.log('\n✓ All done!')
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

fetchMenuData()
