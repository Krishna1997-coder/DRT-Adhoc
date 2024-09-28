const adhocForm = document.getElementById('adhocForm');
const adhocsTable = document.getElementById('adhocsTable') 
const tbody = adhocsTable ? adhocsTable.getElementsByTagName('tbody')[0] : null;
const downloadBtn = document.getElementById('downloadBtn');

// Load existing adhocs from backend and display them
window.onload = async () => {
    try {
        const response = await fetch('https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/'); // Replace with your backend URL if necessary
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const adhocs = await response.json();
        adhocs.forEach(adhoc => {
            addRowToTable(adhoc);
        });
    } catch (error) {
        console.error('Error fetching adhocs:', error);
    }
}

// Add event listener for the form submission
if (adhocForm) {
    adhocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginId = document.getElementById('loginId').value;
        const activity = document.getElementById('adhocActivity').value;
        const duration = document.getElementById('duration').value;
        const date = document.getElementById('date').value;

        const newAdhoc = { loginID: loginId, activity, duration, date };

        try {
            // Send data to the backend
            const response = await fetch('https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/', { // Replace with your backend URL if necessary
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
            } else {
                alert('Error submitting data');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting data');
        }
    });
}

// Function to add a row to the table
function addRowToTable(adhoc) {
    if (adhocsTable) {
        const row = adhocsTable.insertRow();
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
            const response = await fetch('https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/'); // Replace with your backend URL if necessary
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
