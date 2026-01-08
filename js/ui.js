// ==================== UI FUNCTIONS ====================
// Screen management, modals, interactions
// UPDATED: No difficulty selection, strobe toggle in settings

// ===== SCREEN TRANSITIONS =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    
    if (screenId === 'stats-screen' && typeof updateStatsDisplay === 'function') {
        updateStatsDisplay();
    }
}

// ===== MODE INFO MODAL =====
function showModeInfo(mode) {
    if (typeof MODE_INFO === 'undefined') return;
    const info = MODE_INFO[mode];
    if (!info) return;
    
    let html = `<h2>${info.title}</h2>`;
    html += `<div class="info-section"><h4>HOW TO PLAY</h4><ul>${info.howTo.map(h => `<li>${h}</li>`).join('')}</ul></div>`;
    html += `<div class="info-section"><h4>NEURAL TARGETS</h4><ul>${info.improves.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
    html += `<div class="info-section"><h4>THE SCIENCE</h4><p>${info.science}</p></div>`;
    html += `<button class="info-close" onclick="closeInfoModal()">CLOSE</button>`;
    
    document.getElementById('info-content').innerHTML = html;
    document.getElementById('info-modal').classList.remove('hidden');
}

function closeInfoModal() {
    document.getElementById('info-modal').classList.add('hidden');
}

// ===== SETTINGS MODAL =====
function showSettings() {
    if (typeof updateSettingsUI === 'function') updateSettingsUI();
    if (typeof updateCrosshairPreview === 'function') updateCrosshairPreview();
    updateStrobeToggles();
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    if (typeof saveSettings === 'function') saveSettings();
    document.getElementById('settings-modal').classList.add('hidden');
}

function updateStrobeToggles() {
    for (let mode = 1; mode <= 7; mode++) {
        const el = document.getElementById(`strobe-mode-${mode}`);
        if (el && settings.strobeEnabled) {
            el.checked = settings.strobeEnabled[mode] || false;
        }
    }
}

function toggleModeStrobe(mode, enabled) {
    if (typeof toggleStrobe === 'function') {
        toggleStrobe(mode, enabled);
    }
}

// ===== RESULT SCREEN =====
function showResults(stats) {
    document.getElementById('result-mode').innerText = MODE_NAMES[stats.mode] || 'Unknown';
    document.getElementById('result-strobe').innerText = stats.strobe ? 'STROBE ON' : 'NORMAL';
    document.getElementById('result-strobe').className = stats.strobe ? 'strobe-badge active' : 'strobe-badge';
    
    document.getElementById('result-accuracy').innerText = stats.accuracy + '%';
    document.getElementById('result-avgrt').innerText = stats.avgRt + ' ms';
    document.getElementById('result-trials').innerText = stats.hits + ' / ' + stats.trials;
    
    const diffChange = stats.endDifficulty - stats.startDifficulty;
    const diffEl = document.getElementById('result-difficulty');
    diffEl.innerText = Math.round(stats.endDifficulty * 100) + '%';
    
    const changeEl = document.getElementById('result-diff-change');
    changeEl.innerText = (diffChange >= 0 ? '+' : '') + Math.round(diffChange * 100) + '%';
    changeEl.className = 'diff-change ' + (diffChange > 0 ? 'positive' : diffChange < 0 ? 'negative' : '');
    
    // Mini stats
    document.getElementById('result-minrt').innerText = stats.minRt + 'ms';
    document.getElementById('result-maxrt').innerText = stats.maxRt + 'ms';
    document.getElementById('result-consistency').innerText = '±' + stats.rtStdDev + 'ms';
    
    showScreen('result-screen');
}

function restartGame() {
    if (typeof startGame === 'function' && typeof currentMode !== 'undefined') {
        startGame(currentMode);
    } else {
        showScreen('menu-screen');
    }
}

// ===== PAUSE / RESUME =====
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

// ===== EVENT LISTENERS =====
document.addEventListener('click', e => {
    if (e.target.classList.contains('info-modal')) closeInfoModal();
    if (e.target.classList.contains('settings-modal')) closeSettings();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (!document.getElementById('info-modal').classList.contains('hidden')) {
            closeInfoModal();
        } else if (!document.getElementById('settings-modal').classList.contains('hidden')) {
            closeSettings();
        } else if (document.getElementById('game-screen').classList.contains('active')) {
            togglePause();
        }
    }
});

// MODE_NAMES is defined in stats.js