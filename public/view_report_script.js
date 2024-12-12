document.getElementById('filterBtn').addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent form submission
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Call the backend to fetch the filtered productivity data
    await loadProductivityReport(startDate, endDate);
});

async function loadProductivityReport(startDate = '', endDate = '') {
    try {
        const response = await fetch(`https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/get-productivity-report?startDate=${startDate}&endDate=${endDate}`); // Backend API with date filters
        
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

            // Calculate live productivity (converted from seconds to hours)
            const liveProductivity = (data.jobCount * data.takt) / 3600; // Convert takt from seconds to hours
            row.insertCell(3).innerText = liveProductivity.toFixed(2); // Live productivity (hrs)

            // Get total adhocs for the login
            const totalAdhocs = data.totalAdhocs || 0; // Get this data from the backend
            row.insertCell(4).innerText = totalAdhocs.toFixed(2); // Total adhocs (hrs)

            // Calculate total productivity
            const totalProductivity = liveProductivity + totalAdhocs;
            row.insertCell(5).innerText = totalProductivity.toFixed(2); // Total productivity (hrs)
        });
    } catch (error) {
        console.error('Error loading productivity report:', error);
    }
}

// Event listener for downloading the report as CSV
document.getElementById('downloadCsvBtn').addEventListener('click', async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Call the backend to fetch the productivity data with date filters
    const response = await fetch(`https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/get-productivity-report?startDate=${startDate}&endDate=${endDate}`);
    
    if (response.ok) {
        const reportData = await response.json();
        const csvData = convertToCSV(reportData);
        
        // Create a blob and download the CSV file
        const blob = new Blob([csvData], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'productivity_report.csv';
        link.click();
    } else {
        console.error('Error fetching data for CSV download');
    }
});

// Function to convert report data to CSV format
function convertToCSV(data) {
    const headers = ['Login ID', 'Job Count', 'TAKT', 'Live Productivity (hrs)', 'Total Adhocs (hrs)', 'Total Productivity (hrs)'];
    const rows = data.map(item => {
        const liveProductivity = (item.jobCount * item.takt) / 3600; // Convert takt to hours
        const totalAdhocs = item.totalAdhocs || 0;
        const totalProductivity = liveProductivity + totalAdhocs;

        return [
            item.loginID,
            item.jobCount,
            item.takt,
            liveProductivity.toFixed(2),
            totalAdhocs.toFixed(2),
            totalProductivity.toFixed(2)
        ];
    });

    const csvRows = [headers, ...rows].map(row => row.join(','));
    return csvRows.join('\n');
}

