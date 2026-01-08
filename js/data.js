// ==================== DATA MANAGEMENT ====================
// Session storage and retrieval

const STORAGE_KEY = 'neuroaim_v5_data';

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch(e) {
        console.warn('Failed to load data:', e);
    }
    return { 
        mode1: [], 
        mode2_easy: [], 
        mode2_medium: [], 
        mode2_hard: [],
        mode3: []
    };
}

function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e) {
        console.warn('Failed to save data:', e);
    }
}

function addSession(mode, difficulty, session) {
    const data = loadData();
    let key;
    
    if (mode === 1) {
        key = 'mode1';
    } else if (mode === 2) {
        key = 'mode2_' + difficulty;
    } else if (mode === 3) {
        key = 'mode3';
    }
    
    // Ensure key exists (migration support)
    if (!data[key]) data[key] = [];
    
    data[key].push({
        ...session,
        timestamp: Date.now(),
        difficulty: mode === 2 ? difficulty : null
    });
    
    // Keep last 100 sessions per category
    if (data[key].length > 100) {
        data[key] = data[key].slice(-100);
    }
    
    saveData(data);
}

function getSessionsForMode(modeKey) {
    const data = loadData();
    return data[modeKey] || [];
}

function clearAllData() {
    if (confirm('Are you sure you want to clear ALL training data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    }
    return false;
}

function exportData() {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
                saveData(data);
                resolve(true);
            } catch(err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
