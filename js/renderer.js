// ==================== RENDERER ====================
// All canvas drawing functions

// Draw background based on settings
function drawBackground(ctx, width, height) {
    if (settings.visualNoise === 'chaos') {
        if (!chaosNoiseGenerated) {
            generateChaosNoise(width, height);
        }
        ctx.drawImage(chaosNoiseCanvas, 0, 0);
    } else if (settings.visualNoise === 'clean') {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
    } else if (settings.visualNoise === 'grid') {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#0f0f18';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < width; i += 80) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
        }
        for (let i = 0; i < height; i += 80) {
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
        }
        ctx.stroke();
    }
}

// Draw Mode 1: Gabor target with adaptive contrast
function drawGaborTarget(ctx) {
    const x = target.x, y = target.y, size = CFG.gaborSize;
    
    ctx.save();
    
    // Apply adaptive contrast if enabled
    if (settings.adaptiveContrast) {
        ctx.globalAlpha = target.contrast;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.fillStyle = '#000';
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
    
    // Draw Gabor stripes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 3;
    const step = 8;
    const isVertical = target.type === 0;  // Enemy = vertical
    
    for (let i = -size; i < size; i += step) {
        ctx.beginPath();
        if (isVertical) {
            ctx.moveTo(x + i, y - size);
            ctx.lineTo(x + i, y + size);
        } else {
            ctx.moveTo(x - size, y + i);
            ctx.lineTo(x + size, y + i);
        }
        ctx.stroke();
    }
    
    // Gaussian envelope
    const g = ctx.createRadialGradient(x, y, 0, x, y, size);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = g;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
    ctx.restore();
    
    // Draw red dot center (if enabled)
    if (settings.showRedDot) {
        ctx.beginPath();
        ctx.arc(x, y, CFG.microDotSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3366';
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Draw Mode 2: Tracking target with lock ring
function drawTrackingTarget(ctx) {
    const x = target.x, y = target.y;
    const p = target.trackProgress;
    const color = p >= 1 ? '#00ff99' : '#ffcc00';
    
    // Background ring
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Progress ring
    ctx.beginPath();
    ctx.arc(x, y, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Center dot
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = p >= 1 ? 20 : 5;
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Draw Mode 3: Surgical precision target
function drawSurgicalTarget(ctx) {
    const x = target.x, y = target.y;
    const coreSize = CFG.surgical.coreSize;
    const penaltySize = CFG.surgical.penaltySize;
    
    // Draw penalty halo (red zone)
    ctx.beginPath();
    ctx.arc(x, y, penaltySize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 50, 80, 0.12)';
    ctx.strokeStyle = 'rgba(255, 50, 80, 0.35)';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    
    // Inner warning ring
    ctx.beginPath();
    ctx.arc(x, y, penaltySize * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 50, 80, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw core target (cyan)
    ctx.beginPath();
    ctx.arc(x, y, coreSize, 0, Math.PI * 2);
    ctx.fillStyle = '#00d9ff';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Tiny dot in center for extra precision reference
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
}

// Draw after-gaze hold indicator
function drawAfterGaze(ctx) {
    const progress = (performance.now() - target.deadTime) / CFG.afterGazeTime;
    const x = target.deadX, y = target.deadY;
    const radius = 40 * (1 - progress * 0.5);
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,217,255,' + (0.8 - progress * 0.5) + ')';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Progress arc
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.strokeStyle = '#00ff99';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.font = '10px Orbitron';
    ctx.fillStyle = 'rgba(0,217,255,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('HOLD', x, y - 55);
}

// Draw crosshair at current mouse position
function drawCrosshair(ctx, mx, my) {
    drawCrosshairAt(ctx, mx, my, settings.crosshair, settings.crosshairScale);
}

// Draw crosshair at specific position (used for preview too)
function drawCrosshairAt(ctx, x, y, type, scale) {
    const color = '#00d9ff';
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    
    switch (type) {
        case 'cross': {
            const len = 10 * scale;
            const gap = 3 * scale;
            ctx.beginPath();
            ctx.moveTo(x - len, y); ctx.lineTo(x - gap, y);
            ctx.moveTo(x + gap, y); ctx.lineTo(x + len, y);
            ctx.moveTo(x, y - len); ctx.lineTo(x, y - gap);
            ctx.moveTo(x, y + gap); ctx.lineTo(x, y + len);
            ctx.stroke();
            break;
        }
        case 'dot': {
            ctx.beginPath();
            ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case 'circle': {
            ctx.beginPath();
            ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, 1.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case 'chevron': {
            const h = 8 * scale;
            const w = 6 * scale;
            ctx.beginPath();
            ctx.moveTo(x - w, y - h);
            ctx.lineTo(x, y);
            ctx.lineTo(x + w, y - h);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y + 2 * scale, 1 * scale, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case 'crossdot': {
            const l = 12 * scale;
            ctx.beginPath();
            ctx.moveTo(x - l, y); ctx.lineTo(x + l, y);
            ctx.moveTo(x, y - l); ctx.lineTo(x, y + l);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 1, y - 1, 2, 2);
            break;
        }
        default: {
            ctx.beginPath();
            ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y);
            ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10);
            ctx.stroke();
        }
    }
}
