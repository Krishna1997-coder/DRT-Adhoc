document.getElementById('loadMetricsBtn').addEventListener('click', async () => {
    const date = document.getElementById('dodDate').value;

    if (!date) {
        alert("Please select a date.");
        return;
    }

    await loadMetrics(date);
});

async function loadMetrics(date) {
    const fixedAuditors = [
        'carmonsh', 'chnilotp', 'cristopy', 'dahernab', 'djerrren', 'garcjull',
        'gkoteddi', 'hlasrado', 'jreyesh', 'kevjimed', 'kumarqab', 'lmuralik',
        'maltezel', 'mddeepk', 'mdniz', 'melaaray', 'msnandhu', 'mugdhakj',
        'panugah', 'ptimp', 'shaikyas', 'shobhpap', 'shsudhak', 'singhhqo',
        'srivaesu', 'tippirer', 'ukamsuma', 'vodelm'
    ];

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

document.getElementById('saveMetricsBtn').addEventListener('click', async () => {
    const date = document.getElementById('dodDate').value;
    const tableRows = document.querySelectorAll('#dodMetricsTable tbody tr');
    const metricsData = [];

    tableRows.forEach(row => {
        const loginID = row.cells[0].innerText;
        const jobCountInput = row.cells[1].querySelector('input');
        const taktInput = row.cells[2].querySelector('input');

        if (jobCountInput && taktInput) {
            const jobCount = parseInt(jobCountInput.value, 10);
            const takt = parseFloat(taktInput.value);

            const liveProductivity = (jobCount * takt) / 3600; // Convert to hours
            row.cells[3].innerText = liveProductivity.toFixed(2); // Update live productivity cell

            metricsData.push({
                date,
                loginID,
                jobCount,
                takt,
                liveProductivity
            });
        }
    });

    try {
        const response = await fetch('https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/save-dod-metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ metricsData })
        });

        if (response.ok) {
            alert('Metrics saved successfully!');
        } else {
            const errorData = await response.json();
            alert(`Error saving data: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error saving metrics:', error);
        alert('Error saving data');
    }
});
