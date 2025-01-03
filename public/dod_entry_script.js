document.getElementById('loadMetricsBtn').addEventListener('click', loadMetrics);
document.getElementById('saveMetricsBtn').addEventListener('click', saveMetrics);
async function loadMetrics() {
    const date = document.getElementById('dateSelector').value;
    if (!date) {
        alert("Please select a date.");
        return;
    }
    try {
        const response = await fetch(`/get-dod-metrics?date=${date}`);
        const metrics = await response.json();
        if (metrics.message) {
            alert(metrics.message);
            return;
        }
        // Populate the table with metrics data for all auditors
        const tableBody = document.getElementById('metricsTableBody');
        tableBody.innerHTML = '';  // Clear existing table rows
        metrics.forEach(metric => {
            const row = document.createElement('tr');
            
            const loginIDCell = document.createElement('td');
            loginIDCell.textContent = metric.loginID;
            row.appendChild(loginIDCell);
            const jobCountCell = document.createElement('td');
            jobCountCell.innerHTML = metric.jobCount === 0 ? '<input type="number" class="jobCountInput" value="0" />' : metric.jobCount;
            jobCountCell.querySelector('input')?.setAttribute('disabled', metric.jobCount !== 0);
            row.appendChild(jobCountCell);
            const taktCell = document.createElement('td');
            taktCell.innerHTML = metric.takt === 0 ? '<input type="number" class="taktInput" value="0" />' : metric.takt;
            taktCell.querySelector('input')?.setAttribute('disabled', metric.takt !== 0);
            row.appendChild(taktCell);
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading metrics:', error);
        alert('Error loading metrics');
    }
}
async function saveMetrics() {
    const date = document.getElementById('dateSelector').value;
    if (!date) {
        alert("Please select a date.");
        return;
    }
    const tableRows = document.querySelectorAll('#metricsTableBody tr');
    const metricsData = [];
    tableRows.forEach(row => {
        const loginID = row.querySelector('td').textContent;
        const jobCount = row.querySelector('.jobCountInput') ? row.querySelector('.jobCountInput').value : row.querySelector('td:nth-child(2)').textContent;
        const takt = row.querySelector('.taktInput') ? row.querySelector('.taktInput').value : row.querySelector('td:nth-child(3)').textContent;
        metricsData.push({
            loginID,
            jobCount: parseInt(jobCount, 10),
            takt: parseInt(takt, 10),
            liveProductivity: (jobCount * takt) / 3600 // Example calculation for live productivity
        });
    });
    try {
        const response = await fetch('/save-dod-metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, metricsData }),
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
        } else {
            alert(result.message || 'Error saving metrics');
        }
    } catch (error) {
        console.error('Error saving metrics:', error);
        alert('Error saving metrics');
    }
}