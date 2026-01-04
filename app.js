// Конфигурация
const CONFIG = {
    CLEAN_INTERVAL_MINUTES: 5, // через 5 минут появляются первые микробы
    GERM_STAGES: 5, // количество стадий загрязнения
    STAGE_INTERVAL_MINUTES: 2 // интервал между стадиями в минутах
};

// Доступные предметы для добавления
const AVAILABLE_ITEMS = [
    { id: 'mirror', name: 'Зеркало', icon: '🪞', image: 'images/mirror.png' },
    { id: 'toilet', name: 'Унитаз', icon: '🚽', image: 'images/toilet.png' },
    { id: 'shoe_rack', name: 'Полка для обуви', icon: '👟', image: 'images/shoe_rack.png' },
    { id: 'desk', name: 'Рабочий стол', icon: '🖥️', image: 'images/desk.png' },
    { id: 'bed', name: 'Постель', icon: '🛏️', image: 'images/bed.png' },
    { id: 'windowsill', name: 'Подоконник', icon: '🪟', image: 'images/windowsill.png' },
    { id: 'window', name: 'Окна', icon: '🪟', image: 'images/window.png' },
    { id: 'kitchen_apron', name: 'Кухонный фартук', icon: '🧽', image: 'images/kitchen_apron.png' },
    { id: 'floor', name: 'Пол', icon: '🏠', image: 'images/floor.png' },
    { id: 'sink', name: 'Раковина', icon: '🚿', image: 'images/sink.png' },
    { id: 'bathroom', name: 'Ванная', icon: '🛁', image: 'images/bathroom.png' },
    { id: 'refrigerator', name: 'Холодильник', icon: '❄️', image: 'images/refrigerator.png' }
];

// Эмодзи микробов для анимации
const GERM_EMOJIS = ['🦠', '👾', '💀', '👹', '🤢'];

// Инициализация Telegram Web App
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Состояние приложения
let userItems = [];
let currentItemIndex = 0;
let currentItemToClean = null;
let currentItemToRename = null;
let userName = '';
let currentMode = 'single'; // 'single' или 'multi'
let familyMembers = [];
let touchStartX = 0;
let touchEndX = 0;
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

// Загрузка данных при старте
function init() {
    loadUserData();
    checkUserName();
    renderAvailableItems();
    setupCarousel();
    startTimer();
}

// Загрузка всех данных из localStorage
function loadUserData() {
    const savedItems = localStorage.getItem('userItems');
    if (savedItems) {
        userItems = JSON.parse(savedItems);
    }
    
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        userName = savedName;
        updateUserNameDisplay();
    }
    
    const savedMode = localStorage.getItem('currentMode');
    if (savedMode) {
        currentMode = savedMode;
        updateModeButtons();
    }
    
    const savedMembers = localStorage.getItem('familyMembers');
    if (savedMembers) {
        familyMembers = JSON.parse(savedMembers);
    }
}

// Сохранение всех данных
function saveUserData() {
    localStorage.setItem('userItems', JSON.stringify(userItems));
    localStorage.setItem('userName', userName);
    localStorage.setItem('currentMode', currentMode);
    localStorage.setItem('familyMembers', JSON.stringify(familyMembers));
}

// Проверка имени пользователя
function checkUserName() {
    if (!userName) {
        document.getElementById('nameModal').classList.add('active');
    }
}

// Сохранение имени пользователя
function saveUserName() {
    const input = document.getElementById('userNameInput');
    const name = input.value.trim();
    if (name) {
        userName = name;
        saveUserData();
        updateUserNameDisplay();
        document.getElementById('nameModal').classList.remove('active');
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }
}

// Обновление отображения имени
function updateUserNameDisplay() {
    document.getElementById('userName').textContent = userName;
    const initial = userName.charAt(0).toUpperCase();
    document.getElementById('profileInitial').textContent = initial;
}

// Открытие меню профиля
function openProfileMenu() {
    // Можно добавить меню для смены имени, выхода и т.д.
    const newName = prompt('Введи новое имя:', userName);
    if (newName && newName.trim()) {
        userName = newName.trim();
        saveUserData();
        updateUserNameDisplay();
    }
}

// Настройка карусели
function setupCarousel() {
    const track = document.getElementById('carouselTrack');
    const container = document.getElementById('carouselContainer');
    
    // Touch события для свайпа
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Mouse события для десктопа
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    
    renderCarousel();
}

// Обработка начала касания
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
}

// Обработка окончания касания
function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
}

// Обработка свайпа
function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Свайп влево - следующий предмет
            nextItem();
        } else {
            // Свайп вправо - предыдущий предмет
            prevItem();
        }
    }
}

// Mouse события для десктопа
function handleMouseDown(e) {
    isDragging = true;
    startX = e.pageX - document.getElementById('carouselContainer').offsetLeft;
    scrollLeft = currentItemIndex;
    document.getElementById('carouselContainer').style.cursor = 'grabbing';
}

function handleMouseUp() {
    isDragging = false;
    document.getElementById('carouselContainer').style.cursor = 'grab';
}

function handleMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - document.getElementById('carouselContainer').offsetLeft;
    const walk = (x - startX) * 2;
    
    if (Math.abs(walk) > 100) {
        if (walk > 0) {
            prevItem();
        } else {
            nextItem();
        }
        isDragging = false;
    }
}

// Следующий предмет
function nextItem() {
    if (userItems.length === 0) return;
    currentItemIndex = (currentItemIndex + 1) % userItems.length;
    updateCarousel();
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Предыдущий предмет
function prevItem() {
    if (userItems.length === 0) return;
    currentItemIndex = (currentItemIndex - 1 + userItems.length) % userItems.length;
    updateCarousel();
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Обновление карусели
function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const offset = -currentItemIndex * 100;
    track.style.transform = `translateX(${offset}%)`;
    
    updateIndicators();
    updateItemInfo();
}

// Рендеринг карусели
function renderCarousel() {
    const track = document.getElementById('carouselTrack');
    track.innerHTML = '';
    
    if (userItems.length === 0) {
        track.innerHTML = `
            <div class="carousel-item">
                <div class="empty-state">
                    <div class="empty-state-icon">🏠</div>
                    <div class="empty-state-text">Пока нет предметов</div>
                    <div class="empty-state-subtext">Добавь предметы, чтобы начать следить за чистотой!</div>
                </div>
            </div>
        `;
        updateIndicators();
        updateItemInfo();
        return;
    }
    
    userItems.forEach((item, index) => {
        const itemElement = createCarouselItem(item, index);
        track.appendChild(itemElement);
    });
    
    currentItemIndex = Math.min(currentItemIndex, userItems.length - 1);
    updateCarousel();
}

// Создание элемента карусели
function createCarouselItem(item, index) {
    const timeSinceCleaning = Date.now() - item.lastCleaned;
    const minutesSinceCleaning = Math.floor(timeSinceCleaning / 60000);
    const stage = calculateGermStage(minutesSinceCleaning);
    const isDirty = stage > 0;
    
    const div = document.createElement('div');
    div.className = 'carousel-item';
    
    // Получаем информацию о предмете
    const itemInfo = AVAILABLE_ITEMS.find(ai => ai.id === item.id) || { icon: '🏠', image: null };
    
    // Создаем изображение предмета
    const imageContainer = document.createElement('div');
    imageContainer.className = 'item-image-container';
    
    // Базовое изображение
    const baseImage = document.createElement('img');
    baseImage.className = 'item-base-image';
    baseImage.src = item.image || itemInfo.image || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" font-size="100" text-anchor="middle" dominant-baseline="middle">${itemInfo.icon}</text></svg>`)}`;
    baseImage.alt = item.name;
    baseImage.onerror = function() {
        // Если изображение не загрузилось, показываем иконку
        this.style.display = 'none';
        const iconDiv = document.createElement('div');
        iconDiv.className = 'item-base-image';
        iconDiv.style.fontSize = '120px';
        iconDiv.style.display = 'flex';
        iconDiv.style.alignItems = 'center';
        iconDiv.style.justifyContent = 'center';
        iconDiv.textContent = itemInfo.icon;
        imageContainer.appendChild(iconDiv);
    };
    
    imageContainer.appendChild(baseImage);
    
    // Добавляем микробов
    if (isDirty) {
        const germs = generateGerms(stage);
        germs.forEach(germ => imageContainer.appendChild(germ));
    }
    
    div.appendChild(imageContainer);
    
    return div;
}

// Генерация микробов с анимациями
function generateGerms(stage) {
    const germs = [];
    const positions = [
        { x: 15, y: 20 }, { x: 75, y: 15 }, { x: 25, y: 60 },
        { x: 70, y: 70 }, { x: 50, y: 35 }
    ];
    
    for (let i = 0; i < stage; i++) {
        const germ = document.createElement('div');
        germ.className = 'germ';
        
        const germEmoji = GERM_EMOJIS[i % GERM_EMOJIS.length];
        germ.textContent = germEmoji;
        
        const pos = positions[i % positions.length];
        germ.style.left = `${pos.x}%`;
        germ.style.top = `${pos.y}%`;
        germ.style.fontSize = `${20 + i * 4}px`;
        
        // Добавляем разные типы анимаций
        if (i % 3 === 0) {
            germ.classList.add('blink');
        } else if (i % 3 === 1) {
            germ.classList.add('shake');
        }
        
        // Случайная задержка для разнообразия
        germ.style.animationDelay = `${i * 0.3}s`;
        
        germs.push(germ);
    }
    
    return germs;
}

// Вычисление стадии загрязнения
function calculateGermStage(minutesSinceCleaning) {
    if (minutesSinceCleaning < CONFIG.CLEAN_INTERVAL_MINUTES) {
        return 0;
    }
    
    const minutesAfterFirstGerm = minutesSinceCleaning - CONFIG.CLEAN_INTERVAL_MINUTES;
    const stage = Math.min(
        Math.floor(minutesAfterFirstGerm / CONFIG.STAGE_INTERVAL_MINUTES) + 1,
        CONFIG.GERM_STAGES
    );
    
    return stage;
}

// Обновление индикаторов
function updateIndicators() {
    const container = document.getElementById('carouselIndicators');
    container.innerHTML = '';
    
    if (userItems.length === 0) return;
    
    for (let i = 0; i < userItems.length; i++) {
        const indicator = document.createElement('div');
        indicator.className = `indicator ${i === currentItemIndex ? 'active' : ''}`;
        container.appendChild(indicator);
    }
}

// Обновление информации о предмете
function updateItemInfo() {
    if (userItems.length === 0) {
        document.getElementById('itemNameText').textContent = 'Добавь предметы';
        document.getElementById('itemTime').textContent = '';
        document.getElementById('editNameBtn').style.display = 'none';
        document.getElementById('cleanBtn').style.display = 'none';
        return;
    }
    
    const item = userItems[currentItemIndex];
    const timeSinceCleaning = Date.now() - item.lastCleaned;
    const minutesSinceCleaning = Math.floor(timeSinceCleaning / 60000);
    const stage = calculateGermStage(minutesSinceCleaning);
    const isDirty = stage > 0;
    
    document.getElementById('itemNameText').textContent = item.name;
    document.getElementById('itemTime').textContent = formatTime(minutesSinceCleaning);
    document.getElementById('itemTime').className = `item-time ${isDirty ? 'warning' : ''}`;
    document.getElementById('editNameBtn').style.display = 'flex';
    document.getElementById('cleanBtn').style.display = 'block';
    
    const cleanBtn = document.getElementById('cleanBtn');
    if (isDirty) {
        cleanBtn.classList.add('dirty');
    } else {
        cleanBtn.classList.remove('dirty');
    }
}

// Форматирование времени
function formatTime(minutes) {
    if (minutes < 60) {
        return `${minutes} мин назад`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours < 24) {
        return `${hours} ч ${mins} мин назад`;
    }
    
    const days = Math.floor(hours / 24);
    
    if (days === 1) {
        return '1 день назад';
    }
    
    return `${days} дней назад`;
}

// Отображение доступных предметов
function renderAvailableItems() {
    const container = document.getElementById('availableItems');
    container.innerHTML = '';
    
    AVAILABLE_ITEMS.forEach(item => {
        const isAdded = userItems.some(ui => ui.id === item.id);
        
        const card = document.createElement('div');
        card.className = `item-card ${isAdded ? 'disabled' : ''}`;
        if (!isAdded) {
            card.onclick = () => addItem(item);
        }
        
        // Пытаемся загрузить изображение, если не получается - показываем иконку
        const img = document.createElement('img');
        img.src = item.image || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><text x="50%" y="50%" font-size="40" text-anchor="middle" dominant-baseline="middle">${item.icon}</text></svg>`)}`;
        img.alt = item.name;
        img.onerror = function() {
            this.style.display = 'none';
            const iconDiv = document.createElement('div');
            iconDiv.className = 'item-icon';
            iconDiv.textContent = item.icon;
            card.insertBefore(iconDiv, card.firstChild);
        };
        
        card.appendChild(img);
        
        const span = document.createElement('span');
        span.textContent = item.name;
        card.appendChild(span);
        
        container.appendChild(card);
    });
}

// Добавление предмета
function addItem(item) {
    const isAdded = userItems.some(ui => ui.id === item.id);
    if (isAdded) return;
    
    const newItem = {
        id: item.id,
        name: item.name,
        icon: item.icon,
        image: item.image,
        lastCleaned: Date.now(),
        addedAt: Date.now(),
        assignedTo: currentMode === 'multi' ? null : userName
    };
    
    userItems.push(newItem);
    saveUserData();
    renderAvailableItems();
    renderCarousel();
    showMainScreen();
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Показ экрана добавления предметов
function showAddItemsScreen() {
    document.getElementById('mainScreen').classList.remove('active');
    document.getElementById('addItemsScreen').classList.add('active');
    renderAvailableItems();
}

// Показ главного экрана
function showMainScreen() {
    document.getElementById('addItemsScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
    renderCarousel();
}

// Открытие модального окна для отметки уборки
function openCleanModal() {
    if (userItems.length === 0) return;
    
    currentItemToClean = userItems[currentItemIndex];
    document.getElementById('cleanModal').classList.add('active');
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('cleanModal').classList.remove('active');
    currentItemToClean = null;
}

// Отметка предмета как убранного
function markAsCleaned() {
    if (!currentItemToClean) return;
    
    const item = userItems.find(ui => ui.id === currentItemToClean.id);
    if (item) {
        item.lastCleaned = Date.now();
        saveUserData();
        renderCarousel();
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }
    
    closeModal();
}

// Редактирование имени предмета
function editItemName() {
    if (userItems.length === 0) return;
    
    currentItemToRename = userItems[currentItemIndex];
    const input = document.getElementById('renameInput');
    input.value = currentItemToRename.name;
    document.getElementById('renameModal').classList.add('active');
    input.focus();
}

// Закрытие модального окна переименования
function closeRenameModal() {
    document.getElementById('renameModal').classList.remove('active');
    currentItemToRename = null;
}

// Сохранение имени предмета
function saveItemName() {
    if (!currentItemToRename) return;
    
    const input = document.getElementById('renameInput');
    const newName = input.value.trim();
    
    if (newName) {
        const item = userItems.find(ui => ui.id === currentItemToRename.id);
        if (item) {
            item.name = newName;
            saveUserData();
            renderCarousel();
            
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }
        }
    }
    
    closeRenameModal();
}

// Переключение режима Single/Multi
function switchMode(mode) {
    currentMode = mode;
    saveUserData();
    updateModeButtons();
    
    if (mode === 'multi') {
        // Можно добавить логику для мульти-режима
        renderFamilyMembers();
    }
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Обновление кнопок режимов
function updateModeButtons() {
    document.getElementById('singleMode').classList.toggle('active', currentMode === 'single');
    document.getElementById('multiMode').classList.toggle('active', currentMode === 'multi');
}

// Рендеринг членов семьи (для Multi режима)
function renderFamilyMembers() {
    // Пока простое отображение, можно расширить
    if (familyMembers.length === 0) {
        familyMembers = [userName];
        saveUserData();
    }
}

// Таймер для обновления отображения
function startTimer() {
    setInterval(() => {
        if (userItems.length > 0) {
            renderCarousel();
        }
    }, 60000); // Обновляем каждую минуту
}

// Обработка Enter в модальных окнах
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('userNameInput');
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveUserName();
            }
        });
    }
    
    const renameInput = document.getElementById('renameInput');
    if (renameInput) {
        renameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveItemName();
            }
        });
    }
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', init);
