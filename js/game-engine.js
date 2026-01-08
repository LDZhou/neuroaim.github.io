// ==================== GAME ENGINE ====================
// Core game loop, input handling, state management
// UPDATED: Mode 3 uses spawnMode3Target

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// GLOBAL STATE
window.canvasWidth = window.innerWidth;
window.canvasHeight = window.innerHeight;
window.gamePhase = 'waiting'; 
window.mouseX = 0;
window.mouseY = 0;
window.target = null;
window.gazeBreaks = 0; // Track gaze breaks for stats

// Internals - GLOBAL for cross-file access
var currentMode = 1;
var currentDifficulty = 'medium';
var score = 0, hits = 0, misses = 0, shots = 0;
var reactionTimes = [];
var timeLeft = 0;
var gameStartTime = 0;
var lastFrameTime = 0;

function initGame() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    try {
        if (typeof loadStats === 'function') loadStats();
        if (typeof loadSettings === 'function') loadSettings();
        if (typeof NoiseSystem !== 'undefined') NoiseSystem.init(window.canvasWidth, window.canvasHeight);
    } catch(e) {
        console.error("Init warning:", e);
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    window.canvasWidth = window.innerWidth;
    window.canvasHeight = window.innerHeight;
    canvas.width = window.canvasWidth;
    canvas.height = window.canvasHeight;
    
    if (typeof NoiseSystem !== 'undefined') {
        NoiseSystem.init(window.canvasWidth, window.canvasHeight);
    }
}

function startGame(mode, difficulty) {
    if (typeof showScreen === 'function') showScreen('game-screen');
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.classList.add('hidden');

    currentMode = mode;
    currentDifficulty = difficulty;
    
    // Reset Globals
    score = 0; hits = 0; misses = 0; shots = 0; reactionTimes = [];
    window.gazeBreaks = 0;
    window.gamePhase = 'waiting';
    
    // Auto Noise & Speed
    let autoNoiseLevel = 1;
    let noiseSpeedScale = 1.0;

    if (mode === 1) {
        if (difficulty === 'easy') { autoNoiseLevel = 3; noiseSpeedScale = 1.0; }
        else if (difficulty === 'medium') { autoNoiseLevel = 3; noiseSpeedScale = 1.6; }
        else if (difficulty === 'hard') { autoNoiseLevel = 4; noiseSpeedScale = 1.6; }
    } else if (mode === 2) {
        autoNoiseLevel = 1; noiseSpeedScale = 1.0;
    } else if (mode === 3) {
        if (difficulty === 'easy') autoNoiseLevel = 1;
        else if (difficulty === 'medium') autoNoiseLevel = 2; 
        else if (difficulty === 'hard') autoNoiseLevel = 4; 
    } else if (mode === 4) {
        if (difficulty === 'easy') autoNoiseLevel = 0;
        else if (difficulty === 'medium') autoNoiseLevel = 1;
        else if (difficulty === 'hard') autoNoiseLevel = 2;
    }

    if (typeof settings !== 'undefined') settings.noiseLevel = autoNoiseLevel;
    if (typeof NoiseSystem !== 'undefined') {
        NoiseSystem.setSpeedScale(noiseSpeedScale);
        NoiseSystem.regenerate();
    }
    
    if (mode === 2) timeLeft = CFG.mode2.trackTime;
    else timeLeft = 60; 
    
    updateScoreDisplay();
    
    window.gamePhase = 'countdown';
    startCountdown(3, () => {
        window.gamePhase = 'playing';
        gameStartTime = performance.now();
        lastFrameTime = performance.now(); 
        
        // Mode Specific Init
        if (mode === 4 && typeof initMode4 === 'function') initMode4();
        else if (mode === 3 && typeof spawnMode3Target === 'function') spawnMode3Target();
        else if (mode === 2 && typeof initMode2Target === 'function') initMode2Target();
        else spawnTarget();
    });
}

function startCountdown(seconds, callback) {
    let count = seconds;
    const overlay = document.getElementById('countdown-overlay');
    const clickPrompt = document.getElementById('click-prompt');
    const countText = document.getElementById('countdown-text');
    
    if(overlay) overlay.style.display = 'flex';
    if(clickPrompt) clickPrompt.style.display = 'none';
    if(countText) {
        countText.style.display = 'block';
        countText.innerText = count;
        countText.style.color = '#00d9ff';
    }
    
    playSound('click');
    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            if(countText) countText.innerText = count;
            playSound('click');
        } else {
            clearInterval(timer);
            if(overlay) overlay.style.display = 'none';
            callback();
        }
    }, 1000);
}

function endGame() {
    window.gamePhase = 'ended';
    playSound('click');
    
    try {
        const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;
        const avgRt = reactionTimes.length > 0 
            ? Math.round(reactionTimes.reduce((a,b) => a+b, 0) / reactionTimes.length) 
            : 0;
        
        // Calculate additional stats
        const minRt = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;
        const maxRt = reactionTimes.length > 0 ? Math.max(...reactionTimes) : 0;
        
        // Reaction time consistency (standard deviation)
        let rtStdDev = 0;
        if (reactionTimes.length > 1) {
            const mean = avgRt;
            const squaredDiffs = reactionTimes.map(rt => Math.pow(rt - mean, 2));
            rtStdDev = Math.round(Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / reactionTimes.length));
        }
            
        if (typeof saveGameStats === 'function') {
            saveGameStats({
                mode: currentMode,
                difficulty: currentDifficulty,
                score: score,
                accuracy: accuracy,
                avgRt: avgRt,
                minRt: Math.round(minRt),
                maxRt: Math.round(maxRt),
                rtStdDev: rtStdDev,
                hits: hits,
                misses: misses,
                shots: shots,
                gazeBreaks: window.gazeBreaks || 0,
                reactionTimes: reactionTimes.slice(0, 50), // Store first 50 for analysis
                timestamp: Date.now()
            });
        }
        
        if (typeof showResults === 'function') {
            showResults({ 
                score, 
                accuracy, 
                avgRt, 
                hits, 
                misses,
                minRt: Math.round(minRt),
                maxRt: Math.round(maxRt),
                rtStdDev
            });
        }
    } catch(e) {
        console.error("CRITICAL: Error in endGame", e);
        if (typeof showScreen === 'function') showScreen('result-screen');
    }
}

function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    let dt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    if (dt > 100) dt = 16.67; 
    
    if (window.gamePhase === 'playing') {
        timeLeft -= dt / 1000;
        const timeEl = document.getElementById('hud-time');
        if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(timeLeft));
        
        if (timeLeft <= 0) {
            endGame();
        } else {
            if (typeof NoiseSystem !== 'undefined') NoiseSystem.update(dt);
            
            if (currentMode === 1 && typeof updateMode1 === 'function') updateMode1(timestamp, dt);
            else if (currentMode === 2 && typeof updateMode2 === 'function') updateMode2(timestamp, dt);
            else if (currentMode === 3 && typeof updateMode3 === 'function') updateMode3(timestamp, dt);
            else if (currentMode === 4 && typeof updateMode4 === 'function') updateMode4(timestamp, dt);
        }
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

function render() {
    if (typeof drawBackground === 'function') {
        drawBackground(ctx, window.canvasWidth, window.canvasHeight);
        
        if (window.gamePhase === 'playing' && window.target) {
            if (currentMode === 1) drawGaborTarget(ctx);
            else if (currentMode === 2) drawTrackingTarget(ctx);
            else if (currentMode === 3) drawSurgicalTarget(ctx);
            else if (currentMode === 4) drawLandoltTarget(ctx);
            
            // Draw afterGaze indicator for Mode 2
            if (currentMode === 2 && typeof mode2AfterGazeState !== 'undefined' && mode2AfterGazeState) {
                drawMode2AfterGaze(ctx);
            }
        }
        
        if (typeof drawNoiseLayer === 'function') drawNoiseLayer(ctx);
        drawCrosshair(ctx, window.mouseX, window.mouseY);
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    window.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    window.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
}

function handleMouseDown(e) {
    if (window.gamePhase !== 'playing') return;
    if (e.button !== 0) return; 
    
    const t = window.target;
    if (!t) return;

    // Shot counting (Exclude reset clicks in Mode 4)
    if (currentMode !== 4 || (currentMode === 4 && !t.isResetPoint)) {
        shots++;
    }
    
    const dx = window.mouseX - t.x;
    const dy = window.mouseY - t.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (currentMode === 1) handleMode1Click(dist);
    else if (currentMode === 2) handleMode2Click(dist);
    else if (currentMode === 3) handleMode3Click(dist);
    else if (currentMode === 4) handleMode4Click(dist);
    
    updateScoreDisplay();
}

function updateScoreDisplay() {
    const elScore = document.getElementById('hud-score');
    if(elScore) elScore.innerText = score;
    const acc = shots > 0 ? Math.round((hits / shots) * 100) : 100;
    const elAcc = document.getElementById('hud-accuracy');
    if(elAcc) elAcc.innerText = acc + '%';
}