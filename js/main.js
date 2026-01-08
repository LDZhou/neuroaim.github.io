// ==================== MAIN INITIALIZATION ====================
// Entry point and initialization

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    loadSettings();
    
    // Apply Mode 3 settings from storage
    CFG.surgical.coreSize = settings.coreSize;
    CFG.surgical.penaltySize = settings.penaltySize;
    
    // Show menu
    showScreen('menu-screen');
    
    console.log('Neuro-Aim v2.0 initialized');
    console.log('Modular architecture loaded');
});

// Prevent accidental navigation
window.addEventListener('beforeunload', e => {
    if (gamePhase === 'playing') {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Debug helpers (remove in production)
window.debug = {
    getSettings: () => settings,
    getData: () => loadData(),
    getTarget: () => target,
    forceContrast: (val) => { target.contrast = val; },
    skipTo: (seconds) => {
        if (gamePhase === 'playing') {
            gameStartTime = performance.now() - (60 - seconds) * 1000;
        }
    }
};
