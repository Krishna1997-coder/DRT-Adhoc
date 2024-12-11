const adhocForm = document.getElementById('adhocForm');
const adhocsTable = document.getElementById('adhocsTable');
const tbody = adhocsTable ? adhocsTable.getElementsByTagName('tbody')[0] : null;
const downloadBtn = document.getElementById('downloadBtn');
const filterForm = document.getElementById('filterForm');
const durationField = document.getElementById('duration'); // Get the duration field
const countContainer = document.getElementById('countContainer'); // Get the count container
const otherActivityContainer = document.getElementById('otherActivityContainer'); // Get the other activity container

// Load existing adhocs from backend and display them
window.onload = async () => {
    await loadAdhocs(); // Load all adhocs on page load
}

// Function to load adhocs and populate the table
async function loadAdhocs(startDate = '', endDate = '') {
    try {
        const response = await fetch(`https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/adhocs?startDate=${startDate}&endDate=${endDate}`); // Corrected URL with query parameters
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const adhocs = await response.json();
        // Clear existing rows before adding new ones
        if (tbody) {
            tbody.innerHTML = '';
            adhocs.forEach(adhoc => {
                addRowToTable(adhoc);
            });
        }
    } catch (error) {
        console.error('Error fetching adhocs:', error);
    }
}

// Add event listener for the form submission
if (adhocForm) {
    adhocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginId = document.getElementById('loginId').value;
        let activity = document.getElementById('adhocActivity').value;
        let duration = document.getElementById('duration').value;
        const date = document.getElementById('date').value;
        const count = document.getElementById('count') ? document.getElementById('count').value : null;
        const otherActivity = document.getElementById('otherActivity') ? document.getElementById('otherActivity').value : null;

        // If activity is 'Revalidation Audit Count', calculate duration automatically
        if (activity === 'Revalidation Audit Count' && count) {
            activity = `${activity} (${count})`;
            duration = count * 3; // Automatically calculate duration
        }

        const newAdhoc = { 
            loginID: loginId, 
            activity: activity === 'Others' ? otherActivity : activity, 
            duration, 
            date 
        };

        try {
            // Send data to the backend
            const response = await fetch('https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/submit', { // Corrected URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAdhoc)
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message); // Show success message
                addRowToTable(newAdhoc); // Update the table with the new entry
                adhocForm.reset(); // Reset the form
                document.getElementById('countContainer').style.display = 'none';
                document.getElementById('otherActivityContainer').style.display = 'none';
                durationField.disabled = false; // Re-enable duration field after form submission
            } else {
                const errorResponse = await response.json();
                alert('Error submitting data: ' + JSON.stringify(errorResponse.errors)); // Show validation errors
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting data');
        }
    });
}

// Function to add a row to the table
function addRowToTable(adhoc) {
    if (adhocsTable && tbody) {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = adhoc.loginID;
        row.insertCell(1).innerText = adhoc.activity;
        row.insertCell(2).innerText = adhoc.duration;
        row.insertCell(3).innerText = adhoc.date;
    }
}

// Function to download data as CSV
if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/download-csv'); // Update if needed
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'adhocs.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading CSV:', error);
        }
    });
}

// Handle dropdown changes to show/hide additional fields
const adhocActivity = document.getElementById('adhocActivity');
adhocActivity.addEventListener('change', (event) => {
    const selectedActivity = event.target.value;
    if (selectedActivity === 'Revalidation Audit Count') {
        countContainer.style.display = 'block';
        otherActivityContainer.style.display = 'none';
        durationField.disabled = true; // Disable the duration field for Revalidation Audit Count
    } else if (selectedActivity === 'Others') {
        countContainer.style.display = 'none';
        otherActivityContainer.style.display = 'block';
        durationField.disabled = false; // Enable the duration field for other activities
    } else {
        countContainer.style.display = 'none';
        otherActivityContainer.style.display = 'none';
        durationField.disabled = false; // Enable the duration field for other activities
    }
});

// Add event listener for the filter form submission
if (filterForm) {
    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        console.log("Start Date:", startDate); // Log the start and end dates for debugging
        console.log("End Date:", endDate);

        // Load adhocs based on the date range
        await loadAdhocs(startDate, endDate);
    });
}
S