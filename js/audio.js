// ==================== AUDIO SYSTEM ====================
// Procedural sound effects using Web Audio API

let audioCtx = null;
let audioInitialized = false;

function initAudio() {
    if (audioInitialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioInitialized = true;
    } catch(e) {
        console.warn("Web Audio not supported:", e);
    }
}

function playSound(type) {
    if (!settings.soundEnabled || !audioCtx) return;
    
    try {
        const now = audioCtx.currentTime;
        const vol = settings.volume || 0.5;
        
        switch(type) {
            case 'hit':
                playTone(880, 0.08, vol * 0.4, 'sine');
                playTone(1320, 0.06, vol * 0.3, 'sine', 0.02);
                break;
            case 'miss':
                playTone(220, 0.15, vol * 0.3, 'sawtooth');
                break;
            case 'click':
                playTone(660, 0.03, vol * 0.2, 'square');
                break;
            case 'lock':
                playTone(440, 0.1, vol * 0.3, 'sine');
                playTone(660, 0.1, vol * 0.3, 'sine', 0.05);
                break;
            case 'precision':
                playTone(1046, 0.05, vol * 0.4, 'sine');
                playTone(1318, 0.05, vol * 0.3, 'sine', 0.03);
                playTone(1568, 0.08, vol * 0.3, 'sine', 0.06);
                break;
            case 'error':
                playTone(200, 0.1, vol * 0.4, 'sawtooth');
                playTone(150, 0.15, vol * 0.3, 'sawtooth', 0.05);
                break;
            case 'penalty':
                playNoise(0.1, vol * 0.2);
                playTone(110, 0.15, vol * 0.4, 'square');
                break;
            case 'combo':
                const baseFreq = 523;
                playTone(baseFreq, 0.05, vol * 0.3, 'sine');
                playTone(baseFreq * 1.25, 0.05, vol * 0.25, 'sine', 0.04);
                playTone(baseFreq * 1.5, 0.08, vol * 0.3, 'sine', 0.08);
                break;
        }
    } catch(e) {
        // Silently fail
    }
}

function playTone(freq, duration, volume, type, delay = 0) {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration + 0.01);
}

function playNoise(duration, volume) {
    if (!audioCtx) return;
    
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    source.connect(gain);
    gain.connect(audioCtx.destination);
    
    source.start();
    source.stop(audioCtx.currentTime + duration);
}

// Auto-init on first user interaction
document.addEventListener('click', () => {
    if (!audioInitialized && settings.soundEnabled) {
        initAudio();
    }
}, { once: true });

// ===== COMBO SYSTEM =====
var comboCount = 0;
var maxCombo = 0;

function resetCombo() {
    comboCount = 0;
}

function incrementCombo() {
    comboCount++;
    if (comboCount > maxCombo) maxCombo = comboCount;
    
    // Play combo sound at milestones
    if (comboCount > 0 && comboCount % 5 === 0) {
        playSound('combo');
    }
}

function getCombo() { return comboCount; }
function getMaxCombo() { return maxCombo; }