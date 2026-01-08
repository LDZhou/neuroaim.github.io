// ==================== GAME MODES ====================
// Mode-specific logic and click handlers

// Helper: Movement update
function updateMovement(obj, dt, speedMultiplier = 1.0) {
    if (!obj.vx) return; 

    obj.x += obj.vx * speedMultiplier;
    obj.y += obj.vy * speedMultiplier;

    const margin = 50;
    const w = window.canvasWidth;
    const h = window.canvasHeight;
    
    if (obj.x < margin || obj.x > w - margin) obj.vx *= -1;
    if (obj.y < margin || obj.y > h - margin) obj.vy *= -1;

    if (!obj.changeDirTimer) obj.changeDirTimer = 2000 + Math.random() * 1000;
    obj.changeDirTimer -= dt;
    
    if (obj.changeDirTimer <= 0) {
        const speed = Math.sqrt(obj.vx*obj.vx + obj.vy*obj.vy);
        const currentAngle = Math.atan2(obj.vy, obj.vx);
        const newAngle = currentAngle + (Math.random() - 0.5) * Math.PI; 
        
        obj.vx = Math.cos(newAngle) * speed;
        obj.vy = Math.sin(newAngle) * speed;
        
        obj.changeDirTimer = 2000 + Math.random() * 1000; 
    }
}

// ===== MODE 1: GABOR SCOUT =====
function spawnTarget() {
    const w = window.canvasWidth;
    const h = window.canvasHeight;
    const margin = 100;
    const x = margin + Math.random() * (w - margin * 2);
    const y = margin + Math.random() * (h - margin * 2);
    
    const baseSpeed = CFG.noise.baseSpeed; 
    
    window.target = {
        x: x, y: y,
        vx: (Math.random() - 0.5) * baseSpeed,
        vy: (Math.random() - 0.5) * baseSpeed,
        changeDirTimer: Math.random() * 2000,
        type: 0, // Vertical
        spawnTime: performance.now(),
        contrast: CFG.gabor.startContrast,
        deadTime: 0
    };
}

function updateMode1(timestamp, dt) {
    const t = window.target;
    if(!t) return;
    
    const age = timestamp - t.spawnTime;
    const limit = CFG.enemyTimeout;
    
    let speedScale = 1.0;
    if (currentDifficulty === 'medium' || currentDifficulty === 'hard') {
        speedScale = 1.6; 
    }
    
    updateMovement(t, dt / 16.67, speedScale);

    if (age > limit && !t.deadTime) {
        misses++;
        flashEffect('warn', 'MISSED');
        playSound('miss');
        CFG.gabor.startContrast = Math.min(1.0, CFG.gabor.startContrast + CFG.gabor.stepUp);
        spawnTarget();
    }
}

function handleMode1Click(dist) {
    const t = window.target;
    if (dist <= CFG.gaborSize) {
        if (t.type === 0) {
            score += 100;
            hits++;
            playSound('hit');
            reactionTimes.push(performance.now() - t.spawnTime);
            
            if (settings.adaptiveContrast) {
                const nextContrast = CFG.gabor.startContrast - CFG.gabor.stepDown;
                CFG.gabor.startContrast = Math.max(0.08, nextContrast);
            }
            spawnTarget();
        } 
    }
}

// ===== MODE 2: PURE TRACKING =====
function initMode2Target() {
    const w = window.canvasWidth;
    const h = window.canvasHeight;
    const margin = 100;
    const x = margin + Math.random() * (w - margin * 2);
    const y = margin + Math.random() * (h - margin * 2);
    const speed = CFG.mode2[currentDifficulty] || 6;
    
    window.target = {
        x: x, y: y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        changeDirTimer: Math.random() * 3000,
        trackProgress: 0,
        isLocked: false 
    };
}

function updateMode2(timestamp, dt) {
    const t = window.target;
    if (!t) { initMode2Target(); return; }
    if (!t.vx) initMode2Target();
    
    updateMovement(t, dt / 16.67);
    
    // Logic Fix: Ensure mouse coords are valid
    const dx = window.mouseX - t.x;
    const dy = window.mouseY - t.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Tracking radius = target size + margin
    const radius = CFG.tracking.targetSize + 15; 
    
    if (dist <= radius) {
        // Gain Lock
        t.trackProgress += dt / 1000; 
        if (t.trackProgress >= CFG.tracking.lockThreshold) {
            t.trackProgress = CFG.tracking.lockThreshold;
            t.isLocked = true; 
        }
    } else {
        // Decay Lock
        t.trackProgress = Math.max(0, t.trackProgress - (dt / 500));
        if (t.trackProgress < CFG.tracking.lockThreshold) {
            t.isLocked = false;
        }
    }
}

function handleMode2Click(dist) {
    const t = window.target;
    // Must be locked (Green) to kill
    if (t.isLocked) {
        score += 200;
        hits++;
        playSound('hit');
        flashEffect('hit', 'ELIMINATED');
        startAfterGaze();
    } else {
        // Clicked while tracking but not locked? 
        // Maybe feedback?
    }
}

// ===== MODE 3: SURGICAL LOCK =====
function updateMode3(timestamp, dt) { /* Static target */ }

function handleMode3Click(dist) {
    if (dist <= CFG.surgical.coreSize + 2) {
        score += CFG.surgical.coreScore;
        hits++;
        playSound('headshot');
        spawnTarget(); 
    } else if (dist <= CFG.surgical.penaltySize) {
        score += CFG.surgical.penaltyScore;
        flashEffect('penalty', 'IMPURE');
        playSound('error');
    } else {
        score += CFG.surgical.missScore;
    }
}

// ===== MODE 4: LANDOLT SACCADE =====
let mode4State = 'reset';

function initMode4() {
    mode4State = 'reset';
    window.target = { 
        x: window.canvasWidth / 2, 
        y: window.canvasHeight / 2,
        isResetPoint: true 
    };
}

function spawnMode4Target() {
    const w = window.canvasWidth;
    const h = window.canvasHeight;
    const margin = 100;
    const x = margin + Math.random() * (w - margin * 2);
    const y = margin + Math.random() * (h - margin * 2);
    
    const gapDir = Math.floor(Math.random() * 4);
    const conf = CFG.landolt[currentDifficulty];
    
    window.target = {
        x: x, y: y,
        gapDir: gapDir,
        size: conf.size,
        contrast: conf.contrast,
        spawnTime: performance.now(),
        timeout: conf.timeout,
        isResetPoint: false
    };
    mode4State = 'target';
}

function updateMode4(timestamp, dt) {
    const t = window.target;
    if(!t) return;

    if (mode4State === 'reset') {
        const dx = window.mouseX - (window.canvasWidth / 2);
        const dy = window.mouseY - (window.canvasHeight / 2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < CFG.landolt.resetRadius) {
            playSound('click'); 
            spawnMode4Target();
        }
    } else {
        const age = timestamp - t.spawnTime;
        if (age > t.timeout) {
            misses++;
            flashEffect('warn', 'TOO SLOW');
            playSound('miss');
            initMode4();
        }
    }
}

function handleMode4Click(dist) {
    const t = window.target;
    if (mode4State === 'target') {
        if (dist <= t.size * 2) { // Generous hitbox for tiny targets
            score += 100;
            hits++;
            playSound('hit');
            reactionTimes.push(performance.now() - t.spawnTime);
            initMode4(); 
        } else {
            // Optional miss penalty logic here
        }
    }
}

// ===== UTILS =====
function startAfterGaze() {
    const t = window.target;
    t.deadTime = performance.now();
    t.deadX = t.x;
    t.deadY = t.y;
    
    setTimeout(() => {
        if (window.gamePhase === 'playing') {
            if (currentMode === 2) initMode2Target();
            else spawnTarget();
        }
    }, CFG.afterGazeTime);
}

function flashEffect(type, text) {
    const el = document.getElementById(type === 'penalty' ? 'flash-penalty' : 'flash-warn');
    const txt = document.getElementById(type === 'penalty' ? 'flash-text-penalty' : 'flash-text-warn');
    const t = window.target;
    
    if (el) {
        el.style.opacity = 0.3;
        setTimeout(() => el.style.opacity = 0, 150);
    }
    
    if (txt && text && t) {
        txt.innerText = text;
        txt.style.display = 'block';
        txt.style.opacity = 1;
        txt.style.top = (t.y - 50) + 'px';
        txt.style.left = t.x + 'px';
        setTimeout(() => {
            txt.style.opacity = 0;
            setTimeout(() => txt.style.display = 'none', 200);
        }, 500);
    }
}