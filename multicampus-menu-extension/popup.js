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

/**
 * KST 기준 현재 날짜를 반환 (0:00 기준)
 */
function getKSTDate() {
    const now = new Date()
    // UTC 시간에 9시간(KST offset)을 더해서 KST 날짜 계산
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    // 시간 부분을 0으로 설정하여 날짜만 반환
    kstTime.setUTCHours(0, 0, 0, 0)
    return kstTime
}

// 요일 표시 업데이트
function updateDayOfWeek() {
    const date = new Date(dateInput.value)
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const dayOfWeek = days[date.getDay()]

    const dayDisplay = document.getElementById('dayDisplay')
    if (dayDisplay) {
        dayDisplay.textContent = dayOfWeek
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    const today = getKSTDate()
    dateInput.valueAsDate = today
    updateDayOfWeek()
    loadAllMenus()
})

/**
 * 모든 메뉴 로드 (20층 + 10층)
 */
async function loadAllMenus() {
    const date = dateInput.value

    if (!date) {
        return
    }

    try {
        meals20FContainer.innerHTML = ''
        meals10FContainer.innerHTML = ''

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
    } finally {
    }
}

/**
 * 메뉴 데이터 가져오기
 */
async function fetchMenu(baseUrl, date) {
    try {
        // 캐시 무효화를 위한 타임스탬프 추가
        const timestamp = Math.floor(Date.now() / 60000) // 1분마다 갱신
        const url = `${baseUrl}/${date}.json?t=${timestamp}`
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
 * 20층 메뉴 표시 (압축 보드형)
 */
function display20FMeals(meals) {
    meals20FContainer.innerHTML = ''

    meals.forEach(meal => {
        const mealCard = document.createElement('div')
        mealCard.className = 'meal-board'

        // 총 칼로리 계산
        const totalCalories = meal.nutrition ? meal.nutrition.reduce((sum, item) => sum + item.calorie, 0) : 0
        const mainDish = meal.nutrition ? meal.nutrition.find(item => item.isMain) : null

        // 헤더 (코스명 | 메인메뉴 | 총칼로리 | 아이콘)
        const header = document.createElement('div')
        header.className = 'board-header'
        header.innerHTML = `
            <div class="board-title">
                <span class="course-badge">${meal.courseName}</span>
                <span class="main-dish">${mainDish ? mainDish.name : meal.name}</span>
                ${mainDish ? '<span class="star">⭐</span>' : ''}
            </div>
            <div class="board-actions">
                <span class="total-cal">${totalCalories} kcal</span>
                ${meal.nutrition && meal.nutrition.length > 0 ? '<button class="icon-btn" data-action="nutrition" title="영양 정보">ℹ️</button>' : ''}
            </div>
        `
        mealCard.appendChild(header)

        // 메뉴 + 이미지 컨테이너
        const contentContainer = document.createElement('div')
        contentContainer.className = 'board-content'

        // 구성 메뉴 (인라인 리스트)
        if (meal.nutrition && meal.nutrition.length > 0) {
            const menuList = document.createElement('div')
            menuList.className = 'inline-menu-list'

            const items = meal.nutrition.map(item => {
                return `<span class="menu-chip">${item.name} <span class="chip-cal">${item.calorie}</span></span>`
            }).join('')

            menuList.innerHTML = items
            contentContainer.appendChild(menuList)
        }

        // 썸네일 이미지 (오른쪽)
        if (meal.photoUrl) {
            const thumbnail = document.createElement('img')
            thumbnail.src = meal.photoUrl
            thumbnail.alt = meal.name
            thumbnail.className = 'board-thumbnail'
            thumbnail.onerror = () => thumbnail.style.display = 'none'
            thumbnail.onclick = () => {
                const modal = mealCard.querySelector('.image-modal')
                if (modal) modal.classList.toggle('hidden')
            }
            contentContainer.appendChild(thumbnail)

            // 이미지 모달
            const imageModal = document.createElement('div')
            imageModal.className = 'image-modal hidden'
            imageModal.innerHTML = `
                <div class="modal-content">
                    <img src="${meal.photoUrl}" alt="${meal.name}">
                    <button class="modal-close">✕</button>
                </div>
            `
            mealCard.appendChild(imageModal)

            const closeBtn = imageModal.querySelector('.modal-close')
            if (closeBtn) closeBtn.onclick = () => imageModal.classList.add('hidden')
        }

        mealCard.appendChild(contentContainer)

        // 영양정보 (숨김 상태)
        if (meal.nutrition && meal.nutrition.length > 0) {
            const nutritionPanel = document.createElement('div')
            nutritionPanel.className = 'nutrition-panel hidden'

            let html = '<table class="compact-nutrition"><tr><th>메뉴</th><th>칼로리</th><th>탄수</th><th>단백</th><th>지방</th></tr>'
            meal.nutrition.forEach(n => {
                html += `<tr>
                    <td>${n.name}${n.isMain ? ' ⭐' : ''}</td>
                    <td>${n.calorie}</td>
                    <td>${n.carbohydrate}g</td>
                    <td>${n.protein}g</td>
                    <td>${n.fat}g</td>
                </tr>`
            })
            html += '</table>'
            nutritionPanel.innerHTML = html
            mealCard.appendChild(nutritionPanel)
        }

        // 영양정보 버튼 이벤트
        const nutritionBtn = mealCard.querySelector('[data-action="nutrition"]')
        const nutritionPanel = mealCard.querySelector('.nutrition-panel')

        if (nutritionBtn && nutritionPanel) {
            nutritionBtn.onclick = () => nutritionPanel.classList.toggle('hidden')
        }

        meals20FContainer.appendChild(mealCard)
    })
}

/**
 * 메뉴/이미지 뷰 토글
 */
function toggleView(mealCard, view) {
    const menuList = mealCard.querySelector('.detailed-menu-list')
    const image = mealCard.querySelector('.meal-photo')
    const buttons = mealCard.querySelectorAll('.btn-toggle')

    if (view === 'menu') {
        if (menuList) menuList.classList.remove('hidden')
        if (image) image.classList.add('hidden')
        buttons[0].classList.add('active')
        buttons[1].classList.remove('active')
    } else {
        if (menuList) menuList.classList.add('hidden')
        if (image) image.classList.remove('hidden')
        buttons[0].classList.remove('active')
        buttons[1].classList.add('active')
    }
}

/**
 * 10층 메뉴 표시 (압축 칩 형식)
 */
function display10FMeals(meals) {
    meals10FContainer.innerHTML = ''

    meals.forEach(meal => {
        const mealBoard = document.createElement('div')
        mealBoard.className = 'meal-board meal-board-10f'

        const header = document.createElement('div')
        header.className = 'board-header-10f'
        header.innerHTML = `<span class="course-badge-10f">${meal.courseName}</span>`
        mealBoard.appendChild(header)

        // items 배열을 인라인 칩으로 표시
        if (meal.items && meal.items.length > 0) {
            const chipList = document.createElement('div')
            chipList.className = 'chip-list-10f'

            const chips = meal.items.map(item =>
                `<span class="menu-chip-10f">• ${item}</span>`
            ).join('')

            chipList.innerHTML = chips
            mealBoard.appendChild(chipList)
        }

        meals10FContainer.appendChild(mealBoard)
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
dateInput.addEventListener('change', () => {
    updateDayOfWeek()
    loadAllMenus()
})

// 이전 날짜
prevDayBtn.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value)
    currentDate.setDate(currentDate.getDate() - 1)
    dateInput.valueAsDate = currentDate
    updateDayOfWeek()
    loadAllMenus()
})

// 다음 날짜
nextDayBtn.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value)
    currentDate.setDate(currentDate.getDate() + 1)
    dateInput.valueAsDate = currentDate
    updateDayOfWeek()
    loadAllMenus()
})