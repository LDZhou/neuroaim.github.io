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
            targetSize: { min: 45, max: 20 },        // REDUCED: More challenging size range
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
            curveComplexity: { min: 1, max: 3 },
            killTimeout: 7000                         // NEW: 7 second timeout for kill
        }
    },
    
    // ===== MODE 3: SURGICAL LOCK =====
    mode3: {
        name: 'SURGICAL LOCK',
        tag: 'PREMOTOR + INHIBITION',
        description: 'Hit <span style="color:#ffcc00">Yellow Core</span>. Avoid <span style="color:#ffb400">Orange Halo</span>. Precision over speed.',
        params: {
            coreSize: { min: 12, max: 4 },           
            penaltySize: { min: 60, max: 35 },       
            coreOffset: { min: 0.3, max: 0.9 },      
            decoyCount: { min: 0, max: 8 },          
            decoyMovement: { min: 0, max: 3 },
            colorSimilarity: { min: 0, max: 0.9 }    // UPDATED: 0=distinct, 0.9=very similar (linear)
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
            decayFast: { min: 2.0, max: 4.0 },
            trackingRequirement: 0.6                  // NEW: 60% tracking time required
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
            switchInterval: { min: 15000, max: 8000 }, 
            warningTime: { min: 4000, max: 4000 },     
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
            baseSize: 35,              // UPDATED: Closer to target size
            sizeVariance: 8            // NEW: ±8px variance
        }
    }
};

// ==================== MODE INFO (FULL TEXT) ====================
const MODE_INFO = {
    1: {
        title: 'GABOR SCOUT',
        howTo: [
            'Click <strong>Vertical</strong> Gabor patches only.',
            'Ignore horizontal/diagonal distractors.',
            'All patches use Gaussian envelopes for authentic V1 simulation.',
            'Difficulty adapts: size, contrast, speed, noise density.',
            'Enable <span class="highlight">Strobe</span> in settings for temporal challenge.'
        ],
        improves: [ 
            'V1 Orientation Selectivity',
            'Figure-Ground Segregation', 
            'Crowding Resistance',
            'Temporal Visual Processing'
        ],
        science: `Targets the <strong>primary visual cortex (V1)</strong> where orientation-selective neurons reside. Uses authentic Gabor patches with Gaussian envelopes to match V1 receptive fields. The noise field mimics natural visual clutter, forcing your V1 to enhance signal-to-noise ratio. Adaptive difficulty ensures you're always in the optimal learning zone (i+1 principle).`
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
            'Target Transition Discipline'
        ],
        science: `Engages the <strong>cerebellum</strong> and <strong>area MT/V5</strong> for predictive motion tracking. The organic Lissajous movement prevents simple linear extrapolation, forcing your brain to build <strong>complex internal motion models</strong>. The <strong>afterGaze requirement</strong> trains you to resist the common habit of prematurely switching to the next target — in real gameplay, this prevents "panic flicking" and ensures confirmed kills before transitioning. This discipline is critical for multi-target engagements.`
    },
    3: {
        title: 'SURGICAL LOCK',
        howTo: [
            'Hit the <span style="color:#ffcc00">yellow core</span> precisely.',
            'Avoid the <span style="color:#ffb400">orange-yellow halo</span>.',
            '<span class="warn">Core position is RANDOM within halo!</span>',
            'At high difficulty: colors converge to identical yellow + both fade (min 5% opacity).',
            'Pure precision — no time pressure.'
        ],
        improves: [ 
            'Fine Motor Inhibition',
            'Premotor Cortex Precision',
            'Superior Colliculus Targeting',
            'Impulse Control'
        ],
        science: `A high-precision <strong>Fitts' Law</strong> task targeting the <strong>premotor cortex</strong> and <strong>superior colliculus</strong>. The random core placement prevents muscle memory, forcing active <strong>foveal acquisition</strong> on every trial. At extreme difficulty (90%), color similarity and opacity decay create a visual challenge requiring exceptional discrimination and impulse control.`
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
            'Peripheral-to-Foveal Acquisition Speed',
            'Saccadic Target Identification',
            'Pre-Shot Visual Processing',
            'Frontal Eye Field Activation'
        ],
        science: `Trains the critical <strong>peripheral detection → saccade → foveal identification</strong> pipeline. In FPS, you first detect an enemy in peripheral vision, then your eyes saccade to acquire them, and finally your fovea must resolve target details (friend/foe, hitbox position) before firing. This mode specifically accelerates that entire chain. The Landolt C forces <strong>foveal resolution</strong> — you cannot identify the gap direction peripherally, simulating how precise target identification requires direct fixation. Faster completion = faster "time to first shot" in real gameplay.`
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

// ==================== TRAINING GUIDE ====================
const TRAINING_GUIDE = {
    // ===== NEURAL PATHWAYS & TRAINING MODES =====
    neuralPathways: {
        title: 'NEURAL PATHWAYS OF AIMING',
        description: 'Different aiming skills rely on distinct neural circuits. Understanding these pathways helps you train systematically.',
        pathways: [
            {
                name: 'Visual Detection Pipeline',
                regions: ['V1 (Primary Visual Cortex)', 'V4 (Color/Form)', 'MT/V5 (Motion)'],
                function: 'Initial target detection, distinguishing targets from background, motion perception',
                trainedBy: ['Mode 1: Gabor Scout', 'Mode 5: Parafoveal Ghost'],
                fpsApplication: 'Spotting enemies in cluttered environments, detecting movement'
            },
            {
                name: 'Saccadic Targeting System',
                regions: ['Frontal Eye Fields (FEF)', 'Superior Colliculus', 'Parietal Cortex'],
                function: 'Rapid eye movements to acquire targets, coordinate eye-hand movements',
                trainedBy: ['Mode 4: Landolt Saccade', 'Mode 5: Parafoveal Ghost'],
                fpsApplication: 'Flick shots, quick target acquisition, scanning for enemies'
            },
            {
                name: 'Smooth Pursuit & Prediction',
                regions: ['Cerebellum', 'MT/V5', 'Supplementary Eye Fields'],
                function: 'Tracking moving targets, predicting future positions',
                trainedBy: ['Mode 2: Pure Tracking'],
                fpsApplication: 'Tracking strafing enemies, leading shots, spray control'
            },
            {
                name: 'Precision Motor Control',
                regions: ['Premotor Cortex', 'Primary Motor Cortex', 'Basal Ganglia'],
                function: 'Fine motor adjustments, stopping movement precisely',
                trainedBy: ['Mode 3: Surgical Lock'],
                fpsApplication: 'Micro-adjustments, headshot precision, avoiding overflick'
            },
            {
                name: 'Spatial Working Memory',
                regions: ['Dorsolateral Prefrontal Cortex (dlPFC)', 'Posterior Parietal Cortex'],
                function: 'Maintaining spatial positions in memory, multi-target awareness',
                trainedBy: ['Mode 6: Memory Sequencer'],
                fpsApplication: 'Tracking multiple enemies, remembering positions through smoke/cover'
            },
            {
                name: 'Executive Control & Flexibility',
                regions: ['Anterior Cingulate Cortex (ACC)', 'Prefrontal Cortex'],
                function: 'Rule switching, conflict monitoring, inhibiting wrong responses',
                trainedBy: ['Mode 7: Cognitive Switch'],
                fpsApplication: 'Adapting to changing situations, avoiding friendly fire, mode transitions'
            }
        ]
    },

    // ===== WHEN TO EXPECT IMPROVEMENT =====
    neuroplasticity: {
        title: 'WHEN WILL I IMPROVE?',
        keyPoints: [
            {
                heading: 'Not Immediately After Training',
                content: 'Your performance may actually decline immediately after an intense session. This is normal — your neural circuits are fatigued and undergoing reorganization. Do not judge progress by post-session performance.'
            },
            {
                heading: 'Sleep Is When Learning Consolidates',
                content: 'Neural plasticity — the actual strengthening of synaptic connections — occurs primarily during sleep, especially during REM and slow-wave sleep phases. The brain replays and consolidates motor patterns learned during waking hours. One night of quality sleep can improve performance by 20-30% on motor tasks.'
            },
            {
                heading: 'The 48-72 Hour Window',
                content: 'Measurable improvement typically appears 1-3 days after training, assuming adequate sleep. This is when neural consolidation completes and new pathways are fully integrated.'
            },
            {
                heading: 'Cumulative Adaptation (2-4 Weeks)',
                content: 'Structural neural changes (increased myelination, dendritic growth) require consistent training over weeks. Expect significant, stable improvement after 2-4 weeks of regular practice.'
            },
            {
                heading: 'Plateau & Breakthrough Cycles',
                content: 'Skill development follows a step-function pattern. You will experience plateaus where improvement stalls. Continue training — breakthroughs often occur suddenly after apparent stagnation.'
            }
        ],
        sleepRecommendations: [
            'Aim for 7-9 hours of sleep per night',
            'Training before sleep (evening sessions) may enhance consolidation',
            'Avoid alcohol after training — it disrupts REM sleep and consolidation',
            'Naps (20-90 min) can accelerate motor learning if sleep-deprived'
        ]
    },

    // ===== RECOMMENDED USAGE =====
    usageProtocol: {
        title: 'RECOMMENDED TRAINING PROTOCOL',
        principles: [
            {
                name: 'Focused Practice > Marathon Sessions',
                detail: 'Short, focused sessions (10-20 min per mode) outperform long, fatigued sessions. Quality of attention matters more than total time.'
            },
            {
                name: 'Distributed Practice',
                detail: 'Multiple short sessions across days beat one long session. Sleep between sessions allows consolidation.'
            },
            {
                name: 'Train Weaknesses, Not Strengths',
                detail: 'Identify your weakest modes and prioritize them. Comfortable training is often ineffective training.'
            }
        ],
        dailyRecommendations: [
            {
                mode: 'Mode 1: Gabor Scout',
                duration: '5-10 minutes',
                frequency: '3-4x per week',
                notes: 'Best as a warm-up. Primes visual cortex for other tasks.'
            },
            {
                mode: 'Mode 2: Pure Tracking',
                duration: '10-15 minutes',
                frequency: 'Daily or every other day',
                notes: 'Core tracking skill. Essential for most FPS games. Can extend to 20 min if tracking is a weakness.'
            },
            {
                mode: 'Mode 3: Surgical Lock',
                duration: '5-10 minutes',
                frequency: '3-4x per week',
                notes: 'Highly demanding. Shorter sessions prevent frustration. Quality over quantity.'
            },
            {
                mode: 'Mode 4: Landolt Saccade',
                duration: '5-10 minutes',
                frequency: 'Daily',
                notes: 'Critical for flick-heavy games (Valorant, CS). Short sessions, high frequency optimal.'
            },
            {
                mode: 'Mode 5: Parafoveal Ghost',
                duration: '10-15 minutes',
                frequency: '3-4x per week',
                notes: 'Cognitively demanding. Avoid when mentally fatigued.'
            },
            {
                mode: 'Mode 6: Memory Sequencer',
                duration: '5-10 minutes',
                frequency: '2-3x per week',
                notes: 'Working memory training. Benefits plateau quickly — diminishing returns after 10 min.'
            },
            {
                mode: 'Mode 7: Cognitive Switch',
                duration: '5-10 minutes',
                frequency: '2-3x per week',
                notes: 'Best done when mentally fresh. Avoid late-night sessions.'
            }
        ],
        sampleRoutines: [
            {
                name: 'Quick Warm-Up (15 min)',
                routine: 'Mode 1 (5 min) → Mode 4 (5 min) → Mode 2 (5 min)',
                useCase: 'Before ranked games'
            },
            {
                name: 'Full Training Session (45 min)',
                routine: 'Mode 1 (5 min) → Mode 2 (15 min) → Mode 3 (10 min) → Mode 4 (10 min) → Rest',
                useCase: 'Dedicated training day'
            },
            {
                name: 'Cognitive Focus (25 min)',
                routine: 'Mode 5 (10 min) → Mode 7 (10 min) → Mode 6 (5 min)',
                useCase: 'Training awareness and decision-making'
            }
        ],
        warnings: [
            'Do NOT train for more than 60 minutes total per day — diminishing returns and fatigue',
            'Stop if experiencing eye strain, headache, or frustration',
            'Rest at least 1 day per week (active recovery)',
            'Avoid training immediately before important matches — temporary fatigue can hurt performance'
        ]
    },

    // ===== STROBE MODE =====
    strobeMode: {
        title: 'STROBE MODE: TEMPORAL OCCLUSION TRAINING',
        whatItDoes: 'Strobe mode periodically blacks out the screen (3-6 Hz), forcing your brain to process visual information in discrete snapshots rather than continuous flow.',
        howToEnable: 'Go to Settings → Strobe Mode → Toggle ON for each mode individually.',
        benefits: [
            {
                benefit: 'Enhanced Visual Memory',
                explanation: 'When vision is interrupted, your brain must retain the last visual frame longer. This strengthens iconic memory — the brief visual buffer that persists after stimuli disappear.'
            },
            {
                benefit: 'Improved Motion Prediction',
                explanation: 'Without continuous visual feedback, your cerebellum must predict target positions during blackout periods. This enhances predictive tracking ability.'
            },
            {
                benefit: 'Faster Information Extraction',
                explanation: 'Limited visual exposure time forces your brain to extract critical information (target position, movement direction) more efficiently. You learn to see "more" in less time.'
            },
            {
                benefit: 'Reduced Visual Dependency',
                explanation: 'Training with intermittent vision reduces over-reliance on continuous visual feedback, improving performance in chaotic/occluded game situations (smoke, flash, particle effects).'
            }
        ],
        scienceBackground: 'Stroboscopic training has been used by professional athletes (Nike SPARQ, baseball, hockey) to improve dynamic visual acuity and reaction time. Studies show 4-8 weeks of strobe training can improve motion perception, attention, and anticipatory timing.',
        recommendations: [
            'Start with strobe OFF until you reach 50%+ difficulty in normal mode',
            'Enable strobe for 1-2 modes at a time, not all at once',
            'Strobe training is more fatiguing — reduce session duration by 30%',
            'Most effective for Mode 2 (Tracking) and Mode 5 (Peripheral Vision)'
        ],
        warnings: [
            'Strobe can trigger discomfort in photosensitive individuals',
            'Do NOT use if you have epilepsy or seizure history',
            'Stop immediately if you experience headache, nausea, or dizziness'
        ]
    },

    // ===== ADAPTIVE DIFFICULTY (i+1) =====
    adaptiveDifficulty: {
        title: 'ADAPTIVE DIFFICULTY: THE i+1 PRINCIPLE',
        concept: 'The system automatically adjusts difficulty to keep you in the optimal learning zone — challenging enough to improve, but not so hard that you fail repeatedly.',
        origin: 'Based on Vygotsky\'s "Zone of Proximal Development" and Krashen\'s "i+1" hypothesis from language acquisition. Learning is maximized when tasks are slightly beyond current ability (i) plus one step (+1).',
        
        whyItMatters: [
            'Prevents wasted time on tasks that are too easy (no learning occurs)',
            'Prevents frustration from tasks that are impossibly hard (learned helplessness)',
            'Maximizes time spent in the productive struggle zone',
            'Allows automatic progression without manual difficulty management',
            'Ensures challenge scales with your improving skill over weeks/months'
        ],
        tips: [
            'Trust the system — don\'t try to manipulate difficulty by intentionally missing',
            'Difficulty percentage shown in HUD reflects current challenge level',
            'Higher difficulty = better training, but only if you can maintain ~75% accuracy',
            'If stuck at low difficulty, focus on fundamentals (smooth movements, proper timing)'
        ]
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