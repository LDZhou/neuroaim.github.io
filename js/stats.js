// ==================== STATS MODULE ====================
// Pure statistics tracking - no scoring
// Separate strobe/non-strobe statistics
// UPDATED: NCS includes tracking time bonus for Mode 2 and 5

const STATS_KEY = 'neuroaim_stats_v3';

// ===== DATA PERSISTENCE =====
function loadStats() {
    try {
        const data = localStorage.getItem(STATS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.warn("Stats load failed:", e);
        return [];
    }
}

function saveGameStats(session) {
    // Add NCS before saving
    session.ncs = calculateNCS(session);
    
    const stats = loadStats();
    stats.push(session);
    if (stats.length > 2000) stats.shift();
    
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.warn("Storage full?", e);
    }
}

// ===== NCS CALCULATION (UPDATED WITH TRACKING BONUS) =====
function calculateNCS(s) {
    if (!s.trials || s.trials === 0) return 0;
    
    // 1. Difficulty Base (1000 pts per 1.0 diff)
    const avgDiff = ((s.startDifficulty || 0.3) + (s.endDifficulty || 0.3)) / 2;
    const baseScore = avgDiff * 1000;
    
    // 2. Accuracy Weight (Exponential penalty)
    const accuracy = s.hits / s.trials;
    const accWeight = Math.pow(accuracy, 1.5);
    
    // 3. Speed Factor (Multiplier)
    // 400ms base RT. Faster = bonus, Slower = penalty.
    const rt = s.avgRt || 1000;
    const speedFactor = 400 / (Math.max(150, rt) + 50);
    
    // 4. Strobe Bonus (1.2x if Strobe enabled)
    const strobeBonus = s.strobe ? 1.2 : 1.0;
    
    // 5. NEW: Tracking Time Bonus (for Mode 2 and 5)
    let trackingBonus = 1.0;
    if ((s.mode === 2 || s.mode === 5) && s.trackingTime) {
        // Reward sustained tracking
        // Each second of tracking adds 0.5% bonus (capped at 50% = 100 seconds)
        const bonusPercent = Math.min(0.5, s.trackingTime * 0.005);
        trackingBonus = 1.0 + bonusPercent;
    }
    
    return Math.round(baseScore * accWeight * speedFactor * strobeBonus * trackingBonus);
}

// ===== MODE METADATA =====
const MODE_NAMES = {
    1: 'Gabor Scout',
    2: 'Pure Tracking',
    3: 'Surgical Lock',
    4: 'Landolt Saccade',
    5: 'Parafoveal Ghost',
    6: 'Memory Sequencer',
    7: 'Cognitive Switch'
};

const MODE_COLORS = {
    1: '#00d9ff',
    2: '#00ff99',
    3: '#ff3366',
    4: '#ffcc00',
    5: '#9966ff',
    6: '#ff66cc',
    7: '#66ffcc'
};

const MODE_METRICS = {
    1: { primary: 'avgRt', secondary: 'accuracy', name: 'Target Acquisition' },
    2: { primary: 'accuracy', secondary: 'gazeBreaks', name: 'Tracking Stability' },
    3: { primary: 'accuracy', secondary: 'avgRt', name: 'Precision Control' },
    4: { primary: 'avgRt', secondary: 'accuracy', name: 'Saccadic Speed' },
    5: { primary: 'accuracy', secondary: 'inhibitionSuccess', name: 'Peripheral Awareness' },
    6: { primary: 'accuracy', secondary: 'sequenceErrors', name: 'Spatial Memory' },
    7: { primary: 'accuracy', secondary: 'switchErrors', name: 'Cognitive Flexibility' }
};

// ===== CALCULATION HELPERS =====
function filterSessions(stats, mode, strobe = null) {
    return stats.filter(s => {
        if (s.mode !== mode) return false;
        if (strobe !== null && s.strobe !== strobe) return false;
        return true;
    });
}

function calculateAvg(arr, key) {
    const valid = arr.filter(s => s[key] !== undefined && s[key] !== null);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((a, b) => a + b[key], 0) / valid.length);
}

function calculateTrend(sessions, key, windowSize = 5) {
    if (sessions.length < windowSize * 2) return { trend: 'neutral', change: 0 };
    
    const recent = sessions.slice(-windowSize);
    const previous = sessions.slice(-windowSize * 2, -windowSize);
    
    const recentAvg = calculateAvg(recent, key);
    const previousAvg = calculateAvg(previous, key);
    
    if (previousAvg === 0) return { trend: 'neutral', change: 0 };
    
    const change = Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
    
    if (change > 5) return { trend: 'up', change };
    if (change < -5) return { trend: 'down', change };
    return { trend: 'neutral', change };
}

function getDifficultyProgression(sessions) {
    if (sessions.length < 2) return { start: 0.3, end: 0.3, change: 0 };
    
    const first = sessions[0];
    const last = sessions[sessions.length - 1];
    
    return {
        start: first.startDifficulty || 0.3,
        end: last.endDifficulty || 0.3,
        change: (last.endDifficulty || 0.3) - (first.startDifficulty || 0.3)
    };
}

// ===== MAIN DISPLAY =====
function updateStatsDisplay() {
    const stats = loadStats();
    const container = document.getElementById('stats-screen');
    
    if (!container) return;
    
    const header = container.querySelector('.stats-header');
    container.innerHTML = '';
    if(header) container.appendChild(header);
    
    if (stats.length === 0) {
        container.innerHTML += `
            <div class="no-data-message">
                <div class="no-data-icon">📊</div>
                <h3>NO TRAINING DATA</h3>
                <p>Complete training sessions to see statistics.</p>
            </div>
        `;
        return;
    }
    
    const mainContent = document.createElement('div');
    mainContent.className = 'stats-main-content';
    
    mainContent.innerHTML += createOverallSummary(stats);
    
    mainContent.innerHTML += `
        <div class="stats-mode-tabs">
            <button class="mode-tab active" data-mode="all" onclick="switchStatsTab('all')">OVERVIEW</button>
            ${[1,2,3,4,5,6,7].map(m => `
                <button class="mode-tab" data-mode="${m}" onclick="switchStatsTab(${m})">${m}: ${MODE_NAMES[m].split(' ')[0].toUpperCase()}</button>
            `).join('')}
        </div>
        <div id="stats-tab-content"></div>
    `;
    
    container.appendChild(mainContent);
    switchStatsTab('all');
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-data-btn';
    clearBtn.innerText = "CLEAR ALL DATA";
    clearBtn.onclick = () => {
        if(confirm('Delete all training history? Cannot be undone.')) {
            localStorage.removeItem(STATS_KEY);
            updateStatsDisplay();
        }
    };
    container.appendChild(clearBtn);
}

window.switchStatsTab = function(mode) {
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
    const totalTime = Math.round(totalSessions * CFG.sessionDuration / 60);
    const avgAccuracy = calculateAvg(stats, 'accuracy');
    const avgRt = calculateAvg(stats, 'avgRt');
    const strobeSessions = stats.filter(s => s.strobe).length;
    const avgEndDiff = calculateAvg(stats, 'endDifficulty');
    
    // Calculate AVG NCS (recalculate for old sessions)
    const ncsScores = stats.map(s => s.ncs || calculateNCS(s));
    const avgNCS = ncsScores.length > 0 ? Math.round(ncsScores.reduce((a, b) => a + b, 0) / ncsScores.length) : 0;
    
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
            <div class="summary-card purple">
                <div class="summary-value">${avgNCS}</div>
                <div class="summary-label">AVG NCS SCORE</div>
            </div>
            <div class="summary-card green">
                <div class="summary-value">${avgAccuracy}%</div>
                <div class="summary-label">AVG ACCURACY</div>
            </div>
            <div class="summary-card yellow">
                <div class="summary-value">${avgRt}ms</div>
                <div class="summary-label">AVG RT</div>
            </div>
            <div class="summary-card cyan">
                <div class="summary-value">${Math.round(avgEndDiff * 100)}%</div>
                <div class="summary-label">AVG DIFFICULTY</div>
            </div>
        </div>
    `;
}

// ===== OVERVIEW TAB =====
function createOverviewContent(stats) {
    let html = '<div class="stats-overview">';
    
    html += '<h3 class="section-title">PERFORMANCE BY MODE</h3>';
    html += '<div class="mode-performance-grid">';
    
    [1, 2, 3, 4, 5, 6, 7].forEach(mode => {
        const modeSessions = filterSessions(stats, mode);
        const color = MODE_COLORS[mode];
        const name = MODE_NAMES[mode];
        
        if (modeSessions.length === 0) {
            html += `
                <div class="mode-perf-card" style="border-color: ${color}30">
                    <div class="mode-perf-header" style="color: ${color}">${name}</div>
                    <div class="mode-perf-empty">No data</div>
                </div>
            `;
            return;
        }
        
        const normalSessions = filterSessions(stats, mode, false);
        const strobeSessions = filterSessions(stats, mode, true);
        
        // Recalculate NCS for old sessions
        const ncsScores = modeSessions.map(s => s.ncs || calculateNCS(s));
        const avgNCS = ncsScores.length > 0 ? Math.round(ncsScores.reduce((a, b) => a + b, 0) / ncsScores.length) : 0;
        
        const avgAcc = calculateAvg(modeSessions, 'accuracy');
        const avgRt = calculateAvg(modeSessions, 'avgRt');
        const trend = calculateTrend(modeSessions, 'accuracy');
        
        html += `
            <div class="mode-perf-card" style="border-color: ${color}">
                <div class="mode-perf-header" style="color: ${color}">${name}</div>
                <div class="mode-perf-stats">
                    <div class="perf-stat">
                        <span class="perf-value" style="color:#9966ff">${avgNCS}</span>
                        <span class="perf-label">AVG NCS</span>
                    </div>
                    <div class="perf-stat">
                        <span class="perf-value">${avgAcc}%</span>
                        <span class="perf-label">ACCURACY</span>
                    </div>
                    <div class="perf-stat">
                        <span class="perf-value">${avgRt}ms</span>
                        <span class="perf-label">AVG RT</span>
                    </div>
                </div>
                <div class="mode-perf-footer">
                    <span>${normalSessions.length} / ${strobeSessions.length} <small>(N/S)</small></span>
                    <span class="trend ${trend.trend}">${trend.trend === 'up' ? '↑' : trend.trend === 'down' ? '↓' : '→'} ${Math.abs(trend.change)}%</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    html += '<h3 class="section-title">RECENT SESSIONS</h3>';
    html += createSessionsTable(stats.slice(-15).reverse());
    
    html += '</div>';
    return html;
}

// ===== MODE DETAIL TAB =====
function createModeDetailContent(stats, mode) {
    const modeSessions = filterSessions(stats, mode);
    const normalSessions = filterSessions(stats, mode, false);
    const strobeSessions = filterSessions(stats, mode, true);
    const color = MODE_COLORS[mode];
    const name = MODE_NAMES[mode];
    const metric = MODE_METRICS[mode];
    
    if (modeSessions.length === 0) {
        return `
            <div class="mode-detail-empty">
                <h3 style="color: ${color}">${name}</h3>
                <p>Complete sessions in this mode to see statistics.</p>
            </div>
        `;
    }
    
    let html = `<div class="mode-detail" style="--mode-color: ${color}">`;
    
    html += `
        <div class="mode-detail-header">
            <h3 style="color: ${color}">${name}</h3>
            <p class="mode-description">${metric.name} Training</p>
        </div>
    `;
    
    html += '<h4 class="subsection-title">NORMAL vs STROBE (NCS SCORES)</h4>';
    html += '<div class="strobe-comparison">';
    
    [{ label: 'NORMAL', sessions: normalSessions, strobe: false }, 
     { label: 'STROBE', sessions: strobeSessions, strobe: true }].forEach(({ label, sessions, strobe }) => {
        if (sessions.length === 0) {
            html += `
                <div class="strobe-card ${strobe ? 'strobe' : ''}">
                    <div class="strobe-header">${label}</div>
                    <div class="strobe-empty">No data</div>
                </div>
            `;
            return;
        }
        
        const ncsScores = sessions.map(s => s.ncs || calculateNCS(s));
        const avgNCS = ncsScores.length > 0 ? Math.round(ncsScores.reduce((a, b) => a + b, 0) / ncsScores.length) : 0;
        
        const avgAcc = calculateAvg(sessions, 'accuracy');
        const avgRt = calculateAvg(sessions, 'avgRt');
        const avgDiff = calculateAvg(sessions, 'endDifficulty');
        
        html += `
            <div class="strobe-card ${strobe ? 'strobe' : ''}">
                <div class="strobe-header">${label} <span class="session-count">(${sessions.length} sessions)</span></div>
                <div class="strobe-stats">
                    <div class="strobe-stat highlight">
                        <span class="stat-value" style="color: ${strobe ? '#ff66cc' : '#00d9ff'}">${avgNCS}</span>
                        <span class="stat-label">NCS SCORE</span>
                    </div>
                    <div class="strobe-stat">
                        <span class="stat-value">${avgAcc}%</span>
                        <span class="stat-label">Accuracy</span>
                    </div>
                    <div class="strobe-stat">
                        <span class="stat-value">${avgRt}ms</span>
                        <span class="stat-label">Avg RT</span>
                    </div>
                    <div class="strobe-stat">
                        <span class="stat-value">${Math.round(avgDiff * 100)}%</span>
                        <span class="stat-label">Avg Diff</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    html += '<h4 class="subsection-title">DIFFICULTY PROGRESSION</h4>';
    html += createDifficultyChart(modeSessions, mode);
    
    html += '<h4 class="subsection-title">MODE-SPECIFIC METRICS</h4>';
    html += createModeSpecificStats(modeSessions, mode);
    
    html += '<h4 class="subsection-title">RECENT SESSIONS</h4>';
    html += createSessionsTable(modeSessions.slice(-10).reverse(), true);
    
    html += '</div>';
    return html;
}

// ===== DIFFICULTY CHART =====
function createDifficultyChart(sessions, mode) {
    if (sessions.length < 2) {
        return '<div class="chart-placeholder">Need more sessions for chart</div>';
    }
    
    const color = MODE_COLORS[mode];
    const chartSessions = sessions.slice(-30);
    const width = 100 / chartSessions.length;
    
    let bars = '';
    chartSessions.forEach((s, i) => {
        const diff = s.endDifficulty || 0.3;
        const height = diff * 90 + 5;
        const barColor = s.strobe ? '#ff66cc' : color;
        const ncs = s.ncs || calculateNCS(s);
        bars += `
            <div class="chart-bar" style="width: ${width}%; height: ${height}%; background: ${barColor}" 
                 title="NCS: ${ncs} | ${Math.round(diff * 100)}% (${s.strobe ? 'Strobe' : 'Normal'})"></div>
        `;
    });
    
    return `
        <div class="progress-chart">
            <div class="chart-y-axis">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
            </div>
            <div class="chart-bars">${bars}</div>
            <div class="chart-legend">
                <span><span class="legend-dot" style="background: ${color}"></span> Normal</span>
                <span><span class="legend-dot" style="background: #ff66cc"></span> Strobe</span>
            </div>
        </div>
    `;
}

// ===== MODE SPECIFIC STATS =====
function createModeSpecificStats(sessions, mode) {
    let html = '<div class="mode-specific-grid">';
    
    switch(mode) {
        case 2: // Tracking
            const avgGaze = calculateAvg(sessions.filter(s => s.gazeBreaks !== undefined), 'gazeBreaks');
            const avgTrackTime = calculateAvg(sessions.filter(s => s.trackingTime !== undefined), 'trackingTime');
            html += `
                <div class="specific-stat">
                    <span class="stat-value">${avgGaze}</span>
                    <span class="stat-label">Avg Gaze Breaks</span>
                </div>
                <div class="specific-stat">
                    <span class="stat-value">${avgTrackTime.toFixed(1)}s</span>
                    <span class="stat-label">Avg Tracking Time</span>
                </div>
            `;
            break;
        case 3: // Surgical
            const perfectTrials = sessions.reduce((a, s) => a + (s.perfectTrials || 0), 0);
            html += `
                <div class="specific-stat">
                    <span class="stat-value">${perfectTrials}</span>
                    <span class="stat-label">Perfect Core Hits</span>
                </div>
            `;
            break;
        case 5: // Parafoveal
            const inhibSuccess = sessions.reduce((a, s) => a + (s.inhibitionSuccess || 0), 0);
            const inhibFail = sessions.reduce((a, s) => a + (s.inhibitionFail || 0), 0);
            const inhibRate = inhibSuccess + inhibFail > 0 ? Math.round(inhibSuccess / (inhibSuccess + inhibFail) * 100) : 0;
            const avgTrackTime5 = calculateAvg(sessions.filter(s => s.trackingTime !== undefined), 'trackingTime');
            html += `
                <div class="specific-stat">
                    <span class="stat-value">${inhibRate}%</span>
                    <span class="stat-label">Inhibition Success</span>
                </div>
                <div class="specific-stat">
                    <span class="stat-value">${inhibFail}</span>
                    <span class="stat-label">False Positives</span>
                </div>
                <div class="specific-stat">
                    <span class="stat-value">${avgTrackTime5.toFixed(1)}s</span>
                    <span class="stat-label">Avg Tracking Time</span>
                </div>
            `;
            break;
        case 6: // Memory
            const seqErrors = sessions.reduce((a, s) => a + (s.sequenceErrors || 0), 0);
            html += `
                <div class="specific-stat">
                    <span class="stat-value">${seqErrors}</span>
                    <span class="stat-label">Sequence Errors</span>
                </div>
            `;
            break;
        case 7: // Cognitive Switch
            const switchErrors = sessions.reduce((a, s) => a + (s.switchErrors || 0), 0);
            html += `
                <div class="specific-stat">
                    <span class="stat-value">${switchErrors}</span>
                    <span class="stat-label">Switch Errors</span>
                </div>
            `;
            break;
        default:
            const minRt = Math.min(...sessions.filter(s => s.minRt).map(s => s.minRt));
            if (minRt && minRt !== Infinity) {
                html += `
                    <div class="specific-stat">
                        <span class="stat-value">${minRt}ms</span>
                        <span class="stat-label">Best RT</span>
                    </div>
                `;
            }
    }
    
    const avgStdDev = calculateAvg(sessions.filter(s => s.rtStdDev), 'rtStdDev');
    if (avgStdDev > 0) {
        html += `
            <div class="specific-stat">
                <span class="stat-value">±${avgStdDev}ms</span>
                <span class="stat-label">RT Consistency</span>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// ===== SESSIONS TABLE =====
function createSessionsTable(sessions, hideMode = false) {
    if (sessions.length === 0) return '<div class="no-sessions">No sessions</div>';
    
    let html = `
        <table class="sessions-table">
            <thead>
                <tr>
                    ${hideMode ? '' : '<th>MODE</th>'}
                    <th>NCS</th>
                    <th>STROBE</th>
                    <th>ACCURACY</th>
                    <th>AVG RT</th>
                    <th>DIFFICULTY</th>
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
        const diffChange = (s.endDifficulty || 0.3) - (s.startDifficulty || 0.3);
        const ncs = s.ncs || calculateNCS(s);
        
        html += `
            <tr>
                ${hideMode ? '' : `<td style="color: ${modeColor}">${MODE_NAMES[s.mode] || 'Unknown'}</td>`}
                <td style="color: #9966ff; font-weight:bold">${ncs}</td>
                <td>${s.strobe ? '⚡' : '—'}</td>
                <td>${s.accuracy}%</td>
                <td>${s.avgRt}ms</td>
                <td>
                    ${Math.round((s.endDifficulty || 0.3) * 100)}%
                    <small class="${diffChange > 0 ? 'positive' : diffChange < 0 ? 'negative' : ''}">
                        ${diffChange > 0 ? '+' : ''}${Math.round(diffChange * 100)}%
                    </small>
                </td>
                <td class="date-cell">${dateStr} ${timeStr}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}