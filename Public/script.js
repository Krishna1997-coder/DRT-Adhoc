<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>View Past Adhocs</title>
    <script src="script.js"></script>
</head>
<body>
    <h1>Past Adhoc Details</h1>
    <table id="adhocTable" border="1">
        <thead>
            <tr>
                <th>Log in ID</th>
                <th>Adhoc Activity</th>
                <th>Date</th>
                <th>Duration (Mins)</th>
            </tr>
        </thead>
        <tbody>
            <!-- Data will be populated here by script.js -->
        </tbody>
    </table>
    <br>
    <label for="startDate">Start Date:</label>
    <input type="date" id="startDate">
    <label for="endDate">End Date:</label>
    <input type="date" id="endDate">
    <button onclick="downloadCSV()">Download CSV</button>
</body>
</html>
