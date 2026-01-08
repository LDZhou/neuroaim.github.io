// ==================== SETTINGS MANAGEMENT ====================
// Handles all user preferences and persistence

const DEFAULT_SETTINGS = {
    // Mouse
    sensitivity: 1.0,
    
    // Mode 1 specific
    showRedDot: false,           // Default OFF for pure training
    adaptiveContrast: true,      // Enable staircase method
    dynamicNoise: true,          // Enable pink noise overlay
    
    // Mode 3 specific
    coreSize: 3,
    penaltySize: 35,
    
    // After-gaze hold per mode
    afterGazeMode1: true,
    afterGazeMode2: true,
    afterGazeMode3: false,       // Mode 3 doesn't need it by default
    
    // Visual
    visualNoise: 'grid',         // clean, grid, chaos
    crosshair: 'cross',
    crosshairScale: 1.0,
    
    // Audio
    soundEnabled: true,
    volume: 0.5
};

let settings = { ...DEFAULT_SETTINGS };

// Load settings from localStorage
function loadSettings() {
    try {
        const saved = localStorage.getItem('neuroaim_settings');
        if (saved) {
            settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
    } catch(e) {
        console.warn('Failed to load settings:', e);
    }
}

// Save settings to localStorage
function saveSettings() {
    try {
        localStorage.setItem('neuroaim_settings', JSON.stringify(settings));
    } catch(e) {
        console.warn('Failed to save settings:', e);
    }
}

// Update a single setting
function updateSetting(key, value) {
    settings[key] = value;
    saveSettings();
    
    // Trigger any necessary updates
    if (key === 'visualNoise' && value === 'chaos') {
        chaosNoiseGenerated = false;
    }
}

// Sensitivity control
function updateSensitivity(value) {
    settings.sensitivity = parseFloat(value);
    document.getElementById('sensitivity-value').innerText = value + 'x';
    saveSettings();
}

// Core size for Mode 3
function updateCoreSizeSetting(value) {
    settings.coreSize = parseInt(value);
    CFG.surgical.coreSize = settings.coreSize;
    document.getElementById('coreSize-value').innerText = value + 'px';
    saveSettings();
}

// Penalty size for Mode 3
function updatePenaltySizeSetting(value) {
    settings.penaltySize = parseInt(value);
    CFG.surgical.penaltySize = settings.penaltySize;
    document.getElementById('penaltySize-value').innerText = value + 'px';
    saveSettings();
}

// Crosshair scale
function updateCrosshairScale(value) {
    settings.crosshairScale = parseFloat(value);
    document.getElementById('scale-value').innerText = value + 'x';
    saveSettings();
    updateCrosshairPreview();
}

// Volume control
function updateVolume(value) {
    settings.volume = parseFloat(value);
    document.getElementById('volume-value').innerText = Math.round(value * 100) + '%';
    saveSettings();
}

// Visual noise type
function setVisualNoise(value) {
    settings.visualNoise = value;
    saveSettings();
    updateSettingsUI();
    updateNoisePreview();
    if (value === 'chaos') {
        chaosNoiseGenerated = false;
    }
}

// Crosshair type
function setCrosshair(value) {
    settings.crosshair = value;
    saveSettings();
    updateSettingsUI();
    updateCrosshairPreview();
}

// Reset to defaults
function resetSettings() {
    settings = { ...DEFAULT_SETTINGS };
    saveSettings();
    updateSettingsUI();
    updateCrosshairPreview();
    updateNoisePreview();
}

// Update UI to reflect current settings
function updateSettingsUI() {
    // Sensitivity
    document.getElementById('setting-sensitivity').value = settings.sensitivity;
    document.getElementById('sensitivity-value').innerText = settings.sensitivity + 'x';
    
    // Mode 1
    document.getElementById('setting-redDot').checked = settings.showRedDot;
    document.getElementById('setting-adaptiveContrast').checked = settings.adaptiveContrast;
    document.getElementById('setting-dynamicNoise').checked = settings.dynamicNoise;
    
    // Mode 3
    document.getElementById('setting-coreSize').value = settings.coreSize;
    document.getElementById('coreSize-value').innerText = settings.coreSize + 'px';
    document.getElementById('setting-penaltySize').value = settings.penaltySize;
    document.getElementById('penaltySize-value').innerText = settings.penaltySize + 'px';
    
    // After-gaze
    document.getElementById('setting-afterGaze1').checked = settings.afterGazeMode1;
    document.getElementById('setting-afterGaze2').checked = settings.afterGazeMode2;
    document.getElementById('setting-afterGaze3').checked = settings.afterGazeMode3;
    
    // Crosshair
    document.getElementById('setting-scale').value = settings.crosshairScale;
    document.getElementById('scale-value').innerText = settings.crosshairScale + 'x';
    
    // Audio
    document.getElementById('setting-soundEnabled').checked = settings.soundEnabled;
    document.getElementById('setting-volume').value = settings.volume;
    document.getElementById('volume-value').innerText = Math.round(settings.volume * 100) + '%';
    
    // Radio options (visual noise)
    document.querySelectorAll('.radio-option').forEach(opt => {
        const title = opt.querySelector('.radio-title');
        if (title) {
            const isActive = title.innerText.toLowerCase() === settings.visualNoise;
            opt.classList.toggle('active', isActive);
        }
    });
    
    // Crosshair options
    document.querySelectorAll('.crosshair-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.ch === settings.crosshair);
    });
}

// Crosshair preview canvas
function updateCrosshairPreview() {
    const canvas = document.getElementById('crosshair-preview-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    
    drawCrosshairAt(ctx, cx, cy, settings.crosshair, settings.crosshairScale);
}

// Noise preview canvas
function updateNoisePreview() {
    const canvas = document.getElementById('noise-preview-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    const w = rect.width;
    const h = rect.height;
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);
    
    if (settings.visualNoise === 'grid') {
        ctx.strokeStyle = '#0f0f18';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < w; i += 40) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
        }
        for (let i = 0; i < h; i += 40) {
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
        }
        ctx.stroke();
    } else if (settings.visualNoise === 'chaos') {
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const brightness = Math.random() * 80 + 40;
            ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},${Math.random() * 0.2 + 0.05})`;
            ctx.fillRect(x, y, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
        }
    }
    
    // Draw sample Gabor in center
    const cx = w / 2;
    const cy = h / 2;
    const size = 25;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
    
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    for (let i = -size; i < size; i += 5) {
        ctx.beginPath();
        ctx.moveTo(cx + i, cy - size);
        ctx.lineTo(cx + i, cy + size);
        ctx.stroke();
    }
    
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = g;
    ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
    ctx.restore();
    
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff3366';
    ctx.fill();
}

// Initialize settings on load
loadSettings();
