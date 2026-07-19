export default class CommunityMap {

    constructor(options = {}) {
        this.mapElId = typeof options === 'string' ? options : (options.mapElId || 'community-map');
        this.dataKey = typeof options === 'object' && options.dataKey ? options.dataKey : 'communityMapMarkers';

        this.map = null;
        this.infoWindow = null;
        this.gMarkers = [];
        this.markerById = {};
        this.markerDataById = {}; // Добавили хранилище сырых данных объектов
        this.defaultCenter = { lat: 39.7392, lng: -104.9903 };
    }

    /**
     * Инициализация карты
     */
    async init() {
        const el = document.getElementById(this.mapElId);

        if (!el) {
            console.error(`CommunityMap: Не найден элемент #${this.mapElId} на странице.`);
            return;
        }

        if (typeof google === 'undefined' || !google.maps || !google.maps.importLibrary) {
            console.error('CommunityMap: Базовый загрузчик Google Карт не найден.');
            return;
        }

        try {
            await google.maps.importLibrary("maps");
        } catch (error) {
            console.error("CommunityMap: Ошибка при загрузке ядра Google Maps API:", error);
            return;
        }

        const rawData = window[this.dataKey];
        let markers = [];

        if (rawData) {
            if (Array.isArray(rawData)) {
                markers = rawData;
            } else if (Array.isArray(rawData.markers)) {
                markers = rawData.markers;
            }
        }

        this.map = new google.maps.Map(el, {
            center: this.defaultCenter,
            zoom: 11,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: false,
        });

        this.infoWindow = new google.maps.InfoWindow({
            maxWidth: 320,
            pixelOffset: new google.maps.Size(-150, 10)
        });

        google.maps.event.addListener(this.infoWindow, 'domready', () => {
            const closeBtn = document.querySelector('.gm-ui-hover-effect');
            if (closeBtn) closeBtn.style.opacity = '1';
        });

        if (markers.length > 0) {
            this.updateMarkers(markers);
        }

        // Автоматически вешаем слушатель кликов на всю страницу для поиска кнопок фокуса
        this.initGlobalClickListener();

        setTimeout(() => {
            google.maps.event.trigger(this.map, 'resize');
            if (this.gMarkers.length === 0) {
                this.map.setCenter(this.defaultCenter);
                this.map.setZoom(11);
            }
        }, 150);
    }

    /**
     * @param {Array} newMarkers - array (res.data.markers)
     */
    updateMarkers(newMarkers) {
        if (!this.map) {
            console.error("CommunityMap: Карта еще не инициализирована. Вызовите .init() перед обновлением маркеров.");
            return;
        }

        this.gMarkers.forEach(marker => marker.setMap(null));
        this.gMarkers = [];
        this.markerById = {};
        this.markerDataById = {}; // Сбрасываем старые данные

        const markersArray = Array.isArray(newMarkers) ? newMarkers : [];
        if (markersArray.length === 0) {
            console.warn("CommunityMap.updateMarkers: Передан пустой массив маркеров.");
            this.map.setCenter(this.defaultCenter);
            this.map.setZoom(11);
            return;
        }

        const customIcon = {
            url: "data:image/svg+xml;utf8," + encodeURIComponent(`
                <svg width="26" height="33" viewBox="0 0 26 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.8906 0C9.47301 0.00389384 6.19648 1.36914 3.77986 3.79622C1.36324 6.22331 0.00387705 9.51402 0 12.9464C0 24.0245 11.7188 32.3911 12.2183 32.7412C12.4153 32.8799 12.65 32.9542 12.8906 32.9542C13.1312 32.9542 13.3659 32.8799 13.563 32.7412C14.0625 32.3911 25.7812 24.0245 25.7812 12.9464C25.7774 9.51402 24.418 6.22331 22.0014 3.79622C19.5848 1.36914 16.3082 0.00389384 12.8906 0ZM12.8906 8.23864C13.8177 8.23864 14.724 8.51475 15.4949 9.03205C16.2657 9.54935 16.8665 10.2846 17.2213 11.1448C17.5761 12.0051 17.6689 12.9517 17.4881 13.8649C17.3072 14.7781 16.8607 15.617 16.2052 16.2753C15.5496 16.9337 14.7144 17.3821 13.8051 17.5638C12.8958 17.7454 11.9533 17.6522 11.0968 17.2959C10.2403 16.9395 9.50818 16.3361 8.99311 15.5619C8.47804 14.7878 8.20312 13.8775 8.20312 12.9464C8.20312 11.6979 8.69699 10.5004 9.57606 9.61752C10.4551 8.73464 11.6474 8.23864 12.8906 8.23864Z" fill="#1A1A2E"/>
                    <circle cx="12.8906" cy="13.4995" r="3.07812" fill="#FF6A00" stroke="white"/>
                </svg>
            `),
            size: new google.maps.Size(26, 33),
            scaledSize: new google.maps.Size(26, 33),
            anchor: new google.maps.Point(13, 33)
        };

        const bounds = new google.maps.LatLngBounds();
        let hasValidMarkers = false;

        markersArray.forEach((item) => {
            if (!item || item.lat == null || item.lng == null) return;

            const position = {
                lat: Number(item.lat),
                lng: Number(item.lng),
            };

            if (Number.isNaN(position.lat) || Number.isNaN(position.lng)) return;

            const marker = new google.maps.Marker({
                position,
                map: this.map,
                title: item.title || '',
                icon: customIcon
            });

            // Связываем id с маркером и его сырыми данными
            if (item.id) {
                this.markerById[item.id] = marker;
                this.markerDataById[item.id] = item;
            }

            marker.addListener('click', () => {
                this.map.panTo(marker.getPosition());
                if (item.title) {
                    this.openTooltip(marker, item);
                }
            });

            this.gMarkers.push(marker);
            bounds.extend(position);
            hasValidMarkers = true;
        });

        if (hasValidMarkers) {
            if (this.gMarkers.length === 1) {
                this.map.setCenter(this.gMarkers[0].getPosition());
                this.map.setZoom(13);
            } else {
                this.map.fitBounds(bounds, 48);
            }
        }
    }

    openTooltip(marker, item) {
        this.infoWindow.setContent(`<div>
        <div class="gm-info-window">
            <div class="gm-info-window__img"><img src="${item.image || ''}" alt="${item.title || ''}"></div>
            <div class="gm-info-window__info">
                <div class="gm-info-window__title">${item.title || ''}</div>
                <div class="gm-info-window__address">${item.city || ''}</div>
                <div class="gm-info-window__bottom">
                    <a class="gm-info-window__link" href="${item.link || '#'}">
                        <p class="gm-info-window__price">${item.price || ''}</p>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <mask id="mask0_343_1190" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18">
                            <rect width="18" height="18" fill="#D9D9D9"/>
                            </mask>
                            <g mask="url(#mask0_343_1190)">
                            <path d="M12.1313 9.75H3V8.25H12.1313L7.93125 4.05L9 3L15 9L9 15L7.93125 13.95L12.1313 9.75Z" fill="#1C1B1F"/>
                            </g>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </div>`);
        this.infoWindow.open(this.map, marker);
    }

    /**
     * Основная функция перемещения к маркеру по его ID
     * @param {string|number} id - Идентификатор элемента
     */
    focusMarker(id) {
        const marker = this.markerById[id];
        const itemData = this.markerDataById[id];

        if (!marker) {
            console.warn(`CommunityMap: Маркер с id "${id}" не найден на карте.`);
            return;
        }

        // 1. Плавно двигаем карту к пину
        this.map.panTo(marker.getPosition());

        // Опционально: можно принудительно приблизить карту, если масштаб мелкий
        if (this.map.getZoom() < 13) {
            this.map.setZoom(13);
        }

        // 2. Открываем для него тултип
        if (itemData && itemData.title) {
            this.openTooltip(marker, itemData);
        }
    }

    /**
     * Автоматический перехват кликов по кнопкам на фронтенде
     */
    initGlobalClickListener() {
        document.addEventListener('click', (e) => {
            // Ищем ближайший элемент с классом .js-map-focus
            const itemBtn = e.target.closest('.js-map-focus');
            if (!itemBtn) return;

            // Предотвращаем переход по ссылке, если кнопка была ссылкой
            e.preventDefault();

            const viewType = document.querySelector('.js-archive-view');
            console.log(viewType)
            if (viewType && viewType.dataset.view === 'list') {
                viewType.dataset.view = 'map';
            }

            // Извлекаем id из data-аттрибута кнопки (например, data-id="5")
            const itemId = itemBtn.dataset.id;

            if (itemId) {
                this.focusMarker(itemId);
            }
        });
    }
}
