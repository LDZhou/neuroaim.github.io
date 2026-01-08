// ==================== SETTINGS MANAGEMENT ====================
// User preferences, per-mode strobe toggles, difficulty levels

const SETTINGS_KEY = 'neuroaim_settings_v3';

// Default settings
const defaultSettings = {
    // Audio
    soundEnabled: true,
    volume: 0.5,
    
    // Crosshair
    crosshair: 'cross',
    crosshairScale: 1.0,
    
    // Mouse
    sensitivity: 1.0,
    
    // Per-mode strobe settings (false = off by default)
    strobeEnabled: {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false
    },
    
    // Per-mode difficulty levels (adaptive, stored between sessions)
    difficultyLevels: {
        1: { normal: 0.3, strobe: 0.3 },
        2: { normal: 0.3, strobe: 0.3 },
        3: { normal: 0.3, strobe: 0.3 },
        4: { normal: 0.3, strobe: 0.3 },
        5: { normal: 0.3, strobe: 0.3 },
        6: { normal: 0.3, strobe: 0.3 },
        7: { normal: 0.3, strobe: 0.3 }
    }
};

// Global settings object
var settings = { ...defaultSettings };

function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Deep merge with defaults to handle new settings
            settings = deepMerge(defaultSettings, parsed);
        }
    } catch(e) {
        console.warn('Settings load failed:', e);
        settings = { ...defaultSettings };
    }
    return settings;
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch(e) {
        console.warn('Settings save failed:', e);
    }
}

function resetSettings() {
    settings = JSON.parse(JSON.stringify(defaultSettings));
    saveSettings();
    updateSettingsUI();
    updateCrosshairPreview();
}

// Deep merge helper
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

// ===== UI UPDATE FUNCTIONS =====
function updateSettingsUI() {
    // Sound
    const soundEl = document.getElementById('setting-soundEnabled');
    if (soundEl) soundEl.checked = settings.soundEnabled;
    
    // Volume
    const volEl = document.getElementById('setting-volume');
    const volVal = document.getElementById('volume-value');
    if (volEl) volEl.value = settings.volume;
    if (volVal) volVal.innerText = Math.round(settings.volume * 100) + '%';
    
    // Sensitivity
    const sensEl = document.getElementById('setting-sensitivity');
    const sensVal = document.getElementById('sens-value');
    if (sensEl) sensEl.value = settings.sensitivity;
    if (sensVal) sensVal.innerText = settings.sensitivity.toFixed(1) + 'x';
    
    // Crosshair scale
    const scaleEl = document.getElementById('setting-scale');
    const scaleVal = document.getElementById('scale-value');
    if (scaleEl) scaleEl.value = settings.crosshairScale;
    if (scaleVal) scaleVal.innerText = settings.crosshairScale.toFixed(1) + 'x';
    
    // Crosshair type
    document.querySelectorAll('.crosshair-option').forEach(el => {
        el.classList.toggle('active', el.dataset.ch === settings.crosshair);
    });
    
    // Per-mode strobe toggles
    for (let mode = 1; mode <= 7; mode++) {
        const strobeEl = document.getElementById(`strobe-mode-${mode}`);
        if (strobeEl) {
            strobeEl.checked = settings.strobeEnabled[mode] || false;
        }
    }
}

function updateSetting(key, value) {
    settings[key] = value;
    saveSettings();
}

function updateSensitivity(value) {
    settings.sensitivity = parseFloat(value);
    const el = document.getElementById('sens-value');
    if (el) el.innerText = settings.sensitivity.toFixed(1) + 'x';
    saveSettings();
}

function updateVolume(value) {
    settings.volume = parseFloat(value);
    const el = document.getElementById('volume-value');
    if (el) el.innerText = Math.round(settings.volume * 100) + '%';
    saveSettings();
}

function setCrosshair(type) {
    settings.crosshair = type;
    document.querySelectorAll('.crosshair-option').forEach(el => {
        el.classList.toggle('active', el.dataset.ch === type);
    });
    updateCrosshairPreview();
    saveSettings();
}

function updateCrosshairScale(value) {
    settings.crosshairScale = parseFloat(value);
    const el = document.getElementById('scale-value');
    if (el) el.innerText = settings.crosshairScale.toFixed(1) + 'x';
    updateCrosshairPreview();
    saveSettings();
}

function updateCrosshairPreview() {
    const canvas = document.getElementById('crosshair-preview-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.parentElement.clientWidth || 200;
    const h = 80;
    canvas.width = w;
    canvas.height = h;
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);
    
    if (typeof drawCrosshairAt === 'function') {
        drawCrosshairAt(ctx, w/2, h/2, settings.crosshair, settings.crosshairScale);
    }
}

// ===== STROBE TOGGLE =====
function toggleStrobe(mode, enabled) {
    if (!settings.strobeEnabled) settings.strobeEnabled = {};
    settings.strobeEnabled[mode] = enabled;
    saveSettings();
}

// ===== DIFFICULTY LEVEL MANAGEMENT =====
function getDifficultyLevel(mode, isStrobe) {
    const key = isStrobe ? 'strobe' : 'normal';
    if (settings.difficultyLevels && settings.difficultyLevels[mode]) {
        return settings.difficultyLevels[mode][key] || CFG.adaptive.initialLevel;
    }
    return CFG.adaptive.initialLevel;
}

function setDifficultyLevel(mode, isStrobe, level) {
    if (!settings.difficultyLevels) settings.difficultyLevels = {};
    if (!settings.difficultyLevels[mode]) {
        settings.difficultyLevels[mode] = { normal: 0.3, strobe: 0.3 };
    }
    const key = isStrobe ? 'strobe' : 'normal';
    settings.difficultyLevels[mode][key] = Math.max(CFG.adaptive.minLevel, Math.min(CFG.adaptive.maxLevel, level));
    saveSettings();
}

function isStrobeEnabled(mode) {
    return settings.strobeEnabled && settings.strobeEnabled[mode] === true;
}