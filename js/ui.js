// ==================== UI FUNCTIONS ====================
// Screen management, modals, and UI interactions

// Screen transitions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'stats-screen' && typeof updateStatsDisplay === 'function') {
        updateStatsDisplay();
    }
}

function showMode2Difficulty() {
    document.getElementById('difficulty-modal').classList.remove('hidden');
}

function hideDifficultyModal() {
    document.getElementById('difficulty-modal').classList.add('hidden');
}

// Mode info modal
function showModeInfo(mode) {
    if (typeof MODE_INFO === 'undefined') return;
    const info = MODE_INFO[mode];
    if (!info) return;
    
    let html = `<h2>${info.title}</h2>`;
    html += `<div class="info-section"><h4>HOW TO PLAY</h4><ul>${info.howTo.map(h => `<li>${h}</li>`).join('')}</ul></div>`;
    html += `<div class="info-section"><h4>WHAT IT IMPROVES</h4><ul>${info.improves.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
    html += `<div class="info-section"><h4>THE SCIENCE</h4><p>${info.science}</p></div>`;
    html += `<button class="info-close" onclick="closeInfoModal()">CLOSE</button>`;
    
    document.getElementById('info-content').innerHTML = html;
    document.getElementById('info-modal').classList.remove('hidden');
}

function closeInfoModal() {
    document.getElementById('info-modal').classList.add('hidden');
}

// Settings
function showSettings() {
    if (typeof updateSettingsUI === 'function') updateSettingsUI();
    if (typeof updateCrosshairPreview === 'function') updateCrosshairPreview();
    // Noise is internal now, no UI update needed for it
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    if (typeof saveSettings === 'function') saveSettings();
    document.getElementById('settings-modal').classList.add('hidden');
}

// Result Screen
function showResults(stats) {
    document.getElementById('result-score').innerText = stats.score;
    document.getElementById('result-hits').innerText = stats.hits;
    document.getElementById('result-misses').innerText = stats.misses;
    document.getElementById('result-accuracy').innerText = stats.accuracy + '%';
    document.getElementById('result-avgrt').innerText = stats.avgRt + ' ms';
    
    showScreen('result-screen');
}

function restartGame() {
    // Rely on globals from game-engine (currentMode, currentDifficulty)
    // Assuming they are accessible as vars in that scope, or use a window var?
    // Game engine stores them in let variables, so we need to call startGame with params
    // BUT we don't have easy access to them here unless we exposed them or UI stored them.
    // Hack: We can just recall showScreen('menu-screen') for now, OR better:
    // We update startGame to store window.lastMode / window.lastDiff
    if (typeof startGame === 'function' && typeof currentMode !== 'undefined') {
        startGame(currentMode, currentDifficulty); 
    } else {
        // Fallback
        showScreen('menu-screen');
    }
}

// Pause / Resume Logic
function togglePause() {
    if (!document.getElementById('game-screen').classList.contains('active')) return;
    
    const pauseModal = document.getElementById('pause-modal');
    if (window.gamePhase === 'playing') {
        window.gamePhase = 'paused';
        pauseModal.classList.remove('hidden');
    } else if (window.gamePhase === 'paused') {
        window.gamePhase = 'playing';
        pauseModal.classList.add('hidden');
    }
}

function resumeGame() {
    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('quit-confirm').classList.add('hidden');
    window.gamePhase = 'playing';
}

function confirmQuit() {
    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('quit-confirm').classList.remove('hidden');
}

function cancelQuit() {
    document.getElementById('quit-confirm').classList.add('hidden');
    document.getElementById('pause-modal').classList.remove('hidden');
}

function quitGame() {
    document.getElementById('quit-confirm').classList.add('hidden');
    window.gamePhase = 'ended';
    showScreen('menu-screen');
}

// Listeners
document.addEventListener('click', e => {
    if (e.target.classList.contains('info-modal')) closeInfoModal();
    if (e.target.classList.contains('difficulty-modal')) hideDifficultyModal();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (!document.getElementById('info-modal').classList.contains('hidden')) closeInfoModal();
        else if (!document.getElementById('difficulty-modal').classList.contains('hidden')) hideDifficultyModal();
        else if (!document.getElementById('settings-modal').classList.contains('hidden')) closeSettings();
        else if (document.getElementById('game-screen').classList.contains('active')) togglePause();
    }
});