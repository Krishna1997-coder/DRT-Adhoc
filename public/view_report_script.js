document.getElementById('loadReportBtn').addEventListener('click', async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Validate if the dates are provided
    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    await loadProductivityReport(startDate, endDate);
});

async function loadProductivityReport(startDate, endDate) {
    try {
        const response = await fetch(`https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/get-productivity-report?startDate=${startDate}&endDate=${endDate}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch productivity report');
        }

        const reportData = await response.json();
        
        const tbody = document.getElementById('productivityReportTable').getElementsByTagName('tbody')[0];
        tbody.innerHTML = ''; // Clear existing rows

        reportData.forEach(data => {
            const row = tbody.insertRow();
            row.insertCell(0).innerText = data.loginID;
            row.insertCell(1).innerText = data.jobCount;
            row.insertCell(2).innerText = data.takt;

            // Live productivity (hrs)
            row.insertCell(3).innerText = data.liveProductivity.toFixed(2);

            // Total adhocs (hrs)
            row.insertCell(4).innerText = data.totalAdhocs.toFixed(2);

            // Total productivity (hrs)
            row.insertCell(5).innerText = (data.liveProductivity + data.totalAdhocs).toFixed(2);
        });
    } catch (error) {
        console.error('Error loading productivity report:', error);
    }
}

// Add event listener for the download button
document.getElementById('downloadProductivityBtn').addEventListener('click', async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Validate if the dates are provided
    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    try {
        const response = await fetch(`https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/download-productivity-report-csv?startDate=${startDate}&endDate=${endDate}`);
        
        if (!response.ok) {
            throw new Error('Failed to download CSV');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'productivity_report.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading CSV:', error);
    }
});
