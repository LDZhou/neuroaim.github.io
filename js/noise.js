// ==================== NOISE SYSTEM ====================
// Dynamic visual noise for V1 cortex training

// Static chaos noise (for background setting)
let chaosNoiseCanvas = document.createElement('canvas');
let chaosNoiseCtx = chaosNoiseCanvas.getContext('2d');
let chaosNoiseGenerated = false;

// Dynamic pink noise texture (for Mode 1 overlay)
let pinkNoiseCanvas = document.createElement('canvas');
let pinkNoiseCtx = pinkNoiseCanvas.getContext('2d');
const NOISE_SIZE = 512;  // Fixed size texture for performance

// Initialize pink noise texture (1/f noise approximation)
function initPinkNoiseTexture() {
    pinkNoiseCanvas.width = NOISE_SIZE;
    pinkNoiseCanvas.height = NOISE_SIZE;
    
    const idata = pinkNoiseCtx.createImageData(NOISE_SIZE, NOISE_SIZE);
    const buffer = new Uint32Array(idata.data.buffer);
    
    // Generate noise with varying opacity for "shimmering" effect
    for (let i = 0; i < buffer.length; i++) {
        // Generate grayscale noise
        const val = Math.floor(Math.random() * 255);
        // Random alpha for flickering effect (20-80 range)
        const alpha = Math.floor(Math.random() * 60 + 20);
        // Format: 0xAABBGGRR (Little Endian)
        buffer[i] = (alpha << 24) | (val << 16) | (val << 8) | val;
    }
    
    pinkNoiseCtx.putImageData(idata, 0, 0);
}

// Generate static chaos noise for background
function generateChaosNoise(width, height) {
    chaosNoiseCanvas.width = width;
    chaosNoiseCanvas.height = height;
    
    chaosNoiseCtx.fillStyle = '#0a0a0f';
    chaosNoiseCtx.fillRect(0, 0, width, height);

    // Layer 1: Dust particles
    const dustDensity = 5000;
    for (let i = 0; i < dustDensity; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const brightness = Math.random() * 80 + 40;
        chaosNoiseCtx.fillStyle = `rgba(${brightness},${brightness},${brightness},${Math.random() * 0.2 + 0.05})`;
        chaosNoiseCtx.fillRect(x, y, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
    }

    // Layer 2: Fragments
    const fragmentDensity = 1500;
    for (let i = 0; i < fragmentDensity; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 8 + 2;
        const brightness = Math.random() * 80 + 40;
        chaosNoiseCtx.fillStyle = `rgba(${brightness},${brightness},${brightness},${Math.random() * 0.35 + 0.1})`;
        
        if (Math.random() > 0.5) {
            chaosNoiseCtx.fillRect(x, y, size * 1.5, size);
        } else {
            chaosNoiseCtx.beginPath();
            chaosNoiseCtx.arc(x, y, size / 2, 0, Math.PI * 2);
            chaosNoiseCtx.fill();
        }
    }

    // Layer 3: Splotches
    const splotchDensity = 200;
    for (let i = 0; i < splotchDensity; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 60 + 20;
        const brightness = Math.random() * 60 + 20;
        
        const gradient = chaosNoiseCtx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(${brightness},${brightness},${brightness},${Math.random() * 0.2 + 0.05})`);
        gradient.addColorStop(0.5, `rgba(${brightness},${brightness},${brightness},${Math.random() * 0.1})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        chaosNoiseCtx.fillStyle = gradient;
        chaosNoiseCtx.beginPath();
        chaosNoiseCtx.arc(x, y, size, 0, Math.PI * 2);
        chaosNoiseCtx.fill();
    }

    // Layer 4: Streaks
    const streakDensity = 80;
    for (let i = 0; i < streakDensity; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 100 + 30;
        const angle = Math.random() * Math.PI;
        const brightness = Math.random() * 50 + 30;

        chaosNoiseCtx.save();
        chaosNoiseCtx.translate(x, y);
        chaosNoiseCtx.rotate(angle);
        chaosNoiseCtx.fillStyle = `rgba(${brightness},${brightness},${brightness},${Math.random() * 0.15 + 0.03})`;
        chaosNoiseCtx.fillRect(-size / 2, -1, size, 2);
        chaosNoiseCtx.restore();
    }

    chaosNoiseGenerated = true;
}

// Draw dynamic noise overlay (Mode 1 only)
// This creates a "TV static" effect by randomly sampling from the noise texture
function drawDynamicNoise(ctx, width, height) {
    if (currentMode !== 1 || !settings.dynamicNoise) return;
    
    // Random offset each frame for "scrolling" effect
    const randX = Math.floor(Math.random() * (NOISE_SIZE - Math.min(width, NOISE_SIZE)));
    const randY = Math.floor(Math.random() * (NOISE_SIZE - Math.min(height, NOISE_SIZE)));
    
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.12;  // Subtle but noticeable
    
    // Tile the noise if screen is larger than texture
    const tilesX = Math.ceil(width / NOISE_SIZE);
    const tilesY = Math.ceil(height / NOISE_SIZE);
    
    for (let tx = 0; tx < tilesX; tx++) {
        for (let ty = 0; ty < tilesY; ty++) {
            ctx.drawImage(
                pinkNoiseCanvas,
                randX, randY,
                NOISE_SIZE, NOISE_SIZE,
                tx * NOISE_SIZE, ty * NOISE_SIZE,
                NOISE_SIZE, NOISE_SIZE
            );
        }
    }
    
    ctx.restore();
}

// Initialize noise on load
initPinkNoiseTexture();
