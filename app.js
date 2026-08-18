function renderCards() {
    const container = document.getElementById('card-container');
    const query = document.getElementById('search').value.toLowerCase();
    const items = dataStore[currentTab];
    
    container.innerHTML = '';
    
    items.forEach((item, index) => {
        if (Object.values(item).join(' ').toLowerCase().indexOf(query) === -1) return;
        
        const card = document.createElement('div');
        card.className = 'card';
        
        // تجميع الحقول المهمة لتكون متجاورة
        const cbInfo = `
            <div style="display: flex; justify-content: space-between; background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid #dee2e6;">
                <div><small>FIN</small><br><strong>${item.CB_FIN || '-'}</strong></div>
                <div><small>PANEL</small><br><strong>${item.CB_PANEL || '-'}</strong></div>
                <div><small>LOC</small><br><strong>${item.CB_LOCATION || '-'}</strong></div>
            </div>
        `;

        let detailsHtml = '';
        let criticalHtml = '';
        let timerSeconds = parseInt(item.Timer_Seconds, 10) || 0;
        
        // عرض باقي البيانات بشكل أنيق
        Object.keys(item).forEach(key => {
            const k = key.toUpperCase();
            if (['CB_FIN', 'CB_PANEL', 'CB_LOCATION', 'TIMER_SECONDS', 'CRITICAL_NOTE'].includes(k)) return;
            
            detailsHtml += `<div class="row-item"><strong>${key}:</strong> <span>${item[key]}</span></div>`;
        });

        if (item.Critical_Note && item.Critical_Note.trim() !== '') {
            criticalHtml = `<div class="critical-note">⚠️ ${item.Critical_Note}</div>`;
        }
        
        let timerHtml = timerSeconds > 0 
            ? `<button class="timer-btn" id="btn-${currentTab}-${index}" onclick="startTimer(this, ${timerSeconds})">Start Timer (${timerSeconds}s)</button>`
            : '';

        card.innerHTML = `
            ${cbInfo}
            <div class="card-details">${detailsHtml}</div>
            ${criticalHtml}
            ${timerHtml}
        `;
        container.appendChild(card);
    });
}
