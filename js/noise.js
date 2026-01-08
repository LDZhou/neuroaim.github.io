// ==================== NOISE SYSTEM ====================
// Visual noise layers and strobe system
// UPDATED: Strobe as toggle, simplified noise levels

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
    
    init(width, height) {
        this.w = width;
        this.h = height;
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
    
    createGaborCache() {
        const baseSize = 40;
        const canvasSize = baseSize * 3;
        const cx = canvasSize / 2;
        const cy = canvasSize / 2;
        
        this.gaborCache = document.createElement('canvas');
        this.gaborCache.width = canvasSize;
        this.gaborCache.height = canvasSize;
        const ctx = this.gaborCache.getContext('2d');
        
        // Use circular clipping
        ctx.beginPath();
        ctx.arc(cx, cy, baseSize, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw lines
        ctx.strokeStyle = 'rgb(150, 150, 150)';
        ctx.lineWidth = 3;
        const step = 6;
        
        ctx.beginPath();
        for (let i = -canvasSize; i < canvasSize; i += step) {
            ctx.moveTo(cx + i, 0);
            ctx.lineTo(cx + i, canvasSize);
        }
        ctx.stroke();
    },
    
    regenerate() {
        this.particles = [];
        
        if (this.noiseLevel <= 0) return;
        
        // Generate Gabor distractors based on noise level
        const counts = { 1: 30, 2: 80, 3: 150, 4: 200 };
        const count = counts[this.noiseLevel] || 50;
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                changeDirTimer: Math.random() * 3000,
                angle: Math.random() * Math.PI,
                isHorizontal: Math.random() > 0.3, // 70% horizontal (distractors)
                size: 30 + Math.random() * 20,
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
        
        // Draw noise particles
        const alpha = Math.min(1, 0.3 + this.noiseLevel * 0.2);
        ctx.save();
        ctx.globalAlpha = alpha;
        
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