// ==================== GAME MODES ====================
// Mode-specific logic for all 7 modes
// State objects are reset by game-engine.js clearAllModeStates()

// ===== MODE STATE OBJECTS (will be reset by engine) =====
var mode1State = { target: null };
var mode2State = { target: null, trackProgress: 0, isLocked: false, afterGaze: null, totalTrackTime: 0 };
var mode3State = { target: null };
var mode4State = { phase: 'reset', target: null };
var mode5State = { primary: null, ghost: null, ghostTimer: 0, returnTimer: 0, trackingPrimary: false, integrity: 1.0, totalTrackTime: 0 };
var mode6State = { phase: 'waiting', sequence: [], currentIndex: 0, displayIndex: 0, displayTimer: 0, delayTimer: 0, spawnTime: 0, waitTimer: 0, completeTimer: 0 };
var mode7State = { rule: 'cold', switchTimer: 0, warningActive: false, targets: [], nextSpawnTimer: 0 };

// ==================== MODE 1: GABOR SCOUT ====================
function initMode1() {
    mode1State = { target: null };
    spawnMode1Target();
}

function spawnMode1Target() {
    var params = CFG.mode1.params;
    var margin = 100;
    var w = canvasWidth;
    var h = canvasHeight;
    var speed = getScaledValue(params.moveSpeed);
    var targetSize = getScaledValue(params.targetSize);
    
    // Update noise system to match target size
    if (typeof NoiseSystem !== 'undefined') {
        NoiseSystem.setTargetSize(targetSize);
    }
    
    mode1State.target = {
        x: margin + Math.random() * (w - margin * 2),
        y: margin + Math.random() * (h - margin * 2),
        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 0.5) * speed * 2,
        size: targetSize,
        contrast: getScaledValue(params.contrast),
        spawnTime: performance.now(),
        timeout: getScaledValue(params.timeout)
    };
}

function updateMode1(timestamp, dt) {
    var t = mode1State.target;
    if (!t) return;
    
    // Movement
    t.x += t.vx * (dt / 16.67);
    t.y += t.vy * (dt / 16.67);
    
    // Bounce
    var margin = 50;
    if (t.x < margin || t.x > canvasWidth - margin) t.vx *= -1;
    if (t.y < margin || t.y > canvasHeight - margin) t.vy *= -1;
    
    // Random direction changes
    if (Math.random() < 0.005) {
        var speed = getScaledValue(CFG.mode1.params.moveSpeed);
        var angle = Math.random() * Math.PI * 2;
        t.vx = Math.cos(angle) * speed;
        t.vy = Math.sin(angle) * speed;
    }
    
    // Timeout check
    var age = timestamp - t.spawnTime;
    if (age > t.timeout) {
        recordTrialResult(false);
        flashEffect('warn', 'TIMEOUT');
        playSound('miss');
        spawnMode1Target();
    }
}

function handleMode1Click() {
    var t = mode1State.target;
    if (!t) return;
    
    var dist = getDistance(mouseX, mouseY, t.x, t.y);
    var hitRadius = t.size * 1.2;
    
    if (dist <= hitRadius) {
        var rt = performance.now() - t.spawnTime;
        recordTrialResult(true, rt);
        playSound('hit');
        spawnMode1Target();
    }
}

// ==================== MODE 2: PURE TRACKING ====================
function initMode2() {
    mode2State = { target: null, trackProgress: 0, isLocked: false, afterGaze: null, totalTrackTime: 0 };
    spawnMode2Target();
}

function spawnMode2Target() {
    var params = CFG.mode2.params;
    var margin = 100;
    var w = canvasWidth;
    var h = canvasHeight;
    
    mode2State.target = {
        x: margin + Math.random() * (w - margin * 2),
        y: margin + Math.random() * (h - margin * 2),
        size: getScaledValue(params.targetSize),
        phase: Math.random() * Math.PI * 2,
        spawnTime: performance.now()
    };
    mode2State.trackProgress = 0;
    mode2State.isLocked = false;
    mode2State.afterGaze = null;
}

function updateMode2(timestamp, dt) {
    var params = CFG.mode2.params;
    var t = mode2State.target;
    if (!t) return;
    
    // Handle afterGaze phase
    if (mode2State.afterGaze) {
        var elapsed = performance.now() - mode2State.afterGaze.startTime;
        var holdTime = getScaledValue(params.afterGazeTime);
        var gazeRadius = getScaledValue(params.gazeRadius);
        
        var dist = getDistance(mouseX, mouseY, mode2State.afterGaze.x, mode2State.afterGaze.y);
        if (dist > gazeRadius && !mode2State.afterGaze.broken) {
            mode2State.afterGaze.broken = true;
            sessionStats.gazeBreaks++;
            flashEffect('warn', 'BROKE GAZE');
            playSound('error');
        }
        
        if (elapsed >= holdTime) {
            mode2State.afterGaze = null;
            spawnMode2Target();
        }
        return;
    }
    
    // NEW: Check 7 second timeout
    var age = timestamp - t.spawnTime;
    if (age > (params.killTimeout || 7000)) {
        recordTrialResult(false);
        flashEffect('warn', 'TIMEOUT');
        playSound('miss');
        spawnMode2Target();
        return;
    }
    
    // Organic Lissajous movement
    var speed = getScaledValue(params.moveSpeed);
    var complexity = getScaledValue(params.curveComplexity);
    var time = timestamp * 0.001;
    
    t.vx = Math.sin(time * 1.3 * complexity) * speed + Math.cos(time * 2.1) * speed * 0.5;
    t.vy = Math.cos(time * 1.1 * complexity) * speed + Math.sin(time * 2.7) * speed * 0.5;
    
    t.x += t.vx * (dt / 16.67);
    t.y += t.vy * (dt / 16.67);
    
    // Soft boundaries
    var margin = 80;
    var w = canvasWidth;
    var h = canvasHeight;
    if (t.x < margin) t.x += (margin - t.x) * 0.1;
    if (t.x > w - margin) t.x -= (t.x - (w - margin)) * 0.1;
    if (t.y < margin) t.y += (margin - t.y) * 0.1;
    if (t.y > h - margin) t.y -= (t.y - (h - margin)) * 0.1;
    
    // Track progress
    var dist = getDistance(mouseX, mouseY, t.x, t.y);
    var trackRadius = t.size + 20;
    var lockTime = getScaledValue(params.lockTime);
    
    if (dist <= trackRadius) {
        mode2State.trackProgress += dt / 1000;
        // NEW: Accumulate tracking time for NCS
        mode2State.totalTrackTime += dt / 1000;
        
        if (mode2State.trackProgress >= lockTime) {
            mode2State.trackProgress = lockTime;
            mode2State.isLocked = true;
        }
    } else {
        mode2State.trackProgress = Math.max(0, mode2State.trackProgress - dt / 400);
        mode2State.isLocked = false;
    }
}

function handleMode2Click() {
    if (!mode2State.target || mode2State.afterGaze) return;
    
    if (mode2State.isLocked) {
        var rt = performance.now() - mode2State.target.spawnTime;
        
        // NEW: Store tracking time in sessionStats for NCS calculation
        if (!sessionStats.trackingTime) sessionStats.trackingTime = 0;
        sessionStats.trackingTime += mode2State.totalTrackTime;
        
        recordTrialResult(true, rt);
        playSound('hit');
        
        mode2State.afterGaze = {
            x: mode2State.target.x,
            y: mode2State.target.y,
            startTime: performance.now(),
            broken: false
        };
    }
}

// ==================== MODE 3: SURGICAL LOCK ====================
function initMode3() {
    mode3State = { target: null };
    spawnMode3Target();
}

function spawnMode3Target() {
    var params = CFG.mode3.params;
    var margin = 100;
    var w = canvasWidth;
    var h = canvasHeight;
    
    var centerX = margin + Math.random() * (w - margin * 2);
    var centerY = margin + Math.random() * (h - margin * 2);
    
    var penaltySize = getScaledValue(params.penaltySize);
    var coreSize = getScaledValue(params.coreSize);
    var maxOffset = (penaltySize - coreSize - 5) * getScaledValue(params.coreOffset);
    var offsetAngle = Math.random() * Math.PI * 2;
    var offsetDist = Math.random() * maxOffset;
    
    // NEW: Calculate color similarity based on difficulty
    var colorSimilarity = getScaledValue(params.colorSimilarity);
    
    mode3State.target = {
        x: centerX,
        y: centerY,
        coreX: centerX + Math.cos(offsetAngle) * offsetDist,
        coreY: centerY + Math.sin(offsetAngle) * offsetDist,
        penaltySize: penaltySize,
        coreSize: coreSize,
        colorSimilarity: colorSimilarity,  // NEW: 0-0.7 range
        spawnTime: performance.now()
    };
}

function updateMode3(timestamp, dt) {
    // Static target, no update needed
}

function handleMode3Click() {
    var t = mode3State.target;
    if (!t) return;
    
    var coreD = getDistance(mouseX, mouseY, t.coreX, t.coreY);
    var penaltyD = getDistance(mouseX, mouseY, t.x, t.y);
    
    if (coreD <= t.coreSize + 3) {
        var rt = performance.now() - t.spawnTime;
        recordTrialResult(true, rt);
        sessionStats.perfectTrials++;
        playSound('precision');
        spawnMode3Target();
    } else if (penaltyD <= t.penaltySize) {
        recordTrialResult(false);
        flashEffect('penalty', 'IMPRECISE');
        playSound('penalty');
        spawnMode3Target();
    }
}

// ==================== MODE 4: LANDOLT SACCADE ====================
function initMode4() {
    mode4State = { phase: 'reset', target: null };
}

function spawnMode4Target() {
    var params = CFG.mode4.params;
    var eccentricity = getScaledValue(params.eccentricity);
    var angle = Math.random() * Math.PI * 2;
    var cx = canvasWidth / 2;
    var cy = canvasHeight / 2;
    
    mode4State.target = {
        x: cx + Math.cos(angle) * eccentricity,
        y: cy + Math.sin(angle) * eccentricity,
        size: getScaledValue(params.ringSize),
        contrast: getScaledValue(params.contrast),
        gapDir: Math.floor(Math.random() * 4),
        timeout: getScaledValue(params.timeout),
        spawnTime: performance.now()
    };
    mode4State.phase = 'target';
}

function updateMode4(timestamp, dt) {
    if (mode4State.phase !== 'target' || !mode4State.target) return;
    
    var age = timestamp - mode4State.target.spawnTime;
    if (age > mode4State.target.timeout) {
        recordTrialResult(false);
        flashEffect('warn', 'TIMEOUT');
        playSound('miss');
        mode4State.phase = 'reset';
        mode4State.target = null;
    }
}

function handleMode4Click() {
    if (mode4State.phase === 'reset') {
        var cx = canvasWidth / 2;
        var cy = canvasHeight / 2;
        var dist = getDistance(mouseX, mouseY, cx, cy);
        if (dist <= 50) {
            playSound('click');
            spawnMode4Target();
        }
    }
}

function handleMode4Input(dir) {
    if (mode4State.phase !== 'target' || !mode4State.target) return;
    
    var t = mode4State.target;
    var dist = getDistance(mouseX, mouseY, t.x, t.y);
    var hoverRadius = t.size * 2;
    
    if (dist <= hoverRadius) {
        if (dir === t.gapDir) {
            var rt = performance.now() - t.spawnTime;
            recordTrialResult(true, rt);
            playSound('hit');
        } else {
            recordTrialResult(false);
            flashEffect('warn', 'WRONG');
            playSound('error');
        }
        mode4State.phase = 'reset';
        mode4State.target = null;
    } else {
        flashEffect('warn', 'AIM FIRST');
    }
}

// ==================== MODE 5: PARAFOVEAL GHOST ====================
function initMode5() {
    var params = CFG.mode5.params;
    var cx = canvasWidth / 2;
    var cy = canvasHeight / 2;
    
    mode5State = {
        primary: {
            x: cx,
            y: cy,
            size: getScaledValue(params.primarySize),
            phase: Math.random() * Math.PI * 2
        },
        ghost: null,
        ghostTimer: getScaledValue(params.ghostFrequency),
        returnTimer: 0,
        trackingPrimary: true,
        integrity: 1.0,  // NEW: Initialize integrity for progress bar
        totalTrackTime: 0  // NEW: Track time for NCS
    };
}

function spawnGhost() {
    var params = CFG.mode5.params;
    var eccentricity = getScaledValue(params.ghostEccentricity);
    var angle = Math.random() * Math.PI * 2;
    var cx = canvasWidth / 2;
    var cy = canvasHeight / 2;
    
    var isBlue = Math.random() < getScaledValue(params.blueRatio);
    
    mode5State.ghost = {
        x: cx + Math.cos(angle) * eccentricity,
        y: cy + Math.sin(angle) * eccentricity,
        size: getScaledValue(params.ghostSize),
        isBlue: isBlue,
        spawnTime: performance.now(),
        duration: getScaledValue(params.ghostDuration)
    };
}

function updateMode5(timestamp, dt) {
    var params = CFG.mode5.params;
    var p = mode5State.primary;
    if (!p) return;
    
    // Update primary target movement
    var speed = getScaledValue(params.primarySpeed);
    var time = timestamp * 0.001;
    p.vx = Math.sin(time * 1.1) * speed + Math.cos(time * 1.7) * speed * 0.5;
    p.vy = Math.cos(time * 0.9) * speed + Math.sin(time * 1.3) * speed * 0.5;
    p.x += p.vx * (dt / 16.67);
    p.y += p.vy * (dt / 16.67);
    
    // Keep in bounds
    var margin = 150;
    var cx = canvasWidth / 2;
    var cy = canvasHeight / 2;
    p.x = cx + Math.max(-margin, Math.min(margin, p.x - cx));
    p.y = cy + Math.max(-margin, Math.min(margin, p.y - cy));
    
    // Check if tracking primary
    var distToPrimary = getDistance(mouseX, mouseY, p.x, p.y);
    var wasTracking = mode5State.trackingPrimary;
    mode5State.trackingPrimary = distToPrimary <= p.size + 30;
    
    // NEW: Update integrity and tracking time
    if (mode5State.trackingPrimary) {
        // Tracking: slow decay (integrity recovery)
        mode5State.integrity = Math.min(1.0, mode5State.integrity + dt / 1000 * getScaledValue(params.decaySlow));
        // Accumulate tracking time for NCS
        mode5State.totalTrackTime += dt / 1000;
    } else {
        // Not tracking: fast decay
        mode5State.integrity = Math.max(0, mode5State.integrity - dt / 1000 * getScaledValue(params.decayFast));
    }
    
    // Ghost management
    if (!mode5State.ghost) {
        mode5State.ghostTimer -= dt;
        if (mode5State.ghostTimer <= 0) {
            spawnGhost();
            mode5State.ghostTimer = getScaledValue(params.ghostFrequency);
        }
    } else {
        var ghostAge = performance.now() - mode5State.ghost.spawnTime;
        if (ghostAge > mode5State.ghost.duration) {
            if (mode5State.ghost.isBlue) {
                recordTrialResult(false);
                flashEffect('warn', 'MISSED GHOST');
                playSound('miss');
            } else {
                recordTrialResult(true);
                sessionStats.inhibitionSuccess++;
            }
            mode5State.ghost = null;
        }
    }
    
    // Return timer
    if (mode5State.returnTimer > 0) {
        mode5State.returnTimer -= dt;
        if (mode5State.returnTimer <= 0) {
            if (!mode5State.trackingPrimary) {
                recordTrialResult(false);
                flashEffect('warn', 'RETURN FAILED');
                playSound('error');
            }
        }
    }
}

function handleMode5Click() {
    var g = mode5State.ghost;
    var p = mode5State.primary;
    
    if (g) {
        var distToGhost = getDistance(mouseX, mouseY, g.x, g.y);
        if (distToGhost <= g.size + 10) {
            if (g.isBlue) {
                var rt = performance.now() - g.spawnTime;
                
                // NEW: Store tracking time in sessionStats for NCS calculation
                if (!sessionStats.trackingTime) sessionStats.trackingTime = 0;
                sessionStats.trackingTime += mode5State.totalTrackTime;
                
                recordTrialResult(true, rt);
                playSound('hit');
                mode5State.returnTimer = getScaledValue(CFG.mode5.params.returnWindow);
            } else {
                recordTrialResult(false);
                sessionStats.inhibitionFail++;
                flashEffect('penalty', 'INHIBIT!');
                playSound('penalty');
            }
            mode5State.ghost = null;
            return;
        }
    }
}

// ==================== MODE 6: MEMORY SEQUENCER ====================
function initMode6() {
    mode6State = {
        phase: 'waiting',
        sequence: [],
        currentIndex: 0,
        displayIndex: 0,
        displayTimer: 0,
        delayTimer: 0,
        spawnTime: 0,
        waitTimer: 1000,
        completeTimer: 0
    };
}

function generateSequence() {
    var params = CFG.mode6.params;
    var length = Math.round(getScaledValue(params.sequenceLength));
    var spread = getScaledValue(params.spatialSpread);
    var size = getScaledValue(params.targetSize);
    
    // UPDATED: Random center point, avoiding UI areas
    var uiMarginTop = 150;     // Avoid HUD at top
    var uiMarginBottom = 100;  // Margin at bottom
    var uiMarginSide = 100;    // Side margins
    var clusterRadius = getScaledValue(params.clusterRadius);
    
    // Calculate safe zone
    var safeWidth = canvasWidth - uiMarginSide * 2 - clusterRadius * 2;
    var safeHeight = canvasHeight - uiMarginTop - uiMarginBottom - clusterRadius * 2;
    
    // Random center point within safe zone
    var cx = uiMarginSide + clusterRadius + Math.random() * safeWidth;
    var cy = uiMarginTop + clusterRadius + Math.random() * safeHeight;
    
    mode6State.sequence = [];
    
    // Generate positions in a cluster around center
    for (var i = 0; i < length; i++) {
        var angle = (i / length) * Math.PI * 2 + Math.random() * 0.5;
        var dist = spread * (0.5 + Math.random() * 0.5);
        
        mode6State.sequence.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            size: size,
            index: i
        });
    }
    
    mode6State.displayIndex = 0;
    mode6State.displayTimer = 0;
    mode6State.currentIndex = 0;
    mode6State.phase = 'display';
    mode6State.spawnTime = performance.now();
}

function updateMode6(timestamp, dt) {
    var params = CFG.mode6.params;
    
    // Waiting phase (1 second pause between sequences)
    if (mode6State.phase === 'waiting') {
        mode6State.waitTimer -= dt;
        if (mode6State.waitTimer <= 0) {
            generateSequence();
        }
        return;
    }
    
    // Complete phase (show all completed targets briefly)
    if (mode6State.phase === 'complete') {
        mode6State.completeTimer -= dt;
        if (mode6State.completeTimer <= 0) {
            mode6State.phase = 'waiting';
            mode6State.waitTimer = 1000;
        }
        return;
    }
    
    if (mode6State.phase === 'display') {
        mode6State.displayTimer += dt;
        var displayTime = getScaledValue(params.displayTime);
        
        if (mode6State.displayTimer >= displayTime) {
            mode6State.displayTimer = 0;
            mode6State.displayIndex++;
            
            if (mode6State.displayIndex >= mode6State.sequence.length) {
                mode6State.phase = 'delay';
                mode6State.delayTimer = getScaledValue(params.delayBeforeRecall);
            }
            playSound('click');
        }
    } else if (mode6State.phase === 'delay') {
        mode6State.delayTimer -= dt;
        if (mode6State.delayTimer <= 0) {
            mode6State.phase = 'recall';
            mode6State.currentIndex = 0;
        }
    }
}

function handleMode6Click() {
    if (mode6State.phase !== 'recall') return;
    
    var params = CFG.mode6.params;
    var tolerance = getScaledValue(params.positionTolerance);
    var target = mode6State.sequence[mode6State.currentIndex];
    
    if (!target) return;
    
    var dist = getDistance(mouseX, mouseY, target.x, target.y);
    
    if (dist <= tolerance) {
        mode6State.currentIndex++;
        playSound('hit');
        
        if (mode6State.currentIndex >= mode6State.sequence.length) {
            var rt = performance.now() - mode6State.spawnTime;
            recordTrialResult(true, rt);
            sessionStats.perfectTrials++;
            
            // FIXED: Show completion feedback before next sequence
            mode6State.phase = 'complete';
            mode6State.completeTimer = 500;  // 0.5 second to see all green targets
        }
    } else {
        recordTrialResult(false);
        sessionStats.sequenceErrors++;
        flashEffect('penalty', 'WRONG ORDER');
        playSound('error');
        
        // Immediate wait after failure
        mode6State.phase = 'waiting';
        mode6State.waitTimer = 1000;
    }
}

// ==================== MODE 7: COGNITIVE SWITCH ====================
function initMode7() {
    mode7State = {
        rule: 'cold',
        switchTimer: getScaledValue(CFG.mode7.params.switchInterval),
        warningActive: false,
        targets: [],
        nextSpawnTimer: 500
    };
}

function spawnMode7Target() {
    var params = CFG.mode7.params;
    var margin = 100;
    var w = canvasWidth;
    var h = canvasHeight;
    
    var isInhibit = Math.random() < getScaledValue(params.inhibitionRatio);
    
    var color;
    if (mode7State.rule === 'cold') {
        color = isInhibit ? 'green' : 'red';
    } else {
        color = isInhibit ? 'red' : 'green';
    }
    
    var speed = getScaledValue(params.moveSpeed);
    
    mode7State.targets.push({
        x: margin + Math.random() * (w - margin * 2),
        y: margin + Math.random() * (h - margin * 2),
        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 0.5) * speed * 2,
        size: getScaledValue(params.targetSize),
        color: color,
        shouldShoot: !isInhibit,
        spawnTime: performance.now()
    });
}

function updateMode7(timestamp, dt) {
    var params = CFG.mode7.params;
    
    // Rule switch timer
    mode7State.switchTimer -= dt;
    var warningTime = getScaledValue(params.warningTime);
    
    if (mode7State.switchTimer <= warningTime && !mode7State.warningActive) {
        mode7State.warningActive = true;
        playSound('lock');
    }
    
    if (mode7State.switchTimer <= 0) {
        mode7State.rule = mode7State.rule === 'cold' ? 'warm' : 'cold';
        mode7State.switchTimer = getScaledValue(params.switchInterval);
        mode7State.warningActive = false;
        
        // Update existing targets' shouldShoot status
        for (var i = 0; i < mode7State.targets.length; i++) {
            var t = mode7State.targets[i];
            if (mode7State.rule === 'cold') {
                t.shouldShoot = t.color === 'red';
            } else {
                t.shouldShoot = t.color === 'green';
            }
        }
        
        flashEffect('warn', 'RULE SWITCH');
        playSound('click');
    }
    
    // Spawn new targets
    mode7State.nextSpawnTimer -= dt;
    if (mode7State.nextSpawnTimer <= 0) {
        spawnMode7Target();
        mode7State.nextSpawnTimer = getScaledValue(params.targetFrequency);
    }
    
    // Update target positions
    for (var i = 0; i < mode7State.targets.length; i++) {
        var t = mode7State.targets[i];
        t.x += t.vx * (dt / 16.67);
        t.y += t.vy * (dt / 16.67);
        
        var margin = 50;
        if (t.x < margin || t.x > canvasWidth - margin) t.vx *= -1;
        if (t.y < margin || t.y > canvasHeight - margin) t.vy *= -1;
    }
    
    // Remove old targets (timeout)
    var now = performance.now();
    var newTargets = [];
    for (var i = 0; i < mode7State.targets.length; i++) {
        var t = mode7State.targets[i];
        var age = now - t.spawnTime;
        if (age > 4000) {
            if (t.shouldShoot) {
                recordTrialResult(false);
                playSound('miss');
            } else {
                recordTrialResult(true);
                sessionStats.inhibitionSuccess++;
            }
        } else {
            newTargets.push(t);
        }
    }
    mode7State.targets = newTargets;
}

function handleMode7Click() {
    // Find clicked target
    for (var i = mode7State.targets.length - 1; i >= 0; i--) {
        var t = mode7State.targets[i];
        var dist = getDistance(mouseX, mouseY, t.x, t.y);
        
        if (dist <= t.size + 5) {
            if (t.shouldShoot) {
                var rt = performance.now() - t.spawnTime;
                recordTrialResult(true, rt);
                playSound('hit');
            } else {
                recordTrialResult(false);
                sessionStats.switchErrors++;
                flashEffect('penalty', 'WRONG TARGET');
                playSound('penalty');
            }
            mode7State.targets.splice(i, 1);
            return;
        }
    }
}