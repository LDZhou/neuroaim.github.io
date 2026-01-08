// ==================== UI FUNCTIONS ====================
// Screen management, modals, and UI interactions

// Screen transitions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'stats-screen') {
        updateStatsDisplay();
    }
}

// Mode 2 difficulty modal
function showMode2Difficulty() {
    document.getElementById('difficulty-modal').classList.remove('hidden');
}

function hideDifficultyModal() {
    document.getElementById('difficulty-modal').classList.add('hidden');
}

// Mode info modal
function showModeInfo(mode) {
    const info = MODE_INFO[mode];
    if (!info) return;
    
    let html = `<h2>${info.title}</h2>`;
    
    html += `<div class="info-section">
        <h4>HOW TO PLAY</h4>
        <ul>${info.howTo.map(h => `<li>${h}</li>`).join('')}</ul>
    </div>`;
    
    html += `<div class="info-section">
        <h4>WHAT IT IMPROVES</h4>
        <ul>${info.improves.map(i => `<li>${i}</li>`).join('')}</ul>
    </div>`;
    
    html += `<div class="info-section">
        <h4>THE SCIENCE</h4>
        <p>${info.science}</p>
    </div>`;
    
    html += `<button class="info-close" onclick="closeInfoModal()">CLOSE</button>`;
    
    document.getElementById('info-content').innerHTML = html;
    document.getElementById('info-modal').classList.remove('hidden');
}

function closeInfoModal() {
    document.getElementById('info-modal').classList.add('hidden');
}

// Settings modal
function showSettings() {
    updateSettingsUI();
    updateCrosshairPreview();
    updateNoisePreview();
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    saveSettings();
    document.getElementById('settings-modal').classList.add('hidden');
}

// Close modals on background click
document.addEventListener('click', e => {
    if (e.target.classList.contains('info-modal')) {
        closeInfoModal();
    }
    if (e.target.classList.contains('difficulty-modal')) {
        hideDifficultyModal();
    }
});

// Close modals on Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (!document.getElementById('info-modal').classList.contains('hidden')) {
            closeInfoModal();
        }
        if (!document.getElementById('difficulty-modal').classList.contains('hidden')) {
            hideDifficultyModal();
        }
        if (!document.getElementById('settings-modal').classList.contains('hidden')) {
            closeSettings();
        }
    }
});
