/**
 * Welstory Menu Viewer - GitHub Data Version
 */

// GitHub raw URL
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/C4T4767/ssabap/main/data'

// DOM 요소
const dateInput = document.getElementById('dateInput')
const prevDayBtn = document.getElementById('prevDayBtn')
const nextDayBtn = document.getElementById('nextDayBtn')
const mealsContainer = document.getElementById('mealsContainer')
const loading = document.getElementById('loading')
const errorDiv = document.getElementById('error')

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date()
    dateInput.valueAsDate = today
    loadMenu()
})

/**
 * 메뉴 로드
 */
async function loadMenu() {
    const date = dateInput.value

    if (!date) {
        errorDiv.textContent = '날짜를 선택하세요'
        return
    }

    try {
        loading.classList.remove('hidden')
        mealsContainer.innerHTML = ''
        errorDiv.textContent = ''

        const url = `${GITHUB_RAW_URL}/${date}.json`
        console.log('Fetching:', url)

        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`데이터를 찾을 수 없습니다 (${response.status})`)
        }

        const data = await response.json()

        if (!data.meals || data.meals.length === 0) {
            mealsContainer.innerHTML = '<p class="no-data">해당 날짜에 메뉴가 없습니다</p>'
            return
        }

        displayMeals(data.meals)
    } catch (error) {
        console.error('메뉴 로드 실패:', error)
        errorDiv.textContent = `메뉴 로드 실패: ${error.message}`

        if (error.message.includes('404')) {
            errorDiv.textContent = '해당 날짜의 메뉴 데이터가 아직 준비되지 않았습니다'
        }
    } finally {
        loading.classList.add('hidden')
    }
}

/**
 * 메뉴 표시
 */
function displayMeals(meals) {
    mealsContainer.innerHTML = ''

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

        mealsContainer.appendChild(mealCard)
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
dateInput.addEventListener('change', loadMenu)

// 이전 날짜
prevDayBtn.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value)
    currentDate.setDate(currentDate.getDate() - 1)
    dateInput.valueAsDate = currentDate
    loadMenu()
})

// 다음 날짜
nextDayBtn.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value)
    currentDate.setDate(currentDate.getDate() + 1)
    dateInput.valueAsDate = currentDate
    loadMenu()
})
