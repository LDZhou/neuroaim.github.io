// ==================== STATS MODULE ====================
// Comprehensive FPS-focused statistics with progress tracking
// FULLY REWRITTEN for detailed analytics

const STATS_KEY = 'neuroaim_stats_v2';

// ===== DATA PERSISTENCE =====
function loadStats() {
    try {
        const data = localStorage.getItem(STATS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.warn("Stats load failed, resetting:", e);
        return [];
    }
}

function saveGameStats(session) {
    const stats = loadStats();
    stats.push(session);
    if (stats.length > 2000) stats.shift();
    
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.warn("Storage full?", e);
    }
}

// ===== STATS CALCULATION HELPERS =====
function filterByModeAndDifficulty(stats, mode, difficulty = null) {
    return stats.filter(s => {
        if (s.mode !== mode) return false;
        if (difficulty && s.difficulty !== difficulty) return false;
        return true;
    });
}

function getRecentSessions(sessions, count = 10) {
    return sessions.slice(-count);
}

function calculateAverage(arr, key) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + (b[key] || 0), 0);
    return Math.round(sum / arr.length);
}

function calculateTrend(sessions, key, recentCount = 5) {
    if (sessions.length < recentCount * 2) return { trend: 'neutral', change: 0 };
    
    const recent = sessions.slice(-recentCount);
    const previous = sessions.slice(-recentCount * 2, -recentCount);
    
    const recentAvg = calculateAverage(recent, key);
    const previousAvg = calculateAverage(previous, key);
    
    if (previousAvg === 0) return { trend: 'neutral', change: 0 };
    
    const change = Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
    
    if (change > 5) return { trend: 'up', change };
    if (change < -5) return { trend: 'down', change };
    return { trend: 'neutral', change };
}

function getPercentile(value, allValues) {
    if (allValues.length === 0) return 0;
    const sorted = [...allValues].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return Math.round((index / sorted.length) * 100);
}

// ===== MODE NAMES & COLORS =====
const MODE_NAMES = {
    1: 'Gabor Scout',
    2: 'Pure Tracking',
    3: 'Surgical Lock',
    4: 'Landolt Saccade'
};

const MODE_COLORS = {
    1: '#00d9ff',
    2: '#00ff99',
    3: '#ff3366',
    4: '#ffcc00'
};

const DIFFICULTY_COLORS = {
    easy: '#00ff99',
    medium: '#ffcc00',
    hard: '#ff3366'
};

// ===== FPS SKILL METRICS =====
const FPS_METRICS = {
    1: { // Gabor Scout
        primary: 'avgRt',
        secondary: 'accuracy',
        name: 'Target Acquisition',
        description: 'Measures reaction speed and visual filtering ability'
    },
    2: { // Pure Tracking
        primary: 'accuracy',
        secondary: 'gazeBreaks',
        name: 'Tracking Stability',
        description: 'Measures smooth pursuit and post-shot discipline'
    },
    3: { // Surgical Lock
        primary: 'accuracy',
        secondary: 'avgRt',
        name: 'Precision Control',
        description: 'Measures fine motor control and target discrimination'
    },
    4: { // Landolt Saccade
        primary: 'avgRt',
        secondary: 'accuracy',
        name: 'Saccadic Speed',
        description: 'Measures eye-hand coordination and foveal acquisition'
    }
};

// ===== MAIN DISPLAY FUNCTION =====
function updateStatsDisplay() {
    const stats = loadStats();
    const container = document.getElementById('stats-screen');
    
    // Preserve header
    const header = container.querySelector('.stats-header');
    container.innerHTML = '';
    container.appendChild(header);
    
    if (stats.length === 0) {
        container.innerHTML += `
            <div class="no-data-message">
                <div class="no-data-icon">📊</div>
                <h3>NO TRAINING DATA</h3>
                <p>Complete some training sessions to see your statistics.</p>
            </div>
        `;
        return;
    }
    
    // Create main stats layout
    const mainContent = document.createElement('div');
    mainContent.className = 'stats-main-content';
    
    // Overall Summary Section
    mainContent.innerHTML += createOverallSummary(stats);
    
    // Mode Tabs
    mainContent.innerHTML += `
        <div class="stats-mode-tabs">
            <button class="mode-tab active" data-mode="all" onclick="switchStatsTab('all')">OVERVIEW</button>
            <button class="mode-tab" data-mode="1" onclick="switchStatsTab(1)">MODE 1: GABOR</button>
            <button class="mode-tab" data-mode="2" onclick="switchStatsTab(2)">MODE 2: TRACKING</button>
            <button class="mode-tab" data-mode="3" onclick="switchStatsTab(3)">MODE 3: SURGICAL</button>
            <button class="mode-tab" data-mode="4" onclick="switchStatsTab(4)">MODE 4: LANDOLT</button>
        </div>
    `;
    
    // Tab Content Container
    mainContent.innerHTML += `<div id="stats-tab-content"></div>`;
    
    container.appendChild(mainContent);
    
    // Show overview by default
    switchStatsTab('all');
    
    // Add clear data button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-data-btn';
    clearBtn.innerText = "CLEAR ALL DATA";
    clearBtn.onclick = () => {
        if(confirm('Delete all training history? This cannot be undone.')) {
            localStorage.removeItem(STATS_KEY);
            updateStatsDisplay();
        }
    };
    container.appendChild(clearBtn);
}

// ===== TAB SWITCHING =====
window.switchStatsTab = function(mode) {
    // Update active tab
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode == mode);
    });
    
    const container = document.getElementById('stats-tab-content');
    const stats = loadStats();
    
    if (mode === 'all') {
        container.innerHTML = createOverviewContent(stats);
    } else {
        container.innerHTML = createModeDetailContent(stats, parseInt(mode));
    }
};

// ===== OVERALL SUMMARY =====
function createOverallSummary(stats) {
    const totalSessions = stats.length;
    const totalTime = Math.round(totalSessions * 55 / 60); // Approximate minutes
    const avgAccuracy = calculateAverage(stats, 'accuracy');
    const avgRt = calculateAverage(stats, 'avgRt');
    
    // Best scores per mode
    const bestScores = {};
    [1, 2, 3, 4].forEach(mode => {
        const modeSessions = filterByModeAndDifficulty(stats, mode);
        bestScores[mode] = modeSessions.length > 0 
            ? Math.max(...modeSessions.map(s => s.score))
            : 0;
    });
    
    return `
        <div class="stats-summary-grid">
            <div class="summary-card highlight">
                <div class="summary-value">${totalSessions}</div>
                <div class="summary-label">TOTAL SESSIONS</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${totalTime}m</div>
                <div class="summary-label">TRAINING TIME</div>
            </div>
            <div class="summary-card green">
                <div class="summary-value">${avgAccuracy}%</div>
                <div class="summary-label">AVG ACCURACY</div>
            </div>
            <div class="summary-card yellow">
                <div class="summary-value">${avgRt}ms</div>
                <div class="summary-label">AVG REACTION</div>
            </div>
        </div>
    `;
}

// ===== OVERVIEW TAB =====
function createOverviewContent(stats) {
    let html = '<div class="stats-overview">';
    
    // Mode Performance Cards
    html += '<h3 class="section-title">PERFORMANCE BY MODE</h3>';
    html += '<div class="mode-performance-grid">';
    
    [1, 2, 3, 4].forEach(mode => {
        const modeSessions = filterByModeAndDifficulty(stats, mode);
        const color = MODE_COLORS[mode];
        const name = MODE_NAMES[mode];
        
        if (modeSessions.length === 0) {
            html += `
                <div class="mode-perf-card" style="border-color: ${color}20">
                    <div class="mode-perf-header" style="color: ${color}">${name}</div>
                    <div class="mode-perf-empty">No data yet</div>
                </div>
            `;
            return;
        }
        
        const avgScore = calculateAverage(modeSessions, 'score');
        const avgAcc = calculateAverage(modeSessions, 'accuracy');
        const avgRt = calculateAverage(modeSessions, 'avgRt');
        const trend = calculateTrend(modeSessions, 'score');
        
        html += `
            <div class="mode-perf-card" style="border-color: ${color}">
                <div class="mode-perf-header" style="color: ${color}">${name}</div>
                <div class="mode-perf-stats">
                    <div class="perf-stat">
                        <span class="perf-value">${avgScore}</span>
                        <span class="perf-label">AVG SCORE</span>
                    </div>
                    <div class="perf-stat">
                        <span class="perf-value">${avgAcc}%</span>
                        <span class="perf-label">ACCURACY</span>
                    </div>
                    <div class="perf-stat">
                        <span class="perf-value">${avgRt}ms</span>
                        <span class="perf-label">REACT</span>
                    </div>
                </div>
                <div class="mode-perf-footer">
                    <span>${modeSessions.length} sessions</span>
                    <span class="trend ${trend.trend}">${trend.trend === 'up' ? '↑' : trend.trend === 'down' ? '↓' : '→'} ${Math.abs(trend.change)}%</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Recent Sessions Table
    html += '<h3 class="section-title">RECENT SESSIONS</h3>';
    html += createRecentSessionsTable(stats.slice(-15).reverse());
    
    html += '</div>';
    return html;
}

// ===== MODE DETAIL TAB =====
function createModeDetailContent(stats, mode) {
    const modeSessions = filterByModeAndDifficulty(stats, mode);
    const color = MODE_COLORS[mode];
    const name = MODE_NAMES[mode];
    const metric = FPS_METRICS[mode];
    
    if (modeSessions.length === 0) {
        return `
            <div class="mode-detail-empty">
                <h3 style="color: ${color}">${name}</h3>
                <p>Complete some sessions in this mode to see detailed statistics.</p>
            </div>
        `;
    }
    
    let html = `<div class="mode-detail" style="--mode-color: ${color}">`;
    
    // Mode Header
    html += `
        <div class="mode-detail-header">
            <h3 style="color: ${color}">${name}</h3>
            <p class="mode-description">${metric.description}</p>
        </div>
    `;
    
    // Difficulty Breakdown
    html += '<h4 class="subsection-title">PERFORMANCE BY DIFFICULTY</h4>';
    html += '<div class="difficulty-breakdown">';
    
    ['easy', 'medium', 'hard'].forEach(diff => {
        const diffSessions = filterByModeAndDifficulty(stats, mode, diff);
        const diffColor = DIFFICULTY_COLORS[diff];
        
        if (diffSessions.length === 0) {
            html += `
                <div class="diff-card empty">
                    <div class="diff-header" style="color: ${diffColor}">${diff.toUpperCase()}</div>
                    <div class="diff-empty">No data</div>
                </div>
            `;
            return;
        }
        
        const best = Math.max(...diffSessions.map(s => s.score));
        const avg = calculateAverage(diffSessions, 'score');
        const avgAcc = calculateAverage(diffSessions, 'accuracy');
        const avgRt = calculateAverage(diffSessions, 'avgRt');
        const recent = getRecentSessions(diffSessions, 5);
        const recentAvg = calculateAverage(recent, 'score');
        const trend = calculateTrend(diffSessions, 'score');
        
        // Additional mode-specific stats
        let extraStats = '';
        if (mode === 2) {
            const avgGazeBreaks = calculateAverage(diffSessions.filter(s => s.gazeBreaks !== undefined), 'gazeBreaks');
            extraStats = `<div class="diff-stat"><span class="stat-value">${avgGazeBreaks}</span><span class="stat-label">Gaze Breaks</span></div>`;
        }
        if (mode === 3 || mode === 4) {
            const minRt = Math.min(...diffSessions.filter(s => s.minRt).map(s => s.minRt));
            if (minRt && minRt !== Infinity) {
                extraStats = `<div class="diff-stat"><span class="stat-value">${minRt}ms</span><span class="stat-label">Best RT</span></div>`;
            }
        }
        
        html += `
            <div class="diff-card" style="border-color: ${diffColor}">
                <div class="diff-header" style="color: ${diffColor}">${diff.toUpperCase()}</div>
                <div class="diff-best">
                    <span class="best-label">BEST</span>
                    <span class="best-value">${best}</span>
                </div>
                <div class="diff-stats">
                    <div class="diff-stat">
                        <span class="stat-value">${avg}</span>
                        <span class="stat-label">Avg Score</span>
                    </div>
                    <div class="diff-stat">
                        <span class="stat-value">${avgAcc}%</span>
                        <span class="stat-label">Accuracy</span>
                    </div>
                    <div class="diff-stat">
                        <span class="stat-value">${avgRt}ms</span>
                        <span class="stat-label">Avg RT</span>
                    </div>
                    ${extraStats}
                </div>
                <div class="diff-progress">
                    <div class="progress-row">
                        <span>Sessions: ${diffSessions.length}</span>
                        <span class="trend ${trend.trend}">${trend.trend === 'up' ? '↑' : trend.trend === 'down' ? '↓' : '→'} ${Math.abs(trend.change)}%</span>
                    </div>
                    <div class="progress-row">
                        <span>Recent Avg: ${recentAvg}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Progress Chart
    html += '<h4 class="subsection-title">SCORE PROGRESSION</h4>';
    html += createProgressChart(modeSessions, mode);
    
    // Consistency Analysis
    html += '<h4 class="subsection-title">CONSISTENCY ANALYSIS</h4>';
    html += createConsistencyAnalysis(modeSessions, mode);
    
    // Recent Sessions for this mode
    html += '<h4 class="subsection-title">RECENT SESSIONS</h4>';
    html += createRecentSessionsTable(modeSessions.slice(-10).reverse(), true);
    
    html += '</div>';
    return html;
}

// ===== PROGRESS CHART =====
function createProgressChart(sessions, mode) {
    if (sessions.length < 2) {
        return '<div class="chart-placeholder">Need more sessions for chart</div>';
    }
    
    const color = MODE_COLORS[mode];
    const maxScore = Math.max(...sessions.map(s => s.score));
    const minScore = Math.min(...sessions.map(s => s.score));
    const range = maxScore - minScore || 1;
    
    // Take last 20 sessions for chart
    const chartSessions = sessions.slice(-20);
    const width = 100 / chartSessions.length;
    
    let bars = '';
    chartSessions.forEach((s, i) => {
        const height = ((s.score - minScore) / range) * 80 + 10;
        const diffColor = DIFFICULTY_COLORS[s.difficulty] || color;
        bars += `
            <div class="chart-bar" style="width: ${width}%; height: ${height}%; background: ${diffColor}" 
                 title="${s.score} pts (${s.difficulty})"></div>
        `;
    });
    
    return `
        <div class="progress-chart">
            <div class="chart-y-axis">
                <span>${maxScore}</span>
                <span>${Math.round((maxScore + minScore) / 2)}</span>
                <span>${minScore}</span>
            </div>
            <div class="chart-bars">${bars}</div>
            <div class="chart-x-label">← Older | Newer →</div>
        </div>
    `;
}

// ===== CONSISTENCY ANALYSIS =====
function createConsistencyAnalysis(sessions, mode) {
    if (sessions.length < 5) {
        return '<div class="analysis-placeholder">Need at least 5 sessions for analysis</div>';
    }
    
    const scores = sessions.map(s => s.score);
    const rts = sessions.filter(s => s.avgRt).map(s => s.avgRt);
    const accs = sessions.map(s => s.accuracy);
    
    // Calculate standard deviations
    const scoreMean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const scoreStd = Math.round(Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - scoreMean, 2), 0) / scores.length));
    
    const rtMean = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
    const rtStd = rts.length > 0 ? Math.round(Math.sqrt(rts.reduce((a, b) => a + Math.pow(b - rtMean, 2), 0) / rts.length)) : 0;
    
    // Consistency rating
    const scoreCV = scoreMean > 0 ? (scoreStd / scoreMean) * 100 : 0;
    const rtCV = rtMean > 0 ? (rtStd / rtMean) * 100 : 0;
    
    let consistencyRating = 'STABLE';
    let consistencyColor = '#00ff99';
    if (scoreCV > 30 || rtCV > 30) {
        consistencyRating = 'VARIABLE';
        consistencyColor = '#ffcc00';
    }
    if (scoreCV > 50 || rtCV > 50) {
        consistencyRating = 'INCONSISTENT';
        consistencyColor = '#ff3366';
    }
    
    // Improvement detection
    const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2));
    const secondHalf = sessions.slice(Math.floor(sessions.length / 2));
    const firstAvg = calculateAverage(firstHalf, 'score');
    const secondAvg = calculateAverage(secondHalf, 'score');
    const improvement = secondAvg - firstAvg;
    
    return `
        <div class="consistency-grid">
            <div class="consistency-card">
                <div class="consistency-rating" style="color: ${consistencyColor}">${consistencyRating}</div>
                <div class="consistency-label">Overall Consistency</div>
            </div>
            <div class="consistency-card">
                <div class="consistency-value">±${scoreStd}</div>
                <div class="consistency-label">Score Variance</div>
            </div>
            <div class="consistency-card">
                <div class="consistency-value">±${rtStd}ms</div>
                <div class="consistency-label">RT Variance</div>
            </div>
            <div class="consistency-card">
                <div class="consistency-value ${improvement > 0 ? 'positive' : improvement < 0 ? 'negative' : ''}">${improvement > 0 ? '+' : ''}${improvement}</div>
                <div class="consistency-label">Score Trend</div>
            </div>
        </div>
        <div class="consistency-insight">
            ${improvement > 20 ? '📈 <strong>Great progress!</strong> Your scores are improving over time.' : 
              improvement < -20 ? '📉 <strong>Performance dip detected.</strong> Consider taking a break or adjusting difficulty.' :
              '📊 <strong>Steady performance.</strong> Your scores are consistent.'}
            ${scoreCV > 30 ? ' Try to focus on consistency - large score swings indicate variable focus.' : ''}
        </div>
    `;
}

// ===== RECENT SESSIONS TABLE =====
function createRecentSessionsTable(sessions, hideMode = false) {
    if (sessions.length === 0) return '<div class="no-sessions">No sessions yet</div>';
    
    let html = `
        <table class="sessions-table">
            <thead>
                <tr>
                    ${hideMode ? '' : '<th>MODE</th>'}
                    <th>DIFFICULTY</th>
                    <th>SCORE</th>
                    <th>ACCURACY</th>
                    <th>AVG RT</th>
                    <th>HITS</th>
                    <th>DATE</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sessions.forEach(s => {
        const date = new Date(s.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const modeColor = MODE_COLORS[s.mode] || '#fff';
        const diffColor = DIFFICULTY_COLORS[s.difficulty] || '#888';
        
        html += `
            <tr>
                ${hideMode ? '' : `<td style="color: ${modeColor}">${MODE_NAMES[s.mode] || 'Unknown'}</td>`}
                <td style="color: ${diffColor}">${(s.difficulty || 'normal').toUpperCase()}</td>
                <td class="score-cell">${s.score}</td>
                <td>${s.accuracy}%</td>
                <td>${s.avgRt}ms</td>
                <td>${s.hits || 0}/${s.shots || 0}</td>
                <td class="date-cell">${dateStr} ${timeStr}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}