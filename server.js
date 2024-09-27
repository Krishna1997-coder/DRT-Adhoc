const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.static('Public')); // Serve static files from the "Public" directory

// Endpoint to save adhoc data
app.post('/saveAdhoc', (req, res) => {
    const adhocData = req.body; // Get the data from the request
    const filePath = path.join(__dirname, 'Adhoc data', 'saveAdhoc.json'); // Path to save data

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Server error');
        }

        let jsonData = [];
        if (data.length) {
            jsonData = JSON.parse(data); // Parse existing data if file is not empty
        }
        jsonData.push(adhocData); // Add new data

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).send('Server error');
            }
            res.status(200).send('Data saved successfully');
        });
    });
});

// Endpoint to serve past adhoc data
app.get('/viewAdhocs', (req, res) => {
    const filePath = path.join(__dirname, 'Adhoc data', 'saveAdhoc.json'); // Path to read data

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Server error');
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(data); // Send the adhoc data as a response
    });
});

// Start the server
app.listen(PORT,'0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
