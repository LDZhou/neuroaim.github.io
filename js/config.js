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
        coreSize: 3,
        penaltySize: 35,
        coreScore: 100,
        penaltyScore: -50,
        missScore: -10
    },
    
    // Mode 2: Pure Tracking
    mode2: {
        easy: 6,
        medium: 9,
        hard: 13,
        trackTime: 45 
    },
    tracking: {
        targetSize: 30,
        lockThreshold: 1.0
    },

    // Mode 4: Landolt Saccade (NEW)
    landolt: {
        // Difficulty Configs
        easy:   { size: 30, contrast: 1.0, timeout: 5000 },
        medium: { size: 20, contrast: 0.6, timeout: 3000 },
        hard:   { size: 10, contrast: 0.35, timeout: 600 }, // 600ms Peek simulation
        
        resetRadius: 30, // Size of the center reset zone
        gapWidthRatio: 0.25 // Gap size relative to ring circumference
    },
    
    // General Timing
    afterGazeTime: 300,
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
            '<strong>HOLD</strong> cursor still after kill.'
        ],
        improves: [ 'Smooth Pursuit', 'Trigger Control', 'Stability' ],
        science: `A pure motor-tracking task. Separates the "Aim" (Tracking) from the "Shoot" (Decision) phase.`
    },
    3: {
        title: 'SURGICAL LOCK',
        howTo: [
            'Hit the <span style="color:#00d9ff">Cyan Core</span>.',
            'Avoid the <span style="color:#ff3366">Red Halo</span>.',
            'Precision is everything.'
        ],
        improves: [ 'Fine Motor Control', 'Inhibition', 'Color Filtering' ],
        science: `High-precision Fitts' Law task with visual distractors.`
    },
    4: {
        title: 'LANDOLT SACCADE',
        howTo: [
            '<strong>RESET</strong>: Move mouse to CENTER to spawn target.',
            '<strong>SCAN</strong>: Find the Landolt C (Ring with gap).',
            '<strong>IDENTIFY</strong>: See the gap direction (Mental Check).',
            '<strong>SNAP</strong>: Click the target.',
            '<span class="warn">Hard Mode</span>: Target vanishes in 600ms.'
        ],
        improves: [ 'Saccadic Speed', 'Foveal Focus', 'Peripheral Suppression' ],
        science: `Forces a "Reset-Saccade-Focus" loop. The Landolt C gap is too small for peripheral vision, forcing you to physically foveate (look directly at) the target before clicking, preventing "lazy eye" aiming.`
    }
};