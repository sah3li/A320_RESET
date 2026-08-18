// ضع رابط التبويبة الثانية هنا
const links = {
    classic: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFAC2-cGE5CGKLwrdsGdyjupmVoz4ORunlQjQEsgQTFG098SFm8C6w881-2peWiT0HZlh7VAdWjqGe/pub?gid=0&single=true&output=csv",
    enhanced: "ضع_رابط_تبويبة_Enhanced_هنا" 
};

let currentData = [];
const container = document.getElementById('app-container');
const searchInput = document.getElementById('searchInput');

function loadData(type) {
    container.innerHTML = '<div class="loader">Syncing...</div>';
    
    // تأكد أنك وضعت رابط التبويبة Enhanced الحقيقي في الأعلى، وإلا سيعلق التطبيق إذا اخترتها!
    if (!links[type] || links[type].includes("ضع_رابط")) {
        container.innerHTML = '<div class="loader" style="color:#ef4444;">Please add the Enhanced tab CSV link in app.js</div>';
        return;
    }

    Papa.parse(links[type], {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            currentData = results.data.filter(row => row.ECAM_Message || row.ATA);
            renderCards(currentData);
        },
        error: function(err) {
            // هنا سيخبرك بوضوح إذا كان الاتصال مقطوعاً أو يحتاج بروكسي
            container.innerHTML = '<div class="loader" style="color:#ef4444;">Network Error: Please turn on WARP / VPN to access Google Sheets.</div>';
        }
    });
}
function renderCards(data) {
    container.innerHTML = '';
    if (data.length === 0) return container.innerHTML = '<div class="loader">No records found.</div>';

    data.forEach((row, index) => {
        const isCritical = row.Critical_Note && row.Critical_Note.toLowerCase() !== 'none';
        const hasTimer = row.Timer_Seconds && !isNaN(row.Timer_Seconds);
        const card = document.createElement('div');
        card.className = `card ${isCritical ? 'critical' : ''}`;

        let cbHTML = '';
        if (row.CB_FIN && row.CB_FIN.toLowerCase() !== 'none') {
            cbHTML = `
                <div class="cb-container">
                    <div class="cb-box"><span class="cb-label">FIN</span>${row.CB_FIN}</div>
                    <div class="cb-box"><span class="cb-label">PANEL</span>${row.CB_PANEL || '-'}</div>
                    <div class="cb-box"><span class="cb-label">LOC</span>${row.CB_LOCATION || '-'}</div>
                </div>`;
        }

        let timerHTML = hasTimer 
            ? `<button class="timer-btn" onclick="startTimer(this, ${row.Timer_Seconds})">⏱ Start Timer (${row.Timer_Seconds}s)</button>` 
            : '';

        let criticalHTML = isCritical ? `<div class="critical-note">⚠️ ${row.Critical_Note}</div>` : '';

        card.innerHTML = `
            <h3 class="sys-title">${row.ATA} - ${row.Affected_Computer || 'SYS'}</h3>
            <div class="ecam-msg">${row.ECAM_Message || 'Manual Reset'}</div>
            ${cbHTML}
            <div class="steps"><strong>Steps:</strong><br>${row.Reset_Procedure_Steps || 'Follow standard procedure.'}</div>
            ${criticalHTML}
            ${timerHTML}
        `;
        container.appendChild(card);
    });
}

window.startTimer = function(btn, seconds) {
    if (btn.disabled) return;
    btn.disabled = true;
    let timeLeft = parseInt(seconds);
    btn.style.background = "#f59e0b";
    btn.innerText = `⏳ Wait ${timeLeft}s...`;
    
    const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            btn.innerText = `⏳ Wait ${timeLeft}s...`;
        } else {
            clearInterval(interval);
            btn.style.background = "#10b981";
            btn.innerText = "✅ CLOSE C/B NOW";
            setTimeout(() => {
                btn.disabled = false;
                btn.style.background = "#3b82f6";
                btn.innerText = `⏱ Start Timer (${seconds}s)`;
            }, 5000);
        }
    }, 1000);
};

window.switchTab = function(type, element) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    searchInput.value = '';
    loadData(type);
};

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = currentData.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(term)));
    renderCards(filtered);
});

// تشغيل التطبيق بالبيانات الكلاسيكية افتراضياً
loadData('classic');
