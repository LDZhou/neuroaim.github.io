// ==================== RENDERER ====================
// All canvas drawing functions for 7 modes
// UPDATED: Mode 1 Gabor Logic (Global Contrast), Mode 7 Dual-Border System

// ===== MODE 1: GABOR =====
function drawMode1(ctx) {
    var t = mode1State.target;
    if (!t) return;
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    // Gabor Theory Update:
    // To train V1, the target shouldn't just fade out (which might make it pop if noise is dark).
    // Instead, we render the target first, and then allow the NoiseSystem to render ON TOP of it.
    // The difficulty (t.contrast) should control how distinct the Gabor patch is relative to the background.
    
    // 1. Draw Target (Base contrast controlled by difficulty)
    // We use 'destination-over' or just draw before noise if noise has alpha.
    // Assuming NoiseSystem.draw() is called AFTER this in game-engine.js.
    
    drawGaborPatch(ctx, t.x, t.y, t.size, true, t.contrast);
}

function drawGaborPatch(ctx, x, y, size, isVertical, contrast) {
    ctx.save();
    
    // Contrast Handling:
    // High difficulty = Low contrast. 
    // We map contrast (1.0 to 0.15) directly to globalAlpha.
    // CRITICAL CHANGE: The Noise System must also be drawn with parameters that make separation hard.
    // For now, making the target faint is correct, BUT the noise must visually compete with it.
    
    ctx.globalAlpha = Math.max(contrast, 0.05); // Allow going very faint
    
    // Gabor Patch color - Neutral Grey to blend with noise
    ctx.strokeStyle = 'rgba(180, 180, 180, 1.0)';
    ctx.lineWidth = 3;
    
    // Gaussian Window (The "Patch" part)
    // Create a radial gradient to mask the edges softly
    var g = ctx.createRadialGradient(x, y, 0, x, y, size);
    g.addColorStop(0, 'rgba(128, 128, 128, 1)'); // Opaque center
    g.addColorStop(0.5, 'rgba(128, 128, 128, 0.5)'); 
    g.addColorStop(1, 'rgba(128, 128, 128, 0)');   // Transparent edge
    
    // We draw the grating pattern masked by this gradient
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI*2);
    ctx.clip(); // Clip drawing to the circle
    
    var step = 6;
    var drawSize = size;
    
    ctx.beginPath();
    for (var i = -drawSize; i < drawSize; i += step) {
        if (isVertical) {
            ctx.moveTo(x + i, y - drawSize);
            ctx.lineTo(x + i, y + drawSize);
        } else {
            ctx.moveTo(x - drawSize, y + i);
            ctx.lineTo(x + drawSize, y + i);
        }
    }
    ctx.stroke();
    
    ctx.restore();
}

// ===== MODE 2: TRACKING =====
function drawMode2(ctx) {
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    var t = mode2State.target;
    var ag = mode2State.afterGaze;
    
    if (ag) {
        var params = CFG.mode2.params;
        var radius = getScaledValue(params.gazeRadius);
        var elapsed = performance.now() - ag.startTime;
        var total = getScaledValue(params.afterGazeTime);
        var progress = Math.min(1, elapsed / total);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(ag.x, ag.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = ag.broken ? 'rgba(255, 100, 100, 0.4)' : 'rgba(0, 255, 150, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(ag.x, ag.y, radius - 5, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * (1 - progress));
        ctx.strokeStyle = ag.broken ? '#ff6666' : '#00ff99';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ag.x, ag.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = ag.broken ? '#ff6666' : '#00ff99';
        ctx.fill();
        ctx.font = '11px JetBrains Mono';
        ctx.fillStyle = ag.broken ? '#ff6666' : '#00ff99';
        ctx.textAlign = 'center';
        ctx.fillText(ag.broken ? 'GAZE BROKEN' : 'HOLD STEADY', ag.x, ag.y + radius + 20);
        ctx.restore();
        return;
    }
    
    if (!t) return;
    var color = mode2State.isLocked ? '#00ff99' : '#00d9ff';
    var lockTime = getScaledValue(CFG.mode2.params.lockTime);
    var progress = mode2State.trackProgress / lockTime;
    
    ctx.save();
    ctx.shadowBlur = mode2State.isLocked ? 25 : 12;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (progress > 0) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * progress);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    // VISUAL FEEDBACK FOR CONTINUOUS SCORING
    // If tracking, show small +1 particles or glow intensity change
    if (mode2State.isLocked) {
        ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.02) * 0.2;
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = '#00ff99';
        ctx.fillText('+TRACKING', t.x, t.y - t.size - 10);
    }
    
    ctx.restore();
}

// ===== MODE 3: SURGICAL =====
function drawMode3(ctx) {
    var t = mode3State.target;
    if (!t) return;
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.penaltySize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 217, 255, 0.15)'; 
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.4)'; 
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(t.coreX, t.coreY, t.coreSize, 0, Math.PI * 2);
    ctx.fillStyle = '#00d9ff';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 20;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(t.coreX, t.coreY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();
}

// ===== MODE 4: LANDOLT =====
function drawMode4(ctx) {
    if (mode4State.phase === 'reset') {
        var cx = canvasWidth / 2;
        var cy = canvasHeight / 2;
        var radius = 40;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 217, 255, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#00d9ff';
        ctx.shadowColor = '#00d9ff';
        ctx.shadowBlur = 20;
        ctx.fill();
        var pulse = (performance.now() % 1500) / 1500;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + pulse * 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 217, 255, ' + (0.5 * (1 - pulse)) + ')';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillStyle = '#00d9ff';
        ctx.textAlign = 'center';
        ctx.fillText('CLICK TO START', cx, cy + radius + 30);
        ctx.restore();
        return;
    }
    var t = mode4State.target;
    if (!t) return;
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    ctx.save();
    ctx.globalAlpha = Math.max(t.contrast, 0.4);
    ctx.strokeStyle = '#00d9ff';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = Math.max(t.size * 0.2, 3);
    var gapSize = Math.PI / 5;
    var offset = t.gapDir * (Math.PI / 2);
    var startAngle = offset + gapSize / 2;
    var endAngle = offset + Math.PI * 2 - gapSize / 2;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size / 2, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();
}

// ===== MODE 5: PARAFOVEAL =====
function drawMode5(ctx) {
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    var p = mode5State.primary;
    var g = mode5State.ghost;
    
    if (p) {
        var tracking = mode5State.trackingPrimary;
        var color = tracking ? '#00ff99' : '#00d9ff';
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (tracking) {
            ctx.strokeStyle = 'rgba(0, 255, 150, 0.4)';
        } else {
            ctx.strokeStyle = 'rgba(0, 217, 255, 0.4)';
        }
        ctx.lineWidth = 2;
        ctx.stroke();
        
        var radius = p.size + 15;
        var startAngle = Math.PI * 0.7;
        var endAngle = Math.PI * 2.3;
        var range = endAngle - startAngle;
        var currentEnd = startAngle + range * mode5State.integrity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, startAngle, currentEnd);
        ctx.strokeStyle = mode5State.integrity > 0.5 ? '#00d9ff' : '#ff3366';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('INTEGRITY', p.x, p.y + p.size + 30);
        ctx.restore();
    }
    
    if (g) {
        var color = g.isBlue ? '#3366ff' : '#ff3366';
        var elapsed = performance.now() - g.spawnTime;
        var fadeIn = Math.min(1, elapsed / 150);
        var fadeOut = Math.max(0, 1 - (elapsed - (g.duration - 200)) / 200);
        var alpha = Math.min(fadeIn, fadeOut);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 25;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        var pulse = Math.sin(elapsed * 0.015) * 0.3 + 0.7;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size + 10, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha * pulse * 0.5;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

// ===== MODE 6: MEMORY =====
function drawMode6(ctx) {
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    var seq = mode6State.sequence;
    var phase = mode6State.phase;
    
    ctx.save();
    
    if (phase === 'display') {
        if (mode6State.displayIndex < seq.length) {
            var t = seq[mode6State.displayIndex];
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            ctx.fillStyle = '#00d9ff';
            ctx.shadowColor = '#00d9ff';
            ctx.shadowBlur = 30;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.font = 'bold 20px Orbitron';
            ctx.fillStyle = '#0a0a0f';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(mode6State.displayIndex + 1, t.x, t.y);
        }
        ctx.font = '14px JetBrains Mono';
        ctx.fillStyle = '#00d9ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('MEMORIZE: ' + (mode6State.displayIndex + 1) + '/' + seq.length, canvasWidth / 2, 80);
    } else if (phase === 'delay') {
        ctx.font = '24px Orbitron';
        ctx.fillStyle = '#ffcc00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RECALL IN...', canvasWidth / 2, canvasHeight / 2);
    } else if (phase === 'recall' || phase === 'next_round') {
        for (var i = 0; i < seq.length; i++) {
            var t = seq[i];
            var isDone = i < mode6State.currentIndex;
            if (isDone) {
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 255, 150, 0.3)';
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '12px Orbitron';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(i + 1, t.x, t.y);
            }
        }
        if (phase === 'next_round') {
             ctx.font = '24px Orbitron';
             ctx.fillStyle = '#00ff99';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText('SEQUENCE COMPLETE', canvasWidth / 2, canvasHeight / 2 - 50);
             var barW = 200;
             var barH = 4;
             var progress = mode6State.nextRoundTimer / 1000;
             ctx.fillStyle = 'rgba(255,255,255,0.2)';
             ctx.fillRect(canvasWidth/2 - barW/2, canvasHeight/2 - 20, barW, barH);
             ctx.fillStyle = '#00ff99';
             ctx.fillRect(canvasWidth/2 - barW/2, canvasHeight/2 - 20, barW * progress, barH);
        } else {
             ctx.font = '14px JetBrains Mono';
             ctx.fillStyle = '#00d9ff';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'top';
             ctx.fillText('RECALL: ' + mode6State.currentIndex + '/' + seq.length, canvasWidth / 2, 80);
        }
    }
    ctx.restore();
}

// ===== MODE 7: SWITCH (DUAL BORDER + BOTTOM HUD) =====
function drawMode7(ctx) {
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    var targets = mode7State.targets;
    var rule = mode7State.rule;
    var isWarm = rule === 'warm';
    
    ctx.save();
    var ruleColor = isWarm ? '#ff8844' : '#4488ff'; // Rule Env Color (Background Hint)
    var targetColor = isWarm ? '#00ff99' : '#ff3366'; // Target Color (Direct Cue)
    
    var pulse = 0;
    // Pulse logic
    if (mode7State.switchTimer > CFG.mode7.params.switchInterval - 300) {
        pulse = 1.0; // Fresh switch pulse
    } else if (mode7State.warningActive) {
        pulse = Math.sin(performance.now() * 0.02) * 0.5 + 0.5; // Warning pulse
    }
    
    // 1. Dual Border Indicator
    // Inner Border: Rule Color (Ambient)
    ctx.lineWidth = 10;
    ctx.strokeStyle = ruleColor;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);
    
    // Outer Border: TARGET Color (Actionable) - NEW
    ctx.lineWidth = 15 + (pulse * 10);
    ctx.strokeStyle = targetColor;
    ctx.globalAlpha = 0.8 + (pulse * 0.2);
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
    
    // 2. HUD Rule Indicator (BOTTOM)
    var hudW = 320;
    var hudH = 50;
    var hudX = canvasWidth / 2 - hudW / 2;
    var hudY = canvasHeight - 80; 
    
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'rgba(10, 15, 20, 0.9)';
    ctx.strokeStyle = targetColor; // Border matches target
    ctx.lineWidth = 3;
    
    // Pill shape
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 10);
    ctx.fill();
    ctx.stroke();
    
    var ruleText = isWarm ? 'SHOOT GREEN' : 'SHOOT RED';
    
    ctx.fillStyle = targetColor;
    ctx.font = 'bold 20px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = targetColor;
    ctx.shadowBlur = 15;
    ctx.fillText(ruleText, canvasWidth / 2, hudY + hudH / 2);
    ctx.shadowBlur = 0;
    
    // 3. GIANT COUNTDOWN (Priming Color)
    if (mode7State.warningActive) {
        var secondsLeft = Math.ceil(mode7State.switchTimer / 1000);
        
        // Show 3, 2, 1
        if (secondsLeft <= 4 && secondsLeft > 0) { // Updated to 4s to match config
            // Determine NEXT rule to prime color
            var nextIsWarm = !isWarm;
            var nextTargetColor = nextIsWarm ? '#00ff99' : '#ff3366'; // Green vs Red
            
            ctx.save();
            ctx.fillStyle = nextTargetColor;
            ctx.font = 'bold 150px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = nextTargetColor;
            ctx.shadowBlur = 40;
            ctx.globalAlpha = 0.8 + (Math.sin(performance.now() * 0.02) * 0.2);
            
            ctx.fillText(secondsLeft, canvasWidth / 2, canvasHeight / 2);
            
            ctx.font = 'bold 24px JetBrains Mono';
            ctx.fillStyle = '#fff';
            ctx.fillText('SWITCHING...', canvasWidth / 2, canvasHeight / 2 + 100);
            ctx.restore();
        }
    }
    
    ctx.restore();
    
    // 4. Targets
    ctx.save();
    for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        var color = t.color === 'red' ? '#ff3366' : '#00ff99';
        
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}

function drawCrosshair(ctx, mx, my) {
    if (mx === undefined || my === undefined) return;
    var type = settings.crosshair || 'cross';
    var scale = settings.crosshairScale || 1;
    var color = '#00d9ff';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    if (type === 'cross') {
        var len = 10 * scale;
        var gap = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(mx - len, my); ctx.lineTo(mx - gap, my);
        ctx.moveTo(mx + gap, my); ctx.lineTo(mx + len, my);
        ctx.moveTo(mx, my - len); ctx.lineTo(mx, my - gap);
        ctx.moveTo(mx, my + gap); ctx.lineTo(mx, my + len);
        ctx.stroke();
    } else if (type === 'dot') {
        ctx.beginPath();
        ctx.arc(mx, my, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'circle') {
        ctx.beginPath();
        ctx.arc(mx, my, 12 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mx, my, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.moveTo(mx - 10, my); ctx.lineTo(mx + 10, my);
        ctx.moveTo(mx, my - 10); ctx.lineTo(mx, my + 10);
        ctx.stroke();
    }
}

function drawCrosshairAt(ctx, x, y, type, scale) {
    if (x === undefined || y === undefined) return;
    var color = '#00d9ff';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    if (type === 'cross') {
        var len = 10 * scale;
        var gap = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(x - len, y); ctx.lineTo(x - gap, y);
        ctx.moveTo(x + gap, y); ctx.lineTo(x + len, y);
        ctx.moveTo(x, y - len); ctx.lineTo(x, y - gap);
        ctx.moveTo(x, y + gap); ctx.lineTo(x, y + len);
        ctx.stroke();
    } else if (type === 'dot') {
        ctx.beginPath();
        ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'circle') {
        ctx.beginPath();
        ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
}