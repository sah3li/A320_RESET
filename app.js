const URLS = {
    classic: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFAC2-cGE5CGKLwrdsGdyjupmVoz4ORunlQjQEsgQTFG098SFm8C6w881-2peWiT0HZlh7VAdWjqGe/pub?gid=766279178&single=true&output=csv',
    enhanced: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFAC2-cGE5CGKLwrdsGdyjupmVoz4ORunlQjQEsgQTFG098SFm8C6w881-2peWiT0HZlh7VAdWjqGe/pub?gid=1566031438&single=true&output=csv'
};

let appData = { classic: [], enhanced: [] };
let currentTab = 'classic';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.error("SW Registration failed:", err));
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

function updateNetworkStatus() {
    const banner = document.getElementById('offline-banner');
    if (!navigator.onLine) {
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
        fetchData();
    }
}
updateNetworkStatus();

async function fetchData() {
    try {
        for (const type in URLS) {
            const response = await fetch(URLS[type]);
            const csvText = await response.text();
            const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            appData[type] = result.data;
        }
        renderCards();
    } catch (error) {
        console.error("Error fetching data:", error);
        if (!navigator.onLine) {
            alert("Network error: Cannot update data while offline.");
        }
    }
}

function switchTab(tab, btn) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCards();
}

function startTimer(btn, seconds) {
    if (!seconds || isNaN(seconds)) return;
    let timeLeft = parseInt(seconds);
    btn.disabled = true;
    const originalText = btn.innerHTML;
    
    const interval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(interval);
            btn.innerHTML = "✅ Reset Complete!";
            btn.classList.add('done');
            setTimeout(() => { 
                btn.disabled = false; 
                btn.innerHTML = originalText; 
                btn.classList.remove('done'); 
            }, 4000);
        } else {
            btn.innerHTML = `⏳ Wait ${timeLeft}s...`;
            timeLeft--;
        }
    }, 1000);
}

function renderCards() {
    const query = document.getElementById('search').value.toLowerCase();
    const container = document.getElementById('container');
    container.innerHTML = '';

    if (!appData[currentTab].length) return;

    const filteredData = appData[currentTab].filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(query))
    );

    filteredData.forEach(row => {
        const card = document.createElement('div');
        card.className = 'card';

        let cardHTML = `
            <div class="cb-highlight">
                <span>FIN: ${row.CB_FIN || '-'}</span>
                <span>PANEL: ${row.CB_PANEL || '-'}</span>
                <span>LOC: ${row.CB_LOCATION || '-'}</span>
            </div>
        `;

        if (row.Critical_Note && row.Critical_Note.trim() !== '') {
            cardHTML += `<div class="critical-note">⚠️ ${row.Critical_Note}</div>`;
        }

        if (row.Timer_Seconds && !isNaN(row.Timer_Seconds)) {
            cardHTML += `<button class="timer-btn" onclick="startTimer(this, ${row.Timer_Seconds})">⏱️ Start Timer (${row.Timer_Seconds}s)</button>`;
        }

        cardHTML += `<div class="details-grid">`;
        Object.keys(row).forEach(key => {
            cardHTML += `
                <div class="detail-item">
                    <strong>${key.replace(/_/g, ' ')}</strong>
                    ${row[key] || '-'}
                </div>
            `;
        });
        cardHTML += `</div>`;

        card.innerHTML = cardHTML;
        container.appendChild(card);
    });
}

fetchData();
