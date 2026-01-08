// ==================== RENDERER ====================
// All canvas drawing functions for 7 modes
// Each draw function ONLY draws its own mode's state

// ===== MODE 1: GABOR =====
function drawMode1(ctx) {
    var t = mode1State.target;
    if (!t) return;
    
    // Check strobe blind phase
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    drawGaborPatch(ctx, t.x, t.y, t.size, true, t.contrast);
}

function drawGaborPatch(ctx, x, y, size, isVertical, contrast) {
    ctx.save();
    ctx.globalAlpha = Math.max(contrast, 0.15);
    
    ctx.strokeStyle = 'rgb(180, 180, 180)';
    ctx.lineWidth = 3;
    
    var step = 6;
    var drawSize = size * 1.2;
    
    for (var i = -drawSize; i < drawSize; i += step) {
        ctx.beginPath();
        if (isVertical) {
            ctx.moveTo(x + i, y - drawSize);
            ctx.lineTo(x + i, y + drawSize);
        } else {
            ctx.moveTo(x - drawSize, y + i);
            ctx.lineTo(x + drawSize, y + i);
        }
        ctx.stroke();
    }
    
    // Gaussian mask
    ctx.globalCompositeOperation = 'destination-in';
    var g = ctx.createRadialGradient(x, y, 0, x, y, size);
    g.addColorStop(0, 'rgba(0, 0, 0, 1)');
    g.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - drawSize, y - drawSize, drawSize * 2, drawSize * 2);
    ctx.globalCompositeOperation = 'source-over';
    
    ctx.restore();
}

// ===== MODE 2: TRACKING =====
function drawMode2(ctx) {
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    var t = mode2State.target;
    var ag = mode2State.afterGaze;
    
    // Draw afterGaze zone
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
        
        // Progress ring
        ctx.beginPath();
        ctx.arc(ag.x, ag.y, radius - 5, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * (1 - progress));
        ctx.strokeStyle = ag.broken ? '#ff6666' : '#00ff99';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Center dot
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
    
    // Core
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Outer ring
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Progress arc
    if (progress > 0) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * progress);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    ctx.restore();
}

// ===== MODE 3: SURGICAL =====
function drawMode3(ctx) {
    var t = mode3State.target;
    if (!t) return;
    
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    ctx.save();
    
    // Penalty zone
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.penaltySize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 50, 80, 0.12)';
    ctx.strokeStyle = 'rgba(255, 50, 80, 0.5)';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    
    // Core
    ctx.beginPath();
    ctx.arc(t.coreX, t.coreY, t.coreSize, 0, Math.PI * 2);
    ctx.fillStyle = '#00d9ff';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 20;
    ctx.fill();
    
    // Core center
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
        // Draw center reset button
        var cx = canvasWidth / 2;
        var cy = canvasHeight / 2;
        var radius = 40;
        
        ctx.save();
        
        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 217, 255, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#00d9ff';
        ctx.shadowColor = '#00d9ff';
        ctx.shadowBlur = 20;
        ctx.fill();
        
        // Pulse
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
    
    // Landolt C with gap
    var gapSize = Math.PI / 5;
    var offset = t.gapDir * (Math.PI / 2);
    var startAngle = offset + gapSize / 2;
    var endAngle = offset + Math.PI * 2 - gapSize / 2;
    
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size / 2, startAngle, endAngle);
    ctx.stroke();
    
    ctx.restore();
}

// ===== MODE 5: PARAFOVEAL GHOST =====
function drawMode5(ctx) {
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    var p = mode5State.primary;
    var g = mode5State.ghost;
    
    // Draw primary target
    if (p) {
        var tracking = mode5State.trackingPrimary;
        var color = tracking ? '#00ff99' : '#00d9ff';
        
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        
        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Outer ring
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
        
        // Label
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('PRIMARY', p.x, p.y + p.size + 20);
        
        ctx.restore();
    }
    
    // Draw ghost
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
        
        // Ghost shape
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Pulsing outer ring
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

// ===== MODE 6: MEMORY SEQUENCER =====
function drawMode6(ctx) {
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    var seq = mode6State.sequence;
    var phase = mode6State.phase;
    
    ctx.save();
    
    if (phase === 'display') {
        // Show current target in sequence
        if (mode6State.displayIndex < seq.length) {
            var t = seq[mode6State.displayIndex];
            
            // Highlight current
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            ctx.fillStyle = '#00d9ff';
            ctx.shadowColor = '#00d9ff';
            ctx.shadowBlur = 30;
            ctx.fill();
            
            // Number
            ctx.shadowBlur = 0;
            ctx.font = 'bold 20px Orbitron';
            ctx.fillStyle = '#0a0a0f';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(mode6State.displayIndex + 1, t.x, t.y);
        }
        
        // Progress indicator
        ctx.font = '14px JetBrains Mono';
        ctx.fillStyle = '#00d9ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('MEMORIZE: ' + (mode6State.displayIndex + 1) + '/' + seq.length, canvasWidth / 2, 80);
        
    } else if (phase === 'delay') {
        // Blank screen with countdown
        ctx.font = '24px Orbitron';
        ctx.fillStyle = '#ffcc00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RECALL IN...', canvasWidth / 2, canvasHeight / 2);
        
    } else if (phase === 'recall') {
        // Show ghost positions
        for (var i = 0; i < seq.length; i++) {
            var t = seq[i];
            var isNext = i === mode6State.currentIndex;
            var isDone = i < mode6State.currentIndex;
            
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            
            if (isDone) {
                ctx.fillStyle = 'rgba(0, 255, 150, 0.3)';
                ctx.fill();
            } else if (isNext) {
                ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        
        // Progress indicator
        ctx.font = '14px JetBrains Mono';
        ctx.fillStyle = '#00d9ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('RECALL: ' + mode6State.currentIndex + '/' + seq.length, canvasWidth / 2, 80);
    }
    
    ctx.restore();
}

// ===== MODE 7: COGNITIVE SWITCH =====
function drawMode7(ctx) {
    if (currentStrobeEnabled && typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;
    
    var targets = mode7State.targets;
    var rule = mode7State.rule;
    
    // Background color based on rule
    var isWarm = rule === 'warm';
    if (isWarm) {
        ctx.fillStyle = 'rgba(80, 40, 20, 0.3)';
    } else {
        ctx.fillStyle = 'rgba(20, 40, 80, 0.3)';
    }
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Warning pulse
    if (mode7State.warningActive) {
        var pulse = Math.sin(performance.now() * 0.01) * 0.5 + 0.5;
        ctx.fillStyle = 'rgba(255, 200, 0, ' + (pulse * 0.15) + ')';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    ctx.save();
    
    // Draw targets
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
    
    // Rule indicator
    var ruleColor = isWarm ? '#ff8844' : '#4488ff';
    var shootColor = isWarm ? '#00ff99' : '#ff3366';
    var shootLabel = isWarm ? 'GREEN' : 'RED';
    
    ctx.font = 'bold 14px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = ruleColor;
    ctx.fillText('RULE: ' + rule.toUpperCase(), canvasWidth / 2, 50);
    
    ctx.font = '12px JetBrains Mono';
    ctx.fillStyle = shootColor;
    ctx.fillText('SHOOT: ' + shootLabel, canvasWidth / 2, 70);
    
    // Warning indicator
    if (mode7State.warningActive) {
        ctx.font = 'bold 16px Orbitron';
        ctx.fillStyle = '#ffcc00';
        var blink = Math.sin(performance.now() * 0.02) > 0;
        if (blink) {
            ctx.fillText('⚠ SWITCH INCOMING ⚠', canvasWidth / 2, canvasHeight - 50);
        }
    }
    
    ctx.restore();
}

// ===== CROSSHAIR =====
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