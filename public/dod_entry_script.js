document.getElementById('loadMetricsBtn').addEventListener('click', async () => {
    const date = document.getElementById('dodDate').value;

    // Validate if the date is provided
    if (!date) {
        alert("Please select a date.");
        return;
    }

    await loadMetrics(date);
});

async function loadMetrics(date) {
    const fixedAuditors = ['carmonsh', 'chnilotp', 'cristopy', 'dahernab', 'djerrren', 'garcjull', 'gkoteddi', 'hlasrado', 'jreyesh', 'kevjimed', 'kumarqab', 'lmuralik', 'maltezel', 'mddeepk', 'mdniz', 'melaaray', 'msnandhu', 'mugdhakj', 'panugah', 'ptimp', 'shaikyas', 'shobhpap', 'shsudhak', 'singhhqo', 'srivaesu', 'tippirer','ukamsuma', 'vodelm']; // Replace with actual auditor names
    const tbody = document.getElementById('dodMetricsTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Clear existing rows

    fixedAuditors.forEach(auditor => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = auditor;
        row.insertCell(1).innerHTML = '<input type="number" class="jobCount" value="0">';
        row.insertCell(2).innerHTML = '<input type="number" class="takt" value="0">';
        row.insertCell(3).innerText = '0'; // Live productivity will be calculated later
    });
}

document.getElementById('saveMetricsBtn').addEventListener('click', async () => {
    const date = document.getElementById('dodDate').value;

    const tableRows = document.querySelectorAll('#dodMetricsTable tbody tr');
    
    const metricsData = [];

    tableRows.forEach(row => {
        const loginID = row.cells[0].innerText;
        const jobCount = row.cells[1].getElementsByTagName('input')[0].value;
        const takt = row.cells[2].getElementsByTagName('input')[0].value;

        // Calculate live productivity
        const liveProductivity = (jobCount * takt)/3600;
        row.cells[3].innerText = liveProductivity.toFixed(2); // Update live productivity cell

        // Collect data to send to the backend
        metricsData.push({
            date,
            loginID,
            jobCount,
            takt,
            liveProductivity
        });
    });

    // Send data to backend for saving
    try {
        const response = await fetch('https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/save-dod-metrics', { // Replace with your actual backend URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ metricsData, fixedAuditors })
        });

        if (response.ok) {
            // Display success message
            document.getElementById('successMessage').style.display = 'block';
            setTimeout(() => {
                document.getElementById('successMessage').style.display = 'none';
            }, 3000); // Hide success message after 3 seconds
        } else {
            alert('Error saving data');
        }
    } catch (error) {
        console.error('Error saving metrics:', error);
        alert('Error saving data');
    }
});
