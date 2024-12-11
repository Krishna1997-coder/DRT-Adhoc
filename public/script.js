const adhocForm = document.getElementById('adhocForm');
const adhocsTable = document.getElementById('adhocsTable');
const tbody = adhocsTable ? adhocsTable.getElementsByTagName('tbody')[0] : null;
const downloadBtn = document.getElementById('downloadBtn');
const filterForm = document.getElementById('filterForm'); // Add this line to select the filter form

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

        if (activity === 'Revalidation Audit Count' && count) {
            activity = `${activity} (${count})`;
            duration = count * 3; // Calculate duration based on count
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
const countContainer = document.getElementById('countContainer');
const otherActivityContainer = document.getElementById('otherActivityContainer');

adhocActivity.addEventListener('change', (event) => {
    const selectedActivity = event.target.value;

    if (selectedActivity === 'Revalidation Audit Count') {
        countContainer.style.display = 'block';
        otherActivityContainer.style.display = 'none';
    } else if (selectedActivity === 'Others') {
        countContainer.style.display = 'none';
        otherActivityContainer.style.display = 'block';
    } else {
        countContainer.style.display = 'none';
        otherActivityContainer.style.display = 'none';
    }
});

// Add event listener for the filter form to load filtered adhocs
if (filterForm) {
    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        await loadAdhocs(startDate, endDate); // Reload the table with filtered data
    });
}
