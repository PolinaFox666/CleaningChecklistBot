// Конфигурация
const CONFIG = {
    // Время в минутах для тестирования (в продакшене можно заменить на дни)
    CLEAN_INTERVAL_MINUTES: 5, // через 5 минут появляются первые микробы
    GERM_STAGES: 5, // количество стадий загрязнения
    STAGE_INTERVAL_MINUTES: 2 // интервал между стадиями в минутах
};

// Доступные предметы для добавления
const AVAILABLE_ITEMS = [
    { id: 'mirror', name: 'Зеркало', icon: '🪞' },
    { id: 'toilet', name: 'Унитаз', icon: '🚽' },
    { id: 'shoe_rack', name: 'Полка для обуви', icon: '👟' },
    { id: 'desk', name: 'Рабочий стол', icon: '🖥️' },
    { id: 'bed', name: 'Постель', icon: '🛏️' },
    { id: 'windowsill', name: 'Подоконник', icon: '🪟' },
    { id: 'window', name: 'Окна', icon: '🪟' },
    { id: 'kitchen_apron', name: 'Кухонный фартук', icon: '🧽' },
    { id: 'floor', name: 'Пол', icon: '🏠' },
    { id: 'sink', name: 'Раковина', icon: '🚿' },
    { id: 'bathroom', name: 'Ванная', icon: '🛁' },
    { id: 'refrigerator', name: 'Холодильник', icon: '❄️' }
];

// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Состояние приложения
let userItems = [];
let currentItemToClean = null;

// Загрузка данных при старте
function init() {
    loadUserItems();
    renderAvailableItems();
    renderUserItems();
    startTimer();
}

// Загрузка предметов пользователя из localStorage
function loadUserItems() {
    const saved = localStorage.getItem('userItems');
    if (saved) {
        userItems = JSON.parse(saved);
    }
}

// Сохранение предметов пользователя
function saveUserItems() {
    localStorage.setItem('userItems', JSON.stringify(userItems));
}

// Отображение доступных предметов
function renderAvailableItems() {
    const container = document.getElementById('availableItems');
    container.innerHTML = '';
    
    AVAILABLE_ITEMS.forEach(item => {
        // Проверяем, не добавлен ли уже этот предмет
        const isAdded = userItems.some(ui => ui.id === item.id);
        
        const card = document.createElement('div');
        card.className = 'item-card';
        if (isAdded) {
            card.style.opacity = '0.5';
            card.style.cursor = 'not-allowed';
        } else {
            card.onclick = () => addItem(item);
        }
        
        card.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 8px;">${item.icon}</div>
            <span>${item.name}</span>
        `;
        
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
        lastCleaned: Date.now(),
        addedAt: Date.now()
    };
    
    userItems.push(newItem);
    saveUserItems();
    renderAvailableItems();
    renderUserItems();
    showMainScreen();
    
    // Вибрация при добавлении
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Отображение предметов пользователя
function renderUserItems() {
    const container = document.getElementById('userItems');
    container.innerHTML = '';
    
    if (userItems.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: white; padding: 40px;">
                <p style="font-size: 18px; margin-bottom: 10px;">Пока нет предметов</p>
                <p style="font-size: 14px; opacity: 0.8;">Добавь предметы, чтобы начать следить за чистотой!</p>
            </div>
        `;
        return;
    }
    
    userItems.forEach(item => {
        const itemElement = createUserItemElement(item);
        container.appendChild(itemElement);
    });
}

// Создание элемента предмета пользователя
function createUserItemElement(item) {
    const timeSinceCleaning = Date.now() - item.lastCleaned;
    const minutesSinceCleaning = Math.floor(timeSinceCleaning / 60000);
    
    // Вычисляем стадию загрязнения
    const stage = calculateGermStage(minutesSinceCleaning);
    const isDirty = stage > 0;
    
    const div = document.createElement('div');
    div.className = `user-item ${isDirty ? 'dirty' : ''}`;
    div.onclick = () => openCleanModal(item);
    
    // Генерируем HTML для микробов
    const germLayers = generateGermLayers(stage);
    
    div.innerHTML = `
        <div class="item-image-wrapper">
            <div class="item-base-image" style="font-size: 60px; display: flex; align-items: center; justify-content: center;">
                ${item.icon}
            </div>
            ${germLayers}
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-time ${isDirty ? 'warning' : ''}">
            ${formatTime(minutesSinceCleaning)}
        </div>
    `;
    
    return div;
}

// Вычисление стадии загрязнения
function calculateGermStage(minutesSinceCleaning) {
    if (minutesSinceCleaning < CONFIG.CLEAN_INTERVAL_MINUTES) {
        return 0; // Чисто
    }
    
    const minutesAfterFirstGerm = minutesSinceCleaning - CONFIG.CLEAN_INTERVAL_MINUTES;
    const stage = Math.min(
        Math.floor(minutesAfterFirstGerm / CONFIG.STAGE_INTERVAL_MINUTES) + 1,
        CONFIG.GERM_STAGES
    );
    
    return stage;
}

// Генерация слоев микробов
function generateGermLayers(stage) {
    if (stage === 0) return '';
    
    const germs = ['🦠', '👾', '💀', '👹', '🤢'];
    let html = '';
    
    for (let i = 0; i < stage; i++) {
        const germ = germs[i % germs.length];
        const size = 20 + (i * 5); // Увеличиваем размер с каждой стадией
        const x = 10 + (i * 15) % 70; // Позиционирование
        const y = 10 + (i * 20) % 80;
        
        html += `
            <div class="germ-layer visible" style="
                position: absolute;
                top: ${y}%;
                left: ${x}%;
                font-size: ${size}px;
                z-index: ${10 + i};
            ">${germ}</div>
        `;
    }
    
    return html;
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
    const remainingHours = hours % 24;
    
    if (days === 1) {
        return `1 день назад`;
    }
    
    return `${days} дней назад`;
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
    renderUserItems();
}

// Открытие модального окна для отметки уборки
function openCleanModal(item) {
    currentItemToClean = item;
    document.getElementById('cleanModal').classList.add('active');
    
    if (tg && tg.HapticFeedback) {
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
        saveUserItems();
        renderUserItems();
        
        // Вибрация при отметке
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }
    
    closeModal();
}

// Таймер для обновления отображения
function startTimer() {
    setInterval(() => {
        renderUserItems();
    }, 60000); // Обновляем каждую минуту
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', init);

