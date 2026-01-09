// ==================== GAME CONFIGURATION ====================
// Central configuration for all game parameters
// FULL VERSION: Includes all Modes, Parameters, and Descriptions

const CFG = {
    // ===== SESSION CONFIG =====
    sessionDuration: 60, // seconds per session
    
    // ===== ADAPTIVE DIFFICULTY SYSTEM =====
    // Based on Vygotsky's Zone of Proximal Development (i+1)
    adaptive: {
        windowSize: 5,          // Rolling window for performance calculation
        targetAccuracy: 0.75,   // Target 75% success rate
        stepUp: 0.02,           // Increase difficulty
        stepDown: 0.03,         // Decrease difficulty
        minLevel: 0.1,          // Minimum difficulty (10%)
        maxLevel: 5.0,          // UNCAPPED: Practical limit raised to 500%
        initialLevel: 0.3       // Start at 30% difficulty
    },
    
    // ===== MODE 1: GABOR SCOUT =====
    mode1: {
        name: 'GABOR SCOUT',
        tag: 'V1 CORTEX + PERCEPTION',
        description: 'Identify <strong>Vertical</strong> targets in noise.',
        params: {
            targetSize: { min: 60, max: 30 },        
            moveSpeed: { min: 2, max: 8 },           
            contrast: { min: 1.0, max: 0.15 },       
            noiseCount: { min: 20, max: 200 },       
            timeout: { min: 4000, max: 1500 }        
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
            lockTime: { min: 0.6, max: 1.5 },        
            afterGazeTime: { min: 300, max: 800 },   
            gazeRadius: { min: 80, max: 40 },        
            curveComplexity: { min: 1, max: 3 }      
        }
    },
    
    // ===== MODE 3: SURGICAL LOCK =====
    mode3: {
        name: 'SURGICAL LOCK',
        tag: 'PREMOTOR + INHIBITION',
        description: 'Hit <span style="color:#00d9ff">Core</span>. Avoid <span style="color:#aaa">Halo</span>. Precision over speed.',
        params: {
            coreSize: { min: 12, max: 4 },           
            penaltySize: { min: 60, max: 35 },       
            coreOffset: { min: 0.3, max: 0.9 },      
            decoyCount: { min: 0, max: 8 },          
            decoyMovement: { min: 0, max: 3 }        
        }
    },
    
    // ===== MODE 4: LANDOLT SACCADE =====
    mode4: {
        name: 'LANDOLT SACCADE',
        tag: 'DISCRIMINATION + VISUOMOTOR',
        description: 'Aim at target → Press <strong>WASD</strong> for gap direction.',
        params: {
            ringSize: { min: 45, max: 16 },          
            contrast: { min: 1.0, max: 0.4 },
            timeout: { min: 5000, max: 800 },
            eccentricity: { min: 150, max: 400 }     
        }
    },
    
    // ===== MODE 5: PARAFOVEAL GHOST =====
    mode5: {
        name: 'PARAFOVEAL GHOST',
        tag: 'PPC + COVERT ATTENTION',
        description: 'Track center. Shoot <strong>blue</strong> ghosts. Ignore <strong>red</strong>.',
        params: {
            primarySize: { min: 35, max: 20 },
            primarySpeed: { min: 2, max: 6 },
            ghostSize: { min: 30, max: 15 },
            ghostDuration: { min: 1200, max: 400 },  
            ghostEccentricity: { min: 200, max: 450 }, 
            ghostFrequency: { min: 2500, max: 1000 }, 
            blueRatio: { min: 0.7, max: 0.4 },       
            returnWindow: { min: 1500, max: 600 },
            decayNormal: { min: 0.8, max: 1.5 },     
            decaySlow: { min: 0.2, max: 0.4 },       
            decayFast: { min: 2.0, max: 4.0 } 
        }
    },
    
    // ===== MODE 6: MEMORY SEQUENCER =====
    mode6: {
        name: 'MEMORY SEQUENCER',
        tag: 'dlPFC + SPATIAL MEMORY',
        description: 'Memorize <strong>random positions</strong>. Shoot in order. No hints.',
        params: {
            sequenceLength: { min: 2, max: 6 },      
            displayTime: { min: 600, max: 250 },     
            delayBeforeRecall: { min: 500, max: 1500 }, 
            targetSize: { min: 50, max: 25 },
            spatialSpread: { min: 100, max: 300 },
            clusterRadius: { min: 200, max: 350 },   
            positionTolerance: { min: 60, max: 30 }  
        }
    },
    
    // ===== MODE 7: COGNITIVE SWITCH =====
    mode7: {
        name: 'COGNITIVE SWITCH',
        tag: 'ACC + RULE FLEXIBILITY',
        description: 'Adapt to rule changes. <span style="color:#00d9ff">COLD</span> vs <span style="color:#ff8844">WARM</span>.',
        params: {
            targetSize: { min: 40, max: 22 },
            moveSpeed: { min: 3, max: 8 },
            switchInterval: { min: 15000, max: 8000 }, // UPDATED: Much slower switching (8-15s)
            warningTime: { min: 4000, max: 4000 },     // UPDATED: Fixed 4s warning for consistent countdown
            targetFrequency: { min: 2000, max: 800 }, 
            inhibitionRatio: { min: 0.3, max: 0.5 }  
        }
    },
    
    strobe: {
        freqMin: 3,
        freqMax: 6,
        dutyCycle: 0.35,
        blindAlpha: 0.92
    },
    
    noise: {
        baseSpeed: 6,
        gaborField: {
            baseSize: 40
        }
    }
};

// ==================== MODE INFO (FULL TEXT RESTORED) ====================
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
            'Avoid the <span style="color:#aaa">penalty halo</span>.',
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
function getScaledParam(paramObj, difficulty) {
    const t = Math.max(0.1, difficulty); 
    
    let val = paramObj.min + (paramObj.max - paramObj.min) * t;
    
    if (paramObj.min > paramObj.max) {
        const hardFloor = paramObj.max * 0.5;
        val = Math.max(hardFloor, val);
        
        if (paramObj.max > 100) { 
             val = Math.max(150, val);
        }
    }
    
    return val;
}

function getModeConfig(modeNum) {
    return CFG['mode' + modeNum] || null;
}

function getScaledValue(paramObj) {
    return getScaledParam(paramObj, typeof currentDifficulty !== 'undefined' ? currentDifficulty : 0.3);
}