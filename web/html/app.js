// ═══════════════════════════════════════════════════════════════
// ctrlTAB - Application Logic
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// Theme System
// ═══════════════════════════════════════════════════════════════

function initTheme() {
    const saved = localStorage.getItem('ctrltab-theme') || 'light';
    applyTheme(saved);
}

function applyTheme(theme) {
    if (theme === 'light') {
        delete document.documentElement.dataset.theme;
    } else {
        document.documentElement.dataset.theme = theme;
    }
    // Cyberpunk and batman have their own fixed accent colors
    if (theme === 'cyberpunk' || theme === 'batman') {
        document.documentElement.style.removeProperty('--color-accent');
    } else {
        applyAccentColor(_accentColor);
    }
    // Update active state in settings view
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.themeValue === theme);
    });
}

function applyAccentColor(color) {
    const theme = document.documentElement.dataset.theme;
    if (theme === 'cyberpunk' || theme === 'batman') return;
    if (color) {
        document.documentElement.style.setProperty('--color-accent', color);
    } else {
        document.documentElement.style.removeProperty('--color-accent');
    }
}

async function loadUserPreferences() {
    try {
        const prefs = await apiRequest('/auth/preferences');
        _accentColor = prefs.accentColor || null;
        if (_accentColor) {
            localStorage.setItem('ctrltab-accent', _accentColor);
        } else {
            localStorage.removeItem('ctrltab-accent');
        }
        applyAccentColor(_accentColor);
        _backgroundImage = prefs.backgroundImage || null;
        if (_backgroundImage) {
            localStorage.setItem('ctrltab-bg', _backgroundImage);
        } else {
            localStorage.removeItem('ctrltab-bg');
        }
        _backgroundVideo = prefs.backgroundVideo || null;
        if (_backgroundVideo) {
            localStorage.setItem('ctrltab-yt-bg', _backgroundVideo);
        } else {
            localStorage.removeItem('ctrltab-yt-bg');
        }
        _backgroundDim = prefs.backgroundDim !== false;
        localStorage.setItem('ctrltab-bg-dim', _backgroundDim ? '1' : '0');
        applyBackgroundImage(_backgroundImage);
        applyBackgroundVideo(_backgroundVideo);
        applyBackgroundDim(_backgroundDim);
    } catch {}
}

function applyBackgroundImage(url) {
    if (url) {
        document.documentElement.style.setProperty('--user-bg', `url("${url}")`);
        document.documentElement.classList.add('has-user-bg');
    } else {
        document.documentElement.style.removeProperty('--user-bg');
        document.documentElement.classList.remove('has-user-bg');
    }
}

function applyBackgroundDim(dim) {
    document.documentElement.classList.toggle('has-user-bg-dim', !!dim);
}

function parseYouTubeId(input) {
    input = input.trim();
    // Plain 11-char video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    const match = input.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

function applyBackgroundVideo(videoId) {
    const iframe = document.getElementById('yt-bg-iframe');
    if (videoId) {
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1`;
        document.documentElement.classList.add('has-user-bg', 'has-yt-bg');
    } else {
        iframe.src = 'about:blank';
        document.documentElement.classList.remove('has-yt-bg');
        if (!_backgroundImage) {
            document.documentElement.classList.remove('has-user-bg');
        }
    }
}

async function handleYouTubeUrlSet() {
    const input = document.getElementById('ytBgInput');
    const videoId = parseYouTubeId(input.value);
    if (!videoId) {
        alert(t('error.invalid_youtube_url'));
        return;
    }
    // Mutual exclusion: clear image background
    _backgroundImage = null;
    localStorage.removeItem('ctrltab-bg');
    applyBackgroundImage(null);

    _backgroundVideo = videoId;
    localStorage.setItem('ctrltab-yt-bg', videoId);
    applyBackgroundVideo(videoId);
    try {
        await apiRequest('/auth/preferences', { method: 'PUT', body: JSON.stringify({ backgroundImage: null, backgroundVideo: videoId }) });
    } catch {}
    showSettings();
}

async function removeYouTubeBg() {
    _backgroundVideo = null;
    localStorage.removeItem('ctrltab-yt-bg');
    applyBackgroundVideo(null);
    try {
        await apiRequest('/auth/preferences', { method: 'PUT', body: JSON.stringify({ backgroundVideo: null }) });
    } catch {}
    showSettings();
}

function applyShowLinkUrls(show) {
    document.documentElement.classList.toggle('show-link-urls', !!show);
}

function toggleShowLinkUrls(checked) {
    _showLinkUrls = checked;
    localStorage.setItem('ctrltab-show-url', checked ? '1' : '0');
    applyShowLinkUrls(checked);
}

function applyTwoColLayout(enabled) {
    document.documentElement.classList.toggle('two-col-layout', !!enabled);
}

function toggleTwoColLayout(checked) {
    _twoColLayout = checked;
    localStorage.setItem('ctrltab-two-col', checked ? '1' : '0');
    applyTwoColLayout(checked);
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
        el.setAttribute('aria-label', t(el.dataset.i18nTitle));
    });
    document.documentElement.lang = _lang;
}

function setLanguage(lang) {
    _lang = lang;
    localStorage.setItem('ctrltab-lang', lang);
    applyTranslations();
    if (currentView === 'settings') showSettings();
}

function updateAccentPreview(color) {
    applyAccentColor(color);
    const customBtn = document.querySelector('.accent-preset-custom');
    if (customBtn) {
        customBtn.style.background = color;
        customBtn.classList.add('active');
        const icon = customBtn.querySelector('.accent-preset-custom-icon');
        if (icon) icon.style.opacity = '0';
    }
    document.querySelectorAll('.accent-preset[data-color]').forEach(el => el.classList.remove('active'));
}

async function handleAccentColorChange(color) {
    _accentColor = color;
    localStorage.setItem('ctrltab-accent', color);
    applyAccentColor(color);
    const customBtn = document.querySelector('.accent-preset-custom');
    if (customBtn) {
        customBtn.style.background = color;
        customBtn.classList.add('active');
        const icon = customBtn.querySelector('.accent-preset-custom-icon');
        if (icon) icon.style.opacity = '0';
    }
    document.querySelectorAll('.accent-preset[data-color]').forEach(el => el.classList.remove('active'));
    try {
        await apiRequest('/auth/preferences', {
            method: 'PUT',
            body: JSON.stringify({ accentColor: color }),
        });
    } catch {}
}

async function selectAccentPreset(color) {
    _accentColor = color;
    localStorage.setItem('ctrltab-accent', color);
    applyAccentColor(color);
    document.querySelectorAll('.accent-preset[data-color]').forEach(el => {
        el.classList.toggle('active', el.dataset.color === color);
    });
    const customBtn = document.querySelector('.accent-preset-custom');
    if (customBtn) {
        customBtn.classList.remove('active');
        customBtn.style.background = '';
        const icon = customBtn.querySelector('.accent-preset-custom-icon');
        if (icon) icon.style.opacity = '';
    }
    try {
        await apiRequest('/auth/preferences', {
            method: 'PUT',
            body: JSON.stringify({ accentColor: color }),
        });
    } catch {}
}

function setTheme(theme) {
    localStorage.setItem('ctrltab-theme', theme);
    const overlay = document.getElementById('glitchOverlay');
    const currentTheme = document.documentElement.dataset.theme || 'light';

    if (theme === 'cyberpunk') {
        document.body.classList.add('cyberpunk-booting');
        if (overlay) overlay.classList.add('active');
        setTimeout(() => {
            document.body.classList.remove('cyberpunk-booting');
            if (overlay) overlay.classList.remove('active');
        }, 1500);
    } else if (theme === 'batman') {
        const batIntro = document.getElementById('batman-intro');
        if (batIntro) {
            batIntro.style.display = 'block';
            void batIntro.offsetHeight; // force reflow
            batIntro.classList.add('active');
            setTimeout(() => {
                batIntro.classList.remove('active');
                batIntro.style.display = 'none';
            }, 11800);
        }
        document.body.classList.add('batman-booting');
        setTimeout(() => {
            document.body.classList.remove('batman-booting');
        }, 11800);
    } else if (currentTheme === 'cyberpunk') {
        if (overlay) {
            overlay.classList.add('shutdown');
            setTimeout(() => overlay.classList.remove('shutdown'), 700);
        }
    } else if (currentTheme === 'batman') {
        if (overlay) {
            overlay.classList.add('batman-shutdown');
            setTimeout(() => overlay.classList.remove('batman-shutdown'), 600);
        }
    }

    applyTheme(theme);
    if (currentView === 'settings') showSettings();
}

function getOpenInNewTab() {
    const val = localStorage.getItem('ctrltab-newtab');
    return val === null ? true : val === 'true';
}

function setOpenInNewTab(enabled) {
    localStorage.setItem('ctrltab-newtab', enabled);
}

// Apply theme and accent color immediately to prevent flash
let _accentColor = null;
let _backgroundImage = null;
let _backgroundVideo = null;
let _backgroundDim = true;
let _showLinkUrls = false;
let _twoColLayout = false;
let _searchQuery = '';
let _searchDebounceTimer = null;
const ACCENT_PRESETS = ['#e2003d', '#e8650a', '#d4a017', '#198754', '#0d6efd', '#6f42c1', '#d63384'];
initTheme();
_accentColor = localStorage.getItem('ctrltab-accent') || null;
applyAccentColor(_accentColor);
_showLinkUrls = localStorage.getItem('ctrltab-show-url') !== '0';
applyShowLinkUrls(_showLinkUrls);
_twoColLayout = localStorage.getItem('ctrltab-two-col') === '1';
applyTwoColLayout(_twoColLayout);

// ═══════════════════════════════════════════════════════════════
// Authentication
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api';
let currentUser = null;

function getAuthToken() {
    return localStorage.getItem('ctrltab-token');
}

function getCurrentUser() {
    if (currentUser) return currentUser;
    const json = localStorage.getItem('ctrltab-user');
    if (json) currentUser = JSON.parse(json);
    return currentUser;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.is_admin;
}

function logout() {
    localStorage.removeItem('ctrltab-token');
    localStorage.removeItem('ctrltab-user');
    currentUser = null;
    window.location.href = '/login.html';
}

async function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Invalid token');

        const data = await res.json();
        currentUser = data.user;
        localStorage.setItem('ctrltab-user', JSON.stringify(data.user));
        return true;
    } catch {
        logout();
        return false;
    }
}

// State
let currentCollectionId = null;
let currentView = 'collections';
let collections = [];

// DOM Elements
const elements = {
    collectionsList: document.getElementById('collectionsList'),
    collectionTitle: document.getElementById('collectionTitle'),
    sectionsContainer: document.getElementById('sectionsContainer'),
    addCollectionBtn: document.getElementById('addCollectionBtn'),
    editCollectionBtn: document.getElementById('editCollectionBtn'),
    addSectionBtn: document.getElementById('addSectionBtn'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    settingsBackBtn: document.getElementById('settingsBackBtn'),
    searchInput:     document.getElementById('searchInput'),
    searchClearBtn:  document.getElementById('searchClearBtn'),
};

// ═══════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════

async function apiRequest(endpoint, options = {}) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers,
            },
            ...options,
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Collections
async function getCollections() {
    return apiRequest('/collections');
}

async function createCollection(name) {
    return apiRequest('/collections', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}

async function updateCollection(id, data) {
    return apiRequest(`/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteCollection(id) {
    return apiRequest(`/collections/${id}`, {
        method: 'DELETE',
    });
}

// Dashboard
async function getDashboard(collectionId) {
    return apiRequest(`/dashboard/${collectionId}`);
}

// Sections
async function createSection(collectionId, name) {
    return apiRequest(`/collections/${collectionId}/sections`, {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}

async function updateSection(id, data) {
    return apiRequest(`/sections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteSection(id) {
    return apiRequest(`/sections/${id}`, {
        method: 'DELETE',
    });
}

// Links
async function createLink(sectionId, data) {
    return apiRequest(`/sections/${sectionId}/links`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async function updateLink(id, data) {
    return apiRequest(`/links/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteLink(id) {
    return apiRequest(`/links/${id}`, {
        method: 'DELETE',
    });
}

async function reorderLinks(sectionId, orderedIds) {
    return apiRequest(`/sections/${sectionId}/links/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ order: orderedIds }),
    });
}

async function reorderSections(collectionId, orderedIds) {
    return apiRequest(`/collections/${collectionId}/sections/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ order: orderedIds }),
    });
}

async function uploadIcon(file) {
    const formData = new FormData();
    formData.append('icon', file);
    const res = await fetch('/api/upload/icon', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        body: formData,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
    }
    return (await res.json()).url;
}

// ═══════════════════════════════════════════════════════════════
// UI Functions
// ═══════════════════════════════════════════════════════════════

let loadingTimer = null;

function showLoading() {
    clearTimeout(loadingTimer);
    loadingTimer = setTimeout(() => {
        elements.loadingOverlay.classList.add('active');
    }, 150);
}

function hideLoading() {
    clearTimeout(loadingTimer);
    elements.loadingOverlay.classList.remove('active');
}

function showModal(title, bodyHTML) {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = bodyHTML;
    elements.modal.classList.add('active');
}

function hideModal() {
    elements.modal.classList.remove('active');
}

// ═══════════════════════════════════════════════════════════════
// Collections
// ═══════════════════════════════════════════════════════════════

async function loadCollections() {
    try {
        collections = await getCollections();
        renderCollections();

        // Auto-select last used collection, fall back to first
        if (collections.length > 0 && !currentCollectionId) {
            const lastId = parseInt(localStorage.getItem('ctrltab-last-collection'));
            const last = lastId && collections.find(c => c.id === lastId);
            selectCollection(last ? last.id : collections[0].id);
        } else if (collections.length === 0) {
            elements.sectionsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⌘</div>
                    <p>${t('collection.empty')}</p>
                    <button class="btn-primary" onclick="showAddCollectionModal()" style="margin-top: var(--spacing-lg);">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        ${t('collection.empty_btn')}
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load collections:', error);
    }
}

function renderCollections() {
    elements.collectionsList.innerHTML = collections
        .map(collection => `
            <li class="collection-item">
                <button
                    data-collection-id="${collection.id}"
                    onclick="selectCollection(${collection.id})"
                    class="${currentView === 'collections' && currentCollectionId === collection.id ? 'active' : ''}"
                >
                    ${escapeHtml(collection.name)}
                </button>
            </li>
        `)
        .join('');

    // Update settings button active state
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.classList.toggle('active', currentView === 'settings');
    }
}

function goHome() {
    const lastId = parseInt(localStorage.getItem('ctrltab-last-collection'));
    const target = (lastId && collections.find(c => c.id === lastId)) || collections[0];
    if (target) selectCollection(target.id);
}

async function selectCollection(id) {
    _searchQuery = '';
    clearTimeout(_searchDebounceTimer);
    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.searchClearBtn) elements.searchClearBtn.style.display = 'none';

    elements.sectionsContainer.classList.add('sections-exit');
    currentView = 'collections';
    currentCollectionId = id;
    localStorage.setItem('ctrltab-last-collection', id);
    renderCollections();
    await loadDashboard(id);

    // Show collection action buttons, hide settings back
    elements.editCollectionBtn.style.display = 'inline-flex';
    elements.addSectionBtn.style.display = 'inline-flex';
    elements.settingsBackBtn.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
// Settings View
// ═══════════════════════════════════════════════════════════════

function showSettings() {
    currentView = 'settings';
    currentCollectionId = null;
    renderCollections();

    elements.collectionTitle.textContent = t('settings.title');
    elements.editCollectionBtn.style.display = 'none';
    elements.addSectionBtn.style.display = 'none';
    elements.settingsBackBtn.style.display = '';

    const currentTheme = localStorage.getItem('ctrltab-theme') || 'light';
    const user = getCurrentUser();

    let html = '';

    // Theme section
    html += `
        <div class="settings-section">
            <h3 class="settings-section-title">${t('settings.theme')}</h3>
            <div class="theme-cards">
                <button class="theme-card ${currentTheme === 'light' ? 'active' : ''}" data-theme-value="light" onclick="setTheme('light')">
                    <div class="theme-preview theme-preview-light">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">${t('theme.light')}</span>
                </button>
                <button class="theme-card ${currentTheme === 'dark' ? 'active' : ''}" data-theme-value="dark" onclick="setTheme('dark')">
                    <div class="theme-preview theme-preview-dark">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">${t('theme.dark')}</span>
                </button>
                <button class="theme-card ${currentTheme === 'oled' ? 'active' : ''}" data-theme-value="oled" onclick="setTheme('oled')">
                    <div class="theme-preview theme-preview-oled">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">${t('theme.oled')}</span>
                </button>
                <button class="theme-card ${currentTheme === 'cyberpunk' ? 'active' : ''}" data-theme-value="cyberpunk" onclick="setTheme('cyberpunk')">
                    <div class="theme-preview theme-preview-cyberpunk">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">${t('theme.cyberpunk')}</span>
                </button>
                <button class="theme-card ${currentTheme === 'batman' ? 'active' : ''}" data-theme-value="batman" onclick="setTheme('batman')">
                    <div class="theme-preview theme-preview-batman">
                        <div class="tp-sidebar"></div>
                        <div class="tp-content">
                            <div class="tp-bar"></div>
                            <div class="tp-cards">
                                <div class="tp-card"></div>
                                <div class="tp-card"></div>
                            </div>
                        </div>
                    </div>
                    <span class="theme-card-label">${t('theme.batman')}</span>
                </button>
            </div>
            <div class="bg-image-section">
                <span class="accent-color-label">${t('settings.background_image')}</span>
                <div class="bg-image-controls">
                    ${_backgroundImage ? '' : `
                        <span class="bg-image-none">${t('settings.no_background')}</span>
                    `}
                    <label class="btn-secondary bg-upload-label">
                        ${_backgroundImage ? t('btn.change_bg') : t('btn.upload_bg')}
                        <input type="file" accept="image/jpeg,image/png,image/bmp,image/gif"
                               style="display:none" onchange="handleBgUpload(this)">
                    </label>
                    ${_backgroundImage ? `
                        <button class="btn-text-danger" onclick="removeBgImage()">${t('btn.remove')}</button>
                    ` : ''}
                </div>
                ${_backgroundImage ? `
                    <div class="toggle-label" style="margin-top: var(--spacing-sm);">
                        <label class="toggle-switch">
                            <input type="checkbox" ${_backgroundDim ? 'checked' : ''} onchange="handleBgDimToggle(this.checked)">
                            <span class="toggle-track"></span>
                        </label>
                        <span>${t('settings.dim_background')}</span>
                    </div>
                ` : ''}
            </div>
            <div class="bg-image-section">
                <span class="accent-color-label">${t('settings.video_background')}</span>
                <div class="bg-image-controls">
                    ${_backgroundVideo ? `
                        <span class="bg-image-none" style="font-family:monospace;font-size:12px;">${_backgroundVideo}</span>
                        <button class="btn-text-danger" onclick="removeYouTubeBg()">${t('btn.remove')}</button>
                    ` : `
                        <span class="bg-image-none">${t('settings.no_video')}</span>
                    `}
                </div>
                ${!_backgroundVideo ? `
                    <div style="display:flex;gap:var(--spacing-sm);margin-top:var(--spacing-sm);">
                        <input type="text" id="ytBgInput" class="form-input" placeholder="${t('settings.youtube_placeholder')}" style="flex:1;">
                        <button class="btn-secondary" onclick="handleYouTubeUrlSet()">${t('btn.set_video')}</button>
                    </div>
                ` : `
                    <div class="toggle-label" style="margin-top: var(--spacing-sm);">
                        <label class="toggle-switch">
                            <input type="checkbox" ${_backgroundDim ? 'checked' : ''} onchange="handleBgDimToggle(this.checked)">
                            <span class="toggle-track"></span>
                        </label>
                        <span>${t('settings.dim_background')}</span>
                    </div>
                `}
            </div>
            ${currentTheme !== 'cyberpunk' && currentTheme !== 'batman' ? `<div class="accent-color-section">
                <span class="accent-color-label">${t('settings.accent_color')}</span>
                <div class="accent-presets">
                    ${(() => {
                        const isCustom = !!_accentColor && !ACCENT_PRESETS.includes(_accentColor);
                        const effective = _accentColor || '#e2003d';
                        return ACCENT_PRESETS.map(color => `
                            <button class="accent-preset${!isCustom && color === effective ? ' active' : ''}"
                                    data-color="${color}"
                                    style="background:${color}"
                                    onclick="selectAccentPreset('${color}')"
                                    title="${color}"></button>
                        `).join('') + `
                            <label class="accent-preset accent-preset-custom${isCustom ? ' active' : ''}"
                                   title="${t('settings.custom_color')}"
                                   style="${isCustom ? `background:${_accentColor}` : ''}">
                                <span class="accent-preset-custom-icon"${isCustom ? ' style="opacity:0"' : ''}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                    </svg>
                                </span>
                                <input type="color" id="accentColorInput"
                                       value="${_accentColor || '#e2003d'}"
                                       style="position:absolute;opacity:0;width:0;height:0;pointer-events:none"
                                       oninput="updateAccentPreview(this.value)"
                                       onchange="handleAccentColorChange(this.value)">
                            </label>
                        `;
                    })()}
                </div>
            </div>` : ''}
        </div>
    `;

    // Preferences section
    const openInNewTab = getOpenInNewTab();
    html += `
        <div class="settings-section">
            <h3 class="settings-section-title">${t('settings.preferences')}</h3>
            <div class="toggle-label">
                <label class="toggle-switch">
                    <input type="checkbox" id="openNewTabCheckbox" ${openInNewTab ? 'checked' : ''} onchange="setOpenInNewTab(this.checked)">
                    <span class="toggle-track"></span>
                </label>
                <span>${t('pref.open_new_tab')}</span>
            </div>
            <div class="toggle-label">
                <label class="toggle-switch">
                    <input type="checkbox" ${_showLinkUrls ? 'checked' : ''} onchange="toggleShowLinkUrls(this.checked)">
                    <span class="toggle-track"></span>
                </label>
                <span>${t('pref.show_url')}</span>
            </div>
            <div class="toggle-label">
                <label class="toggle-switch">
                    <input type="checkbox" ${_twoColLayout ? 'checked' : ''} onchange="toggleTwoColLayout(this.checked)">
                    <span class="toggle-track"></span>
                </label>
                <span>${t('pref.two_col')}</span>
            </div>
            <div class="toggle-label">
                <span>${t('settings.language')}</span>
                <div class="lang-switcher">
                    <button class="lang-btn ${_lang === 'en' ? 'active' : ''}" onclick="setLanguage('en')">EN</button>
                    <button class="lang-btn ${_lang === 'nl' ? 'active' : ''}" onclick="setLanguage('nl')">NL</button>
                    <button class="lang-btn ${_lang === 'es' ? 'active' : ''}" onclick="setLanguage('es')">ES</button>
                </div>
            </div>
        </div>
    `;

    // Admin: User Management section
    if (isAdmin()) {
        html += `
            <div class="settings-section">
                <h3 class="settings-section-title">${t('admin.user_management')}</h3>
                <div id="usersTableContainer">
                    <div style="color: var(--color-text-muted);">${t('admin.loading_users')}</div>
                </div>
            </div>
        `;
    }

    // Account section
    html += `
        <div class="settings-section">
            <h3 class="settings-section-title">${t('settings.account')}</h3>
            <div class="settings-field">
                <span class="settings-field-label">${t('account.username')}</span>
                <span class="settings-field-value">${user ? escapeHtml(user.username) : ''}</span>
            </div>
            <div class="settings-field">
                <span class="settings-field-label">${t('account.role')}</span>
                <span class="settings-field-value">
                    <span class="badge ${user && user.is_admin ? 'badge-admin' : 'badge-user'}">
                        ${user && user.is_admin ? t('account.role_admin') : t('account.role_user')}
                    </span>
                </span>
            </div>
            <div class="settings-account-actions">
                <button class="btn-secondary" onclick="showChangePasswordModal()">${t('btn.change_password')}</button>
                <button class="btn-danger" onclick="logout()">${t('btn.logout')}</button>
            </div>
        </div>
    `;

    html += `
        <div class="settings-section">
            <h3 class="settings-section-title">${t('settings.data')}</h3>

            <div class="settings-label">${t('export.title')}</div>
            <div class="settings-hint">${t('export.hint')}</div>
            <button class="btn-secondary" id="exportBtn" style="margin-top: var(--spacing-sm);" onclick="handleExport(this)">
                ${t('btn.export_json')}
            </button>
            <div id="exportStatus" class="import-status" style="display:none;"></div>

            <div class="settings-label" style="margin-top: var(--spacing-xl);">${t('import.section_title')}</div>
            <div class="settings-hint">${t('import.section_hint')}</div>
            <button class="btn-secondary" style="margin-top: var(--spacing-sm);" onclick="showImportModal()">
                ${t('btn.import_data')}
            </button>
        </div>
    `;

    html += `
        <div class="settings-footer">
            ${t('footer.credits')}
            <a href="https://github.com/erymantho/ctrlTAB" target="_blank" rel="noopener" class="github-link">
                <img class="github-logo" src="icons/github-logo.svg" alt="GitHub" width="14" height="14">
                GitHub
            </a>
            <div class="settings-version">v1.2</div>
        </div>
    `;

    elements.sectionsContainer.innerHTML = html;

    // Load users table if admin
    if (isAdmin()) {
        loadUsersTable();
    }
}

async function loadUsersTable() {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    try {
        const users = await apiRequest('/admin/users');

        const rows = users.map(user => `
            <tr>
                <td>${escapeHtml(user.username)}</td>
                <td>
                    <span class="badge ${user.is_admin ? 'badge-admin' : 'badge-user'}">
                        ${user.is_admin ? t('account.role_admin') : t('account.role_user')}
                    </span>
                </td>
                <td style="font-size: 12px; color: var(--color-text-muted);">
                    ${new Date(user.created_at).toLocaleDateString()}
                </td>
                <td>
                    <div style="display: flex; gap: var(--spacing-sm);">
                        <button class="btn-icon" onclick="showEditUserModal(${user.id})" title="${t('btn.edit_user')}">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon btn-icon-danger" onclick="confirmDeleteUser(${user.id}, '${escapeHtml(user.username)}')" title="${t('btn.delete_user')}">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div style="margin-bottom: var(--spacing-lg);">
                <button class="btn-primary" onclick="showAddUserModal()">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    ${t('btn.add_user')}
                </button>
            </div>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>${t('admin.col_username')}</th>
                        <th>${t('admin.col_role')}</th>
                        <th>${t('admin.col_created')}</th>
                        <th>${t('admin.col_actions')}</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = `<div style="color: var(--color-text-muted);">${t('error.load_users')}</div>`;
    }
}

async function loadDashboard(collectionId) {
    try {
        showLoading();
        const data = await getDashboard(collectionId);

        elements.collectionTitle.textContent = data.name;
        elements.collectionTitle.classList.add('title-flash');
        setTimeout(() => elements.collectionTitle.classList.remove('title-flash'), 500);
        renderSections(data.sections || []);
        initDragAndDrop();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>${t('error.load_collection')}</p>
            </div>
        `;
    } finally {
        hideLoading();
    }
}

function renderSections(sections) {
    elements.sectionsContainer.classList.remove('sections-exit');

    if (sections.length === 0) {
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📑</div>
                <p>${t('section.empty')}</p>
            </div>
        `;
        elements.sectionsContainer.classList.add('sections-enter');
        setTimeout(() => elements.sectionsContainer.classList.remove('sections-enter'), 600);
        return;
    }

    elements.sectionsContainer.innerHTML = sections
        .map(section => {
            const links = section.links || [];
            return `
            <div class="section" data-section-id="${section.id}">
                <div class="section-header" draggable="true">
                    <h3 class="section-title">${escapeHtml(section.name)}</h3>
                    <div class="section-actions">
                        <button class="btn-icon btn-icon--labeled" onclick="showAddLinkModal(${section.id})" title="${t('btn.add_link')}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <span>${t('btn.add_link')}</span>
                        </button>
                        ${links.length > 1 ? `
                        <button class="btn-icon btn-icon--labeled" onclick="sortSectionAlpha(${section.id})" title="${t('btn.sort_alpha')}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h7M2 8h5M2 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                <path d="M11 3l2 2 2-2M13 5V13M11 11l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>${t('btn.sort_alpha')}</span>
                        </button>` : ''}
                        <button class="btn-icon btn-icon--labeled" onclick="showEditSectionModal(${section.id}, '${escapeHtml(section.name)}')" title="${t('section.edit')}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>${t('section.edit')}</span>
                        </button>
                    </div>
                </div>
                <div class="links-grid" data-section-id="${section.id}">
                    ${renderLinks(links, section.id)}
                </div>
            </div>
        `;
        })
        .join('');

    elements.sectionsContainer.classList.add('sections-enter');
    setTimeout(() => elements.sectionsContainer.classList.remove('sections-enter'), 600);
}

function buildFaviconSources(link) {
    const seen = new Set();
    const sources = [];
    const add = url => { if (url && !seen.has(url)) { seen.add(url); sources.push(url); } };

    if (link.favicon) add(link.favicon);

    try {
        const { origin, hostname } = new URL(link.url);
        const m = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        const isLocal = hostname === 'localhost' || (m && (
            +m[1] === 10 || +m[1] === 127 ||
            (+m[1] === 172 && +m[2] >= 16 && +m[2] <= 31) ||
            (+m[1] === 192 && +m[2] === 168)
        ));

        // Browser-side fallback chain (works even when server couldn't reach local apps)
        add(`${origin}/favicon.ico`);
        add(`${origin}/favicon.png`);
        add(`${origin}/apple-touch-icon.png`);

        if (!isLocal) {
            add(`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`);
        }
    } catch {}

    return sources;
}

function onFaviconError(img) {
    const fallbacks = (img.dataset.fallbacks || '').split('|').filter(Boolean);
    if (fallbacks.length > 0) {
        img.dataset.fallbacks = fallbacks.slice(1).join('|');
        img.src = fallbacks[0];
        return;
    }
    // All sources exhausted: show letter initial
    const box = img.closest('.link-favicon');
    const initial = img.dataset.initial || '?';
    if (box) box.innerHTML = `<span class="link-favicon-initial">${initial}</span>`;
}

function renderLinks(links, sectionId) {
    if (links.length === 0) {
        return `<p style="color: var(--color-text-muted); font-size: 14px;">${t('link.empty')}</p>`;
    }

    const target = getOpenInNewTab() ? ' target="_blank"' : '';
    return links
        .map(link => {
            const sources = buildFaviconSources(link);
            const initial = escapeHtml((link.title || '?')[0].toUpperCase());
            let displayUrl = link.url;
            try { displayUrl = new URL(link.url).hostname.replace(/^www\./, ''); } catch {}
            const faviconHtml = sources.length > 0
                ? `<img src="${escapeHtml(sources[0])}" data-fallbacks="${escapeHtml(sources.slice(1).join('|'))}" data-initial="${initial}" alt="" draggable="false" onerror="onFaviconError(this)">`
                : `<span class="link-favicon-initial">${initial}</span>`;
            return `
            <a href="${escapeHtml(link.url)}"${target} class="link-card" draggable="true" data-link-id="${link.id}">
                <div class="link-favicon">
                    ${faviconHtml}
                </div>
                <div class="link-content">
                    <div class="link-title">${escapeHtml(link.title)}</div>
                    <div class="link-url">${escapeHtml(displayUrl)}</div>
                </div>
                <div class="link-actions" onclick="event.preventDefault(); event.stopPropagation();">
                    <button class="btn-icon" onclick="showEditLinkModal(${link.id}, ${link.section_id}, '${escapeHtml(link.title)}', '${escapeHtml(link.url)}', '${escapeHtml(link.favicon || '')}')" title="${t('btn.edit_link')}">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="copyLinkUrl('${escapeHtml(link.url)}', this)" title="${t('btn.copy_url')}">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <rect x="5.5" y="2.5" width="8" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M5.5 4.5H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h6.5a1 1 0 0 0 1-1V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </a>
        `;
        })
        .join('');
}

// ═══════════════════════════════════════════════════════════════
// Search
// ═══════════════════════════════════════════════════════════════

function handleSearchInput(value) {
    _searchQuery = value.trim();

    if (elements.searchClearBtn) {
        elements.searchClearBtn.style.display = _searchQuery ? '' : 'none';
    }

    clearTimeout(_searchDebounceTimer);

    if (_searchQuery.length < 2) {
        if (_searchQuery.length === 0) clearSearch();
        return;
    }

    _searchDebounceTimer = setTimeout(() => performSearch(_searchQuery), 300);
}

async function performSearch(q) {
    try {
        const results = await apiRequest(`/search?q=${encodeURIComponent(q)}`);
        if (_searchQuery !== q) return;
        renderSearchResults(q, results);
    } catch (err) {
        console.error('Search failed:', err);
    }
}

function renderSearchResults(q, results) {
    currentView = 'search';
    renderCollections();

    elements.collectionTitle.textContent = t('search.title', { query: q });
    elements.editCollectionBtn.style.display = 'none';
    elements.addSectionBtn.style.display = 'none';
    elements.settingsBackBtn.style.display = 'none';

    if (results.length === 0) {
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>${t('search.no_results', { query: escapeHtml(q) })}</p>
            </div>
        `;
        return;
    }

    const target = getOpenInNewTab() ? ' target="_blank"' : '';
    const cards = results.map(link => {
        const sources = buildFaviconSources(link);
        const initial = escapeHtml((link.title || '?')[0].toUpperCase());
        let displayUrl = link.url;
        try { displayUrl = new URL(link.url).hostname.replace(/^www\./, ''); } catch {}
        const faviconHtml = sources.length > 0
            ? `<img src="${escapeHtml(sources[0])}" data-fallbacks="${escapeHtml(sources.slice(1).join('|'))}" data-initial="${initial}" alt="" draggable="false" onerror="onFaviconError(this)">`
            : `<span class="link-favicon-initial">${initial}</span>`;

        return `
            <a href="${escapeHtml(link.url)}"${target} class="link-card search-result-card"
               draggable="false"
               data-link-id="${link.id}"
               onclick="selectCollection(${link.collection_id}); clearSearch();">
                <div class="link-favicon">${faviconHtml}</div>
                <div class="link-content">
                    <div class="link-title">${escapeHtml(link.title)}</div>
                    <div class="link-url">${escapeHtml(displayUrl)}</div>
                    <div class="search-breadcrumb">${escapeHtml(link.collection_name)} &rsaquo; ${escapeHtml(link.section_name)}</div>
                </div>
            </a>
        `;
    }).join('');

    elements.sectionsContainer.innerHTML = `
        <div class="search-results-container">
            <p class="search-results-count">${t('search.result_count', { n: results.length, plural: results.length === 1 ? '' : 's' })}</p>
            <div class="links-grid">${cards}</div>
        </div>
    `;
}

function clearSearch() {
    _searchQuery = '';
    clearTimeout(_searchDebounceTimer);

    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.searchClearBtn) elements.searchClearBtn.style.display = 'none';

    if (currentView === 'search') {
        const lastId = parseInt(localStorage.getItem('ctrltab-last-collection'));
        const target = (lastId && collections.find(c => c.id === lastId)) || collections[0];
        if (target) {
            selectCollection(target.id);
        } else {
            currentView = 'collections';
            renderCollections();
        }
    }
}

function openFirstSearchResult() {
    const first = elements.sectionsContainer.querySelector('.search-result-card');
    if (first) first.click();
}

// ═══════════════════════════════════════════════════════════════
// Export / Import
// ═══════════════════════════════════════════════════════════════

async function handleExport(btn) {
    const statusEl = document.getElementById('exportStatus');
    btn.disabled = true;
    statusEl.style.display = '';
    statusEl.className = 'import-status import-status--loading';
    statusEl.textContent = t('export.exporting');

    try {
        const res = await fetch(`${API_BASE}/export`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || t('export.failed'));
        }
        const blob = await res.blob();
        const date = new Date().toISOString().split('T')[0];
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ctrltab-backup-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        statusEl.style.display = 'none';
    } catch (err) {
        statusEl.className = 'import-status import-status--error';
        statusEl.textContent = err.message || t('export.failed');
    } finally {
        btn.disabled = false;
    }
}

function showImportModal() {
    showModal(t('modal.import_data'), `
        <div class="import-options">
            <label class="import-option">
                <input type="radio" name="importType" value="ctrltab" checked onchange="updateImportModalType()">
                <div>
                    <span class="import-option-title">${t('import.ctrltab_title')}</span>
                    <span class="import-option-hint">${t('import.ctrltab_hint')}</span>
                </div>
            </label>
            <label class="import-option">
                <input type="radio" name="importType" value="linkwarden" onchange="updateImportModalType()">
                <div>
                    <span class="import-option-title">${t('import.linkwarden_title')}</span>
                    <span class="import-option-hint">${t('import.linkwarden_hint')}</span>
                </div>
            </label>
            <label class="import-option">
                <input type="radio" name="importType" value="bookmarks" onchange="updateImportModalType()">
                <div>
                    <span class="import-option-title">${t('import.bookmarks_title')}</span>
                    <span class="import-option-hint">${t('import.bookmarks_hint')}</span>
                </div>
            </label>
        </div>

        <div style="margin-top: var(--spacing-lg); display: flex; align-items: center; gap: var(--spacing-md);">
            <label class="btn-secondary import-label" id="importModalLabel">
                ${t('btn.choose_file')}
                <input type="file" id="importModalFile" accept=".json,application/json" style="display:none"
                    onchange="document.getElementById('importModalFileName').textContent = this.files[0]?.name ?? ''; document.getElementById('importModalSubmitBtn').disabled = !this.files[0];">
            </label>
            <span id="importModalFileName" style="font-size: 13px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;"></span>
        </div>

        <div id="importModalStatus" class="import-status" style="display:none; margin-top: var(--spacing-md);"></div>

        <div class="form-actions" style="margin-top: var(--spacing-xl);">
            <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
            <button type="button" class="btn-primary" id="importModalSubmitBtn" disabled onclick="handleImportSubmit()">${t('btn.import')}</button>
        </div>
    `);
}

function updateImportModalType() {
    const type = document.querySelector('input[name="importType"]:checked')?.value;
    const fileInput = document.getElementById('importModalFile');
    fileInput.accept = type === 'bookmarks' ? '.html,.htm,text/html' : '.json,application/json';
    fileInput.value = '';
    document.getElementById('importModalFileName').textContent = '';
    document.getElementById('importModalSubmitBtn').disabled = true;
}

async function handleImportSubmit() {
    const type = document.querySelector('input[name="importType"]:checked')?.value;
    const fileInput = document.getElementById('importModalFile');
    const file = fileInput.files[0];
    if (!file || !type) return;

    const endpoints = { ctrltab: '/import/ctrltab', linkwarden: '/import/linkwarden', bookmarks: '/import/bookmarks' };
    const statusEl  = document.getElementById('importModalStatus');
    const submitBtn = document.getElementById('importModalSubmitBtn');
    const labelEl   = document.getElementById('importModalLabel');

    statusEl.style.display = '';
    statusEl.className = 'import-status import-status--loading';
    statusEl.textContent = t('import.importing');
    submitBtn.disabled = true;
    labelEl.style.pointerEvents = 'none';

    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}${endpoints[type]}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('import.failed'));

        const { imported } = data;
        statusEl.className = 'import-status import-status--success';
        statusEl.textContent = t('import.success', {
            collections: imported.collections,
            c_plural: imported.collections !== 1 ? 's' : '',
            links: imported.links,
            l_plural: imported.links !== 1 ? 's' : ''
        });
        await loadCollections();
        setTimeout(hideModal, 2000);
    } catch (err) {
        statusEl.className = 'import-status import-status--error';
        statusEl.textContent = err.message || t('import.failed');
        submitBtn.disabled = false;
        labelEl.style.pointerEvents = '';
    }
}

// ═══════════════════════════════════════════════════════════════
// Drag-and-Drop
// ═══════════════════════════════════════════════════════════════

let _dragLinkId = null;       // ID of the link being dragged
let _dragLinkCard = null;     // DOM reference to the card (kept during cross-col navigation)
let _dragSrcSectionId = null; // section the link originated from
let _dragCardHeight = 0;      // card height at dragstart (for placeholder sizing)
let _placeholder = null;      // drop-target indicator div that moves instead of the card
let _dragSection = null;      // section element being dragged
let _dragCtrl = null;         // AbortController for all drag event listeners
let _colHoverTimer = null;    // timer for hovering over a collection in the sidebar
let _colHoverCtrl = null;     // AbortController for collection hover listeners

const LINKS_EMPTY_HTML = () => `<p style="color: var(--color-text-muted); font-size: 14px;">${t('link.empty')}</p>`;

function _stopColHover() {
    if (_colHoverCtrl) { _colHoverCtrl.abort(); _colHoverCtrl = null; }
    clearTimeout(_colHoverTimer);
    _colHoverTimer = null;
    document.querySelectorAll('.collection-drop-hover').forEach(el => el.classList.remove('collection-drop-hover'));
}

function _startColHover() {
    _stopColHover();
    _colHoverCtrl = new AbortController();
    const { signal } = _colHoverCtrl;
    document.querySelectorAll('.collections-list button[data-collection-id]').forEach(btn => {
        const colId = parseInt(btn.dataset.collectionId);
        if (colId === currentCollectionId) return;
        btn.addEventListener('dragover', e => {
            e.preventDefault();
            btn.classList.add('collection-drop-hover');
            if (!_colHoverTimer) {
                _colHoverTimer = setTimeout(() => {
                    _colHoverTimer = null;
                    _stopColHover();
                    document.body.classList.remove('link-dragging');
                    // Park card on body so it survives the collection re-render
                    if (_dragLinkCard) {
                        _dragLinkCard.classList.remove('dragging');
                        _dragLinkCard.style.display = 'none';
                        document.body.appendChild(_dragLinkCard);
                    }
                    // Placeholder belongs to the old collection's grid — discard it
                    _placeholder?.remove();
                    _placeholder = null;
                    selectCollection(colId);
                }, 800);
            }
        }, { signal });
        btn.addEventListener('dragleave', () => {
            btn.classList.remove('collection-drop-hover');
            clearTimeout(_colHoverTimer);
            _colHoverTimer = null;
        }, { signal });
    });
}

function initDragAndDrop() {
    if (_dragCtrl) _dragCtrl.abort();
    _dragCtrl = new AbortController();
    const { signal } = _dragCtrl;

    // Cross-collection drag in progress: re-attach hover listeners for the new collection
    if (_dragLinkId) _startColHover();

    // ── Link drag ──────────────────────────────────────────────────────
    document.querySelectorAll('.links-grid').forEach(grid => {
        grid.addEventListener('dragstart', e => {
            const card = e.target.closest('.link-card[data-link-id]');
            if (!card) return;
            _dragLinkId = parseInt(card.dataset.linkId);
            _dragLinkCard = card;
            _dragSrcSectionId = parseInt(grid.dataset.sectionId);
            _dragCardHeight = card.offsetHeight;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.linkId);
            document.body.classList.add('link-dragging');
            // Create placeholder — it moves around grids; the card stays put
            _placeholder = document.createElement('div');
            _placeholder.className = 'drag-placeholder';
            _placeholder.style.height = _dragCardHeight + 'px';
            _startColHover();
        }, { signal });

        grid.addEventListener('dragover', e => {
            e.preventDefault();
            if (!_dragLinkId) return;
            // After cross-collection navigation the placeholder was discarded; recreate it
            if (!_placeholder) {
                _placeholder = document.createElement('div');
                _placeholder.className = 'drag-placeholder';
                _placeholder.style.height = (_dragCardHeight || 60) + 'px';
            }
            grid.querySelector(':scope > p')?.remove();
            const after = getDragAfterElement(grid, e.clientX, e.clientY);
            if (after && after !== _placeholder) grid.insertBefore(_placeholder, after);
            else if (!after) grid.appendChild(_placeholder);
        }, { signal });

        grid.addEventListener('drop', e => e.preventDefault(), { signal });
    });

    // ── Section drag ───────────────────────────────────────────────────
    const container = document.getElementById('sectionsContainer');
    if (!container) return;

    container.addEventListener('dragstart', e => {
        if (_dragLinkId) return;
        const header = e.target.closest('.section-header');
        const section = header?.closest('.section[data-section-id]');
        if (!section) return;
        _dragSection = section;
        section.classList.add('section-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', section.dataset.sectionId);
    }, { signal });

    container.addEventListener('dragover', e => {
        if (!_dragSection) return;
        e.preventDefault();
        const after = getSectionAfterElement(container, e.clientY);
        if (after) container.insertBefore(_dragSection, after);
        else container.appendChild(_dragSection);
    }, { signal });

    // ── Global dragend ─────────────────────────────────────────────────
    document.addEventListener('dragend', async () => {
        document.body.classList.remove('link-dragging');
        _stopColHover();

        // Section drag finished
        if (_dragSection) {
            _dragSection.classList.remove('section-dragging');
            const orderedIds = [...container.querySelectorAll('.section[data-section-id]')]
                .map(el => parseInt(el.dataset.sectionId));
            _dragSection = null;
            try {
                await reorderSections(currentCollectionId, orderedIds);
            } catch {
                loadDashboard(currentCollectionId);
            }
            return;
        }

        // Link drag finished
        if (!_dragLinkId) return;

        const card = _dragLinkCard;
        const linkId = _dragLinkId;
        const srcSectionId = _dragSrcSectionId;

        // Where is the placeholder? That's the drop target.
        const targetGrid = _placeholder?.isConnected ? _placeholder.parentElement : null;

        // Move card to placeholder position before removing placeholder
        if (targetGrid) targetGrid.insertBefore(card, _placeholder);
        _placeholder?.remove();
        _placeholder = null;

        _dragLinkId = null;
        _dragLinkCard = null;
        _dragSrcSectionId = null;
        _dragCardHeight = 0;

        card.classList.remove('dragging');
        card.style.display = '';

        if (!targetGrid || !targetGrid.classList.contains('links-grid')) {
            // Drag was cancelled or dropped outside any grid
            if (!card.isConnected) card.remove(); // was parked on body
            else loadDashboard(currentCollectionId);
            return;
        }

        const targetSectionId = parseInt(targetGrid.dataset.sectionId);
        const orderedIds = [...targetGrid.querySelectorAll('.link-card[data-link-id]')]
            .map(el => parseInt(el.dataset.linkId));

        try {
            if (targetSectionId !== srcSectionId) {
                await apiRequest(`/links/${linkId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ section_id: targetSectionId }),
                });
                // Restore "No links yet" in source section if it's now empty
                const srcGrid = document.querySelector(`.links-grid[data-section-id="${srcSectionId}"]`);
                if (srcGrid && !srcGrid.querySelector('.link-card[data-link-id]')) {
                    srcGrid.innerHTML = LINKS_EMPTY_HTML();
                }
            }
            await reorderLinks(targetSectionId, orderedIds);
        } catch {
            loadDashboard(currentCollectionId);
        }
    }, { signal });
}


async function copyLinkUrl(url, btn) {
    try {
        await navigator.clipboard.writeText(url);
        const original = btn.innerHTML;
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 8.5L6 12L13.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        setTimeout(() => { btn.innerHTML = original; }, 1200);
    } catch { /* clipboard not available */ }
}

function getSectionAfterElement(container, y) {
    const sections = [...container.querySelectorAll('.section[data-section-id]:not(.section-dragging)')];
    for (const section of sections) {
        const box = section.getBoundingClientRect();
        if (y < box.top + box.height / 2) return section;
    }
    return null;
}

function getDragAfterElement(grid, x, y) {
    const cards = [...grid.querySelectorAll('.link-card:not(.dragging)')];
    for (const card of cards) {
        const box = card.getBoundingClientRect();
        const onSameRow = y >= box.top && y <= box.bottom;
        const belowCursor = box.top > y;
        if (belowCursor || (onSameRow && x < box.left + box.width / 2)) {
            return card;
        }
    }
    return null;
}

async function sortSectionAlpha(sectionId) {
    const grid = document.querySelector(`.links-grid[data-section-id="${sectionId}"]`);
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.link-card[data-link-id]')];
    cards.sort((a, b) =>
        a.querySelector('.link-title').textContent.localeCompare(
            b.querySelector('.link-title').textContent, undefined, { sensitivity: 'base' }
        )
    );
    cards.forEach(card => grid.appendChild(card));
    const orderedIds = cards.map(card => parseInt(card.dataset.linkId));
    await reorderLinks(sectionId, orderedIds);
}

// ═══════════════════════════════════════════════════════════════
// Modal Actions - Collections
// ═══════════════════════════════════════════════════════════════

function showAddCollectionModal() {
    showModal(t('modal.add_collection'), `
        <form onsubmit="handleAddCollection(event)">
            <div class="form-group">
                <label class="form-label">${t('form.name_label')}</label>
                <input type="text" class="form-input" name="name" placeholder="${t('form.collection_name_placeholder')}" required autofocus>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
                <button type="submit" class="btn-primary">${t('btn.create')}</button>
            </div>
        </form>
    `);
}

async function handleAddCollection(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');

    try {
        showLoading();
        await createCollection(name);
        await loadCollections();
        hideModal();
    } catch (error) {
        alert(t('error.create_collection'));
    } finally {
        hideLoading();
    }
}

function showEditCollectionModal() {
    const collection = collections.find(c => c.id === currentCollectionId);
    if (!collection) return;

    showModal(t('modal.edit_collection'), `
        <form onsubmit="handleEditCollection(event)">
            <div class="form-group">
                <label class="form-label">${t('form.name_label')}</label>
                <input type="text" class="form-input" name="name" value="${escapeHtml(collection.name)}" required autofocus>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
                <button type="submit" class="btn-primary">${t('btn.save')}</button>
            </div>
        </form>
        <div class="modal-danger-zone">
            <button type="button" class="btn-text-danger" onclick="confirmDeleteCollection()">${t('modal.delete_collection')}</button>
        </div>
    `);
}

async function handleEditCollection(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');

    try {
        showLoading();
        await updateCollection(currentCollectionId, { name });
        await loadCollections();
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert(t('error.update_collection'));
    } finally {
        hideLoading();
    }
}

function confirmDeleteCollection() {
    const collection = collections.find(c => c.id === currentCollectionId);
    if (!collection) return;

    showModal(t('modal.delete_collection'), `
        <p style="margin-bottom: var(--spacing-lg); color: var(--color-text-secondary);">
            ${t('confirm.delete_collection', { name: escapeHtml(collection.name) })}
            <br><br>
            ${t('confirm.delete_collection_warning')}
        </p>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
            <button type="button" class="btn-danger" onclick="handleDeleteCollection()">${t('btn.delete')}</button>
        </div>
    `);
}

async function handleDeleteCollection() {
    try {
        showLoading();
        await deleteCollection(currentCollectionId);
        currentCollectionId = null;
        await loadCollections();
        elements.collectionTitle.textContent = 'ctrlTAB';
        elements.sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⌘</div>
                <p>${t('collection.empty')}</p>
                <button class="btn-primary" onclick="showAddCollectionModal()" style="margin-top: var(--spacing-lg);">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    ${t('collection.empty_btn')}
                </button>
            </div>
        `;
        elements.editCollectionBtn.style.display = 'none';
        elements.addSectionBtn.style.display = 'none';
        hideModal();
    } catch (error) {
        alert(t('error.delete_collection'));
    } finally {
        hideLoading();
    }
}

// ═══════════════════════════════════════════════════════════════
// Modal Actions - Sections
// ═══════════════════════════════════════════════════════════════

function showAddSectionModal() {
    showModal(t('modal.add_section'), `
        <form onsubmit="handleAddSection(event)">
            <div class="form-group">
                <label class="form-label">${t('form.name_label')}</label>
                <input type="text" class="form-input" name="name" placeholder="${t('form.section_name_placeholder')}" required autofocus>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
                <button type="submit" class="btn-primary">${t('btn.create')}</button>
            </div>
        </form>
    `);
}

async function handleAddSection(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');

    try {
        showLoading();
        await createSection(currentCollectionId, name);
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert(t('error.create_section'));
    } finally {
        hideLoading();
    }
}

function showEditSectionModal(sectionId, currentName) {
    showModal(t('modal.edit_section'), `
        <form onsubmit="handleEditSection(event, ${sectionId})">
            <div class="form-group">
                <label class="form-label">${t('form.name_label')}</label>
                <input type="text" class="form-input" name="name" value="${currentName}" required autofocus>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
                <button type="submit" class="btn-primary">${t('btn.save')}</button>
            </div>
        </form>
        <div class="modal-danger-zone">
            <button type="button" class="btn-text-danger" onclick="confirmDeleteSection(${sectionId})">${t('modal.delete_section')}</button>
        </div>
    `);
}

async function handleEditSection(event, sectionId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');

    try {
        showLoading();
        await updateSection(sectionId, { name });
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert(t('error.update_section'));
    } finally {
        hideLoading();
    }
}

function confirmDeleteSection(sectionId) {
    showModal(t('modal.delete_section'), `
        <p style="margin-bottom: var(--spacing-lg); color: var(--color-text-secondary);">
            ${t('confirm.delete_section')}
            <br><br>
            ${t('confirm.delete_section_warning')}
        </p>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
            <button type="button" class="btn-danger" onclick="handleDeleteSection(${sectionId})">${t('btn.delete')}</button>
        </div>
    `);
}

async function handleDeleteSection(sectionId) {
    try {
        showLoading();
        await deleteSection(sectionId);
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert(t('error.delete_section'));
    } finally {
        hideLoading();
    }
}

// ═══════════════════════════════════════════════════════════════
// Modal Actions - Links
// ═══════════════════════════════════════════════════════════════

function faviconFormGroup(currentValue = '') {
    const hasIcon = !!currentValue;
    const placeholderSvg = `<svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2"/><path d="M8 1.5C8 1.5 6 4 6 8s2 6.5 2 6.5M8 1.5C8 1.5 10 4 10 8s-2 6.5-2 6.5M1.5 8h13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;
    return `
        <div class="form-group">
            <label class="form-label">${t('form.icon_label')}</label>
            <input type="hidden" name="favicon" id="faviconHiddenInput" value="${escapeHtml(currentValue)}">
            <input type="file" id="faviconFileInput" accept=".png,.svg,.ico" style="display:none" onchange="handleIconUpload(this)">
            <div class="icon-upload-group">
                <div class="icon-preview-box" id="faviconPreviewBox">
                    ${hasIcon
                        ? `<img id="faviconPreviewImg" src="${escapeHtml(currentValue)}" alt="" onerror="this.style.display='none'">`
                        : `<span id="faviconPreviewImg" class="icon-preview-placeholder">${placeholderSvg}</span>`}
                </div>
                <div class="icon-upload-actions">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('faviconFileInput').click()">${t('btn.upload_icon')}</button>
                    <button type="button" class="btn-text-danger" id="faviconRemoveBtn" style="${hasIcon ? '' : 'display:none'}" onclick="removeIcon()">${t('btn.remove')}</button>
                    <p class="icon-upload-hint">${t('form.icon_hint')}</p>
                </div>
            </div>
        </div>`;
}

const _faviconPlaceholderSvg = `<svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2"/><path d="M8 1.5C8 1.5 6 4 6 8s2 6.5 2 6.5M8 1.5C8 1.5 10 4 10 8s-2 6.5-2 6.5M1.5 8h13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;

async function handleIconUpload(input) {
    const file = input.files[0];
    if (!file) return;
    try {
        const url = await uploadIcon(file);
        document.getElementById('faviconHiddenInput').value = url;
        const wrap = document.getElementById('faviconPreviewBox');
        wrap.innerHTML = `<img id="faviconPreviewImg" src="${url}" alt="" onerror="this.style.display='none'">`;
        document.getElementById('faviconRemoveBtn').style.display = '';
    } catch (err) {
        console.error('[upload] error:', err);
        alert(err.message || 'Failed to upload icon');
    }
    input.value = '';
}

function removeIcon() {
    document.getElementById('faviconHiddenInput').value = '';
    const wrap = document.getElementById('faviconPreviewBox');
    wrap.innerHTML = `<span id="faviconPreviewImg" class="icon-preview-placeholder">${_faviconPlaceholderSvg}</span>`;
    document.getElementById('faviconRemoveBtn').style.display = 'none';
}

async function handleBgUpload(input) {
    const file = input.files[0];
    if (!file) return;
    input.value = '';
    try {
        const formData = new FormData();
        formData.append('background', file);
        const res = await fetch('/api/upload/background', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
            body: formData,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Upload failed');
        }
        const { url } = await res.json();
        // Mutual exclusion: clear YouTube background
        _backgroundVideo = null;
        localStorage.removeItem('ctrltab-yt-bg');
        applyBackgroundVideo(null);
        _backgroundImage = url;
        localStorage.setItem('ctrltab-bg', url);
        applyBackgroundImage(url);
        await apiRequest('/auth/preferences', { method: 'PUT', body: JSON.stringify({ backgroundImage: url, backgroundVideo: null }) });
        showSettings();
    } catch (err) {
        alert(err.message || 'Failed to upload background');
    }
}

async function handleBgDimToggle(checked) {
    _backgroundDim = checked;
    localStorage.setItem('ctrltab-bg-dim', checked ? '1' : '0');
    applyBackgroundDim(checked);
    try {
        await apiRequest('/auth/preferences', { method: 'PUT', body: JSON.stringify({ backgroundDim: checked }) });
    } catch {}
}

async function removeBgImage() {
    _backgroundImage = null;
    localStorage.removeItem('ctrltab-bg');
    applyBackgroundImage(null);
    try {
        await apiRequest('/auth/preferences', { method: 'PUT', body: JSON.stringify({ backgroundImage: null }) });
    } catch {}
    showSettings();
}

function showAddLinkModal(sectionId) {
    showModal(t('modal.add_link'), `
        <form onsubmit="handleAddLink(event, ${sectionId})">
            <div class="form-group">
                <label class="form-label">${t('form.title_label')}</label>
                <input type="text" class="form-input" name="title" placeholder="${t('form.link_title_placeholder')}" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">${t('form.url_label')}</label>
                <input type="url" class="form-input" name="url" placeholder="${t('form.link_url_placeholder')}" required>
            </div>
            ${faviconFormGroup()}
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
                <button type="submit" class="btn-primary">${t('btn.create')}</button>
            </div>
        </form>
    `);
}

async function handleAddLink(event, sectionId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const title = formData.get('title');
    const url = formData.get('url');
    const favicon = formData.get('favicon') || undefined; // undefined = let server auto-fetch

    try {
        showLoading();
        await createLink(sectionId, { title, url, favicon });
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert(t('error.create_link'));
    } finally {
        hideLoading();
    }
}

function showEditLinkModal(linkId, sectionId, currentTitle, currentUrl, currentFavicon) {
    showModal(t('modal.edit_link'), `
        <form onsubmit="handleEditLink(event, ${linkId})">
            <div class="form-group">
                <label class="form-label">${t('form.title_label')}</label>
                <input type="text" class="form-input" name="title" value="${currentTitle}" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">${t('form.url_label')}</label>
                <input type="url" class="form-input" name="url" value="${currentUrl}" required>
            </div>
            ${faviconFormGroup(currentFavicon)}
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
                <button type="submit" class="btn-primary">${t('btn.save')}</button>
            </div>
        </form>
        <div class="modal-danger-zone">
            <button type="button" class="btn-text-danger" onclick="confirmDeleteLink(${linkId})">${t('modal.delete_link')}</button>
        </div>
    `);
}

async function handleEditLink(event, linkId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const title = formData.get('title');
    const url = formData.get('url');
    const favicon = formData.get('favicon'); // '' = removed (re-fetch), non-empty = custom icon

    try {
        showLoading();
        await updateLink(linkId, { title, url, favicon });
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert(t('error.update_link'));
    } finally {
        hideLoading();
    }
}

function confirmDeleteLink(linkId) {
    showModal(t('modal.delete_link'), `
        <p style="margin-bottom: var(--spacing-lg); color: var(--color-text-secondary);">
            ${t('confirm.delete_link')}
        </p>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
            <button type="button" class="btn-danger" onclick="handleDeleteLink(${linkId})">${t('btn.delete')}</button>
        </div>
    `);
}

async function handleDeleteLink(linkId) {
    try {
        showLoading();
        await deleteLink(linkId);
        await loadDashboard(currentCollectionId);
        hideModal();
    } catch (error) {
        alert(t('error.delete_link'));
    } finally {
        hideLoading();
    }
}

// ═══════════════════════════════════════════════════════════════
// Change Password
// ═══════════════════════════════════════════════════════════════

function showChangePasswordModal() {
    showModal(t('modal.change_password'), `
        <form onsubmit="handleChangePassword(event)">
            <div class="form-group">
                <label class="form-label">${t('form.current_password')}</label>
                <input type="password" class="form-input" name="currentPassword" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">${t('form.new_password')}</label>
                <input type="password" class="form-input" name="newPassword" required minlength="6">
                <small style="color: var(--color-text-muted); font-size: 12px;">${t('form.password_hint')}</small>
            </div>
            <div class="form-group">
                <label class="form-label">${t('form.confirm_password')}</label>
                <input type="password" class="form-input" name="confirmPassword" required minlength="6">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="hideModal()">${t('btn.cancel')}</button>
                <button type="submit" class="btn-primary">${t('btn.change_password')}</button>
            </div>
        </form>
    `);
}

async function handleChangePassword(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
        alert(t('error.password_mismatch'));
        return;
    }

    try {
        showLoading();
        await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        hideLoading();
        hideModal();
        alert(t('success.password_changed'));
    } catch (error) {
        hideLoading();
        alert(t('error.change_password') + ': ' + error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// Admin Panel
// ═══════════════════════════════════════════════════════════════

async function refreshUsersInSettings() {
    if (currentView === 'settings' && isAdmin()) {
        await loadUsersTable();
    }
}

function showAddUserModal() {
    showModal(t('modal.add_user'), `
        <form onsubmit="handleAddUser(event)">
            <div class="form-group">
                <label class="form-label">${t('admin.col_username')}</label>
                <input type="text" class="form-input" name="username" required autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">${t('form.password_label')}</label>
                <input type="password" class="form-input" name="password" required minlength="6">
                <small style="color: var(--color-text-muted); font-size: 12px;">${t('form.password_hint')}</small>
            </div>
            <div class="form-group">
                <label class="form-label" style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    <input type="checkbox" name="is_admin">
                    ${t('form.admin_privileges')}
                </label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="refreshUsersInSettings()">${t('btn.back')}</button>
                <button type="submit" class="btn-primary">${t('btn.create_user')}</button>
            </div>
        </form>
    `);
}

async function handleAddUser(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    try {
        showLoading();
        await apiRequest('/admin/users', {
            method: 'POST',
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password'),
                is_admin: formData.get('is_admin') === 'on'
            })
        });
        hideLoading();
        hideModal();
        refreshUsersInSettings();
    } catch (error) {
        hideLoading();
        alert(t('error.create_user') + ': ' + error.message);
    }
}

async function showEditUserModal(userId) {
    try {
        showLoading();
        const users = await apiRequest('/admin/users');
        const user = users.find(u => u.id === userId);
        hideLoading();

        if (!user) { alert(t('error.load_user')); return; }

        showModal(t('modal.edit_user'), `
            <form onsubmit="handleEditUser(event, ${userId})">
                <div class="form-group">
                    <label class="form-label">${t('admin.col_username')}</label>
                    <input type="text" class="form-input" name="username" value="${escapeHtml(user.username)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('form.new_password_optional')}</label>
                    <input type="password" class="form-input" name="password" minlength="6">
                </div>
                <div class="form-group">
                    <label class="form-label" style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        <input type="checkbox" name="is_admin" ${user.is_admin ? 'checked' : ''}>
                        ${t('form.admin_privileges')}
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="refreshUsersInSettings()">${t('btn.back')}</button>
                    <button type="submit" class="btn-primary">${t('btn.save')}</button>
                </div>
            </form>
        `);
    } catch (error) {
        hideLoading();
        alert(t('error.load_user'));
    }
}

async function handleEditUser(event, userId) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const data = {
        username: formData.get('username'),
        is_admin: formData.get('is_admin') === 'on'
    };

    const password = formData.get('password');
    if (password) data.password = password;

    try {
        showLoading();
        await apiRequest(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        hideLoading();
        refreshUsersInSettings();
    } catch (error) {
        hideLoading();
        alert(t('error.update_user') + ': ' + error.message);
    }
}

function confirmDeleteUser(userId, username) {
    showModal(t('modal.delete_user'), `
        <p style="margin-bottom: var(--spacing-lg); color: var(--color-text-secondary);">
            ${t('confirm.delete_user', { name: escapeHtml(username) })}
            <br><br>
            ${t('confirm.delete_user_warning')}
        </p>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="refreshUsersInSettings()">${t('btn.cancel')}</button>
            <button type="button" class="btn-danger" onclick="handleDeleteUser(${userId})">${t('btn.delete')}</button>
        </div>
    `);
}

async function handleDeleteUser(userId) {
    try {
        showLoading();
        await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
        hideLoading();
        hideModal();
        refreshUsersInSettings();
    } catch (error) {
        hideLoading();
        alert(t('error.delete_user') + ': ' + error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════════════════

elements.addCollectionBtn.addEventListener('click', showAddCollectionModal);
elements.editCollectionBtn.addEventListener('click', showEditCollectionModal);
elements.addSectionBtn.addEventListener('click', showAddSectionModal);
elements.modalClose.addEventListener('click', hideModal);
elements.modalBackdrop.addEventListener('click', hideModal);

// Settings button
document.getElementById('settingsBtn').addEventListener('click', showSettings);
elements.settingsBackBtn.addEventListener('click', () => {
    if (collections.length > 0) {
        selectCollection(collections[0].id);
    }
});

// Close modal on Escape key, search shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
        hideModal();
        return;
    }
    if (e.key === 'Escape' && currentView === 'search') {
        clearSearch();
        return;
    }
    const tag = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
    const modalOpen = elements.modal.classList.contains('active');

    if (e.key === '/' && !modalOpen && !inInput) {
        e.preventDefault();
        elements.searchInput?.focus();
        return;
    }

    // Focus-on-type: single printable character → focus search bar and pass through
    if (!modalOpen && !inInput && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        elements.searchInput?.focus();
        // Don't preventDefault — let the keypress land in the now-focused input
    }
});

// ═══════════════════════════════════════════════════════════════
// Service Worker
// ═══════════════════════════════════════════════════════════════

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
}

// ═══════════════════════════════════════════════════════════════
// Initialize
// ═══════════════════════════════════════════════════════════════

(async function init() {
    const authenticated = await checkAuth();
    if (!authenticated) return;

    _lang = detectLang();
    applyTranslations();
    loadUserPreferences();
    loadCollections();
})();
