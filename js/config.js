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
            '<span class="highlight">Easy</span>: Gabor noise field. Standard speed.',
            '<span class="highlight">Medium</span>: Faster target movement.',
            '<span class="highlight">Hard</span>: Strobe occlusion added.',
            'Click <strong>Vertical</strong> Gabor patches only.',
            'Ignore horizontal distractors.'
        ],
        improves: [ 
            'V1 Orientation Selectivity',
            'Figure-Ground Segregation', 
            'Crowding Resistance',
            'Temporal Visual Processing'
        ],
        science: `This mode targets the <strong>primary visual cortex (V1)</strong> where orientation-selective neurons reside. The Gabor noise field mimics natural visual clutter, forcing your V1 to enhance signal-to-noise ratio. Higher difficulties increase temporal frequency and add stroboscopic occlusion, training <strong>temporal integration</strong> and <strong>predictive visual processing</strong> — critical for tracking targets through visual interruptions in FPS games.`
    },
    2: {
        title: 'PURE TRACKING',
        howTo: [
            'Keep crosshair on the moving target.',
            'Ring fills while tracking → turns <span class="highlight" style="color:#00ff99">GREEN</span>.',
            '<strong>CLICK</strong> when locked to eliminate.',
            '<strong>HOLD STILL</strong> after kill (afterGaze).',
            '<span class="highlight">Medium/Hard</span>: Organic Lissajous curves.',
            '<span class="warn">Hard</span>: Strobe occlusion overlay.'
        ],
        improves: [ 
            'Smooth Pursuit Eye Movement',
            'Cerebellar Motor Prediction',
            'MT/V5 Motion Processing',
            'Post-Shot Stability (Recoil Control)'
        ],
        science: `Engages the <strong>cerebellum</strong> and <strong>area MT/V5</strong> for predictive motion tracking. The organic Lissajous movement (Medium/Hard) prevents simple linear extrapolation, forcing your brain to build <strong>complex internal motion models</strong>. The afterGaze requirement trains <strong>post-saccadic suppression control</strong> — the same neural pathway responsible for recoil management in FPS. Strobe mode adds <strong>temporal prediction under uncertainty</strong>, simulating muzzle flash occlusion.`
    },
    3: {
        title: 'SURGICAL LOCK',
        howTo: [
            'Hit the <span style="color:#00d9ff">cyan core</span> precisely.',
            'Avoid the <span style="color:#ff3366">red penalty halo</span>.',
            '<span class="warn">Core position is RANDOM within halo!</span>',
            'Decoys match target appearance exactly.',
            'Pure precision — no time pressure.'
        ],
        improves: [ 
            'Fine Motor Inhibition',
            'Premotor Cortex Precision',
            'Superior Colliculus Targeting',
            'Impulse Control'
        ],
        science: `A high-precision <strong>Fitts' Law</strong> task targeting the <strong>premotor cortex</strong> and <strong>superior colliculus</strong>. The random core placement prevents muscle memory, forcing active <strong>foveal acquisition</strong> on every trial. The penalty zone trains <strong>motor inhibition</strong> — the ability to suppress premature movements. Decoys matching target appearance engage <strong>visual discrimination circuits</strong>, teaching your brain to filter real targets from noise based on spatial context, not just appearance.`
    },
    4: {
        title: 'LANDOLT SACCADE',
        howTo: [
            '<strong>CLICK CENTER</strong> to spawn target.',
            '<strong>SACCADE</strong>: Move eyes/cursor to find the Landolt C.',
            '<strong>HOVER</strong> over target, then press direction key:',
            '<span class="highlight">W</span>=Up, <span class="highlight">A</span>=Left, <span class="highlight">S</span>=Down, <span class="highlight">D</span>=Right',
            'Direction = where the <strong>gap</strong> is pointing.',
            '<span class="warn">Hard</span>: Target vanishes in 800ms.'
        ],
        improves: [ 
            'Saccadic Eye Movement Speed',
            'Visual Discrimination Under Pressure',
            'Visuomotor Translation (WASD Mapping)',
            'Frontal Eye Field Activation'
        ],
        science: `Combines <strong>saccadic targeting</strong> with <strong>forced visual discrimination</strong>. The Landolt C optotype requires foveal resolution to identify gap direction — peripheral vision cannot solve this task. The WASD response forces <strong>visuomotor translation</strong>: visual percept → cognitive decision → motor command. This engages the <strong>frontal eye fields (FEF)</strong>, <strong>parietal cortex</strong>, and <strong>premotor areas</strong> simultaneously. The center-reset loop ensures proper <strong>saccadic reset</strong> between targets, training the neural pathway for rapid target switching in FPS gameplay.`
    }
};