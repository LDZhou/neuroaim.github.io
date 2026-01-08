// ==================== MAIN INITIALIZATION ====================
// Entry point and initialization logic

document.addEventListener('DOMContentLoaded', () => {
    console.log("Neuro-Aim: System Boot...");

    // 1. Load User Settings
    // Retrieves sensitivity, volume, and noise levels from LocalStorage
    loadSettings();

    // 2. Initialize Game Engine
    // Sets up the Canvas size, context, and event listeners
    initGame();

    // 3. Initialize Neuro-Noise System (CRITICAL)
    // Pre-generates the noise textures immediately so there's no lag when game starts
    if (typeof NoiseSystem !== 'undefined') {
        NoiseSystem.init(window.innerWidth, window.innerHeight);
    }

    // 4. Sync UI Elements
    // Updates all sliders (Sensitivity, Volume, Noise Level) to match loaded settings
    updateSettingsUI();

    // 5. Crosshair Preview
    // Draws the initial crosshair in the settings menu
    updateCrosshairPreview();

    // 6. Audio System Hints
    // Note: AudioContext usually resumes on the first user interaction (click),
    // but we prepare the volume level here.
    if (typeof audioCtx !== 'undefined' && typeof settings !== 'undefined') {
        // Pre-set volume var if needed, though ui.js handles the slider
    }

    console.log("Neuro-Aim: Systems Nominal. Ready for protocol.");
});