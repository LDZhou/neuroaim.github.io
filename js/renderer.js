// ==================== RENDERER ====================
// All canvas drawing functions

function drawBackground(ctx, width, height) {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);
}

function drawNoiseLayer(ctx) {
    if (typeof NoiseSystem !== 'undefined') {
        NoiseSystem.draw(ctx);
    }
}

// SHARED GABOR RENDERER
function drawGaborStruct(ctx, x, y, size, isVertical, opacity) {
    if (typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;

    const safeOpacity = Math.max(opacity, 0.1); 
    ctx.save();
    ctx.globalAlpha = safeOpacity;
    
    const baseColor = '150, 150, 150'; 

    ctx.beginPath();
    ctx.strokeStyle = `rgb(${baseColor})`; 
    ctx.lineWidth = 3;
    const step = 6;
    const drawSize = size * 1.2; 
    
    for (let i = -drawSize; i < drawSize; i += step) {
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
    
    ctx.globalCompositeOperation = 'destination-in';
    const g = ctx.createRadialGradient(x, y, 0, x, y, size);
    g.addColorStop(0, 'rgba(0, 0, 0, 1)');
    g.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = g;
    ctx.fillRect(x - drawSize, y - drawSize, drawSize * 2, drawSize * 2);
    ctx.globalCompositeOperation = 'source-over';
    
    ctx.restore();
}

// Mode 1: Gabor Target
function drawGaborTarget(ctx) {
    const t = window.target;
    if(!t) return;
    let contrast = 1.0;
    if (settings.adaptiveContrast) contrast = t.contrast;
    drawGaborStruct(ctx, t.x, t.y, CFG.gaborSize, t.type === 0, contrast);
}

// Mode 2: PURE TRACKING TARGET
function drawTrackingTarget(ctx) {
    const t = window.target;
    if(!t) return;
    
    const x = t.x, y = t.y;
    const size = CFG.tracking.targetSize;
    const color = t.isLocked ? '#00ff99' : '#00d9ff';
    
    ctx.save();
    ctx.shadowBlur = t.isLocked ? 20 : 10;
    ctx.shadowColor = color;
    
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0; 
    
    const p = t.trackProgress; 
    const lockThresh = CFG.tracking.lockThreshold;
    const pct = Math.min(1, p / lockThresh);
    
    // Outer static ring
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Progress ring
    if (pct > 0) {
        ctx.beginPath();
        ctx.arc(x, y, size, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * pct));
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    ctx.restore();
}

// Mode 3: Surgical Target
function drawSurgicalTarget(ctx) {
    const t = window.target;
    if(!t) return;
    if (typeof NoiseSystem !== 'undefined' && NoiseSystem.isBlindPhase) return;

    const x = t.x, y = t.y;
    const coreSize = CFG.surgical.coreSize;
    const penaltySize = CFG.surgical.penaltySize;
    
    ctx.beginPath();
    ctx.arc(x, y, penaltySize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 50, 80, 0.12)';
    ctx.strokeStyle = 'rgba(255, 50, 80, 0.35)';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, coreSize, 0, Math.PI * 2);
    ctx.fillStyle = '#00d9ff';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Mode 4: Landolt C
function drawLandoltTarget(ctx) {
    const t = window.target;
    if(!t) return;

    if (t.isResetPoint) {
        // Draw Center Reset Indicator
        const cx = window.canvasWidth / 2;
        const cy = window.canvasHeight / 2;
        
        ctx.save();
        // Inner dot
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00d9ff'; 
        ctx.shadowColor = '#00d9ff';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Pulse ring
        const pulse = (performance.now() % 1000) / 1000;
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + pulse * 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 217, 255, ${1 - pulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.font = '12px JetBrains Mono';
        ctx.fillStyle = '#00d9ff';
        ctx.textAlign = 'center';
        ctx.fillText("RESET", cx, cy + 40);
        ctx.restore();
        return;
    }

    // Actual Target
    const { x, y, size, gapDir, contrast } = t;
    
    ctx.save();
    ctx.globalAlpha = contrast;
    
    const color = '#00d9ff'; 
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.25; 
    
    const gapSize = Math.PI / 3; 
    let startAngle = 0;
    let endAngle = 0;
    
    // gapDir: 0:Right, 1:Down, 2:Left, 3:Up
    const offset = gapDir * (Math.PI / 2);
    startAngle = offset + gapSize / 2;
    endAngle = offset + (Math.PI * 2) - gapSize / 2;
    
    ctx.beginPath();
    ctx.arc(x, y, size/2, startAngle, endAngle);
    ctx.stroke();
    
    ctx.restore();
}


function drawAfterGaze(ctx) {
    const t = window.target;
    if(!t) return;
    
    const progress = (performance.now() - t.deadTime) / CFG.afterGazeTime;
    const x = t.deadX, y = t.deadY;
    const radius = 40 * (1 - progress * 0.5);
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,217,255,' + (0.8 - progress * 0.5) + ')';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawCrosshair(ctx, mx, my) {
    drawCrosshairAt(ctx, mx, my, settings.crosshair, settings.crosshairScale);
}

function drawCrosshairAt(ctx, x, y, type, scale) {
    const color = '#00d9ff'; 
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    
    // Default fallback
    if (x === undefined || y === undefined) return;

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