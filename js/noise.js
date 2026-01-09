// ==================== NOISE SYSTEM ====================
// Visual noise layers and strobe system
// UPDATED: Strobe as toggle, simplified noise levels
// UPDATED: Gabor size matches target, consistent opacity

const NoiseSystem = {
    particles: [],
    w: 0,
    h: 0,
    noiseLevel: 1,
    strobeEnabled: false,
    strobeTimer: 0,
    currentStrobePeriod: 0,
    isBlindPhase: false,
    gaborCache: null,
    currentTargetSize: 45,  // UPDATED: Default to mode1 initial size (45px)
    
    init(width, height) {
        this.w = width;
        this.h = height;
        this.currentTargetSize = 45;  // Reset to default on init
        this.createGaborCache();
        this.regenerate();
    },
    
    setNoiseLevel(level) {
        this.noiseLevel = level;
    },
    
    setStrobeEnabled(enabled) {
        this.strobeEnabled = enabled;
        if (!enabled) {
            this.isBlindPhase = false;
        }
    },
    
    setTargetSize(size) {
        this.currentTargetSize = size;
        this.createGaborCache();
        // IMPORTANT: Regenerate particles with new size
        this.regenerate();
    },
    
    createGaborCache() {
        // UPDATED: Use currentTargetSize instead of fixed baseSize
        const baseSize = this.currentTargetSize || CFG.noise.gaborField.baseSize || 35;
        const canvasSize = baseSize * 3;
        const cx = canvasSize / 2;
        const cy = canvasSize / 2;
        
        this.gaborCache = document.createElement('canvas');
        this.gaborCache.width = canvasSize;
        this.gaborCache.height = canvasSize;
        const ctx = this.gaborCache.getContext('2d');
        
        // Step 1: Draw grating pattern
        ctx.strokeStyle = 'rgb(180, 180, 180)';
        ctx.lineWidth = 3;
        const step = 6;
        
        ctx.beginPath();
        for (let i = -canvasSize; i < canvasSize; i += step) {
            ctx.moveTo(cx + i, 0);
            ctx.lineTo(cx + i, canvasSize);
        }
        ctx.stroke();
        
        // Step 2: Apply Gaussian envelope (高斯模糊) - Match target's blur
        ctx.globalCompositeOperation = 'destination-in';
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseSize * 1.0);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');      // Full opacity at center
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');    // Stronger Gaussian falloff
        gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)');    // More gradual fade
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');        // Transparent at edge
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasSize, canvasSize);
    },
    
    regenerate() {
        this.particles = [];
        
        if (this.noiseLevel <= 0) return;
        
        // Generate Gabor distractors based on noise level
        const counts = { 1: 30, 2: 80, 3: 150, 4: 200 };
        const count = counts[this.noiseLevel] || 50;
        
        // UPDATED: Use currentTargetSize as base
        const baseSize = this.currentTargetSize || CFG.noise.gaborField.baseSize || 35;
        const sizeVar = CFG.noise.gaborField.sizeVariance || 8;
        
        for (let i = 0; i < count; i++) {
            // Size matches target ± small variance
            const size = baseSize + (Math.random() - 0.5) * sizeVar;
            
            this.particles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                changeDirTimer: Math.random() * 3000,
                angle: Math.random() * Math.PI,
                isHorizontal: Math.random() > 0.3, // 70% horizontal (distractors)
                size: size,
                type: 'gabor'
            });
        }
    },
    
    update(dt) {
        // Update particle positions
        const margin = 50;
        this.particles.forEach(p => {
            p.x += p.vx * (dt / 16);
            p.y += p.vy * (dt / 16);
            
            // Wrap around
            if (p.x < -margin) p.x = this.w + margin;
            if (p.x > this.w + margin) p.x = -margin;
            if (p.y < -margin) p.y = this.h + margin;
            if (p.y > this.h + margin) p.y = -margin;
            
            // Random direction changes
            p.changeDirTimer -= dt;
            if (p.changeDirTimer <= 0) {
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const angle = Math.atan2(p.vy, p.vx) + (Math.random() - 0.5) * Math.PI;
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                p.changeDirTimer = 2000 + Math.random() * 1000;
            }
        });
        
        // Strobe logic
        if (this.strobeEnabled) {
            this.strobeTimer += dt;
            if (this.strobeTimer >= this.currentStrobePeriod) {
                this.strobeTimer = 0;
                const freq = CFG.strobe.freqMin + Math.random() * (CFG.strobe.freqMax - CFG.strobe.freqMin);
                this.currentStrobePeriod = 1000 / freq;
            }
            const visibleTime = this.currentStrobePeriod * CFG.strobe.dutyCycle;
            this.isBlindPhase = this.strobeTimer > visibleTime;
        } else {
            this.isBlindPhase = false;
        }
    },
    
    draw(ctx) {
        if (this.noiseLevel <= 0) return;
        
        // During strobe blind phase, draw dark overlay
        if (this.strobeEnabled && this.isBlindPhase) {
            ctx.fillStyle = `rgba(5, 5, 8, ${CFG.strobe.blindAlpha})`;
            ctx.fillRect(0, 0, this.w, this.h);
            return;
        }
        
        // UPDATED: Match target's opacity range (0.5-0.7 for consistency)
        const baseAlpha = 0.6;  // Slightly visible to create challenge
        
        ctx.save();
        ctx.globalAlpha = baseAlpha;
        
        this.particles.forEach(p => {
            if (p.type === 'gabor' && this.gaborCache) {
                ctx.save();
                ctx.translate(p.x, p.y);
                if (p.isHorizontal) {
                    ctx.rotate(Math.PI / 2);
                } else {
                    ctx.rotate(p.angle);
                }
                
                const scale = (p.size * 2) / this.gaborCache.width;
                ctx.scale(scale, scale);
                ctx.drawImage(this.gaborCache, -this.gaborCache.width / 2, -this.gaborCache.height / 2);
                ctx.restore();
            }
        });
        
        ctx.restore();
    }
};