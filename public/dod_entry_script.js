document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loadMetricsBtn').addEventListener('click', async () => {
        const date = document.getElementById('dateSelector').value;
        if (!date) {
            alert("Please select a date.");
            return;
        }
        await loadMetrics(date);
    });
    document.getElementById('saveMetricsBtn').addEventListener('click', saveMetrics);
});

async function loadMetrics(date) {
    try {
        const response = await fetch(`/get-dod-metrics?date=${date}`);
        const metrics = await response.json();
        if (metrics.message) {
            alert(metrics.message);
            return;
        }
        // Populate the table with metrics data for all auditors
        const tableBody = document.querySelector('#metricsTableBody tbody');
        tableBody.innerHTML = '';  // Clear existing table rows
        metrics.forEach(metric => {
            const row = document.createElement('tr');
            
            const loginIDCell = document.createElement('td');
            loginIDCell.textContent = metric.loginID;
            row.appendChild(loginIDCell);
            
            const jobCountCell = document.createElement('td');
            if (metric.jobCount === 0) {
                const jobCountInput = document.createElement('input');
                jobCountInput.type = 'number';
                jobCountInput.className = 'jobCountInput';
                jobCountInput.value = '0';
                jobCountCell.appendChild(jobCountInput);
            } else {
                jobCountCell.textContent = metric.jobCount;
            }
            row.appendChild(jobCountCell);
            
            const taktCell = document.createElement('td');
            if (metric.takt === 0) {
                const taktInput = document.createElement('input');
                taktInput.type = 'number';
                taktInput.className = 'taktInput';
                taktInput.value = '0';
                taktCell.appendChild(taktInput);
            } else {
                taktCell.textContent = metric.takt;
            }
            row.appendChild(taktCell);
            
            const liveProductivityCell = document.createElement('td');
            liveProductivityCell.textContent = ((metric.jobCount * metric.takt) / 3600).toFixed(2);
            row.appendChild(liveProductivityCell);
            
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
    const tableRows = document.querySelectorAll('#metricsTableBody tbody tr');
    const metricsData = [];
    tableRows.forEach(row => {
        const loginID = row.querySelector('td').textContent;
        const jobCount = row.querySelector('.jobCountInput') ? row.querySelector('.jobCountInput').value : row.querySelector('td:nth-child(2)').textContent;
        const takt = row.querySelector('.taktInput') ? row.querySelector('.taktInput').value : row.querySelector('td:nth-child(3)').textContent;
        const liveProductivity = ((parseInt(jobCount, 10) * parseInt(takt, 10)) / 3600).toFixed(2); // Limit to 2 decimal places
        metricsData.push({
            loginID,
            jobCount: parseInt(jobCount, 10),
            takt: parseInt(takt, 10),
            liveProductivity: parseFloat(liveProductivity), // Convert back to number if needed
            date: date // Include date in each metric object
        });
    });
    try {
        const response = await fetch('/save-dod-metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ metricsData }), // Send metricsData only
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('successMessage').style.display = 'block';
            // Lock the cells and update live productivity
            tableRows.forEach(row => {
                const jobCountInput = row.querySelector('.jobCountInput');
                const taktInput = row.querySelector('.taktInput');
                if (jobCountInput) {
                    jobCountInput.setAttribute('disabled', 'true');
                    jobCountInput.parentElement.textContent = jobCountInput.value;
                }
                if (taktInput) {
                    taktInput.setAttribute('disabled', 'true');
                    taktInput.parentElement.textContent = taktInput.value;
                }
                const jobCount = parseInt(row.querySelector('td:nth-child(2)').textContent, 10);
                const takt = parseInt(row.querySelector('td:nth-child(3)').textContent, 10);
                const liveProductivityCell = row.querySelector('td:nth-child(4)');
                liveProductivityCell.textContent = ((jobCount * takt) / 3600).toFixed(2);
            });
        } else {
            alert(result.message || 'Error saving metrics');
        }
    } catch (error) {
        console.error('Error saving metrics:', error);
        alert('Error saving metrics');
    }
}