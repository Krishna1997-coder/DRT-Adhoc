const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { Parser } = require('json2csv');

// Import the Adhoc model
const Adhoc = require('./models/adhoc'); // Adjust the path as necessary

const app = express();
const port = process.env.PORT || 3000; // Use Heroku's port or default to 3000

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Endpoint to handle form submission
app.post('/submit', [
    body('loginID').notEmpty().withMessage('Login ID is required'),
    body('activity').notEmpty().withMessage('Activity is required'),
    body('date').isISO8601().withMessage('Date must be in ISO format'),
    body('duration').notEmpty().withMessage('Duration is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { loginID, activity, date, duration } = req.body;
    const newActivity = new Adhoc({ loginID, activity, date, duration });

    try {
        const savedActivity = await newActivity.save();
        res.status(201).json({ message: 'Activity submitted successfully!', activity: savedActivity });
    } catch (error) {
        console.error('Error saving to MongoDB', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint to retrieve past adhoc activities
app.get('/adhocs', async (req, res) => {
    try {
        const adhocs = await Adhoc.find({});

        if (adhocs.length === 0) {
            return res.status(204).send(); // No content
        }

        res.status(200).json(adhocs);
    } catch (error) {
        console.error('Error retrieving data from MongoDB', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/download-csv', async (req, res) => {
    try {
        const adhocs = await Adhoc.find({});
        
        if (adhocs.length === 0) {
            return res.status(404).json({ message: 'No activities found to download.' });
        }

        const csvParser = new Parser({ fields: ['loginID', 'activity', 'date', 'duration'] });
        const csv = csvParser.parse(adhocs);

        res.header('Content-Type', 'text/csv');
        res.attachment('Adhoc.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error retrieving data from MongoDB', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
