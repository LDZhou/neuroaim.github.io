// ==================== MAIN INITIALIZATION ====================
// Entry point

document.addEventListener('DOMContentLoaded', () => {
    console.log("Neuro-Aim v3: System Boot...");
    console.log("7 Modes | Adaptive Difficulty | Strobe Toggle");

    // 1. Load Settings first (must exist before other modules use it)
    if (typeof loadSettings === 'function') {
        loadSettings();
        console.log("Settings loaded");
    } else {
        console.warn("loadSettings not found, using defaults");
    }

    // 2. Initialize Game Engine
    if (typeof initGame === 'function') {
        initGame();
        console.log("Game initialized");
    } else {
        console.error("initGame not found!");
    }

    // 3. Sync UI
    if (typeof updateSettingsUI === 'function') {
        updateSettingsUI();
    }
    if (typeof updateCrosshairPreview === 'function') {
        updateCrosshairPreview();
    }

    console.log("Neuro-Aim: Systems Ready.");
});