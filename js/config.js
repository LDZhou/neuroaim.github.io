// ==================== GAME CONFIGURATION ====================
// Central configuration for all game parameters
// UPDATED: 7 modes, adaptive difficulty (i+1), strobe as setting

const CFG = {
    // ===== SESSION CONFIG =====
    sessionDuration: 60, // seconds per session
    
    // ===== ADAPTIVE DIFFICULTY SYSTEM =====
    // Based on Vygotsky's Zone of Proximal Development (i+1)
    // Difficulty adjusts in micro-increments based on rolling performance
    adaptive: {
        windowSize: 5,          // Rolling window for performance calculation
        targetAccuracy: 0.75,   // Target 75% success rate (optimal learning zone)
        stepUp: 0.02,           // Increase difficulty by 2% when performing well
        stepDown: 0.03,         // Decrease by 3% when struggling (faster recovery)
        minLevel: 0.1,          // Minimum difficulty (10%)
        maxLevel: 1.0,          // Maximum difficulty (100%)
        initialLevel: 0.3       // Start at 30% difficulty
    },
    
    // ===== MODE 1: GABOR SCOUT =====
    mode1: {
        name: 'GABOR SCOUT',
        tag: 'V1 CORTEX + PERCEPTION',
        description: 'Identify <strong>Vertical</strong> targets in noise.',
        // Adaptive parameters (scaled by difficulty 0.1-1.0)
        params: {
            targetSize: { min: 60, max: 30 },        // Larger = easier
            moveSpeed: { min: 2, max: 8 },           // Slower = easier
            contrast: { min: 1.0, max: 0.15 },       // Higher = easier
            noiseCount: { min: 20, max: 200 },       // Fewer = easier
            timeout: { min: 4000, max: 1500 }        // Longer = easier
        }
    },
    
    // ===== MODE 2: PURE TRACKING =====
    mode2: {
        name: 'PURE TRACKING',
        tag: 'CEREBELLUM + PREDICTION',
        description: 'Track <strong>organic curves</strong>. Hold steady after kill.',
        params: {
            targetSize: { min: 40, max: 20 },
            moveSpeed: { min: 3, max: 12 },
            lockTime: { min: 0.6, max: 1.5 },        // Time needed to lock
            afterGazeTime: { min: 300, max: 800 },   // Hold time after kill
            gazeRadius: { min: 80, max: 40 },        // Tolerance radius
            curveComplexity: { min: 1, max: 3 }      // Lissajous complexity
        }
    },
    
    // ===== MODE 3: SURGICAL LOCK =====
    mode3: {
        name: 'SURGICAL LOCK',
        tag: 'PREMOTOR + INHIBITION',
        description: 'Zero tolerance. Hit <strong>Random Core</strong>. Avoid Halo.',
        params: {
            coreSize: { min: 12, max: 4 },           // Core radius
            penaltySize: { min: 60, max: 35 },       // Penalty zone radius
            coreOffset: { min: 0.3, max: 0.9 },      // How off-center core can be
            decoyCount: { min: 0, max: 8 },          // Decoy targets
            decoyMovement: { min: 0, max: 3 }        // Decoy speed
        }
    },
    
    // ===== MODE 4: LANDOLT SACCADE =====
    mode4: {
        name: 'LANDOLT SACCADE',
        tag: 'DISCRIMINATION + VISUOMOTOR',
        description: 'Aim at target → Press <strong>WASD</strong> for gap direction.',
        params: {
            ringSize: { min: 45, max: 16 },          // Landolt C size
            contrast: { min: 1.0, max: 0.4 },
            timeout: { min: 5000, max: 800 },
            eccentricity: { min: 150, max: 400 }     // Distance from center
        }
    },
    
    // ===== MODE 5: PARAFOVEAL GHOST (NEW) =====
    mode5: {
        name: 'PARAFOVEAL GHOST',
        tag: 'PPC + COVERT ATTENTION',
        description: 'Track center. Shoot <strong>blue</strong> ghosts. Ignore <strong>red</strong>.',
        params: {
            // Primary target (always present, must track)
            primarySize: { min: 35, max: 20 },
            primarySpeed: { min: 2, max: 6 },
            // Ghost parameters
            ghostSize: { min: 30, max: 15 },
            ghostDuration: { min: 1200, max: 400 },  // How long ghost visible
            ghostEccentricity: { min: 200, max: 450 }, // Distance from center
            ghostFrequency: { min: 2500, max: 1000 }, // Time between ghosts
            blueRatio: { min: 0.7, max: 0.4 },       // % of ghosts that are blue (shoot)
            returnWindow: { min: 1500, max: 600 }    // Time to return to primary
        }
    },
    
    // ===== MODE 6: WORKING MEMORY SEQUENCER (NEW) =====
    mode6: {
        name: 'MEMORY SEQUENCER',
        tag: 'dlPFC + SPATIAL MEMORY',
        description: 'Memorize <strong>sequence</strong>. Shoot positions in order.',
        params: {
            sequenceLength: { min: 3, max: 7 },      // Number of targets
            displayTime: { min: 600, max: 250 },     // Each target visible time
            delayBeforeRecall: { min: 500, max: 1500 }, // Blank time before shooting
            targetSize: { min: 50, max: 25 },
            spatialSpread: { min: 200, max: 400 },   // How spread out targets are
            positionTolerance: { min: 60, max: 30 }  // Click accuracy needed
        }
    },
    
    // ===== MODE 7: COGNITIVE SWITCH (NEW) =====
    mode7: {
        name: 'COGNITIVE SWITCH',
        tag: 'ACC + RULE FLEXIBILITY',
        description: 'Rules change with <strong>environment</strong>. Adapt instantly.',
        params: {
            targetSize: { min: 40, max: 22 },
            moveSpeed: { min: 3, max: 8 },
            switchInterval: { min: 8000, max: 3000 }, // Time between rule changes
            warningTime: { min: 1500, max: 500 },    // Warning before switch
            targetFrequency: { min: 2000, max: 800 }, // Target spawn rate
            inhibitionRatio: { min: 0.3, max: 0.5 }  // % of "don't shoot" targets
        }
    },
    
    // ===== STROBE SYSTEM (NOW IN SETTINGS) =====
    strobe: {
        freqMin: 3,
        freqMax: 6,
        dutyCycle: 0.35,
        blindAlpha: 0.92
    },
    
    // ===== NOISE SYSTEM =====
    noise: {
        baseSpeed: 6,
        gaborField: {
            baseSize: 40
        }
    }
};

// ==================== MODE INFO ====================
const MODE_INFO = {
    1: {
        title: 'GABOR SCOUT',
        howTo: [
            'Click <strong>Vertical</strong> Gabor patches only.',
            'Ignore horizontal/diagonal distractors.',
            'Difficulty adapts: size, contrast, speed, noise density.',
            'Enable <span class="highlight">Strobe</span> in settings for temporal challenge.'
        ],
        improves: [ 
            'V1 Orientation Selectivity',
            'Figure-Ground Segregation', 
            'Crowding Resistance',
            'Temporal Visual Processing'
        ],
        science: `Targets the <strong>primary visual cortex (V1)</strong> where orientation-selective neurons reside. The Gabor noise field mimics natural visual clutter, forcing your V1 to enhance signal-to-noise ratio. Adaptive difficulty ensures you're always in the optimal learning zone (i+1 principle).`
    },
    2: {
        title: 'PURE TRACKING',
        howTo: [
            'Keep crosshair on the moving target.',
            'Ring fills while tracking → turns <span class="highlight" style="color:#00ff99">GREEN</span>.',
            '<strong>CLICK</strong> when locked to eliminate.',
            '<strong>HOLD POSITION</strong> after kill (afterGaze phase).',
            'Movement becomes more organic at higher difficulty.'
        ],
        improves: [ 
            'Smooth Pursuit Eye Movement',
            'Cerebellar Motor Prediction',
            'MT/V5 Motion Processing',
            'Post-Shot Stability (Recoil Control)'
        ],
        science: `Engages the <strong>cerebellum</strong> and <strong>area MT/V5</strong> for predictive motion tracking. The organic Lissajous movement prevents simple linear extrapolation, forcing your brain to build <strong>complex internal motion models</strong>. The afterGaze requirement trains <strong>post-saccadic suppression control</strong>.`
    },
    3: {
        title: 'SURGICAL LOCK',
        howTo: [
            'Hit the <span style="color:#00d9ff">cyan core</span> precisely.',
            'Avoid the <span style="color:#ff3366">red penalty halo</span>.',
            '<span class="warn">Core position is RANDOM within halo!</span>',
            'Decoys appear at higher difficulty.',
            'Pure precision — no time pressure.'
        ],
        improves: [ 
            'Fine Motor Inhibition',
            'Premotor Cortex Precision',
            'Superior Colliculus Targeting',
            'Impulse Control'
        ],
        science: `A high-precision <strong>Fitts' Law</strong> task targeting the <strong>premotor cortex</strong> and <strong>superior colliculus</strong>. The random core placement prevents muscle memory, forcing active <strong>foveal acquisition</strong> on every trial.`
    },
    4: {
        title: 'LANDOLT SACCADE',
        howTo: [
            '<strong>CLICK CENTER</strong> to spawn target.',
            '<strong>SACCADE</strong>: Move eyes/cursor to the Landolt C.',
            '<strong>HOVER</strong> over target, then press direction key:',
            '<span class="highlight">W</span>=Up, <span class="highlight">A</span>=Left, <span class="highlight">S</span>=Down, <span class="highlight">D</span>=Right',
            'Direction = where the <strong>gap</strong> is pointing.'
        ],
        improves: [ 
            'Saccadic Eye Movement Speed',
            'Visual Discrimination Under Pressure',
            'Visuomotor Translation (WASD Mapping)',
            'Frontal Eye Field Activation'
        ],
        science: `Combines <strong>saccadic targeting</strong> with <strong>forced visual discrimination</strong>. The Landolt C optotype requires foveal resolution to identify gap direction. The WASD response forces <strong>visuomotor translation</strong>: visual percept → cognitive decision → motor command.`
    },
    5: {
        title: 'PARAFOVEAL GHOST',
        howTo: [
            'ALWAYS track the <span style="color:#00d9ff">primary target</span> in center.',
            '<span style="color:#3366ff">BLUE ghost</span> appears in periphery → <strong>SHOOT IT</strong> then return.',
            '<span style="color:#ff3366">RED ghost</span> appears → <strong>IGNORE IT</strong> (inhibit saccade).',
            'Breaking primary tracking = penalty.',
            'Tests your ability to use peripheral vision strategically.'
        ],
        improves: [ 
            'Covert Attention Allocation',
            'Peripheral Motion Detection',
            'Saccadic Inhibition Control',
            'Split Attention Management'
        ],
        science: `Trains <strong>covert attention</strong> — attending to peripheral stimuli without moving eyes. The <strong>posterior parietal cortex (PPC)</strong> allocates spatial attention while the <strong>superior colliculus</strong> processes peripheral motion. Red ghosts train <strong>saccadic inhibition</strong> — critical for not tunnel-visioning in FPS.`
    },
    6: {
        title: 'MEMORY SEQUENCER',
        howTo: [
            'Targets appear <strong>one by one</strong> in sequence.',
            'Each target flashes briefly then disappears.',
            'After delay, <strong>shoot the positions IN ORDER</strong>.',
            'Wrong order = fail. Must start sequence over.',
            'Sequence length increases with skill.'
        ],
        improves: [ 
            'Visuospatial Working Memory',
            'Spatial Position Encoding',
            'Sequential Motor Planning',
            'Object Permanence Under Pressure'
        ],
        science: `Targets the <strong>visuospatial sketchpad</strong> component of working memory, mediated by <strong>dorsolateral prefrontal cortex (dlPFC)</strong>. This is the neural substrate of "keeping track of enemy positions" even when not visible — critical for high-level FPS awareness.`
    },
    7: {
        title: 'COGNITIVE SWITCH',
        howTo: [
            'Environment color indicates current <strong>RULE</strong>.',
            '<span style="color:#4488ff">COLD (Blue/Gray)</span>: Shoot <span style="color:#ff3366">RED</span>, ignore <span style="color:#00ff99">GREEN</span>.',
            '<span style="color:#ff8844">WARM (Orange/Red)</span>: Shoot <span style="color:#00ff99">GREEN</span>, ignore <span style="color:#ff3366">RED</span>.',
            'Screen flashes before rule switch.',
            'Shooting wrong target = heavy penalty.'
        ],
        improves: [ 
            'Cognitive Flexibility',
            'Rule Maintenance & Switching',
            'Conflict Monitoring',
            'Inhibitory Control'
        ],
        science: `Targets the <strong>anterior cingulate cortex (ACC)</strong> for conflict monitoring and <strong>prefrontal cortex</strong> for rule maintenance. Simulates the cognitive demands of rapidly changing combat situations where "friend vs foe" rules shift (e.g., mode switches, ability cooldowns).`
    }
};

// ==================== HELPER: GET SCALED PARAM =====
// Returns a value interpolated between min and max based on difficulty level
function getScaledParam(paramObj, difficulty) {
    // difficulty: 0.1 (easiest) to 1.0 (hardest)
    // For params where higher = easier (like size), min is easy value, max is hard value
    const t = Math.max(0.1, Math.min(1.0, difficulty));
    return paramObj.min + (paramObj.max - paramObj.min) * t;
}

// ==================== HELPER: GET MODE CONFIG =====
function getModeConfig(modeNum) {
    return CFG['mode' + modeNum] || null;
}

// Convenience wrapper - uses currentDifficulty from game-engine.js
function getScaledValue(paramObj) {
    return getScaledParam(paramObj, typeof currentDifficulty !== 'undefined' ? currentDifficulty : 0.3);
}