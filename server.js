const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to serve the 'enter_adhoc.html' file
app.get('/enter_adhoc.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'enter_adhoc.html'));
});

// Route to serve the 'view_adhocs.html' file
app.get('/view_adhocs.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view_adhocs.html'));
});

// Route to handle form submissions and save data to 'adhocs.csv'
app.post('/saveAdhoc', (req, res) => {
    const { loginId, adhocActivity, date, duration } = req.body;
    const newRow = `${loginId},${adhocActivity},${date},${duration}\n`;

    fs.appendFile(path.join(__dirname, 'public', 'adhocs.csv'), newRow, (err) => {
        if (err) throw err;
        console.log('Adhoc activity saved!');
    });

    res.redirect('/view_adhocs.html');
});

// Route to serve the 'adhocs.csv' file
app.get('/adhocs.csv', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'adhocs.csv'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
