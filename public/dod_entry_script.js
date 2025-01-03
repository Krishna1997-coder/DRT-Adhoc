document.getElementById('loadMetricsBtn').addEventListener('click', async () => {
    const date = document.getElementById('dodDate').value;

    if (!date) {
        alert("Please select a date.");
        return;
    }

    await loadMetrics(date);
});

async function loadMetrics(date) {
    const fixedAuditors = ['carmonsh', 'chnilotp', 'cristopy', 'dahernab', 'djerrren', 'garcjull','gkoteddi', 'hlasrado', 'jreyesh', 'kevjimed', 'kumarqab', 'lmuralik', 'maltezel', 'mddeepk', 'mdniz', 'melaaray', 'msnandhu', 'mugdhakj', 'panugah', 'ptimp', 'shaikyas', 'shobhpap', 'shsudhak', 'singhhqo', 'srivaesu', 'tippirer', 'ukamsuma', 'vodelm'];

    const tbody = document.getElementById('dodMetricsTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Clear existing rows

    try {
        const response = await fetch(`https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/get-dod-metrics?date=${date}`);
        if (!response.ok) {
            throw new Error('Error fetching existing metrics');
        }
        const existingMetrics = await response.json();

        const metricsMap = new Map();
        existingMetrics.forEach(metric => {
            metricsMap.set(metric.loginID, metric);
        });

        fixedAuditors.forEach(auditor => {
            const row = tbody.insertRow();
            row.insertCell(0).innerText = auditor;

            if (metricsMap.has(auditor)) {
                const metric = metricsMap.get(auditor);
                row.insertCell(1).innerText = metric.jobCount;
                row.insertCell(2).innerText = metric.takt;
                row.insertCell(3).innerText = ((metric.jobCount * metric.takt) / 3600).toFixed(2); // Live productivity
            } else {
                row.insertCell(1).innerHTML = '<input type="number" class="jobCount" value="0">';
                row.insertCell(2).innerHTML = '<input type="number" class="takt" value="0">';
                row.insertCell(3).innerText = '0'; // Live productivity
            }
        });
    } catch (error) {
        console.error('Error loading metrics:', error);
        alert(`Error loading metrics: ${error.message}`);
    }
}
