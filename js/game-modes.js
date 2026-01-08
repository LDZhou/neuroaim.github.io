// ==================== GAME MODES ====================
// Mode-specific logic and click handlers
// UPDATED: Mode 2 organic movement, Mode 3 random core, Mode 4 WASD

// Helper: Movement update (linear bouncing)
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

// [NEW] Organic Movement: Lissajous-like smooth curves simulating biological movement
function updateOrganicMovement(obj, dt, timestamp) {
    const t = timestamp * 0.001; // Convert to seconds
    
    // Multiple sine waves superimposed for pseudo-random smooth motion
    // X component: base oscillation + fine variation
    const vxBase = Math.sin(t * 1.5) * 4; 
    const vxFine = Math.cos(t * 3.7) * 2;
    obj.vx = (vxBase + vxFine) * 1.5;

    // Y component: phase offset for elliptical/figure-8 trajectories
    const vyBase = Math.cos(t * 1.2) * 4;
    const vyFine = Math.sin(t * 4.1) * 2;
    obj.vy = (vyBase + vyFine) * 1.5;

    // Apply velocity
    obj.x += obj.vx * (dt / 16.67);
    obj.y += obj.vy * (dt / 16.67);

    // Soft boundaries: apply turning force instead of hard bounce
    const margin = 100;
    const w = window.canvasWidth;
    const h = window.canvasHeight;
    const turnForce = 0.5;

    if (obj.x < margin) obj.x += turnForce * (margin - obj.x);
    if (obj.x > w - margin) obj.x -= turnForce * (obj.x - (w - margin));
    if (obj.y < margin) obj.y += turnForce * (margin - obj.y);
    if (obj.y > h - margin) obj.y -= turnForce * (obj.y - (h - margin));
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

// ===== MODE 2: PURE TRACKING (UPDATED with afterGaze enforcement) =====
var mode2AfterGazeState = null; // { deadX, deadY, startTime, brokeGaze, nextSpawnDelay }

function initMode2Target() {
    const w = window.canvasWidth;
    const h = window.canvasHeight;
    const margin = 100;
    const x = margin + Math.random() * (w - margin * 2);
    const y = margin + Math.random() * (h - margin * 2);
    const speed = CFG.mode2[currentDifficulty] || 6;
    
    mode2AfterGazeState = null;
    
    window.target = {
        x: x, y: y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        changeDirTimer: Math.random() * 3000,
        trackProgress: 0,
        isLocked: false,
        isDead: false
    };
}

function updateMode2(timestamp, dt) {
    const t = window.target;
    if (!t) { initMode2Target(); return; }
    if (!t.vx && !t.isDead) initMode2Target();
    
    // Handle afterGaze phase
    if (mode2AfterGazeState) {
        const elapsed = performance.now() - mode2AfterGazeState.startTime;
        const gazeTime = CFG.afterGazeTime + (mode2AfterGazeState.brokeGaze ? CFG.mode2.afterGazeDelayPenalty : 0);
        
        // Check if mouse moved away during afterGaze
        if (!mode2AfterGazeState.brokeGaze) {
            const dx = window.mouseX - mode2AfterGazeState.deadX;
            const dy = window.mouseY - mode2AfterGazeState.deadY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > CFG.mode2.gazeRadius) {
                mode2AfterGazeState.brokeGaze = true;
                score += CFG.mode2.afterGazePenalty;
                flashEffect('warn', 'BROKE GAZE');
                playSound('error');
                
                // Track gaze breaks for stats
                if (!window.gazeBreaks) window.gazeBreaks = 0;
                window.gazeBreaks++;
            }
        }
        
        if (elapsed >= gazeTime) {
            mode2AfterGazeState = null;
            initMode2Target();
        }
        return;
    }
    
    // [UPDATED] Choose movement mode based on difficulty
    // Easy: linear bouncing, Medium/Hard: organic movement
    if (currentDifficulty === 'medium' || currentDifficulty === 'hard') {
        updateOrganicMovement(t, dt, timestamp);
    } else {
        updateMovement(t, dt / 16.67);
    }
    
    const dx = window.mouseX - t.x;
    const dy = window.mouseY - t.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Same lock radius for all difficulties
    const radius = CFG.tracking.targetSize + 15; 
    
    if (dist <= radius) {
        t.trackProgress += dt / 1000; 
        if (t.trackProgress >= CFG.tracking.lockThreshold) {
            t.trackProgress = CFG.tracking.lockThreshold;
            t.isLocked = true; 
        }
    } else {
        t.trackProgress = Math.max(0, t.trackProgress - (dt / 500));
        if (t.trackProgress < CFG.tracking.lockThreshold) {
            t.isLocked = false;
        }
    }
}

function handleMode2Click(dist) {
    const t = window.target;
    if (t.isDead || mode2AfterGazeState) return;
    
    if (t.isLocked) {
        score += 200;
        hits++;
        playSound('hit');
        reactionTimes.push(performance.now() - (t.spawnTime || performance.now()));
        
        // Start afterGaze phase
        t.isDead = true;
        mode2AfterGazeState = {
            deadX: t.x,
            deadY: t.y,
            startTime: performance.now(),
            brokeGaze: false
        };
        
        // Store for drawing
        t.deadTime = performance.now();
        t.deadX = t.x;
        t.deadY = t.y;
    }
}

// ===== MODE 3: SURGICAL LOCK (UPDATED with random core position) =====
function spawnMode3Target() {
    const w = window.canvasWidth;
    const h = window.canvasHeight;
    const margin = 100;
    const x = margin + Math.random() * (w - margin * 2);
    const y = margin + Math.random() * (h - margin * 2);
    
    // Calculate random core offset within penalty zone
    const maxOffset = (CFG.surgical.penaltySize - CFG.surgical.coreSize - 5) * CFG.surgical.coreOffsetMax;
    const offsetAngle = Math.random() * Math.PI * 2;
    const offsetDist = Math.random() * maxOffset;
    
    const coreOffsetX = Math.cos(offsetAngle) * offsetDist;
    const coreOffsetY = Math.sin(offsetAngle) * offsetDist;
    
    window.target = {
        x: x, y: y, // Center of penalty zone
        coreX: x + coreOffsetX, // Actual core position
        coreY: y + coreOffsetY,
        spawnTime: performance.now(),
        deadTime: 0
    };
}

function updateMode3(timestamp, dt) {
    // Static target, no movement needed
}

function handleMode3Click(dist) {
    const t = window.target;
    
    // Calculate distance to actual core
    const dx = window.mouseX - t.coreX;
    const dy = window.mouseY - t.coreY;
    const coreDist = Math.sqrt(dx*dx + dy*dy);
    
    // Calculate distance to penalty zone center
    const penaltyDx = window.mouseX - t.x;
    const penaltyDy = window.mouseY - t.y;
    const penaltyDist = Math.sqrt(penaltyDx*penaltyDx + penaltyDy*penaltyDy);
    
    if (coreDist <= CFG.surgical.coreSize + 2) {
        score += CFG.surgical.coreScore;
        hits++;
        playSound('precision');
        reactionTimes.push(performance.now() - t.spawnTime);
        spawnMode3Target();
    } else if (penaltyDist <= CFG.surgical.penaltySize) {
        score += CFG.surgical.penaltyScore;
        misses++;
        flashEffect('penalty', 'IMPURE');
        playSound('error');
        spawnMode3Target();
    } else {
        score += CFG.surgical.missScore;
    }
}

// ===== MODE 4: LANDOLT SACCADE (UPDATED with click-to-reset) =====
var mode4State = 'waitingForCenterClick'; // 'waitingForCenterClick' | 'target'

function initMode4() {
    mode4State = 'waitingForCenterClick';
    window.target = { 
        x: window.canvasWidth / 2, 
        y: window.canvasHeight / 2,
        isResetPoint: true 
    };
}

function spawnMode4Target() {
    const w = window.canvasWidth;
    const h = window.canvasHeight;
    const margin = 120;
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

    if (mode4State === 'target' && !t.isResetPoint) {
        const age = timestamp - t.spawnTime;
        if (age > t.timeout) {
            misses++;
            flashEffect('warn', 'TOO SLOW');
            playSound('miss');
            initMode4(); // Go back to center click
        }
    }
}

// [NEW] Mode 4 WASD Input Handler
function handleMode4Input(inputDir) {
    const t = window.target;
    if (!t || mode4State !== 'target' || t.isResetPoint) return;

    // Check if mouse is hovering over target
    const dx = window.mouseX - t.x;
    const dy = window.mouseY - t.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    const hitRadius = t.size * 2.5;

    if (dist <= hitRadius) {
        // Check if direction matches gap direction
        if (inputDir === t.gapDir) {
            // Success: correct direction while hovering
            score += 100;
            hits++;
            shots++; // Count as a shot
            playSound('hit');
            reactionTimes.push(performance.now() - t.spawnTime);
            initMode4(); // Return to center reset
        } else {
            // Wrong direction
            score -= 50;
            shots++; // Count as a shot (miss)
            flashEffect('warn', 'WRONG DIR');
            playSound('error');
            // Player can retry
        }
    } else {
        // Pressed key without aiming at target
        flashEffect('warn', 'AIM FIRST');
    }
    
    updateScoreDisplay();
}

// [MODIFIED] handleMode4Click only handles center reset, not target
function handleMode4Click(dist) {
    const t = window.target;
    
    if (mode4State === 'waitingForCenterClick' && t.isResetPoint) {
        // Check if clicked the center reset button
        const dx = window.mouseX - (window.canvasWidth / 2);
        const dy = window.mouseY - (window.canvasHeight / 2);
        const centerDist = Math.sqrt(dx*dx + dy*dy);
        
        if (centerDist <= CFG.landolt.resetClickRadius) {
            playSound('click');
            spawnMode4Target();
        }
        // Don't count as shot if clicking center
        shots--;
    }
    // [REMOVED] Target clicking - now handled by WASD
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
    
    if (txt && text) {
        txt.innerText = text;
        txt.style.display = 'block';
        txt.style.opacity = 1;
        
        if (t) {
            txt.style.top = (t.y - 50) + 'px';
            txt.style.left = t.x + 'px';
        } else {
            txt.style.top = '50%';
            txt.style.left = '50%';
        }
        
        setTimeout(() => {
            txt.style.opacity = 0;
            setTimeout(() => txt.style.display = 'none', 200);
        }, 500);
    }
}