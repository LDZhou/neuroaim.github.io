// ==================== STATISTICS ====================
// Stats display and charting functions

let statsMode = 'mode1';

function setStatsMode(mode) {
    statsMode = mode;
    const tabs = document.querySelectorAll('.mode-tab');
    tabs.forEach((t, i) => {
        const modes = ['mode1', 'mode2_easy', 'mode2_medium', 'mode2_hard', 'mode3'];
        t.classList.toggle('active', modes[i] === mode);
    });
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const data = loadData();
    const sessions = data[statsMode] || [];
    
    if (sessions.length === 0) {
        document.getElementById('stats-content').style.display = 'none';
        document.getElementById('no-data').style.display = 'block';
        return;
    }
    
    document.getElementById('stats-content').style.display = 'block';
    document.getElementById('no-data').style.display = 'none';
    
    const scores = sessions.map(s => s.score);
    const best = Math.max(...scores);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const totalHits = sessions.reduce((a, s) => a + s.hits, 0);
    
    document.getElementById('stat-sessions').innerText = sessions.length;
    document.getElementById('stat-best').innerText = best;
    document.getElementById('stat-avg').innerText = avg;
    document.getElementById('stat-total').innerText = totalHits;
    
    updateSkillLevel(sessions);
    drawStatsCharts(sessions);
    drawCorrelationCharts(sessions);
    drawSessionList(sessions);
}

function updateSkillLevel(sessions) {
    if (sessions.length < 3) {
        document.getElementById('skill-level').innerText = '--';
        document.getElementById('skill-name').innerText = 'NEED MORE DATA';
        document.getElementById('skill-bar').style.width = '0%';
        return;
    }
    
    const recent = sessions.slice(-10);
    const avgScore = recent.reduce((a, s) => a + s.score, 0) / recent.length;
    const avgAcc = recent.reduce((a, s) => a + s.accuracy, 0) / recent.length;
    const avgRT = recent.filter(s => s.avgRT > 0).reduce((a, s) => a + s.avgRT, 0) /
                  recent.filter(s => s.avgRT > 0).length || 999;
    
    // Adjust scoring based on mode
    let maxExpectedScore = 50;
    if (statsMode === 'mode3') maxExpectedScore = 2000;  // Mode 3 has higher scores
    
    const scoreComponent = Math.min(avgScore / maxExpectedScore, 1) * 40;
    const accComponent = (avgAcc / 100) * 30;
    const rtComponent = Math.max(0, 1 - (avgRT - 300) / 700) * 30;
    const composite = scoreComponent + accComponent + rtComponent;
    
    const levels = [
        { threshold: 20, name: 'NOVICE', level: 'D' },
        { threshold: 35, name: 'DEVELOPING', level: 'C' },
        { threshold: 50, name: 'TRAINED', level: 'B' },
        { threshold: 65, name: 'ADVANCED', level: 'B+' },
        { threshold: 75, name: 'EXPERT', level: 'A' },
        { threshold: 85, name: 'ELITE', level: 'A+' },
        { threshold: 100, name: 'MASTER', level: 'S' }
    ];
    
    let current = levels[0];
    for (const lvl of levels) {
        if (composite >= lvl.threshold) current = lvl;
    }
    
    document.getElementById('skill-level').innerText = current.level;
    document.getElementById('skill-name').innerText = current.name;
    document.getElementById('skill-bar').style.width = Math.min(composite, 100) + '%';
}

function drawStatsCharts(sessions) {
    const recent = sessions.slice(-20);
    drawLineChart('stats-score-chart', recent.map(s => s.score), '#00d9ff');
    drawLineChart('stats-acc-chart', recent.map(s => s.accuracy), '#00ff99');
    const rts = recent.filter(s => s.avgRT > 0).map(s => s.avgRT);
    drawLineChart('stats-rt-chart', rts, '#ffcc00', true);
}

function drawLineChart(canvasId, data, color, invertBetter = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    if (data.length < 2) {
        ctx.fillStyle = '#333';
        ctx.font = '11px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('Need more data', rect.width / 2, rect.height / 2);
        return;
    }
    
    const padding = { top: 20, right: 20, bottom: 20, left: 50 };
    const chartW = rect.width - padding.left - padding.right;
    const chartH = rect.height - padding.top - padding.bottom;
    
    const maxVal = Math.max(...data) * 1.1 || 100;
    const minVal = Math.min(...data) * 0.9 || 0;
    const range = maxVal - minVal || 1;
    
    // Grid lines
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = padding.top + (chartH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(rect.width - padding.right, y);
        ctx.stroke();
    }
    
    // Trend line
    if (data.length >= 3) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 8;
        
        const windowSize = Math.min(5, Math.floor(data.length / 2));
        data.forEach((_, i) => {
            const start = Math.max(0, i - windowSize);
            const end = Math.min(data.length, i + windowSize + 1);
            const avg = data.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
            
            const x = padding.left + (chartW / (data.length - 1)) * i;
            const y = padding.top + chartH - ((avg - minVal) / range) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
    
    // Main line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    data.forEach((v, i) => {
        const x = padding.left + (chartW / (data.length - 1)) * i;
        const y = padding.top + chartH - ((v - minVal) / range) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Points
    data.forEach((v, i) => {
        const x = padding.left + (chartW / (data.length - 1)) * i;
        const y = padding.top + chartH - ((v - minVal) / range) * chartH;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    });
    
    // Labels
    ctx.fillStyle = '#555';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal), padding.left - 8, padding.top + 5);
    ctx.fillText(Math.round(minVal), padding.left - 8, padding.top + chartH + 5);
    
    // Trend arrow
    if (data.length >= 3) {
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const improving = invertBetter ? secondAvg < firstAvg : secondAvg > firstAvg;
        const arrow = improving ? '↑' : '↓';
        const arrowColor = improving ? '#00ff99' : '#ff3366';
        
        ctx.fillStyle = arrowColor;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(arrow, rect.width - 10, 20);
    }
}

function drawCorrelationCharts(sessions) {
    const validSessions = sessions.filter(s => s.avgRT > 0 && s.accuracy >= 0);
    
    if (validSessions.length < 5) {
        document.getElementById('corr-insight-1').innerHTML = '<span style="color:#555">Need at least 5 sessions</span>';
        document.getElementById('corr-insight-2').innerHTML = '<span style="color:#555">Need at least 5 sessions</span>';
        
        ['stats-corr-rt-acc', 'stats-corr-rt-score'].forEach(id => {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * 2;
            canvas.height = rect.height * 2;
            ctx.scale(2, 2);
            ctx.fillStyle = '#333';
            ctx.font = '11px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText('Need more data', rect.width / 2, rect.height / 2);
        });
        return;
    }
    
    // RT vs Accuracy
    const rtAccData = validSessions.map(s => ({ x: s.avgRT, y: s.accuracy }));
    const rtAccCorr = calculateCorrelation(rtAccData.map(d => d.x), rtAccData.map(d => d.y));
    drawScatterPlot('stats-corr-rt-acc', rtAccData, '#00ff99', 'RT (ms)', 'Accuracy %');
    
    let insight1 = `<strong>Correlation: <span class="${getCorrelationClass(rtAccCorr)}">${rtAccCorr.toFixed(2)}</span></strong><br>`;
    if (rtAccCorr < -0.3) {
        insight1 += 'Speed-accuracy tradeoff detected. Consider slowing down for precision.';
    } else if (rtAccCorr > 0.3) {
        insight1 += 'Positive correlation: deliberate responses tend to be more accurate.';
    } else {
        insight1 += 'No strong relationship. Performance is consistent across paces.';
    }
    document.getElementById('corr-insight-1').innerHTML = insight1;
    
    // RT vs Score
    const rtScoreData = validSessions.map(s => ({ x: s.avgRT, y: s.score }));
    const rtScoreCorr = calculateCorrelation(rtScoreData.map(d => d.x), rtScoreData.map(d => d.y));
    drawScatterPlot('stats-corr-rt-score', rtScoreData, '#ffcc00', 'RT (ms)', 'Score');
    
    let insight2 = `<strong>Correlation: <span class="${getCorrelationClass(-rtScoreCorr)}">${rtScoreCorr.toFixed(2)}</span></strong><br>`;
    if (rtScoreCorr < -0.3) {
        insight2 += 'Faster reactions lead to higher scores. Speed is your strength.';
    } else if (rtScoreCorr > 0.3) {
        insight2 += 'Slower sessions have higher scores. Measured approach works for you.';
    } else {
        insight2 += 'Score not strongly tied to reaction time. Other factors matter more.';
    }
    document.getElementById('corr-insight-2').innerHTML = insight2;
}

function calculateCorrelation(x, y) {
    const n = x.length;
    if (n < 2) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);
    
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return den === 0 ? 0 : num / den;
}

function getCorrelationClass(r) {
    if (r > 0.3) return 'positive';
    if (r < -0.3) return 'negative';
    return 'neutral';
}

function drawScatterPlot(canvasId, data, color, xLabel, yLabel) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    const padding = { top: 20, right: 20, bottom: 35, left: 50 };
    const chartW = rect.width - padding.left - padding.right;
    const chartH = rect.height - padding.top - padding.bottom;
    
    const xVals = data.map(d => d.x);
    const yVals = data.map(d => d.y);
    const xMin = Math.min(...xVals) * 0.9;
    const xMax = Math.max(...xVals) * 1.1;
    const yMin = Math.min(...yVals) * 0.9;
    const yMax = Math.max(...yVals) * 1.1;
    
    // Grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(rect.width - padding.right, y);
        ctx.stroke();
    }
    
    // Regression line
    const n = data.length;
    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = yVals.reduce((a, b) => a + b, 0);
    const sumXY = xVals.reduce((acc, x, i) => acc + x * yVals[i], 0);
    const sumX2 = xVals.reduce((acc, x) => acc + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const lineY1 = slope * xMin + intercept;
    const lineY2 = slope * xMax + intercept;
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    const lx1 = padding.left;
    const ly1 = padding.top + chartH - ((lineY1 - yMin) / (yMax - yMin)) * chartH;
    const lx2 = padding.left + chartW;
    const ly2 = padding.top + chartH - ((lineY2 - yMin) / (yMax - yMin)) * chartH;
    ctx.moveTo(lx1, Math.max(padding.top, Math.min(padding.top + chartH, ly1)));
    ctx.lineTo(lx2, Math.max(padding.top, Math.min(padding.top + chartH, ly2)));
    ctx.stroke();
    
    // Points
    data.forEach(d => {
        const px = padding.left + ((d.x - xMin) / (xMax - xMin)) * chartW;
        const py = padding.top + chartH - ((d.y - yMin) / (yMax - yMin)) * chartH;
        
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    
    // Labels
    ctx.fillStyle = '#555';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, padding.left + chartW / 2, rect.height - 8);
    
    ctx.save();
    ctx.translate(12, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
    
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(yMax), padding.left - 8, padding.top + 5);
    ctx.fillText(Math.round(yMin), padding.left - 8, padding.top + chartH + 5);
    
    ctx.textAlign = 'left';
    ctx.fillText(Math.round(xMin), padding.left, rect.height - 22);
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(xMax), rect.width - padding.right, rect.height - 22);
}

function drawSessionList(sessions) {
    const container = document.getElementById('session-list');
    if (!container) return;
    
    const recent = sessions.slice(-20).reverse();
    
    let html = `
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <thead>
                <tr style="color:#555;text-align:left;">
                    <th style="padding:8px;border-bottom:1px solid #1a1a2e;">DATE</th>
                    <th style="padding:8px;border-bottom:1px solid #1a1a2e;">SCORE</th>
                    <th style="padding:8px;border-bottom:1px solid #1a1a2e;">HITS</th>
                    <th style="padding:8px;border-bottom:1px solid #1a1a2e;">ACC</th>
                    <th style="padding:8px;border-bottom:1px solid #1a1a2e;">AVG RT</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    recent.forEach((s, i) => {
        const date = new Date(s.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const highlight = i === 0 ? 'color:#00d9ff;' : '';
        
        html += `
            <tr style="${highlight}">
                <td style="padding:8px;border-bottom:1px solid #111;">${dateStr}</td>
                <td style="padding:8px;border-bottom:1px solid #111;font-weight:bold;">${s.score}</td>
                <td style="padding:8px;border-bottom:1px solid #111;">${s.hits}</td>
                <td style="padding:8px;border-bottom:1px solid #111;">${s.accuracy}%</td>
                <td style="padding:8px;border-bottom:1px solid #111;">${s.avgRT || '--'}ms</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}
