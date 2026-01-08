// ==================== DATA MANAGEMENT ====================
// Export, import, and data utilities

function exportData() {
    const stats = loadStats();
    const settings_data = JSON.parse(localStorage.getItem('neuroaim_settings_v3') || '{}');
    
    const exportObj = {
        version: 3,
        exportDate: new Date().toISOString(),
        stats: stats,
        settings: settings_data
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroaim_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.stats) {
                    localStorage.setItem('neuroaim_stats_v3', JSON.stringify(data.stats));
                }
                if (data.settings) {
                    localStorage.setItem('neuroaim_settings_v3', JSON.stringify(data.settings));
                }
                
                resolve(true);
            } catch(err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function getDataSummary() {
    const stats = loadStats();
    const totalSessions = stats.length;
    const modes = {};
    
    stats.forEach(s => {
        if (!modes[s.mode]) modes[s.mode] = { normal: 0, strobe: 0 };
        if (s.strobe) modes[s.mode].strobe++;
        else modes[s.mode].normal++;
    });
    
    return {
        totalSessions,
        byMode: modes,
        oldestSession: stats.length > 0 ? new Date(stats[0].timestamp) : null,
        newestSession: stats.length > 0 ? new Date(stats[stats.length - 1].timestamp) : null
    };
}