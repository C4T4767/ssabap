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

/**
 * 메뉴 골라주기 (룰렛) 로직
 */
const menuPickerBtn = document.getElementById('menuPickerBtn')

if (menuPickerBtn) {
    menuPickerBtn.addEventListener('click', () => {
        const allMeals = document.querySelectorAll('.meal-board')

        if (allMeals.length === 0) {
            alert('선택할 메뉴가 없습니다. 날짜를 확인해주세요.')
            return
        }

        // 3. Easter Egg: 연속 10회 클릭 시 "이제 골라주세요.."
        const now = Date.now()
        const lastClickTime = parseInt(localStorage.getItem('menuPickerLastClickTime') || '0')
        let streak = parseInt(localStorage.getItem('menuPickerStreak') || '0')

        // 5분(300,000ms) 이내에 다시 클릭했으면 연속 클릭으로 인정
        if (now - lastClickTime < 5 * 60 * 1000) {
            streak++
        } else {
            streak = 1
        }

        localStorage.setItem('menuPickerLastClickTime', now.toString())
        localStorage.setItem('menuPickerStreak', streak.toString())

        if (streak >= 10) {
            menuPickerBtn.disabled = true
            menuPickerBtn.textContent = '이제 골라주세요..'

            // 5초 후 리셋
            setTimeout(() => {
                menuPickerBtn.disabled = false
                menuPickerBtn.textContent = '🎲 오늘의 메뉴 골라주기'
                localStorage.setItem('menuPickerStreak', '0') // 스트릭 초기화
            }, 5000)

            return // 룰렛 돌리지 않음
        }

        // 버튼 비활성화 (중복 클릭 방지)
        menuPickerBtn.disabled = true
        menuPickerBtn.textContent = '🎲 고르는 중...'

        // 30 ~ 40 사이의 랜덤 숫자 생성 (USER REQUEST: 30~40)
        const steps = Math.floor(Math.random() * 11) + 30
        let currentStep = 0

        // 시작 위치를 0~4 사이에서 랜덤으로 결정 (USER REQUEST: 1~5로 시작)
        // 단, 메뉴 개수가 5개보다 적을 수도 있으므로 Math.min 사용
        let currentIndex = Math.floor(Math.random() * Math.min(5, allMeals.length))

        // 애니메이션 속도 조절 (점점 느려지게 할 수도 있지만, 일단 일정하게)
        const intervalTime = 100

        function highlightNext() {
            // 이전 하이라이트 제거
            allMeals.forEach(meal => meal.classList.remove('highlight'))

            // 다음 메뉴 하이라이트
            const targetIndex = currentIndex % allMeals.length
            const targetMeal = allMeals[targetIndex]

            targetMeal.classList.add('highlight')
            targetMeal.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

            currentIndex++
            currentStep++

            if (currentStep < steps) {
                // 다음 단계로
                // 룰렛 느낌을 위해 마지막 10단계는 점점 느려지게
                let nextDelay = intervalTime
                if (steps - currentStep < 10) {
                    nextDelay += (10 - (steps - currentStep)) * 30
                }

                setTimeout(highlightNext, nextDelay)
            } else {
                // 종료
                setTimeout(() => {
                    const finalMealName = targetMeal.querySelector('.main-dish')?.textContent ||
                        targetMeal.querySelector('.menu-chip-10f')?.textContent?.replace('•', '') ||
                        '이 메뉴'

                    // 모달 표시
                    const resultModal = document.getElementById('resultModal')
                    const resultMenuName = document.getElementById('resultMenuName')

                    if (resultModal && resultMenuName) {
                        resultMenuName.textContent = finalMealName.trim()
                        resultModal.classList.remove('hidden')

                        // 폭죽 효과 (선택 사항)
                        // confetti() 
                    } else {
                        // 모달이 없으면 기존 alert (fallback)
                        alert(`🎉 오늘의 추천 메뉴는\n[${finalMealName.trim()}]\n입니다! 맛점하세요!`)
                    }

                    menuPickerBtn.disabled = false
                    menuPickerBtn.textContent = '🎲 오늘의 메뉴 골라주기'
                }, 500)
            }
        }

        highlightNext()
    })
}

// 모달 닫기 로직
const resultModal = document.getElementById('resultModal')
const closeBtn = document.querySelector('.close-btn')
const closeResultBtn = document.getElementById('closeResultBtn')

function closeModal() {
    if (resultModal) {
        resultModal.classList.add('hidden')
    }
}

if (closeBtn) closeBtn.addEventListener('click', closeModal)
if (closeResultBtn) closeResultBtn.addEventListener('click', closeModal)
if (resultModal) {
    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) {
            closeModal()
        }
    })
}