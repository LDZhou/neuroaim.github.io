// ==================== AUDIO SYSTEM ====================
// Web Audio API based sound effects with Dopamine Feedback System
// Combo hits increase pitch (Reward Prediction), misses play low defeat sound

let audioCtx = null;

// Combo tracking for dopamine feedback
var comboCount = 0;
const MAX_COMBO_PITCH = 12; // Max semitones to raise pitch

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Reset combo on game start
function resetCombo() {
    comboCount = 0;
}

// Calculate pitch multiplier based on combo (each combo raises ~1 semitone)
function getComboPitchMultiplier() {
    const semitones = Math.min(comboCount, MAX_COMBO_PITCH);
    return Math.pow(2, semitones / 12); // 12-TET formula
}

function playSound(type) {
    // Initialize audio context on first interaction
    if (!audioCtx) {
        initAudio();
    }
    
    if (!audioCtx || !settings.soundEnabled) return;
    
    // Resume if suspended
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    const vol = settings.volume || 0.5;
    
    switch (type) {
        case 'hit': {
            // Success hit - pitch increases with combo
            comboCount++;
            const pitchMult = getComboPitchMultiplier();
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            // Base frequencies scaled by combo
            const baseFreq = 600 * pitchMult;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.05);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.12);
            osc.type = 'sine';
            
            // Slightly louder at higher combos for satisfaction
            const comboVol = Math.min(0.2 + comboCount * 0.01, 0.35);
            gain.gain.setValueAtTime(comboVol * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
            
            // Add harmonic sparkle at high combos
            if (comboCount >= 5) {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.frequency.setValueAtTime(baseFreq * 2, now);
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.08 * vol, now);
                gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc2.start(now);
                osc2.stop(now + 0.08);
            }
            break;
        }
        case 'miss': {
            // Miss - breaks combo, deep defeat sound
            const hadCombo = comboCount >= 3;
            comboCount = 0;
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            // Low descending tone
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.25 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
            
            // Extra disappointment sound if broke a good combo
            if (hadCombo) {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.frequency.setValueAtTime(100, now + 0.05);
                osc2.frequency.exponentialRampToValueAtTime(40, now + 0.35);
                osc2.type = 'sawtooth';
                gain2.gain.setValueAtTime(0.12 * vol, now + 0.05);
                gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc2.start(now + 0.05);
                osc2.stop(now + 0.35);
            }
            break;
        }
        case 'error': {
            // Error/wrong input - similar to miss but distinct
            comboCount = 0;
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.setValueAtTime(100, now + 0.1);
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.18 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
        }
        case 'click': {
            // UI click - neutral, doesn't affect combo
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(1000, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.1 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
            break;
        }
        case 'lock': {
            // Target locked - ascending confirmation
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.12 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
        }
        case 'precision': {
            // Perfect hit (Mode 3 core) - bright double tone with combo
            comboCount++;
            const pitchMult = getComboPitchMultiplier();
            
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc1.frequency.setValueAtTime(800 * pitchMult, now);
            osc2.frequency.setValueAtTime(1200 * pitchMult, now);
            osc1.frequency.exponentialRampToValueAtTime(1600 * pitchMult, now + 0.08);
            osc2.frequency.exponentialRampToValueAtTime(2400 * pitchMult, now + 0.08);
            osc1.type = 'sine';
            osc2.type = 'sine';
            
            const comboVol = Math.min(0.15 + comboCount * 0.01, 0.25);
            gain.gain.setValueAtTime(comboVol * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.12);
            osc2.stop(now + 0.12);
            break;
        }
        case 'penalty': {
            // Mode 3 penalty zone hit - breaks combo
            comboCount = 0;
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.22 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        }
        case 'streak': {
            // Milestone sound for combo milestones (5, 10, 15...)
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const osc3 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc1.connect(gain);
            osc2.connect(gain);
            osc3.connect(gain);
            gain.connect(audioCtx.destination);
            
            // Major chord arpeggio
            osc1.frequency.setValueAtTime(523, now); // C5
            osc2.frequency.setValueAtTime(659, now + 0.05); // E5
            osc3.frequency.setValueAtTime(784, now + 0.1); // G5
            osc1.type = osc2.type = osc3.type = 'sine';
            
            gain.gain.setValueAtTime(0.15 * vol, now);
            gain.gain.setValueAtTime(0.15 * vol, now + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            
            osc1.start(now);
            osc2.start(now + 0.05);
            osc3.start(now + 0.1);
            osc1.stop(now + 0.4);
            osc2.stop(now + 0.4);
            osc3.stop(now + 0.4);
            break;
        }
    }
}

// Get current combo count (for HUD display if needed)
function getComboCount() {
    return comboCount;
}