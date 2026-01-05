    // Конфигурация
    const CONFIG = {
        GERM_STAGES: 5 // количество стадий загрязнения
    };

    // Варианты периодов уборки (в минутах для тестирования, в продакшене - дни)
    const CLEANING_PERIODS = [
        { id: 'daily', name: 'Ежедневно', minutes: 1 }, // 1 минута = ежедневно для теста
        { id: '2days', name: 'Раз в 2 дня', minutes: 2 },
        { id: '3days', name: 'Раз в 3 дня', minutes: 3 },
        { id: '4days', name: 'Раз в 4 дня', minutes: 4 },
        { id: 'weekly', name: 'Раз в неделю', minutes: 7 },
        { id: '2weeks', name: 'Раз в 2 недели', minutes: 14 },
        { id: '3weeks', name: 'Раз в 3 недели', minutes: 21 },
        { id: 'monthly', name: 'Ежемесячно', minutes: 30 },
        { id: '2months', name: 'Каждые 2 месяца', minutes: 60 }
    ];

    // Для продакшена (раскомментировать когда нужно):
    // const CLEANING_PERIODS = [
    //     { id: 'daily', name: 'Ежедневно', days: 1 },
    //     { id: '2days', name: 'Раз в 2 дня', days: 2 },
    //     { id: '3days', name: 'Раз в 3 дня', days: 3 },
    //     { id: '4days', name: 'Раз в 4 дня', days: 4 },
    //     { id: 'weekly', name: 'Раз в неделю', days: 7 },
    //     { id: '2weeks', name: 'Раз в две недели', days: 14 },
    //     { id: '3weeks', name: 'Раз в 3 недели', days: 21 },
    //     { id: 'monthly', name: 'Ежемесячно', days: 30 },
    //     { id: '2months', name: 'Каждые 2 месяца', days: 60 }
    // ];

    // Милые аватары по умолчанию
    const DEFAULT_AVATARS = [
        { emoji: '🐱', name: 'Котёнок' },
        { emoji: '🐶', name: 'Щенок' },
        { emoji: '🐰', name: 'Зайчик' },
        { emoji: '🐻', name: 'Медвежонок' },
        { emoji: '🦊', name: 'Лисёнок' },
        { emoji: '🐼', name: 'Панда' },
        { emoji: '🐨', name: 'Коала' },
        { emoji: '🦄', name: 'Единорог' },
        { emoji: '🐸', name: 'Лягушонок' },
        { emoji: '🐷', name: 'Поросёнок' },
        { emoji: '🦉', name: 'Совёнок' },
        { emoji: '🐯', name: 'Тигрёнок' }
    ];

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
    { id: 'refrigerator', name: 'Холодильник', icon: '❄️', image: 'images/refrigerator.png' },
    { id: 'washing_machine', name: 'Стиральная машина', icon: '🧺', image: 'images/WashingMachine.png' },
    { id: 'stove', name: 'Плита', icon: '🔥', image: 'images/stove.png' },
    { id: 'oven', name: 'Духовка', icon: '🍞', image: 'images/oven.png' },
    { id: 'microwave', name: 'Микроволновка', icon: '📻', image: 'images/microwave.png' }
];

    // Эмодзи микробов для анимации
    const GERM_EMOJIS = ['🦠', '👾', '💀', '👹', '🐛', '🤮','🤢'];

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
    let userAvatar = ''; // URL или путь к аватару
    let currentMode = 'single'; // 'single' или 'multi'
    let familyMembers = [];
    let selectedItems = []; // Выбранные предметы для добавления
    let currentFamilyFilter = null; // Текущий фильтр по члену семьи в Multi режиме
    let userSettings = { // Настройки пользователя
        cleanIntervalMinutes: 5,
        stageIntervalMinutes: 2
    };
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    // Загрузка данных при старте
    function init() {
        loadUserData();
        // Проверяем имя только если его нет после загрузки
        if (!userName) {
            checkUserName();
        }
        renderAvailableItems();
        setupCarousel();
        startTimer();
    }

    // Загрузка всех данных из localStorage
    function loadUserData() {
        const savedItems = localStorage.getItem('userItems');
        if (savedItems) {
            userItems = JSON.parse(savedItems);
            // Обновляем пути к изображениям, если они устарели
            let needsSave = false;
            userItems.forEach(item => {
                const itemInfo = AVAILABLE_ITEMS.find(ai => ai.id === item.id);
                if (itemInfo && itemInfo.image) {
                    // Если путь к изображению устарел (содержит tinified или подпапки), обновляем его
                    if (item.image && (item.image.includes('tinified/') || item.image.includes('этапы загрязнения'))) {
                        item.image = itemInfo.image;
                        needsSave = true;
                    } else if (!item.image) {
                        // Если изображение не было сохранено, используем из каталога
                        item.image = itemInfo.image;
                        needsSave = true;
                    }
                }
            });
            // Сохраняем обновленные данные, если были изменения
            if (needsSave) {
                saveUserData();
            }
        }
        
        const savedName = localStorage.getItem('userName');
        if (savedName) {
            userName = savedName;
        }
        
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            userAvatar = savedAvatar;
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
        
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            userSettings = { ...userSettings, ...JSON.parse(savedSettings) };
        }
        
        // Обновляем отображение после загрузки всех данных
        if (userName) {
            updateUserNameDisplay();
        }
    }

    // Сохранение всех данных
    function saveUserData() {
        localStorage.setItem('userItems', JSON.stringify(userItems));
        localStorage.setItem('userName', userName);
        localStorage.setItem('userAvatar', userAvatar);
        localStorage.setItem('currentMode', currentMode);
        localStorage.setItem('familyMembers', JSON.stringify(familyMembers));
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
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

    // Обновление отображения имени и аватара
    function updateUserNameDisplay() {
        const userNameEl = document.getElementById('userName');
        const profileIconEl = document.getElementById('profileIcon');
        
        if (userNameEl) {
            userNameEl.textContent = userName || 'Гость';
        }
        
        if (profileIconEl) {
            if (userAvatar) {
                if (userAvatar.startsWith('emoji:')) {
                    // Эмодзи аватар
                    const emoji = userAvatar.replace('emoji:', '');
                    profileIconEl.innerHTML = `<span style="font-size: 24px;">${emoji}</span>`;
                } else {
                    // Загруженное фото
                    profileIconEl.innerHTML = `<img src="${userAvatar}" alt="${userName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                }
            } else {
                // Иначе показываем первую букву
                const initial = userName ? userName.charAt(0).toUpperCase() : '?';
                profileIconEl.innerHTML = `<span>${initial}</span>`;
            }
        }
    }

    // Открытие меню профиля
    function openProfileMenu() {
        document.getElementById('profileModal').classList.add('active');
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

    // Обновление классов карусели
    function updateCarouselClasses() {
        const track = document.getElementById('carouselTrack');
        const itemsToShow = getFilteredItems();
        
        if (itemsToShow.length === 0) return;
        
        const items = track.querySelectorAll('.carousel-item');
        items.forEach((itemEl) => {
            itemEl.classList.remove('prev', 'next', 'active');
            
            // Получаем ID и индекс из data-атрибутов для правильной синхронизации
            const itemId = itemEl.getAttribute('data-item-id');
            const itemIndex = parseInt(itemEl.getAttribute('data-item-index')) || 0;
            
            // Проверяем, что элемент соответствует текущему индексу
            // Используем ID для дополнительной проверки
            const currentItem = itemsToShow[currentItemIndex];
            const isCurrentItem = currentItem && itemId === currentItem.id && itemIndex === currentItemIndex;
            
            const totalItems = itemsToShow.length;
            let prevIndex = currentItemIndex - 1;
            let nextIndex = currentItemIndex + 1;
            
            // Обработка циклического перехода
            if (prevIndex < 0) prevIndex = totalItems - 1;
            if (nextIndex >= totalItems) nextIndex = 0;
            
            if (isCurrentItem || itemIndex === currentItemIndex) {
                itemEl.classList.add('active');
            } else if (itemIndex === prevIndex) {
                itemEl.classList.add('prev');
            } else if (itemIndex === nextIndex) {
                itemEl.classList.add('next');
            }
        });
    }

    // Обновление карусели
    function updateCarousel() {
        const track = document.getElementById('carouselTrack');
        const itemsToShow = getFilteredItems();
        
        if (itemsToShow.length === 0) return;
        
        // Центрируем активный элемент
        const offset = -currentItemIndex * 100;
        track.style.transform = `translateX(${offset}%)`;
        
        // Обновляем классы
        updateCarouselClasses();
        
        updateIndicators();
        updateItemInfo();
    }

    // Рендеринг карусели
    function renderCarousel() {
        const track = document.getElementById('carouselTrack');
        const container = document.getElementById('carouselContainer');
        track.innerHTML = '';
        
        // Фильтруем предметы в зависимости от режима
        const itemsToShow = getFilteredItems();
        
        if (itemsToShow.length === 0) {
            track.innerHTML = `
                <div class="carousel-item active">
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
        if (currentItemIndex < 0) {
            currentItemIndex = itemsToShow.length - 1;
        }
        
        // Создаем все элементы в правильном порядке
        itemsToShow.forEach((item, index) => {
            const itemElement = createCarouselItem(item, index);
            // Сохраняем data-атрибуты для связи с данными
            itemElement.setAttribute('data-item-index', index);
            itemElement.setAttribute('data-item-id', item.id);
            track.appendChild(itemElement);
        });
        
        // Устанавливаем правильные классы после создания всех элементов
        updateCarouselClasses();
        updateCarousel();
    }

    // Создание элемента карусели
    function createCarouselItem(item, index) {
        const timeSinceCleaning = Date.now() - item.lastCleaned;
        const minutesSinceCleaning = Math.floor(timeSinceCleaning / 60000);
        const stage = calculateGermStage(minutesSinceCleaning, item);
        const isDirty = stage > 0;
        
        const div = document.createElement('div');
        div.className = 'carousel-item';
        
        // Получаем информацию о предмете
        const itemInfo = AVAILABLE_ITEMS.find(ai => ai.id === item.id) || { icon: '🏠', image: null };
        
        // Создаем изображение предмета
        const imageContainer = document.createElement('div');
        imageContainer.className = 'item-image-container';
        
        // Определяем путь к изображению в зависимости от стадии загрязнения
        // Приоритет: актуальный item.image -> itemInfo.image (из каталога)
        // Если item.image устарел или неправильный, используем itemInfo.image
        let imagePath = item.image;
        
        // Проверяем, что путь актуален (не содержит устаревшие подпапки)
        if (imagePath && (imagePath.includes('tinified/') || imagePath.includes('этапы загрязнения'))) {
            imagePath = itemInfo.image; // Используем актуальный путь из каталога
        }
        
        // Если нет пути или он невалидный, используем из каталога
        if (!imagePath) {
            imagePath = itemInfo.image;
        }
        
        let finalImagePath = imagePath;
        
        // Если есть стадия загрязнения и путь к изображению, формируем путь к изображению стадии
        if (stage > 0 && imagePath && !imagePath.startsWith('data:')) {
            // Извлекаем базовое имя файла без расширения и путь к папке
            // Например: images/WashingMachine.png -> images/WashingMachine2.png для stage 1
            const pathMatch = imagePath.match(/^(.+\/)?(.+?)(\.(png|jpg|jpeg|svg))?$/i);
            if (pathMatch) {
                const folderPath = pathMatch[1] || '';
                const baseName = pathMatch[2] || '';
                const extension = pathMatch[4] || 'png';
                
                // Формируем путь к изображению стадии (stage + 1, так как stage 0 = чистое)
                // Например: images/WashingMachine.png -> images/WashingMachine2.png для stage 1
                finalImagePath = `${folderPath}${baseName}${stage + 1}.${extension}`;
            }
        }
        
        // Если нет пути - используем SVG с иконкой
        if (!imagePath || imagePath.startsWith('data:')) {
            finalImagePath = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" font-size="100" text-anchor="middle" dominant-baseline="middle">${itemInfo.icon}</text></svg>`)}`;
        }
        
        // Создаем одно изображение с предзагрузкой
        const baseImage = document.createElement('img');
        baseImage.className = 'item-base-image';
        baseImage.alt = item.name;
        baseImage.setAttribute('data-item-id', item.id); // Добавляем ID для синхронизации
        
        // Функция для показа fallback иконки
        const showFallbackIcon = () => {
            baseImage.style.display = 'none';
            if (!imageContainer.querySelector('.item-icon-fallback')) {
                const iconDiv = document.createElement('div');
                iconDiv.className = 'item-base-image item-icon-fallback';
                iconDiv.style.fontSize = '120px';
                iconDiv.style.display = 'flex';
                iconDiv.style.alignItems = 'center';
                iconDiv.style.justifyContent = 'center';
                iconDiv.textContent = itemInfo.icon;
                imageContainer.appendChild(iconDiv);
            }
        };
        
        // Предзагрузка изображения для проверки его существования
        if (finalImagePath && !finalImagePath.startsWith('data:')) {
            const testImage = new Image();
            let fallbackAttempted = false;
            
            testImage.onload = () => {
                // Изображение загрузилось успешно
                baseImage.src = finalImagePath;
            };
            
            testImage.onerror = () => {
                // Если изображение стадии не загрузилось, пробуем базовое
                if (!fallbackAttempted && stage > 0 && imagePath && imagePath !== finalImagePath && !imagePath.startsWith('data:')) {
                    fallbackAttempted = true;
                    const baseTestImage = new Image();
                    baseTestImage.onload = () => {
                        baseImage.src = imagePath;
                    };
                    baseTestImage.onerror = () => {
                        showFallbackIcon();
                    };
                    baseTestImage.src = imagePath;
                } else {
                    showFallbackIcon();
                }
            };
            
            testImage.src = finalImagePath;
        } else {
            // Для data URI устанавливаем сразу
            baseImage.src = finalImagePath;
        }
        
        // Также добавляем обработчик ошибок на само изображение для надежности
        baseImage.onerror = function() {
            showFallbackIcon();
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
    // Вычисление стадии загрязнения с учетом индивидуального периода предмета
    function calculateGermStage(minutesSinceCleaning, item) {
        // Получаем период для предмета (по умолчанию - ежедневно)
        const period = item.cleaningPeriod || 'daily';
        const periodData = CLEANING_PERIODS.find(p => p.id === period) || CLEANING_PERIODS[0];
        const periodMinutes = periodData.minutes || 1;
        
        // Первая стадия появляется только когда период полностью прошел
        // Если прошло меньше периода - предмет чистый
        if (minutesSinceCleaning < periodMinutes) {
            return 0;
        }
        
        // Вычисляем насколько период превышен
        const overdueTime = minutesSinceCleaning - periodMinutes;
        
        // Если период только что прошел - первая стадия
        if (overdueTime <= 0) {
            return 0; // Еще не загрязнен
        }
        
        // После окончания периода - добавляем стадии пропорционально
        const stageInterval = Math.max(1, Math.floor(periodMinutes / CONFIG.GERM_STAGES));
        const stage = Math.min(
            Math.floor(overdueTime / stageInterval) + 1,
            CONFIG.GERM_STAGES
        );
        
        return stage;
    }

    // Обновление индикаторов (убрано - заменено на декоративную линию)
    function updateIndicators() {
        // Индикаторы больше не используются
    }

    // Обновление информации о предмете
    function updateItemInfo() {
        const itemsToShow = getFilteredItems();
        
        if (itemsToShow.length === 0) {
            document.getElementById('itemNameText').textContent = 'Добавь предметы';
            document.getElementById('itemTime').textContent = '';
            document.getElementById('editNameBtn').style.display = 'none';
            document.getElementById('cleanBtn').style.display = 'none';
            document.getElementById('periodBtn').style.display = 'none';
            return;
        }
        
        // Проверяем, что индекс в допустимых пределах
        if (currentItemIndex < 0 || currentItemIndex >= itemsToShow.length) {
            currentItemIndex = 0;
        }
        
        const item = itemsToShow[currentItemIndex];
        
        // Дополнительная проверка: убеждаемся, что активный элемент карусели соответствует данным
        const track = document.getElementById('carouselTrack');
        const activeElement = track.querySelector('.carousel-item.active');
        if (activeElement) {
            const activeItemId = activeElement.getAttribute('data-item-id');
            if (activeItemId && activeItemId !== item.id) {
                // Если не совпадает, ищем правильный индекс
                const correctIndex = itemsToShow.findIndex(i => i.id === activeItemId);
                if (correctIndex !== -1) {
                    currentItemIndex = correctIndex;
                    const correctItem = itemsToShow[currentItemIndex];
                    if (correctItem) {
                        // Обновляем карусель с правильным индексом
                        updateCarousel();
                        return; // Выходим, так как updateCarousel вызовет updateItemInfo снова
                    }
                }
            }
        }
        const timeSinceCleaning = Date.now() - item.lastCleaned;
        const minutesSinceCleaning = Math.floor(timeSinceCleaning / 60000);
        const stage = calculateGermStage(minutesSinceCleaning, item);
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
        document.getElementById('periodBtn').style.display = 'block';
        
        // Обновляем текст периода
        const period = item.cleaningPeriod || 'daily';
        const periodData = CLEANING_PERIODS.find(p => p.id === period) || CLEANING_PERIODS[0];
        document.getElementById('periodText').textContent = periodData.name;
        
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
        
        // Убеждаемся, что путь к изображению правильный
        let imagePath = item.image;
        // Если путь содержит устаревшие подпапки, используем актуальный путь
        if (imagePath && (imagePath.includes('tinified/') || imagePath.includes('этапы загрязнения'))) {
            // Находим актуальный путь из каталога
            const itemInfo = AVAILABLE_ITEMS.find(ai => ai.id === item.id);
            if (itemInfo && itemInfo.image) {
                imagePath = itemInfo.image;
            }
        }
        
        const newItem = {
            id: item.id,
            name: item.name,
            icon: item.icon,
            image: imagePath || item.image, // Сохраняем актуальный путь
            lastCleaned: Date.now(),
            addedAt: Date.now(),
            assignedTo: currentMode === 'multi' ? null : userName,
            cleaningPeriod: 'daily' // По умолчанию ежедневно
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

    // Удаление текущего предмета
    function deleteCurrentItem() {
        const itemsToShow = getFilteredItems();
        if (itemsToShow.length === 0) return;
        
        const itemToDelete = itemsToShow[currentItemIndex];
        
        // Подтверждение удаления
        if (confirm(`Удалить предмет "${itemToDelete.name}"?`)) {
            // Удаляем предмет из массива userItems
            const itemIndex = userItems.findIndex(ui => ui.id === itemToDelete.id);
            if (itemIndex !== -1) {
                userItems.splice(itemIndex, 1);
                saveUserData();
                
                // Обновляем индекс, если нужно
                const newItemsToShow = getFilteredItems();
                if (currentItemIndex >= newItemsToShow.length && newItemsToShow.length > 0) {
                    currentItemIndex = newItemsToShow.length - 1;
                } else if (newItemsToShow.length === 0) {
                    currentItemIndex = 0;
                }
                
                renderCarousel();
                closeRenameModal();
                
                if (tg?.HapticFeedback) {
                    tg.HapticFeedback.notificationOccurred('success');
                }
            }
        }
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
                        assignedTo: member,
                        cleaningPeriod: 'daily' // По умолчанию ежедневно
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

    // Открытие модального окна профиля
    function openProfileMenu() {
        const nameInput = document.getElementById('profileNameInput');
        const avatarPreview = document.getElementById('avatarPreviewContent');
        
        if (nameInput) nameInput.value = userName || '';
        
        // Обновляем превью аватара
        if (avatarPreview) {
            if (userAvatar) {
                if (userAvatar.startsWith('emoji:')) {
                    const emoji = userAvatar.replace('emoji:', '');
                    avatarPreview.innerHTML = `<span style="font-size: 40px;">${emoji}</span>`;
                } else {
                    avatarPreview.innerHTML = `<img src="${userAvatar}" alt="${userName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                }
            } else {
                const initial = userName ? userName.charAt(0).toUpperCase() : '?';
                avatarPreview.textContent = initial;
            }
        }
        
        document.getElementById('profileModal').classList.add('active');
    }

    // Закрытие модального окна профиля
    function closeProfileModal() {
        document.getElementById('profileModal').classList.remove('active');
    }

    // Сохранение профиля
    function saveProfile() {
        const nameInput = document.getElementById('profileNameInput');
        
        if (nameInput && nameInput.value.trim()) {
            userName = nameInput.value.trim();
        }
        
        saveUserData();
        updateUserNameDisplay();
        closeProfileModal();
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }

    // Открытие модального окна выбора аватара
    function openAvatarSelector() {
        const grid = document.getElementById('avatarsGrid');
        grid.innerHTML = '';
        
        // Добавляем стандартные аватары
        DEFAULT_AVATARS.forEach((avatar, index) => {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'avatar-option';
            if (userAvatar === `emoji:${avatar.emoji}`) {
                avatarDiv.classList.add('selected');
            }
            avatarDiv.textContent = avatar.emoji;
            avatarDiv.onclick = () => selectAvatar(`emoji:${avatar.emoji}`, avatar.emoji);
            grid.appendChild(avatarDiv);
        });
        
        document.getElementById('avatarModal').classList.add('active');
    }

    // Закрытие модального окна выбора аватара
    function closeAvatarModal() {
        document.getElementById('avatarModal').classList.remove('active');
    }

    // Выбор аватара
    function selectAvatar(avatarValue, emoji) {
        userAvatar = avatarValue;
        saveUserData();
        updateUserNameDisplay();
        closeAvatarModal();
        
        // Обновляем превью в модальном окне профиля
        const avatarPreview = document.getElementById('avatarPreviewContent');
        if (avatarPreview) {
            avatarPreview.textContent = emoji;
        }
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }

    // Загрузка своего аватара
    function handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выбери изображение');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            userAvatar = e.target.result; // Сохраняем как base64
            saveUserData();
            updateUserNameDisplay();
            closeAvatarModal();
            
            // Обновляем превью в модальном окне профиля
            const avatarPreview = document.getElementById('avatarPreviewContent');
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${userAvatar}" alt="${userName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
            
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
        };
        reader.readAsDataURL(file);
    }

    // Открытие модального окна выбора периода
    function openPeriodModal() {
        const itemsToShow = getFilteredItems();
        if (itemsToShow.length === 0) return;
        
        const item = itemsToShow[currentItemIndex];
        const currentPeriod = item.cleaningPeriod || 'daily';
        
        const list = document.getElementById('periodsList');
        list.innerHTML = '';
        
        CLEANING_PERIODS.forEach(period => {
            const periodDiv = document.createElement('div');
            periodDiv.className = `period-option ${period.id === currentPeriod ? 'selected' : ''}`;
            periodDiv.onclick = () => selectPeriod(period.id);
            periodDiv.textContent = period.name;
            list.appendChild(periodDiv);
        });
        
        document.getElementById('periodModal').classList.add('active');
    }

    // Выбор периода
    function selectPeriod(periodId) {
        const itemsToShow = getFilteredItems();
        if (itemsToShow.length === 0) return;
        
        const item = itemsToShow[currentItemIndex];
        const userItem = userItems.find(ui => ui.id === item.id);
        
        if (userItem) {
            userItem.cleaningPeriod = periodId;
            saveUserData();
            renderCarousel();
            
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
        }
        
        closePeriodModal();
    }

    // Закрытие модального окна периода
    function closePeriodModal() {
        document.getElementById('periodModal').classList.remove('active');
    }

    // Инициализация при загрузке
    document.addEventListener('DOMContentLoaded', init);
