// ==================== GAME ENGINE ====================
// Core game loop, input handling, state management

// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let canvasWidth, canvasHeight;

// Game state
let currentMode = 1;
let currentDifficulty = 'medium';
let gamePhase = 'waiting';  // waiting, countdown, playing, paused, ended

// Score tracking
let score = 0, hits = 0, misses = 0, shots = 0;
let reactionTimes = [];
let timeLeft = 60;
let lastFrameTime = 0;
let gameStartTime = 0;

// Mouse state (with sensitivity)
let rawMx = 0, rawMy = 0;
let mx = 0, my = 0;
let lastMx = 0, lastMy = 0;

// Target state
let target = {
    x: 0, y: 0,
    type: 0,              // 0=enemy, 1=friend
    spawnTime: 0,
    trackProgress: 0,
    vx: 0, vy: 0,
    contrast: 1.0,        // For adaptive contrast
    // After-gaze
    deadX: 0, deadY: 0, deadTime: 0,
    afterGazeActive: false
};

// Target history for ratio management
let targetHistory = [];

// Penalty state
let penaltyActive = false;
let penaltyEndTime = 0;

// Right-click prevention flag
let rightClickBlocked = false;

// Resize handler
function resize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Regenerate chaos noise on resize
    if (settings.visualNoise === 'chaos') {
        chaosNoiseGenerated = false;
    }
}
window.addEventListener('resize', resize);
resize();

// Mouse movement with sensitivity
document.addEventListener('mousemove', e => {
    rawMx = e.clientX;
    rawMy = e.clientY;
    
    // Apply sensitivity (relative to center)
    if (gamePhase === 'playing') {
        const sens = settings.sensitivity;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        // Calculate delta from last position
        const dx = (e.clientX - lastMx) * sens;
        const dy = (e.clientY - lastMy) * sens;
        
        mx = Math.max(0, Math.min(canvasWidth, mx + dx));
        my = Math.max(0, Math.min(canvasHeight, my + dy));
    } else {
        mx = rawMx;
        my = rawMy;
    }
    
    lastMx = e.clientX;
    lastMy = e.clientY;
});

// Left click handler
document.addEventListener('mousedown', e => {
    if (e.button !== 0) return;  // Left click only
    
    if (gamePhase === 'waiting') {
        startCountdown();
        return;
    }
    
    if (gamePhase !== 'playing' || penaltyActive || target.afterGazeActive) return;
    
    shots++;
    const dist = Math.hypot(mx - target.x, my - target.y);
    
    if (currentMode === 1) {
        handleMode1Click(dist);
    } else if (currentMode === 2) {
        handleMode2Click(dist);
    } else if (currentMode === 3) {
        handleMode3Click(dist);
    }
    
    updateHUD();
});

// Right-click prevention during game
document.addEventListener('contextmenu', e => {
    if (rightClickBlocked) {
        e.preventDefault();
        return false;
    }
});

// Keyboard handler
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (gamePhase === 'playing') {
            pauseGame();
        } else if (gamePhase === 'paused') {
            resumeGame();
        }
    }
});

// Update HUD display
function updateHUD() {
    document.getElementById('hud-score').innerText = score;
    const acc = shots > 0 ? Math.round((hits / shots) * 100) : 0;
    document.getElementById('hud-accuracy').innerText = acc + '%';
    
    // Update contrast display for Mode 1
    if (currentMode === 1 && settings.adaptiveContrast) {
        const contrastPercent = Math.round(target.contrast * 100);
        document.getElementById('hud-contrast').innerText = contrastPercent + '%';
    }
}

// ==================== GAME LOOP ====================
function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    
    let dt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Clamp delta time to prevent physics glitches
    if (dt > 50) dt = 16.67;
    
    if (gamePhase === 'playing') {
        const elapsed = (timestamp - gameStartTime) / 1000;
        timeLeft = Math.max(0, 60 - elapsed);
        document.getElementById('hud-time').innerText = Math.ceil(timeLeft);
        
        if (timeLeft <= 0) {
            endGame();
            return;
        }
        
        update(timestamp, dt);
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(timestamp, dt) {
    // Handle penalty timeout
    if (penaltyActive && timestamp > penaltyEndTime) {
        penaltyActive = false;
        // Mode 3: don't respawn on penalty
        if (currentMode !== 3) {
            spawnTarget();
        }
    }
    
    if (penaltyActive) return;
    
    // After-gaze hold logic
    if (target.afterGazeActive) {
        const elapsed = timestamp - target.deadTime;
        const dist = Math.hypot(mx - target.deadX, my - target.deadY);
        
        if (dist > 50) {
            target.afterGazeActive = false;
            score -= 1;
            misses++;
            triggerPenalty('BROKE GAZE');
            return;
        }
        
        if (elapsed >= CFG.afterGazeTime) {
            completeKill();
        }
        return;
    }
    
    // Mode 1: Target timeout
    if (currentMode === 1 && target.spawnTime > 0) {
        const elapsed = timestamp - target.spawnTime;
        
        if (target.type === 1) {  // Friend
            if (elapsed >= CFG.friendTimeout) {
                score += 1;
                hits++;
                spawnTarget();
                updateHUD();
            }
        } else {  // Enemy
            if (elapsed >= CFG.enemyTimeout) {
                score -= 1;
                misses++;
                
                // Adaptive contrast: make easier after timeout
                if (settings.adaptiveContrast) {
                    target.contrast = Math.min(1.0, target.contrast + CFG.gabor.stepUp);
                }
                
                showFeedback('TOO SLOW', 'warn');
                spawnTarget();
                updateHUD();
            }
        }
    }
    
    // Mode 2 & 3: Movement and tracking
    if (currentMode === 2 || currentMode === 3) {
        const timeScale = dt / 16.67;
        
        target.x += target.vx * timeScale;
        target.y += target.vy * timeScale;
        
        // Boundary bounce
        const pad = 80;
        if (target.x < pad) {
            target.x = pad;
            target.vx = Math.abs(target.vx);
        } else if (target.x > canvasWidth - pad) {
            target.x = canvasWidth - pad;
            target.vx = -Math.abs(target.vx);
        }
        if (target.y < pad) {
            target.y = pad;
            target.vy = Math.abs(target.vy);
        } else if (target.y > canvasHeight - pad) {
            target.y = canvasHeight - pad;
            target.vy = -Math.abs(target.vy);
        }
        
        // Mode 2: Lock tracking
        if (currentMode === 2) {
            const dist = Math.hypot(mx - target.x, my - target.y);
            const trackTime = CFG.mode2[currentDifficulty].trackTime;
            const wasLocked = target.trackProgress >= 1;
            
            if (dist < 35) {
                target.trackProgress = Math.min(1, target.trackProgress + (16.6 / trackTime) * timeScale);
            } else {
                target.trackProgress = Math.max(0, target.trackProgress - 0.03 * timeScale);
            }
            
            if (!wasLocked && target.trackProgress >= 1) {
                playSound('lock');
            }
        }
    }
}

// Render frame
function render() {
    // Draw background
    drawBackground(ctx, canvasWidth, canvasHeight);
    
    // Draw dynamic noise overlay (Mode 1 only)
    if (currentMode === 1) {
        drawDynamicNoise(ctx, canvasWidth, canvasHeight);
    }
    
    // Draw target
    if (gamePhase === 'playing' && !penaltyActive) {
        if (target.afterGazeActive) {
            drawAfterGaze(ctx);
        } else if (currentMode === 1) {
            drawGaborTarget(ctx);
        } else if (currentMode === 2) {
            drawTrackingTarget(ctx);
        } else if (currentMode === 3) {
            drawSurgicalTarget(ctx);
        }
    }
    
    // Draw crosshair
    drawCrosshair(ctx, mx, my);
}

// ==================== GAME FLOW ====================
function startGame(mode, difficulty = 'medium') {
    hideDifficultyModal();
    currentMode = mode;
    currentDifficulty = difficulty;
    
    // Set body class for mode-specific styling
    document.body.className = 'mode-' + mode;
    
    showScreen('game-screen');
    
    // Reset state
    score = 0;
    hits = 0;
    misses = 0;
    shots = 0;
    reactionTimes = [];
    timeLeft = 60;
    penaltyActive = false;
    target.afterGazeActive = false;
    target.contrast = CFG.gabor.startContrast;
    targetHistory = [];
    lastFrameTime = 0;
    
    // Block right-click during game
    rightClickBlocked = true;
    
    // Reset mouse position
    mx = canvasWidth / 2;
    my = canvasHeight / 2;
    lastMx = rawMx;
    lastMy = rawMy;
    
    // Update CFG with current settings for Mode 3
    CFG.surgical.coreSize = settings.coreSize;
    CFG.surgical.penaltySize = settings.penaltySize;
    
    // Show waiting screen
    gamePhase = 'waiting';
    document.getElementById('countdown-overlay').classList.remove('hidden');
    document.getElementById('click-prompt').style.display = 'block';
    document.getElementById('countdown-text').style.display = 'none';
    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('quit-confirm').classList.add('hidden');
    
    // Show/hide contrast HUD
    document.getElementById('hud-contrast-container').style.display = 
        (mode === 1 && settings.adaptiveContrast) ? 'block' : 'none';
    
    updateHUD();
    requestAnimationFrame(gameLoop);
}

function startCountdown() {
    gamePhase = 'countdown';
    initAudio();
    
    document.getElementById('click-prompt').style.display = 'none';
    document.getElementById('countdown-text').style.display = 'block';
    
    let count = 3;
    const countEl = document.getElementById('countdown-text');
    
    function tick() {
        if (count > 0) {
            countEl.innerText = count;
            countEl.style.animation = 'none';
            countEl.offsetHeight;  // Trigger reflow
            countEl.style.animation = 'countPulse 1s ease-out';
            count--;
            setTimeout(tick, 1000);
        } else {
            document.getElementById('countdown-overlay').classList.add('hidden');
            gamePhase = 'playing';
            gameStartTime = performance.now();
            spawnTarget();
        }
    }
    
    tick();
}

function pauseGame() {
    if (gamePhase !== 'playing') return;
    gamePhase = 'paused';
    document.getElementById('pause-modal').classList.remove('hidden');
}

function resumeGame() {
    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('quit-confirm').classList.add('hidden');
    
    const pauseDuration = performance.now() - (gameStartTime + (60 - timeLeft) * 1000);
    gameStartTime += pauseDuration;
    lastFrameTime = performance.now();
    
    gamePhase = 'playing';
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
    gamePhase = 'ended';
    rightClickBlocked = false;
    document.body.className = '';
    showScreen('menu-screen');
}

function endGame() {
    gamePhase = 'ended';
    rightClickBlocked = false;
    document.body.className = '';
    
    const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;
    const avgRT = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
    
    // Save session
    addSession(currentMode, currentDifficulty, {
        score,
        hits,
        misses,
        shots,
        accuracy,
        avgRT,
        reactionTimes: reactionTimes.slice(),
        finalContrast: currentMode === 1 ? target.contrast : null
    });
    
    showResults(score, hits, misses, accuracy, avgRT);
}

function restartGame() {
    startGame(currentMode, currentDifficulty);
}

function showResults(finalScore, finalHits, finalMisses, accuracy, avgRT) {
    document.getElementById('result-score').innerText = finalScore;
    document.getElementById('result-hits').innerText = finalHits;
    document.getElementById('result-misses').innerText = finalMisses;
    document.getElementById('result-accuracy').innerText = accuracy + '%';
    document.getElementById('result-avgrt').innerText = avgRT || '--';
    
    drawResultChart();
    showScreen('result-screen');
}

function drawResultChart() {
    const canvas = document.getElementById('result-chart-canvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    const data = loadData();
    let key;
    if (currentMode === 1) key = 'mode1';
    else if (currentMode === 2) key = 'mode2_' + currentDifficulty;
    else if (currentMode === 3) key = 'mode3';
    
    const sessions = data[key] || [];
    const recent = sessions.slice(-10);
    
    if (recent.length < 2) {
        ctx.fillStyle = '#333';
        ctx.font = '12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('Need more sessions for chart', rect.width / 2, rect.height / 2);
        return;
    }
    
    const scores = recent.map(s => s.score);
    const maxScore = Math.max(...scores, 10);
    
    const padding = { top: 30, right: 20, bottom: 30, left: 40 };
    const chartW = rect.width - padding.left - padding.right;
    const chartH = rect.height - padding.top - padding.bottom;
    
    // Grid lines
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(rect.width - padding.right, y);
        ctx.stroke();
    }
    
    // Line chart
    ctx.beginPath();
    ctx.strokeStyle = '#00d9ff';
    ctx.lineWidth = 2;
    
    scores.forEach((s, i) => {
        const x = padding.left + (chartW / (scores.length - 1)) * i;
        const y = padding.top + chartH - (s / maxScore) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Points
    scores.forEach((s, i) => {
        const x = padding.left + (chartW / (scores.length - 1)) * i;
        const y = padding.top + chartH - (s / maxScore) * chartH;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = i === scores.length - 1 ? '#00ff99' : '#00d9ff';
        ctx.fill();
    });
    
    // Labels
    ctx.fillStyle = '#555';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(maxScore, padding.left - 10, padding.top + 5);
    ctx.fillText('0', padding.left - 10, padding.top + chartH + 5);
}
