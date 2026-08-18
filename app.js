// app.js
const CSV_CLASSIC = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFAC2-cGE5CGKLwrdsGdyjupmVoz4ORunlQjQEsgQTFG098SFm8C6w881-2peWiT0HZlh7VAdWjqGe/pub?gid=766279178&single=true&output=csv";
const CSV_ENHANCED = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFAC2-cGE5CGKLwrdsGdyjupmVoz4ORunlQjQEsgQTFG098SFm8C6w881-2peWiT0HZlh7VAdWjqGe/pub?gid=1566031438&single=true&output=csv";

let dataStore = { classic: [], enhanced: [] };
let currentTab = 'classic';

document.addEventListener("DOMContentLoaded", () => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
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

function checkNetworkStatus() { document.getElementById('offline-alert').style.display = navigator.onLine ? 'none' : 'block'; }

async function fetchData() {
    try {
        const [resC, resE] = await Promise.all([fetch(CSV_CLASSIC), fetch(CSV_ENHANCED)]);
        dataStore.classic = parseCSV(await resC.text());
        dataStore.enhanced = parseCSV(await resE.text());
        renderCards();
    } catch (e) { console.error(e); }
}

function parseCSV(str) {
    const rows = str.split('\n').map(row => {
        let arr = [], curr = '', inQ = false;
        for (let char of row) {
            if (char === '"') inQ = !inQ;
            else if (char === ',' && !inQ) { arr.push(curr.trim()); curr = ''; }
            else curr += char;
        }
        arr.push(curr.trim()); return arr;
    });
    const headers = rows[0];
    return rows.slice(1).filter(r => r.length === headers.length).map(r => {
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = r[i]);
        return obj;
    });
}

function getVal(item, keys) {
    const k = Object.keys(item).find(key => keys.includes(key.toUpperCase()));
    return k ? item[k] : '-';
}

function renderCards() {
    const container = document.getElementById('card-container');
    const query = document.getElementById('search').value.toLowerCase();
    container.innerHTML = '';
    
    dataStore[currentTab].forEach((item, index) => {
        if (Object.values(item).join(' ').toLowerCase().indexOf(query) === -1) return;
        
        const fin = getVal(item, ['CB_FIN', 'CB_FIN', 'FIN']);
        const panel = getVal(item, ['CB_PANEL', 'PANEL']);
        const loc = getVal(item, ['CB_LOCATION', 'LOCATION', 'LOC']);
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; background:#e9ecef; padding:10px; border-radius:5px; margin-bottom:10px;">
                <div><small>FIN</small><br><strong>${fin}</strong></div>
                <div><small>PANEL</small><br><strong>${panel}</strong></div>
                <div><small>LOC</small><br><strong>${loc}</strong></div>
            </div>
            ${Object.entries(item).map(([k, v]) => !['CB_FIN','CB_PANEL','CB_LOCATION','TIMER_SECONDS','CRITICAL_NOTE'].includes(k.toUpperCase()) ? `<div class="row-item"><strong>${k}:</strong> ${v}</div>` : '').join('')}
            ${item.Critical_Note ? `<div class="critical-note">⚠️ ${item.Critical_Note}</div>` : ''}
            ${item.Timer_Seconds ? `<button class="timer-btn" onclick="startTimer(this, ${item.Timer_Seconds})">Start Timer (${item.Timer_Seconds}s)</button>` : ''}
        `;
        container.appendChild(card);
    });
}

window.startTimer = function(btn, s) {
    btn.disabled = true;
    let t = s;
    const i = setInterval(() => {
        btn.innerText = `Wait... ${--t}s`;
        if (t <= 0) { clearInterval(i); btn.innerText = "Done"; btn.className = "timer-btn done"; }
    }, 1000);
}
