// ==================== GAME ENGINE ====================
// Core game loop, input handling, adaptive difficulty
// FIXED: Proper state isolation between modes

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// GLOBAL STATE
var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;
var gamePhase = 'waiting'; 
var mouseX = 0;
var mouseY = 0;

// Session tracking
var currentMode = 1;
var currentStrobeEnabled = false;
var currentDifficulty = 0.3;
var hits = 0, misses = 0, trials = 0;
var reactionTimes = [];
var sessionStats = {};
var timeLeft = 0;
var gameStartTime = 0;
var lastFrameTime = 0;

// Adaptive difficulty tracking
var recentResults = [];

function initGame() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    try {
        if (typeof loadStats === 'function') loadStats();
        if (typeof loadSettings === 'function') loadSettings();
        if (typeof NoiseSystem !== 'undefined') NoiseSystem.init(canvasWidth, canvasHeight);
    } catch(e) {
        console.error("Init warning:", e);
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    if (typeof NoiseSystem !== 'undefined') {
        NoiseSystem.init(canvasWidth, canvasHeight);
    }
}

function startGame(mode) {
    if (typeof showScreen === 'function') showScreen('game-screen');

    currentMode = mode;
    currentStrobeEnabled = isStrobeEnabled(mode);
    currentDifficulty = getDifficultyLevel(mode, currentStrobeEnabled);
    
    // Reset ALL mode states first
    clearAllModeStates();
    
    // Reset session stats
    hits = 0; 
    misses = 0; 
    trials = 0; 
    reactionTimes = [];
    recentResults = [];
    sessionStats = {
        mode: mode,
        strobe: currentStrobeEnabled,
        startDifficulty: currentDifficulty,
        gazeBreaks: 0,
        perfectTrials: 0,
        sequenceErrors: 0,
        switchErrors: 0,
        inhibitionSuccess: 0,
        inhibitionFail: 0
    };
    
    if (typeof resetCombo === 'function') resetCombo();
    
    // Setup noise
    setupNoiseForMode(mode, currentDifficulty, currentStrobeEnabled);
    
    timeLeft = CFG.sessionDuration;
    gamePhase = 'countdown';
    
    updateHUD();
    
    startCountdown(3, function() {
        gamePhase = 'playing';
        gameStartTime = performance.now();
        lastFrameTime = performance.now();
        initModeState(mode);
    });
}

function clearAllModeStates() {
    // Clear all mode states to prevent crossover
    mode1State = { target: null };
    mode2State = { target: null, trackProgress: 0, isLocked: false, afterGaze: null };
    mode3State = { target: null };
    mode4State = { phase: 'reset', target: null };
    mode5State = { primary: null, ghost: null, ghostTimer: 0, returnTimer: 0, trackingPrimary: false };
    mode6State = { phase: 'display', sequence: [], currentIndex: 0, displayIndex: 0, displayTimer: 0, delayTimer: 0, spawnTime: 0 };
    mode7State = { rule: 'cold', switchTimer: 0, warningActive: false, targets: [], nextSpawnTimer: 0 };
}

function setupNoiseForMode(mode, difficulty, strobeEnabled) {
    if (typeof NoiseSystem === 'undefined') return;
    
    let noiseLevel = 0;
    if (mode === 1) {
        noiseLevel = Math.floor(1 + difficulty * 3);
    } else {
        noiseLevel = 0;
    }
    
    NoiseSystem.setNoiseLevel(noiseLevel);
    NoiseSystem.setStrobeEnabled(strobeEnabled);
    NoiseSystem.regenerate();
}

function initModeState(mode) {
    switch(mode) {
        case 1: initMode1(); break;
        case 2: initMode2(); break;
        case 3: initMode3(); break;
        case 4: initMode4(); break;
        case 5: initMode5(); break;
        case 6: initMode6(); break;
        case 7: initMode7(); break;
    }
}

function startCountdown(seconds, callback) {
    var count = seconds;
    var overlay = document.getElementById('countdown-overlay');
    var clickPrompt = document.getElementById('click-prompt');
    var countText = document.getElementById('countdown-text');
    
    if(overlay) overlay.style.display = 'flex';
    if(clickPrompt) clickPrompt.style.display = 'none';
    if(countText) {
        countText.style.display = 'block';
        countText.innerText = count;
        countText.style.color = '#00d9ff';
    }
    
    playSound('click');
    var timer = setInterval(function() {
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
    gamePhase = 'ended';
    playSound('click');
    
    setDifficultyLevel(currentMode, currentStrobeEnabled, currentDifficulty);
    
    var accuracy = trials > 0 ? Math.round((hits / trials) * 100) : 0;
    var avgRt = reactionTimes.length > 0 
        ? Math.round(reactionTimes.reduce(function(a,b){return a+b;}, 0) / reactionTimes.length) 
        : 0;
    var minRt = reactionTimes.length > 0 ? Math.round(Math.min.apply(null, reactionTimes)) : 0;
    var maxRt = reactionTimes.length > 0 ? Math.round(Math.max.apply(null, reactionTimes)) : 0;
    
    var rtStdDev = 0;
    if (reactionTimes.length > 1) {
        var mean = avgRt;
        var squaredDiffs = reactionTimes.map(function(rt) { return Math.pow(rt - mean, 2); });
        rtStdDev = Math.round(Math.sqrt(squaredDiffs.reduce(function(a, b) { return a + b; }, 0) / reactionTimes.length));
    }
    
    var finalStats = {
        mode: currentMode,
        strobe: currentStrobeEnabled,
        startDifficulty: sessionStats.startDifficulty,
        endDifficulty: currentDifficulty,
        difficultyChange: currentDifficulty - sessionStats.startDifficulty,
        accuracy: accuracy,
        avgRt: avgRt,
        minRt: minRt,
        maxRt: maxRt,
        rtStdDev: rtStdDev,
        hits: hits,
        misses: misses,
        trials: trials,
        reactionTimes: reactionTimes.slice(0, 50),
        timestamp: Date.now(),
        gazeBreaks: sessionStats.gazeBreaks,
        perfectTrials: sessionStats.perfectTrials,
        sequenceErrors: sessionStats.sequenceErrors,
        switchErrors: sessionStats.switchErrors,
        inhibitionSuccess: sessionStats.inhibitionSuccess,
        inhibitionFail: sessionStats.inhibitionFail
    };
    
    if (typeof saveGameStats === 'function') {
        saveGameStats(finalStats);
    }
    
    if (typeof showResults === 'function') {
        showResults(finalStats);
    }
}

// ===== ADAPTIVE DIFFICULTY SYSTEM =====
function recordTrialResult(success, reactionTime) {
    trials++;
    if (success) hits++;
    else misses++;
    
    if (reactionTime !== undefined && reactionTime !== null) {
        reactionTimes.push(reactionTime);
    }
    
    recentResults.push(success ? 1 : 0);
    if (recentResults.length > CFG.adaptive.windowSize) {
        recentResults.shift();
    }
    
    adjustDifficulty();
    updateHUD();
}

function adjustDifficulty() {
    if (recentResults.length < CFG.adaptive.windowSize) return;
    
    var sum = 0;
    for (var i = 0; i < recentResults.length; i++) sum += recentResults[i];
    var recentAccuracy = sum / recentResults.length;
    
    if (recentAccuracy > CFG.adaptive.targetAccuracy + 0.1) {
        currentDifficulty = Math.min(CFG.adaptive.maxLevel, currentDifficulty + CFG.adaptive.stepUp);
        setupNoiseForMode(currentMode, currentDifficulty, currentStrobeEnabled);
    } else if (recentAccuracy < CFG.adaptive.targetAccuracy - 0.1) {
        currentDifficulty = Math.max(CFG.adaptive.minLevel, currentDifficulty - CFG.adaptive.stepDown);
        setupNoiseForMode(currentMode, currentDifficulty, currentStrobeEnabled);
    }
}

// ===== GAME LOOP =====
function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    var dt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    if (dt > 100) dt = 16.67;
    
    if (gamePhase === 'playing') {
        timeLeft -= dt / 1000;
        
        if (timeLeft <= 0) {
            endGame();
        } else {
            if (typeof NoiseSystem !== 'undefined') NoiseSystem.update(dt);
            
            // Update ONLY current mode
            switch(currentMode) {
                case 1: updateMode1(timestamp, dt); break;
                case 2: updateMode2(timestamp, dt); break;
                case 3: updateMode3(timestamp, dt); break;
                case 4: updateMode4(timestamp, dt); break;
                case 5: updateMode5(timestamp, dt); break;
                case 6: updateMode6(timestamp, dt); break;
                case 7: updateMode7(timestamp, dt); break;
            }
        }
        
        updateHUD();
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    var timeEl = document.getElementById('hud-time');
    if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(timeLeft));
    
    var accEl = document.getElementById('hud-accuracy');
    var acc = trials > 0 ? Math.round((hits / trials) * 100) : 100;
    if (accEl) accEl.innerText = acc + '%';
    
    var diffEl = document.getElementById('hud-difficulty');
    if (diffEl) diffEl.innerText = Math.round(currentDifficulty * 100) + '%';
    
    var trialsEl = document.getElementById('hud-trials');
    if (trialsEl) trialsEl.innerText = trials;
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    if (gamePhase === 'playing') {
        // Draw ONLY current mode
        switch(currentMode) {
            case 1: drawMode1(ctx); break;
            case 2: drawMode2(ctx); break;
            case 3: drawMode3(ctx); break;
            case 4: drawMode4(ctx); break;
            case 5: drawMode5(ctx); break;
            case 6: drawMode6(ctx); break;
            case 7: drawMode7(ctx); break;
        }
        
        // Draw noise layer (only for mode 1)
        if (currentMode === 1 && typeof NoiseSystem !== 'undefined') {
            NoiseSystem.draw(ctx);
        }
        
        // Strobe effect
        if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) {
            ctx.fillStyle = 'rgba(5, 5, 8, 0.92)';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
    }
    
    // Draw crosshair
    if (typeof drawCrosshair === 'function') {
        drawCrosshair(ctx, mouseX, mouseY);
    }
}

// ===== INPUT HANDLERS =====
function handleMouseMove(e) {
    var rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
}

function handleMouseDown(e) {
    if (gamePhase !== 'playing') return;
    if (e.button !== 0) return;
    
    switch(currentMode) {
        case 1: handleMode1Click(); break;
        case 2: handleMode2Click(); break;
        case 3: handleMode3Click(); break;
        case 4: handleMode4Click(); break;
        case 5: handleMode5Click(); break;
        case 6: handleMode6Click(); break;
        case 7: handleMode7Click(); break;
    }
}

function handleKeyDown(e) {
    if (gamePhase !== 'playing') return;
    
    if (currentMode === 4) {
        var key = e.key.toLowerCase();
        var dir = -1;
        
        if (key === 'd' || key === 'arrowright') dir = 0;
        else if (key === 's' || key === 'arrowdown') dir = 1;
        else if (key === 'a' || key === 'arrowleft') dir = 2;
        else if (key === 'w' || key === 'arrowup') dir = 3;
        
        if (dir !== -1) {
            handleMode4Input(dir);
        }
    }
}

// ===== UTILITY FUNCTIONS =====
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

function getScaledValue(paramObj) {
    return getScaledParam(paramObj, currentDifficulty);
}

function flashEffect(type, text) {
    var el = document.getElementById(type === 'penalty' ? 'flash-penalty' : 'flash-warn');
    var txt = document.getElementById(type === 'penalty' ? 'flash-text-penalty' : 'flash-text-warn');
    
    if (el) {
        el.style.opacity = type === 'penalty' ? 0.4 : 0.25;
        setTimeout(function() { el.style.opacity = 0; }, 150);
    }
    
    if (txt && text) {
        txt.innerText = text;
        txt.style.display = 'block';
        txt.style.opacity = 1;
        txt.style.top = '40%';
        txt.style.left = '50%';
        
        setTimeout(function() {
            txt.style.opacity = 0;
            setTimeout(function() { txt.style.display = 'none'; }, 200);
        }, 400);
    }
}