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
let selectedItems = []; // Выбранные предметы для добавления
let currentFamilyFilter = null; // Текущий фильтр по члену семьи в Multi режиме
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

// Получение отфильтрованного списка предметов
function getFilteredItems() {
    if (currentMode === 'multi' && currentFamilyFilter) {
        return userItems.filter(item => item.assignedTo === currentFamilyFilter);
    }
    return userItems;
}

// Следующий предмет
function nextItem() {
    const itemsToShow = getFilteredItems();
    if (itemsToShow.length === 0) return;
    currentItemIndex = (currentItemIndex + 1) % itemsToShow.length;
    updateCarousel();
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Предыдущий предмет
function prevItem() {
    const itemsToShow = getFilteredItems();
    if (itemsToShow.length === 0) return;
    currentItemIndex = (currentItemIndex - 1 + itemsToShow.length) % itemsToShow.length;
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
    
    // Фильтруем предметы в зависимости от режима
    const itemsToShow = getFilteredItems();
    
    if (itemsToShow.length === 0) {
        track.innerHTML = `
            <div class="carousel-item">
                <div class="empty-state">
                    <div class="empty-state-icon">🏠</div>
                    <div class="empty-state-text">Пока нет предметов</div>
                    <div class="empty-state-subtext">${currentMode === 'multi' && currentFamilyFilter ? 'У этого члена семьи нет предметов' : 'Добавь предметы, чтобы начать следить за чистотой!'}</div>
                </div>
            </div>
        `;
        updateIndicators();
        updateItemInfo();
        return;
    }
    
    // Обновляем индекс если он выходит за границы
    if (currentItemIndex >= itemsToShow.length) {
        currentItemIndex = 0;
    }
    
    itemsToShow.forEach((item, index) => {
        const itemElement = createCarouselItem(item, index);
        track.appendChild(itemElement);
    });
    
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
    
    const itemsToShow = getFilteredItems();
    
    if (itemsToShow.length === 0) return;
    
    for (let i = 0; i < itemsToShow.length; i++) {
        const indicator = document.createElement('div');
        indicator.className = `indicator ${i === currentItemIndex ? 'active' : ''}`;
        container.appendChild(indicator);
    }
}

// Обновление информации о предмете
function updateItemInfo() {
    const itemsToShow = getFilteredItems();
    
    if (itemsToShow.length === 0) {
        document.getElementById('itemNameText').textContent = 'Добавь предметы';
        document.getElementById('itemTime').textContent = '';
        document.getElementById('editNameBtn').style.display = 'none';
        document.getElementById('cleanBtn').style.display = 'none';
        return;
    }
    
    const item = itemsToShow[currentItemIndex];
    const timeSinceCleaning = Date.now() - item.lastCleaned;
    const minutesSinceCleaning = Math.floor(timeSinceCleaning / 60000);
    const stage = calculateGermStage(minutesSinceCleaning);
    const isDirty = stage > 0;
    
    document.getElementById('itemNameText').textContent = item.name;
    
    // Показываем информацию о назначенном члене семьи в Multi режиме
    let timeText = formatTime(minutesSinceCleaning);
    if (currentMode === 'multi' && item.assignedTo) {
        timeText += ` • ${item.assignedTo}`;
    }
    
    document.getElementById('itemTime').textContent = timeText;
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
        const isSelected = selectedItems.includes(item.id);
        
        const card = document.createElement('div');
        card.className = `item-card ${isAdded ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`;
        
        if (!isAdded) {
            card.onclick = (e) => {
                // Не срабатывает при клике на чекбокс
                if (e.target.type !== 'checkbox') {
                    toggleItemSelection(item.id);
                }
            };
        }
        
        // Чекбокс для выбора
        if (!isAdded) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isSelected;
            checkbox.className = 'item-checkbox';
            checkbox.onclick = (e) => {
                e.stopPropagation();
                toggleItemSelection(item.id);
            };
            card.appendChild(checkbox);
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
    
    updateAddButton();
}

// Переключение выбора предмета
function toggleItemSelection(itemId) {
    const index = selectedItems.indexOf(itemId);
    if (index > -1) {
        selectedItems.splice(index, 1);
    } else {
        selectedItems.push(itemId);
    }
    renderAvailableItems();
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Обновление кнопки добавления
function updateAddButton() {
    const btn = document.getElementById('addSelectedBtn');
    const count = document.getElementById('selectedCount');
    if (selectedItems.length > 0) {
        btn.style.display = 'block';
        count.textContent = selectedItems.length;
    } else {
        btn.style.display = 'none';
    }
}

// Добавление выбранных предметов
function addSelectedItems() {
    if (selectedItems.length === 0) return;
    
    // Если Multi режим, показываем модальное окно выбора члена семьи
    if (currentMode === 'multi') {
        currentItemToClean = { ids: [...selectedItems] }; // Временно используем для хранения выбранных ID
        showAssignModal();
    } else {
        // Single режим - добавляем сразу
        selectedItems.forEach(itemId => {
            const item = AVAILABLE_ITEMS.find(ai => ai.id === itemId);
            if (item) {
                addItemDirectly(item);
            }
        });
        selectedItems = [];
        showMainScreen();
    }
}

// Прямое добавление предмета (без модального окна)
function addItemDirectly(item) {
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
}

// Добавление предмета (старый метод, оставлен для совместимости)
function addItem(item) {
    // В режиме множественного выбора просто выбираем предмет
    if (!userItems.some(ui => ui.id === item.id)) {
        toggleItemSelection(item.id);
    }
}

// Показ экрана добавления предметов
function showAddItemsScreen() {
    selectedItems = []; // Сбрасываем выбранные предметы
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
    const itemsToShow = getFilteredItems();
    
    if (itemsToShow.length === 0) return;
    
    currentItemToClean = itemsToShow[currentItemIndex];
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
    const itemsToShow = getFilteredItems();
    if (itemsToShow.length === 0) return;
    
    currentItemToRename = itemsToShow[currentItemIndex];
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
        // Инициализируем членов семьи если их нет
        if (familyMembers.length === 0) {
            familyMembers = [userName];
            saveUserData();
        }
        // В Multi режиме показываем все предметы, но с фильтрацией
        currentFamilyFilter = null;
    } else {
        // В Single режиме сбрасываем фильтр
        currentFamilyFilter = null;
    }
    
    // Обновляем карусель с учетом режима
    renderCarousel();
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Обновление кнопок режимов
function updateModeButtons() {
    document.getElementById('singleMode').classList.toggle('active', currentMode === 'single');
    document.getElementById('multiMode').classList.toggle('active', currentMode === 'multi');
}

// Показ модального окна назначения предметов
function showAssignModal() {
    const container = document.getElementById('familyMembers');
    container.innerHTML = '';
    
    // Добавляем текущего пользователя если его нет в списке
    if (!familyMembers.includes(userName)) {
        familyMembers.push(userName);
    }
    
    familyMembers.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'family-member';
        memberDiv.onclick = () => assignItemsToMember(member);
        
        const avatar = document.createElement('div');
        avatar.className = 'family-member-avatar';
        avatar.textContent = member.charAt(0).toUpperCase();
        
        const name = document.createElement('div');
        name.className = 'family-member-name';
        name.textContent = member;
        
        memberDiv.appendChild(avatar);
        memberDiv.appendChild(name);
        container.appendChild(memberDiv);
    });
    
    // Кнопка добавления нового члена семьи
    const addMemberDiv = document.createElement('div');
    addMemberDiv.className = 'family-member';
    addMemberDiv.onclick = addNewFamilyMember;
    addMemberDiv.innerHTML = `
        <div class="family-member-avatar" style="background: var(--glass-bg); color: var(--text-primary);">+</div>
        <div class="family-member-name">Добавить члена семьи</div>
    `;
    container.appendChild(addMemberDiv);
    
    document.getElementById('assignModal').classList.add('active');
}

// Назначение предметов члену семьи
function assignItemsToMember(member) {
    if (currentItemToClean && currentItemToClean.ids) {
        // Добавляем выбранные предметы
        currentItemToClean.ids.forEach(itemId => {
            const item = AVAILABLE_ITEMS.find(ai => ai.id === itemId);
            if (item) {
                const newItem = {
                    id: item.id,
                    name: item.name,
                    icon: item.icon,
                    image: item.image,
                    lastCleaned: Date.now(),
                    addedAt: Date.now(),
                    assignedTo: member
                };
                userItems.push(newItem);
            }
        });
    }
    
    saveUserData();
    selectedItems = [];
    closeAssignModal();
    renderAvailableItems();
    renderCarousel();
    showMainScreen();
    
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// Добавление нового члена семьи
function addNewFamilyMember() {
    const name = prompt('Введи имя нового члена семьи:');
    if (name && name.trim() && !familyMembers.includes(name.trim())) {
        familyMembers.push(name.trim());
        saveUserData();
        showAssignModal(); // Перерисовываем список
    }
}

// Закрытие модального окна назначения
function closeAssignModal() {
    document.getElementById('assignModal').classList.remove('active');
    currentItemToClean = null;
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
