// app.js
const CSV_CLASSIC = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFAC2-cGE5CGKLwrdsGdyjupmVoz4ORunlQjQEsgQTFG098SFm8C6w881-2peWiT0HZlh7VAdWjqGe/pub?gid=766279178&single=true&output=csv";
const CSV_ENHANCED = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFAC2-cGE5CGKLwrdsGdyjupmVoz4ORunlQjQEsgQTFG098SFm8C6w881-2peWiT0HZlh7VAdWjqGe/pub?gid=1566031438&single=true&output=csv";

let dataStore = { classic: [], enhanced: [] };
let currentTab = 'classic';

document.addEventListener("DOMContentLoaded", () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }

    checkNetworkStatus();
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.getAttribute('data-target');
            renderCards();
        });
    });

    document.getElementById('search').addEventListener('input', renderCards);

    fetchData();
});

function checkNetworkStatus() {
    const alert = document.getElementById('offline-alert');
    alert.style.display = navigator.onLine ? 'none' : 'block';
}

async function fetchData() {
    try {
        const [classicRes, enhancedRes] = await Promise.all([
            fetch(CSV_CLASSIC),
            fetch(CSV_ENHANCED)
        ]);
        const classicText = await classicRes.text();
        const enhancedText = await enhancedRes.text();
        
        dataStore.classic = parseCSV(classicText);
        dataStore.enhanced = parseCSV(enhancedText);
        
        renderCards();
    } catch (error) {
        console.error("Fetch failed, relying on Service Worker cache.", error);
    }
}

function parseCSV(str) {
    const rows = [];
    let row = [];
    let curr = '';
    let inQuotes = false;
    
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && str[i+1] === '"') {
            curr += '"'; i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            row.push(curr.trim()); curr = '';
        } else if (char === '\n' && !inQuotes) {
            row.push(curr.trim()); rows.push(row); row = []; curr = '';
        } else if (char !== '\r') {
            curr += char;
        }
    }
    if (curr) row.push(curr.trim());
    if (row.length > 0) rows.push(row);
    
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = r[i] || ''; });
        return obj;
    });
}

function renderCards() {
    const container = document.getElementById('card-container');
    const query = document.getElementById('search').value.toLowerCase();
    const items = dataStore[currentTab];
    
    container.innerHTML = '';
    
    items.forEach((item, index) => {
        if (Object.values(item).join(' ').toLowerCase().indexOf(query) === -1) return;
        
        const card = document.createElement('div');
        card.className = 'card';
        
        let detailsHtml = '';
        let criticalHtml = '';
        let timerSeconds = 0;
        
        Object.keys(item).forEach(key => {
            const keyLower = key.toLowerCase();
            const val = item[key];
            
            if (keyLower === 'timer_seconds') {
                timerSeconds = parseInt(val, 10) || 0;
                detailsHtml += `<div class="row-item"><strong>${key}:</strong> <span>${val}</span></div>`;
            } else if (keyLower === 'critical_note') {
                if (val && val.trim() !== '') {
                    criticalHtml = `<div class="critical-note">⚠️ ${val}</div>`;
                }
                detailsHtml += `<div class="row-item"><strong>${key}:</strong> <span>${val}</span></div>`;
            } else {
                let isHighlight = ['cb_fin', 'cb_panel', 'cb_location'].includes(keyLower);
                let valClass = isHighlight ? 'cb-highlight' : '';
                detailsHtml += `<div class="row-item"><strong>${key}:</strong> <span class="${valClass}">${val}</span></div>`;
            }
        });
        
        let timerHtml = timerSeconds > 0 
            ? `<button class="timer-btn" id="btn-${currentTab}-${index}" onclick="startTimer(this, ${timerSeconds})">Start Timer (${timerSeconds}s)</button>`
            : '';

        card.innerHTML = `
            <div class="card-details">${detailsHtml}</div>
            ${criticalHtml}
            ${timerHtml}
        `;
        container.appendChild(card);
    });
}

window.startTimer = function(btn, seconds) {
    btn.disabled = true;
    let left = seconds;
    btn.innerText = `Wait... ${left}s`;
    
    const interval = setInterval(() => {
        left--;
        btn.innerText = `Wait... ${left}s`;
        if (left <= 0) {
            clearInterval(interval);
            btn.innerText = "Time's up! Reset Complete.";
            btn.classList.add('done');
        }
    }, 1000);
}
