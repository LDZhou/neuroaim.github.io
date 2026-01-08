// ==================== GAME CONFIGURATION ====================
// Central configuration for all game parameters

const CFG = {
    // Mode 1: Gabor Scout
    gaborSize: 45,
    microDotSize: 5,
    
    // Mode 1: Adaptive Contrast (Staircase Method)
    gabor: {
        startContrast: 1.0,
        stepDown: 0.05,      // Decrease contrast after hit
        stepUp: 0.10,        // Increase contrast after miss
        minContrast: 0.08    // Minimum visibility
    },
    
    // Mode 3: Surgical Lock
    surgical: {
        coreSize: 3,         // Default 3px precision target
        penaltySize: 35,     // Default penalty halo size
        coreScore: 100,      // Points for hitting core
        penaltyScore: -50,   // Penalty for hitting halo
        missScore: -10       // Penalty for missing entirely
    },
    
    // Timing
    afterGazeTime: 300,
    friendTimeout: 2000,
    enemyTimeout: 3000,
    
    // Mode 2: Dynamic Tracking difficulty presets
    mode2: {
        easy:   { speed: 6,  trackTime: 600, label: 'EASY' },
        medium: { speed: 8,  trackTime: 450, label: 'MEDIUM' },
        hard:   { speed: 12, trackTime: 350, label: 'HARD' }
    },
    
    // Target spawn ratio
    targetRatio: 0.65  // 65% enemies in Mode 1
};

// Mode information for help modals
const MODE_INFO = {
    1: {
        title: 'GABOR SCOUT',
        howTo: [
            '<span class="highlight">Vertical stripes</span> = Enemy → Click to eliminate',
            '<span class="highlight">Horizontal stripes</span> = Friendly → Do NOT click, wait for it to disappear',
            'With adaptive contrast ON: targets fade as you improve',
            'Dynamic noise overlay trains V1 cortex pattern separation',
            'After each kill, <span class="warn">hold your cursor position</span> for 300ms (configurable)'
        ],
        improves: [
            '<span class="highlight">Target discrimination</span> — quickly identify friend vs foe under pressure',
            '<span class="highlight">Contrast sensitivity</span> — detect targets at lower visibility thresholds',
            '<span class="highlight">Impulse control</span> — resist shooting friendlies, reduce panic clicks',
            '<span class="highlight">V1 cortex training</span> — process orientation in visual noise'
        ],
        science: `This mode trains two critical visual pathways. The <span class="highlight">Gabor patches</span> (striped circles) are the same stimuli neuroscientists use to study V1 cortex — your brain's first visual processing area that detects orientation.

The <span class="highlight">adaptive contrast</span> uses a psychophysical staircase method: as you succeed, targets become more transparent, pushing your contrast sensitivity threshold. The <span class="highlight">dynamic noise overlay</span> creates realistic visual interference, training your brain to separate signal from noise — essential for spotting enemies in cluttered game environments.`
    },
    2: {
        title: 'DYNAMIC TRACKING',
        howTo: [
            'A target moves randomly across the screen',
            '<span class="highlight">Keep your cursor on the target</span> to fill the lock ring',
            'Once the ring turns <span class="highlight">green</span>, click to confirm the kill',
            'Clicking before lock completes = penalty',
            'After each kill, <span class="warn">hold position</span> for 300ms (configurable)'
        ],
        improves: [
            '<span class="highlight">Smooth pursuit</span> — track moving targets without losing them',
            '<span class="highlight">Predictive tracking</span> — anticipate target movement patterns',
            '<span class="highlight">Lock discipline</span> — wait for the right moment instead of panic shooting',
            '<span class="highlight">Cursor-eye coordination</span> — synchronize hand movement with visual tracking'
        ],
        science: `This mode targets the <span class="highlight">MT/V5 area</span> (middle temporal cortex), specialized for motion processing. When you track a moving target, MT neurons calculate velocity vectors and predict future positions — essential for leading shots in games.

The <span class="highlight">smooth pursuit system</span> is separate from saccades (quick eye jumps). Most people over-rely on saccades, causing jerky tracking. This training strengthens the pursuit pathway, resulting in smoother tracking. The <span class="highlight">lock confirmation mechanic</span> trains your basal ganglia to inhibit premature motor responses.`
    },
    3: {
        title: 'SURGICAL LOCK',
        howTo: [
            'A tiny <span class="highlight">3px cyan core</span> appears surrounded by a <span class="warn">red penalty halo</span>',
            'You MUST hit the <span class="highlight">exact core</span> to score (+100)',
            'Hitting the <span class="warn">halo</span> = severe penalty (-50) and target stays',
            'Missing entirely = minor penalty (-10)',
            'Only perfect shots refresh the target'
        ],
        improves: [
            '<span class="highlight">Micro-precision</span> — pixel-perfect cursor control',
            '<span class="highlight">Impulse inhibition</span> — resist "close enough" shots',
            '<span class="highlight">Premotor cortex</span> — fine motor planning before execution',
            '<span class="highlight">Frustration tolerance</span> — maintain precision under pressure'
        ],
        science: `This mode is inspired by <span class="highlight">Fitts' Law</span> training used in motor control research. The tiny target size forces your <span class="highlight">premotor cortex</span> to compute extremely precise motor plans before execution.

The <span class="highlight">penalty halo</span> creates a "no-go zone" that trains response inhibition — the same neural circuit that prevents flinching. By punishing imprecise shots without refreshing the target, you're forced to recalibrate rather than spam. This builds the <span class="highlight">frustration tolerance</span> essential for high-pressure gameplay.`
    }
};
