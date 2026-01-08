// ==================== GAME MODES ====================
// Mode-specific click handlers and logic

// Mode 1: Gabor Scout - Visual discrimination with adaptive contrast
function handleMode1Click(dist) {
    playSound('click');
    
    const coreHit = dist <= CFG.microDotSize + 2;
    const bodyHit = dist <= CFG.gaborSize;
    
    if (coreHit) {
        if (target.type === 0) {  // Enemy (vertical stripes)
            playSound('hit');
            const rt = performance.now() - target.spawnTime;
            reactionTimes.push(rt);
            
            // Adaptive contrast: make next target harder
            if (settings.adaptiveContrast) {
                target.contrast = Math.max(
                    CFG.gabor.minContrast,
                    target.contrast - CFG.gabor.stepDown
                );
            }
            
            initiateAfterGaze(1);
        } else {  // Friendly (horizontal stripes)
            playSound('error');
            score -= 3;
            misses++;
            
            // Adaptive contrast: make next target easier
            if (settings.adaptiveContrast) {
                target.contrast = Math.min(1.0, target.contrast + CFG.gabor.stepUp);
            }
            
            triggerPenalty('FRIENDLY FIRE', 'hit');
        }
    } else if (bodyHit) {
        if (target.type === 0) {  // Enemy body hit but missed core
            playSound('miss');
            score -= 1;
            misses++;
            
            if (settings.adaptiveContrast) {
                target.contrast = Math.min(1.0, target.contrast + CFG.gabor.stepUp * 0.5);
            }
            
            showFeedback('MISSED CORE', 'warn');
            spawnTarget();
        } else {  // Friendly
            playSound('error');
            score -= 2;
            misses++;
            
            if (settings.adaptiveContrast) {
                target.contrast = Math.min(1.0, target.contrast + CFG.gabor.stepUp);
            }
            
            triggerPenalty('FRIENDLY FIRE', 'miss');
        }
    }
    // Miss entirely = no penalty, just didn't click on target
}

// Mode 2: Dynamic Tracking - Smooth pursuit with lock
function handleMode2Click(dist) {
    playSound('click');
    
    if (dist < 35 && target.trackProgress >= 1) {
        // Locked and on target
        playSound('hit');
        const rt = performance.now() - target.spawnTime;
        reactionTimes.push(rt);
        initiateAfterGaze(2);
    } else if (dist < 35) {
        // On target but not locked yet
        playSound('error');
        score -= 2;
        misses++;
        triggerPenalty('WAIT FOR LOCK');
    }
    // Click outside target = ignored
}

// Mode 3: Surgical Lock - Extreme precision
function handleMode3Click(dist) {
    playSound('click');
    
    const coreSize = CFG.surgical.coreSize;
    const penaltySize = CFG.surgical.penaltySize;
    
    // Core hit (with 2px tolerance)
    const coreHit = dist <= coreSize + 2;
    // Penalty zone hit
    const penaltyHit = dist <= penaltySize;
    
    if (coreHit) {
        // Perfect precision hit!
        playSound('precision');
        score += CFG.surgical.coreScore;
        hits++;
        
        const rt = performance.now() - target.spawnTime;
        reactionTimes.push(rt);
        
        initiateAfterGaze(3);
    } else if (penaltyHit) {
        // Hit the penalty halo - severe punishment
        playSound('penalty');
        score += CFG.surgical.penaltyScore;  // Negative
        misses++;
        
        triggerPenalty('PRECISION FAIL');
        // Important: Do NOT spawn new target - force retry
    } else {
        // Missed entirely
        playSound('miss');
        score += CFG.surgical.missScore;  // Small negative
        misses++;
    }
}

// Initiate after-gaze hold if enabled for current mode
function initiateAfterGaze(mode) {
    let shouldHold = false;
    
    if (mode === 1 && settings.afterGazeMode1) shouldHold = true;
    else if (mode === 2 && settings.afterGazeMode2) shouldHold = true;
    else if (mode === 3 && settings.afterGazeMode3) shouldHold = true;
    
    if (shouldHold) {
        target.afterGazeActive = true;
        target.deadX = target.x;
        target.deadY = target.y;
        target.deadTime = performance.now();
    } else {
        completeKill();
    }
}

// Complete kill and spawn new target
function completeKill() {
    score++;
    hits++;
    target.afterGazeActive = false;
    spawnTarget();
    updateHUD();
}

// Spawn a new target based on current mode
function spawnTarget() {
    const pad = 120;
    target.x = pad + Math.random() * (canvasWidth - pad * 2);
    target.y = pad + Math.random() * (canvasHeight - pad * 2);
    target.spawnTime = performance.now();
    target.trackProgress = 0;
    target.afterGazeActive = false;
    
    if (currentMode === 1) {
        // Mode 1: Friend/Enemy with adaptive ratio
        targetHistory.push(0);
        if (targetHistory.length > 20) targetHistory.shift();
        
        const recentEnemies = targetHistory.slice(-10).filter(t => t === 0).length;
        const recentFriends = 10 - recentEnemies;
        
        let enemyChance = CFG.targetRatio;
        if (recentEnemies >= 8) enemyChance = 0.3;
        else if (recentFriends >= 6) enemyChance = 0.8;
        else enemyChance = CFG.targetRatio + (Math.random() - 0.5) * 0.2;
        
        target.type = Math.random() < enemyChance ? 0 : 1;
        targetHistory[targetHistory.length - 1] = target.type;
        
        // Initialize contrast if first target
        if (shots === 0 || !target.contrast) {
            target.contrast = CFG.gabor.startContrast;
        }
        
    } else if (currentMode === 2) {
        // Mode 2: Moving target
        const angle = Math.random() * Math.PI * 2;
        const speed = CFG.mode2[currentDifficulty].speed;
        target.vx = Math.cos(angle) * speed;
        target.vy = Math.sin(angle) * speed;
        
    } else if (currentMode === 3) {
        // Mode 3: Surgical precision - slight drift
        target.vx = (Math.random() - 0.5) * 0.3;
        target.vy = (Math.random() - 0.5) * 0.3;
        target.type = 0;  // Always enemy
    }
}

// Trigger penalty flash and pause
function triggerPenalty(msg, hitType = null) {
    penaltyActive = true;
    penaltyEndTime = performance.now() + 1500;
    
    const isGaze = msg.includes('GAZE');
    const flashEl = isGaze ? 'flash-warn' : 'flash-penalty';
    const textEl = isGaze ? 'flash-text-warn' : 'flash-text-penalty';
    
    let displayMsg = msg;
    if (hitType === 'hit') displayMsg = msg + ' (-3)';
    else if (hitType === 'miss') displayMsg = msg + ' (-2)';
    else if (msg === 'PRECISION FAIL') displayMsg = msg + ' (-50)';
    
    document.getElementById(flashEl).classList.add('active');
    document.getElementById(textEl).innerText = displayMsg;
    document.getElementById(textEl).classList.add('active');
    
    setTimeout(() => {
        document.getElementById(flashEl).classList.remove('active');
        document.getElementById(textEl).classList.remove('active');
    }, 300);
    
    updateHUD();
}

// Show feedback message
function showFeedback(msg, type) {
    const flashEl = type === 'warn' ? 'flash-warn' : 'flash-penalty';
    const textEl = type === 'warn' ? 'flash-text-warn' : 'flash-text-penalty';
    
    document.getElementById(flashEl).classList.add('active');
    document.getElementById(textEl).innerText = msg + ' (-1)';
    document.getElementById(textEl).classList.add('active');
    
    setTimeout(() => {
        document.getElementById(flashEl).classList.remove('active');
        document.getElementById(textEl).classList.remove('active');
    }, 200);
}
