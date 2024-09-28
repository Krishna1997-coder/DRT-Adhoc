const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('Public'));

// Load existing adhoc data from JSON file
const loadAdhocData = () => {
    try {
        const dataBuffer = fs.readFileSync('data/adhocData.json');
        return JSON.parse(dataBuffer.toString());
    } catch (e) {
        return [];
    }
};

// Save adhoc data to JSON file
const saveAdhocData = (data) => {
    fs.writeFileSync('data/adhocData.json', JSON.stringify(data, null, 2));
};

// Route to handle submitting adhoc data
app.post('/saveAdhoc', (req, res) => {
    const { loginId, activity, date, duration } = req.body;
    
    if (!loginId || !activity || !date || !duration) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    const adhocData = loadAdhocData();
    adhocData.push({ loginId, activity, date, duration });
    saveAdhocData(adhocData);
    res.status(201).send({ message: 'Adhoc data saved successfully!' });
});

// Route to retrieve adhoc data
app.get('/getAdhoc', (req, res) => {
    const adhocData = loadAdhocData();
    res.send(adhocData);
});

// Route to download adhoc data as CSV
app.get('/downloadAdhoc', (req, res) => {
    const { start, end } = req.query;
    const adhocData = loadAdhocData();

    const filteredData = adhocData.filter(item => {
        const itemDate = new Date(item.date);
        return (!start || itemDate >= new Date(start)) && (!end || itemDate <= new Date(end));
    });

    let csv = 'Login ID,Activity,Date,Duration\n';
    filteredData.forEach(item => {
        csv += `${item.loginId},${item.activity},${item.date},${item.duration}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('adhoc_data.csv');
    res.send(csv);
});

// Start the server
app.listen(PORT,0.0.0.0/0, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
