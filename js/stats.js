// ==================== STATS MODULE ====================
// Handles local storage of game history and basic analytics
// UPDATED: Added Mode 4 Support and Robust Parsing

const STATS_KEY = 'neuroaim_stats';

// Load stats from localStorage
function loadStats() {
    try {
        const data = localStorage.getItem(STATS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.warn("Stats load failed, resetting:", e);
        return [];
    }
}

// Save a new game session
function saveGameStats(session) {
    const stats = loadStats();
    stats.push(session);
    // Keep last 1000 games only to prevent storage full
    if (stats.length > 1000) stats.shift();
    
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.warn("Storage full?", e);
    }
}

// Display stats in the Stats Screen
function updateStatsDisplay() {
    const stats = loadStats();
    const container = document.getElementById('stats-screen');
    const header = container.querySelector('.stats-header');
    
    // Clear old content except header
    container.innerHTML = '';
    container.appendChild(header);
    
    if (stats.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'no-data';
        msg.innerText = "NO TRAINING DATA FOUND";
        msg.style.textAlign = 'center';
        msg.style.padding = '50px';
        msg.style.color = '#555';
        container.appendChild(msg);
        return;
    }
    
    // Create Summary Blocks
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'stats-summary';
    summaryDiv.style.display = 'grid';
    summaryDiv.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    summaryDiv.style.gap = '20px';
    summaryDiv.style.padding = '20px';
    
    // Calculate Mode Averages
    const modeStats = {
        1: { name: 'Gabor Scout', count: 0, avgScore: 0, color: '#00d9ff' },
        2: { name: 'Neuro Tracking', count: 0, avgScore: 0, color: '#00ff99' },
        3: { name: 'Surgical Lock', count: 0, avgScore: 0, color: '#ff3366' },
        4: { name: 'Landolt Saccade', count: 0, avgScore: 0, color: '#ffcc00' }
    };
    
    stats.forEach(s => {
        const m = modeStats[s.mode];
        if (m) {
            m.count++;
            m.avgScore += s.score;
        }
    });
    
    Object.keys(modeStats).forEach(k => {
        const m = modeStats[k];
        if (m.count > 0) {
            const avg = Math.round(m.avgScore / m.count);
            const card = document.createElement('div');
            card.style.background = 'rgba(255,255,255,0.05)';
            card.style.padding = '15px';
            card.style.borderLeft = `4px solid ${m.color}`;
            card.innerHTML = `
                <div style="font-size:12px; color:#888">${m.name}</div>
                <div style="font-size:24px; font-weight:bold; color:#fff">${avg}</div>
                <div style="font-size:12px; color:#666">${m.count} Sessions</div>
            `;
            summaryDiv.appendChild(card);
        }
    });
    
    container.appendChild(summaryDiv);
    
    // Recent History List
    const listDiv = document.createElement('div');
    listDiv.style.padding = '0 20px';
    listDiv.innerHTML = '<h3 style="color:#00d9ff; margin-bottom:10px">RECENT HISTORY</h3>';
    
    // Show last 10 entries reversed
    const recent = stats.slice(-10).reverse();
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.textAlign = 'left';
    table.style.borderCollapse = 'collapse';
    table.style.color = '#ccc';
    
    table.innerHTML = `
        <tr style="border-bottom:1px solid #333; color:#666">
            <th style="padding:10px">MODE</th>
            <th>DIFFICULTY</th>
            <th>SCORE</th>
            <th>ACCURACY</th>
            <th>RT</th>
        </tr>
    `;
    
    recent.forEach(s => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #222';
        const modeName = modeStats[s.mode] ? modeStats[s.mode].name : `Mode ${s.mode}`;
        
        tr.innerHTML = `
            <td style="padding:10px; color:${modeStats[s.mode]?.color || '#fff'}">${modeName}</td>
            <td style="text-transform:uppercase; font-size:12px">${s.difficulty || 'Normal'}</td>
            <td>${s.score}</td>
            <td>${s.accuracy}%</td>
            <td>${s.avgRt}ms</td>
        `;
        table.appendChild(tr);
    });
    
    listDiv.appendChild(table);
    container.appendChild(listDiv);
    
    // Optional: Add a simple clear data button
    const clearBtn = document.createElement('button');
    clearBtn.innerText = "CLEAR ALL DATA";
    clearBtn.style.marginTop = '30px';
    clearBtn.style.marginLeft = '20px';
    clearBtn.style.background = '#331111';
    clearBtn.style.color = '#ff3333';
    clearBtn.style.border = 'none';
    clearBtn.style.padding = '10px 20px';
    clearBtn.style.cursor = 'pointer';
    clearBtn.onclick = () => {
        if(confirm('Delete all training history?')) {
            localStorage.removeItem(STATS_KEY);
            updateStatsDisplay();
        }
    };
    container.appendChild(clearBtn);
}