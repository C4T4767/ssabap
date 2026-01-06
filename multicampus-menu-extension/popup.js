/**
 * Welstory Menu Viewer - Dual Floor Version
 */

// GitHub raw URLs
const GITHUB_RAW_URL_20F = 'https://raw.githubusercontent.com/C4T4767/ssabap/main/data'
const GITHUB_RAW_URL_10F = 'https://raw.githubusercontent.com/C4T4767/ssabap/main/data-10f'

// DOM 요소
const dateInput = document.getElementById('dateInput')
const prevDayBtn = document.getElementById('prevDayBtn')
const nextDayBtn = document.getElementById('nextDayBtn')
const meals20FContainer = document.getElementById('meals20FContainer')
const meals10FContainer = document.getElementById('meals10FContainer')
const loading = document.getElementById('loading')
const errorDiv = document.getElementById('error')

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date()
    dateInput.valueAsDate = today
    loadAllMenus()
})

/**
 * 모든 메뉴 로드 (20층 + 10층)
 */
async function loadAllMenus() {
    const date = dateInput.value

    if (!date) {
        errorDiv.textContent = '날짜를 선택하세요'
        return
    }

    try {
        loading.classList.remove('hidden')
        meals20FContainer.innerHTML = ''
        meals10FContainer.innerHTML = ''
        errorDiv.textContent = ''

        // 20층과 10층 메뉴를 동시에 로드
        const [data20F, data10F] = await Promise.all([
            fetchMenu(GITHUB_RAW_URL_20F, date),
            fetchMenu(GITHUB_RAW_URL_10F, date)
        ])

        // 20층 메뉴 표시
        if (data20F && data20F.meals && data20F.meals.length > 0) {
            display20FMeals(data20F.meals)
        } else {
            meals20FContainer.innerHTML = '<p class="no-data">해당 날짜에 메뉴가 없습니다</p>'
        }

        // 10층 메뉴 표시
        if (data10F && data10F.meals && data10F.meals.length > 0) {
            display10FMeals(data10F.meals)
        } else {
            meals10FContainer.innerHTML = '<p class="no-data">해당 날짜에 메뉴가 없습니다</p>'
        }
    } catch (error) {
        console.error('메뉴 로드 실패:', error)
        errorDiv.textContent = `메뉴 로드 실패: ${error.message}`
    } finally {
        loading.classList.add('hidden')
    }
}

/**
 * 메뉴 데이터 가져오기
 */
async function fetchMenu(baseUrl, date) {
    try {
        const url = `${baseUrl}/${date}.json`
        console.log('Fetching:', url)

        const response = await fetch(url)

        if (!response.ok) {
            console.warn(`데이터를 찾을 수 없습니다: ${url}`)
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('Fetch error:', error)
        return null
    }
}

/**
 * 20층 메뉴 표시
 */
function display20FMeals(meals) {
    meals20FContainer.innerHTML = ''

    meals.forEach(meal => {
        const mealCard = document.createElement('div')
        mealCard.className = 'meal-card'

        const mealHeader = document.createElement('div')
        mealHeader.className = 'meal-header'
        mealHeader.innerHTML = `
            <h3>${meal.courseName}</h3>
            <p class="meal-name">${meal.name}</p>
            ${meal.setName ? `<p class="set-name">${meal.setName}</p>` : ''}
        `

        mealCard.appendChild(mealHeader)

        if (meal.photoUrl) {
            const img = document.createElement('img')
            img.src = meal.photoUrl
            img.alt = meal.name
            img.className = 'meal-photo'
            img.onerror = () => img.style.display = 'none'
            mealCard.appendChild(img)
        }

        if (meal.nutrition && meal.nutrition.length > 0) {
            const nutritionBtn = document.createElement('button')
            nutritionBtn.className = 'btn btn-small'
            nutritionBtn.textContent = '영양 정보'
            nutritionBtn.onclick = () => toggleNutrition(mealCard, meal.nutrition)
            mealCard.appendChild(nutritionBtn)

            const nutritionDiv = document.createElement('div')
            nutritionDiv.className = 'nutrition-info hidden'
            mealCard.appendChild(nutritionDiv)
        }

        meals20FContainer.appendChild(mealCard)
    })
}

/**
 * 10층 메뉴 표시
 */
function display10FMeals(meals) {
    meals10FContainer.innerHTML = ''

    meals.forEach(meal => {
        const mealCard = document.createElement('div')
        mealCard.className = 'meal-card meal-card-10f'

        const mealHeader = document.createElement('div')
        mealHeader.className = 'meal-header'
        mealHeader.innerHTML = `
            <h3>${meal.courseName}</h3>
        `

        mealCard.appendChild(mealHeader)

        // items 배열 표시
        if (meal.items && meal.items.length > 0) {
            const itemsList = document.createElement('div')
            itemsList.className = 'menu-items'
            itemsList.innerHTML = '<ul>' + meal.items.map(item => `<li>${item}</li>`).join('') + '</ul>'
            mealCard.appendChild(itemsList)
        }

        meals10FContainer.appendChild(mealCard)
    })
}

/**
 * 영양 정보 토글
 */
function toggleNutrition(mealCard, nutrition) {
    const nutritionDiv = mealCard.querySelector('.nutrition-info')

    if (!nutritionDiv.classList.contains('hidden')) {
        nutritionDiv.classList.add('hidden')
        return
    }

    let html = '<table class="nutrition-table"><thead><tr><th>메뉴</th><th>칼로리</th><th>탄수화물</th><th>단백질</th><th>지방</th></tr></thead><tbody>'

    nutrition.forEach(n => {
        html += `
            <tr>
                <td>${n.name}${n.isMain ? ' ⭐' : ''}</td>
                <td>${n.calorie}kcal</td>
                <td>${n.carbohydrate}g</td>
                <td>${n.protein}g</td>
                <td>${n.fat}g</td>
            </tr>
        `
    })

    html += '</tbody></table>'
    nutritionDiv.innerHTML = html
    nutritionDiv.classList.remove('hidden')
}

// 날짜 변경 이벤트
dateInput.addEventListener('change', loadAllMenus)

// 이전 날짜
prevDayBtn.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value)
    currentDate.setDate(currentDate.getDate() - 1)
    dateInput.valueAsDate = currentDate
    loadAllMenus()
})

// 다음 날짜
nextDayBtn.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value)
    currentDate.setDate(currentDate.getDate() + 1)
    dateInput.valueAsDate = currentDate
    loadAllMenus()
})
