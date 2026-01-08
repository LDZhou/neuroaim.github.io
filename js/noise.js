// ==================== NOISE SYSTEM ====================
// Advanced Gabor Noise Field & Strobe Logic
// Optimized with Pre-rendering Cache for High Performance

const NoiseSystem = {
    particles: [], 
    w: 0, h: 0,
    strobeTimer: 0,
    currentStrobePeriod: 0,
    isBlindPhase: false,
    speedScale: 1.0, 
    
    gaborCache: null,
    
    init(width, height) {
        this.w = width;
        this.h = height;
        this.createGaborCache(); 
        this.regenerate();
    },
    
    setSpeedScale(scale) {
        this.speedScale = scale;
    },

    createGaborCache() {
        const baseSize = CFG.noise.gaborField.size; 
        const canvasSize = baseSize * 4; 
        const cx = canvasSize / 2;
        const cy = canvasSize / 2;
        
        this.gaborCache = document.createElement('canvas');
        this.gaborCache.width = canvasSize;
        this.gaborCache.height = canvasSize;
        const ctx = this.gaborCache.getContext('2d');
        
        const baseColor = '150, 150, 150'; 
        ctx.strokeStyle = `rgb(${baseColor})`; 
        ctx.lineWidth = 3;
        const step = 6;
        
        ctx.beginPath();
        for (let i = -canvasSize; i < canvasSize; i += step) {
            ctx.moveTo(cx + i, 0);
            ctx.lineTo(cx + i, canvasSize);
        }
        ctx.stroke();
        
        ctx.globalCompositeOperation = 'destination-in';
        const radius = baseSize; 
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g.addColorStop(0, 'rgba(0, 0, 0, 1)');
        g.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.globalCompositeOperation = 'source-over';
    },

    regenerate() {
        this.particles = [];
        const level = settings.noiseLevel;
        const mode = currentMode;
        
        if (!this.gaborCache) this.createGaborCache();
        
        if (level === 0) return; // Clean

        if (mode === 1) {
            this.generateGaborParticles(this.w, this.h, level);
        } else if (mode === 2) {
            // Mode 2 pure tracking has no noise usually (level 1 only)
            if (level === 1) return;
        } else {
            // Mode 3 and Mode 4 use Pixel Decoys
            this.generateDecoyParticles(this.w, this.h, level);
        }
    },

    generateGaborParticles(w, h, level) {
        if (level === 1) return; 

        const densityMap = { 2: 60, 3: 200, 4: 200 };
        const count = densityMap[level] || 50;
        const baseSize = CFG.noise.gaborField.size;
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * CFG.noise.baseSpeed, 
                vy: (Math.random() - 0.5) * CFG.noise.baseSpeed,
                changeDirTimer: Math.random() * 3000,
                angle: Math.random() * Math.PI, 
                isHorizontal: Math.random() > 0.3,
                size: baseSize * (0.8 + Math.random() * 0.4),
                isGabor: true
            });
        }
    },

    generateDecoyParticles(w, h, level) {
        const density = level === 2 ? 80 : 200;
        for (let i = 0; i < density; i++) {
            const type = Math.random();
            this.particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                changeDirTimer: Math.random() * 3000,
                type: type,
                isPixel: true
            });
        }
    },

    update(dt) {
        const level = settings.noiseLevel;
        if (level === 0) return;

        // 1. Move Particles (Apply Speed Scale)
        if (this.particles.length > 0) {
            const margin = 50;
            this.particles.forEach(p => {
                p.x += p.vx * (dt/16) * this.speedScale;
                p.y += p.vy * (dt/16) * this.speedScale;
                
                if (p.x < -margin) p.x = this.w + margin;
                if (p.x > this.w + margin) p.x = -margin;
                if (p.y < -margin) p.y = this.h + margin;
                if (p.y > this.h + margin) p.y = -margin;
                
                p.changeDirTimer -= dt;
                if (p.changeDirTimer <= 0) {
                    const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
                    const currentAngle = Math.atan2(p.vy, p.vx);
                    const newAngle = currentAngle + (Math.random() - 0.5) * Math.PI;
                    
                    p.vx = Math.cos(newAngle) * speed;
                    p.vy = Math.sin(newAngle) * speed;
                    p.changeDirTimer = 2000 + Math.random() * 1000;
                }
            });
        }

        // 2. Strobe Logic
        if (level === 4) {
            this.strobeTimer += dt;
            if (this.strobeTimer >= this.currentStrobePeriod) {
                this.strobeTimer = 0;
                const freq = CFG.noise.strobe.freqMin + Math.random() * (CFG.noise.strobe.freqMax - CFG.noise.strobe.freqMin);
                this.currentStrobePeriod = 1000 / freq;
            }
            const visibleTime = this.currentStrobePeriod * CFG.noise.strobe.dutyCycle;
            this.isBlindPhase = this.strobeTimer > visibleTime;
        } else {
            this.isBlindPhase = false;
        }
    },

    draw(ctx) {
        const level = settings.noiseLevel;
        if (level === 0) return;
        
        let alpha = 1.0;
        if (level === 4) {
            alpha = this.isBlindPhase ? CFG.noise.strobe.blindAlpha : CFG.noise.strobe.clearAlpha;
        } else if (level === 3) {
            alpha = 0.8;
        } else if (level === 2) {
            alpha = 0.5;
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;

        if (level === 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            const dustCount = Math.min(this.w*this.h*0.0001, 200); 
            for (let i=0; i<dustCount; i++) {
                 const x = (Math.sin(i) * 10000) % this.w;
                 const y = (Math.cos(i) * 10000) % this.h;
                 ctx.fillRect(Math.abs(x), Math.abs(y), 1, 1);
            }
            ctx.restore();
            return;
        }

        this.particles.forEach(p => {
            if (p.isGabor) {
                if (this.gaborCache) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    if (!p.isHorizontal) ctx.rotate(p.angle);
                    else ctx.rotate(Math.PI / 2); 
                    
                    const scale = (p.size * 2.4) / this.gaborCache.width; 
                    ctx.scale(scale, scale);
                    ctx.drawImage(this.gaborCache, -this.gaborCache.width/2, -this.gaborCache.height/2);
                    ctx.restore();
                }
            } else if (p.isPixel) {
                if (p.type < 0.33) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
                    ctx.fillStyle = 'rgba(0, 217, 255, 0.8)';
                    ctx.fill();
                } else if (p.type < 0.66) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 35, 0, Math.PI*2);
                    ctx.strokeStyle = 'rgba(255, 50, 80, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
                    ctx.fillRect(p.x, p.y, 2, 2);
                }
            }
        });
        
        ctx.restore();
    }
};