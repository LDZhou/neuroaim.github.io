// ==================== SETTINGS MANAGEMENT ====================
// Handles all user preferences and persistence
// RESTORED FULL FUNCTIONALITY

const DEFAULT_SETTINGS = {
    // Mouse
    sensitivity: 1.0,
    
    // Mode Configs
    adaptiveContrast: true,      // Mode 1
    
    // Surgical Configs (Mode 3)
    coreSize: 3,
    penaltySize: 35,
    
    // After-gaze Configs
    afterGazeMode1: true,
    afterGazeMode2: true,
    afterGazeMode3: false,       
    
    // Visual (Internal mostly, controlled by Difficulty now)
    noiseLevel: 1,               
    
    // Crosshair
    crosshair: 'cross',          
    crosshairScale: 1.0,
    
    // Audio
    soundEnabled: true,
    volume: 0.5
};

let settings = { ...DEFAULT_SETTINGS };

function loadSettings() {
    try {
        const saved = localStorage.getItem('neuroaim_settings');
        if (saved) {
            settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            
            // Clean up legacy keys if any
            if (saved.includes('visualNoise')) delete settings.visualNoise;
        }
    } catch(e) {
        console.warn('Failed to load settings:', e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('neuroaim_settings', JSON.stringify(settings));
    } catch(e) {
        console.warn('Failed to save settings:', e);
    }
}

// Generic updater
function updateSetting(key, value) {
    settings[key] = value;
    saveSettings();
}

// ===== SPECIFIC UPDATERS (Linked to HTML inputs) =====

function updateVolume(val) {
    settings.volume = parseFloat(val);
    const el = document.getElementById('volume-value');
    if (el) el.innerText = Math.round(settings.volume * 100) + '%';
    saveSettings();
    if (typeof initAudio === 'function') initAudio(); // Apply volume immediately
}

function updateSensitivity(val) {
    settings.sensitivity = parseFloat(val);
    const el = document.getElementById('sens-value');
    if (el) el.innerText = val + 'x';
    saveSettings();
}

function updateCoreSize(val) {
    settings.coreSize = parseInt(val);
    const el = document.getElementById('core-size-value');
    if (el) el.innerText = val + 'px';
    
    // Sync to CFG immediately
    if (typeof CFG !== 'undefined') CFG.surgical.coreSize = settings.coreSize;
    saveSettings();
}

function updatePenaltySize(val) {
    settings.penaltySize = parseInt(val);
    const el = document.getElementById('penalty-size-value');
    if (el) el.innerText = val + 'px';
    
    if (typeof CFG !== 'undefined') CFG.surgical.penaltySize = settings.penaltySize;
    saveSettings();
}

function updateCrosshairScale(val) {
    settings.crosshairScale = parseFloat(val);
    const el = document.getElementById('scale-value');
    if (el) el.innerText = val + 'x';
    saveSettings();
    updateCrosshairPreview();
}

function setCrosshair(value) {
    settings.crosshair = value;
    saveSettings();
    updateSettingsUI();
    updateCrosshairPreview();
}

function resetSettings() {
    settings = { ...DEFAULT_SETTINGS };
    saveSettings();
    updateSettingsUI();
    updateCrosshairPreview();
    
    // Sync CFG values back to default
    if (typeof CFG !== 'undefined') {
        CFG.surgical.coreSize = settings.coreSize;
        CFG.surgical.penaltySize = settings.penaltySize;
    }
}

// ===== UI SYNCHRONIZATION =====
// Ensures all HTML inputs match current JS settings
function updateSettingsUI() {
    // 1. Mouse Sens
    const elSens = document.getElementById('setting-sensitivity');
    if (elSens) {
        elSens.value = settings.sensitivity;
        const val = document.getElementById('sens-value');
        if(val) val.innerText = settings.sensitivity + 'x';
    }

    // 2. Volume
    const elVol = document.getElementById('setting-volume');
    if (elVol) {
        elVol.value = settings.volume;
        const val = document.getElementById('volume-value');
        if(val) val.innerText = Math.round(settings.volume * 100) + '%';
    }
    
    // 3. Mode Configs
    const elAdap = document.getElementById('setting-adaptiveContrast');
    if (elAdap) elAdap.checked = settings.adaptiveContrast;
    
    const elCore = document.getElementById('setting-coreSize');
    if (elCore) {
        elCore.value = settings.coreSize;
        const val = document.getElementById('core-size-value');
        if(val) val.innerText = settings.coreSize + 'px';
    }
    
    const elPen = document.getElementById('setting-penaltySize');
    if (elPen) {
        elPen.value = settings.penaltySize;
        const val = document.getElementById('penalty-size-value');
        if(val) val.innerText = settings.penaltySize + 'px';
    }

    // 4. After Gaze
    const elGaze1 = document.getElementById('setting-afterGaze1');
    if (elGaze1) elGaze1.checked = settings.afterGazeMode1;
    
    const elGaze2 = document.getElementById('setting-afterGaze2');
    if (elGaze2) elGaze2.checked = settings.afterGazeMode2;

    // 5. Crosshair
    document.querySelectorAll('.crosshair-option').forEach(opt => {
        const isActive = opt.dataset.ch === settings.crosshair;
        opt.classList.toggle('active', isActive);
        // Add visual border for active state handled by CSS
    });

    const elScale = document.getElementById('setting-scale');
    if (elScale) {
        elScale.value = settings.crosshairScale;
        const val = document.getElementById('scale-value');
        if(val) val.innerText = settings.crosshairScale + 'x';
    }
}

// Update the preview canvas in settings modal
function updateCrosshairPreview() {
    const canvas = document.getElementById('crosshair-preview-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    // Handle Retina displays or CSS scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    
    ctx.resetTransform(); 
    ctx.scale(2, 2);
    
    // Draw bg
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Center
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    
    // Draw
    if (typeof drawCrosshairAt === 'function') {
        drawCrosshairAt(ctx, cx, cy, settings.crosshair, settings.crosshairScale);
    }
}

// Initial Load
loadSettings();