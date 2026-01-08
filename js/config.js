// ==================== GAME CONFIGURATION ====================
// Central configuration for all game parameters

const CFG = {
    // Mode 1: Gabor Scout
    gaborSize: 45,
    microDotSize: 5,
    
    // Mode 1: Adaptive Contrast
    gabor: {
        startContrast: 1.0,
        stepDown: 0.05,
        stepUp: 0.10,
        minContrast: 0.08
    },
    
    // Mode 3: Surgical Lock
    surgical: {
        coreSize: 8, // Increased from 5 for visibility
        penaltySize: 45, // Slightly larger penalty zone
        coreScore: 100,
        penaltyScore: -50,
        missScore: -10,
        // NEW: Core spawns randomly within penalty zone
        coreOffsetMax: 0.7 // Max offset from center as ratio of (penaltySize - coreSize)
    },
    
    // Mode 2: Pure Tracking
    mode2: {
        easy: 6,
        medium: 9,
        hard: 13,
        trackTime: 45,
        // NEW: After-gaze enforcement
        afterGazePenalty: -20,
        afterGazeDelayPenalty: 500, // Extra delay if broke gaze (ms)
        gazeRadius: 60 // Must stay within this radius during afterGaze
    },
    tracking: {
        targetSize: 30,
        lockThreshold: 1.0
    },

    // Mode 4: Landolt Saccade (UPDATED)
    landolt: {
        // Difficulty Configs - increased sizes for visibility
        easy:   { size: 40, contrast: 1.0, timeout: 5000 },
        medium: { size: 28, contrast: 0.8, timeout: 3000 },
        hard:   { size: 18, contrast: 0.5, timeout: 800 },
        
        // NEW: Click-to-reset system
        resetRadius: 50, // Larger reset zone for easier clicking
        resetClickRadius: 40, // Clickable area
        gapWidthRatio: 0.25
    },
    
    // General Timing
    afterGazeTime: 500, // Increased from 300 for better enforcement
    friendTimeout: 2000,
    enemyTimeout: 3000,
    
    targetRatio: 0.65, 

    // Noise System Config
    noise: {
        baseSpeed: 8,
        strobe: {
            freqMin: 3, freqMax: 5,
            dutyCycle: 0.3,
            blindAlpha: 0.95, clearAlpha: 0.15
        },
        gaborField: {
            density: { 1: 20, 2: 80, 3: 200, 4: 200 },
            size: 40
        },
        pixelNoise: {
            density: { 1: 0.05, 2: 0.20, 3: 0.50, 4: 0.50 }
        }
    }
};

// ==================== MODE INFO ====================
const MODE_INFO = {
    1: {
        title: 'GABOR SCOUT',
        howTo: [
            '<span class="highlight">Easy</span>: Gabor Noise. Normal Speed.',
            '<span class="highlight">Medium</span>: Fast Targets.',
            '<span class="highlight">Hard</span>: Strobe Storm.',
            'Click Vertical targets. Ignore Noise.'
        ],
        improves: [ 'V1 Orientation', 'Figure-Ground', 'Visual Speed' ],
        science: `Trains visual cortex to filter signal from noise. Higher difficulties increase the temporal frequency (speed) and add occlusion (strobe).`
    },
    2: {
        title: 'PURE TRACKING',
        howTo: [
            'Keep crosshair on the moving circle.',
            'Wait for ring to turn <span class="highlight" style="color:#00ff99">GREEN</span>.',
            '<strong>CLICK</strong> to eliminate.',
            '<strong>HOLD</strong> cursor still after kill.',
            '<span class="warn">Moving early = PENALTY + DELAY</span>'
        ],
        improves: [ 'Smooth Pursuit', 'Trigger Control', 'Stability', 'Post-Shot Discipline' ],
        science: `A pure motor-tracking task. Separates the "Aim" (Tracking) from the "Shoot" (Decision) phase. After-gaze enforcement trains recoil control habits.`
    },
    3: {
        title: 'SURGICAL LOCK',
        howTo: [
            'Hit the <span style="color:#00d9ff">Cyan Core</span>.',
            'Avoid the <span style="color:#ff3366">Red Halo</span>.',
            '<span class="warn">Core position is RANDOM within halo!</span>',
            'Precision is everything.'
        ],
        improves: [ 'Fine Motor Control', 'Inhibition', 'Visual Tracking', 'Micro-Adjustment' ],
        science: `High-precision Fitts' Law task with unpredictable target placement, preventing muscle memory and forcing active visual acquisition.`
    },
    4: {
        title: 'LANDOLT SACCADE',
        howTo: [
            '<strong>CLICK CENTER</strong>: Click the center circle to spawn target.',
            '<strong>SCAN</strong>: Find the Landolt C (Ring with gap).',
            '<strong>CLICK TARGET</strong>: Acquire and click.',
            '<strong>REPEAT</strong>: Click center → Click target → ...',
            '<span class="warn">Hard Mode</span>: Target vanishes in 600ms.'
        ],
        improves: [ 'Saccadic Speed', 'Foveal Focus', 'Click Rhythm', 'Target Acquisition' ],
        science: `Forces a "Center-Saccade-Acquire-Return" loop. The click requirement at center ensures proper eye reset between targets, preventing lazy peripheral aiming.`
    }
};