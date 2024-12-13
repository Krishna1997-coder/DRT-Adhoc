const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { Parser } = require('json2csv');

// Import the Adhoc and DodMetrics models
const Adhoc = require('./models/adhoc');
const DodMetrics = require('./models/dodMetrics');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Endpoint to handle form submission (for Adhoc data)
app.post('/submit', [
    body('loginID').notEmpty().withMessage('Login ID is required'),
    body('activity').notEmpty().withMessage('Activity is required'),
    body('date').isISO8601().withMessage('Date must be in ISO format'),
    body('duration').isNumeric().withMessage('Duration must be a number')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { loginID, activity, date, duration, count } = req.body;

    let finalDuration = duration;
    let finalActivity = activity;

    if (activity === 'Revalidation Audit Count' && count) {
        finalDuration = count * 3;
        finalActivity = `${activity} (${count})`;
    }

    const newActivity = new Adhoc({ loginID, activity: finalActivity, date, duration: finalDuration });

    try {
        const savedActivity = await newActivity.save();
        res.status(201).json({ message: 'Activity submitted successfully!', activity: savedActivity });
    } catch (error) {
        console.error('Error saving to MongoDB', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint to retrieve past adhoc activities with optional date filtering
app.get('/adhocs', async (req, res) => {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.date = { ...filter.date, $gte: start };
    }

    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date = { ...filter.date, $lte: end };
    }

    try {
        const adhocs = await Adhoc.find(filter);
        res.status(200).json(adhocs);
    } catch (error) {
        console.error('Error retrieving data from MongoDB', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint to save DoD metrics data
app.post('/save-dod-metrics', async (req, res) => {
    const { metricsData } = req.body;

    try {
        for (const metric of metricsData) {
            const newDodMetric = new DodMetrics({
                date: metric.date,
                loginID: metric.loginID,
                jobCount: metric.jobCount,
                takt: metric.takt,
                liveProductivity: metric.liveProductivity
            });

            await newDodMetric.save();
        }

        res.status(200).json({ message: 'Metrics saved successfully!' });
    } catch (error) {
        console.error('Error saving metrics:', error);
        res.status(500).json({ message: 'Error saving metrics' });
    }
});

// New endpoint for generating the productivity report
app.get('/get-productivity-report', async (req, res) => {
    const { startDate, endDate } = req.query;

    const fixedAuditors = ['carmonsh', 'chnilotp', 'cristopy', 'dahernab', 'djerrren', 'garcjull', 'gkoteddi', 'hlasrado', 'jreyesh', 'kevjimed', 'kumarqab', 'lmuralik', 'maltezel', 'mddeepk', 'mdniz', 'melaaray', 'msnandhu', 'mugdhakj', 'panugah', 'ptimp', 'shaikyas', 'shobhpap', 'shsudhak', 'singhhqo', 'srivaesu', 'tippirer', 'ukamsuma', 'vodelm'];

    try {
        const adhocs = await Adhoc.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        const dodMetrics = await DodMetrics.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        const reportData = [];
        const isSingleDay = new Date(startDate).toDateString() === new Date(endDate).toDateString();

        for (const auditor of fixedAuditors) {
            const adhocData = adhocs.filter(item => item.loginID === auditor);
            const dodMetricData = dodMetrics.filter(item => item.loginID === auditor);

            const totalAdhocs = adhocData.reduce((sum, item) => sum + item.duration, 0);
            const jobCount = dodMetricData.reduce((sum, item) => sum + item.jobCount, 0);
            let takt = dodMetricData.reduce((sum, item) => sum + item.takt, 0);
            let liveProductivity = 0;

            if (!isSingleDay && jobCount > 0) {
                takt = takt / jobCount; // Calculate average TAKT for multiple days
            }

            liveProductivity = (jobCount * takt) / 3600; // Calculate live productivity in hours

            reportData.push({
                loginID: auditor,
                jobCount,
                takt,
                totalAdhocs: totalAdhocs / 60, // Convert total adhocs to hours
                liveProductivity
            });
        }

        res.status(200).json(reportData);

    } catch (error) {
        console.error('Error generating productivity report:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint to download CSV of productivity report
app.get('/download-productivity-report-csv', async (req, res) => {
    const { startDate, endDate } = req.query;

    const fixedAuditors = ['carmonsh', 'chnilotp', 'cristopy', 'dahernab', 'djerrren', 'garcjull', 'gkoteddi', 'hlasrado', 'jreyesh', 'kevjimed', 'kumarqab', 'lmuralik', 'maltezel', 'mddeepk', 'mdniz', 'melaaray', 'msnandhu', 'mugdhakj', 'panugah', 'ptimp', 'shaikyas', 'shobhpap', 'shsudhak', 'singhhqo', 'srivaesu', 'tippirer', 'ukamsuma', 'vodelm'];

    try {
        const adhocs = await Adhoc.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        const dodMetrics = await DodMetrics.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        const reportData = [];
        const isSingleDay = new Date(startDate).toDateString() === new Date(endDate).toDateString();

        for (const auditor of fixedAuditors) {
            const adhocData = adhocs.filter(item => item.loginID === auditor);
            const dodMetricData = dodMetrics.filter(item => item.loginID === auditor);

            const totalAdhocs = adhocData.reduce((sum, item) => sum + item.duration, 0);
            const jobCount = dodMetricData.reduce((sum, item) => sum + item.jobCount, 0);
            let takt = dodMetricData.reduce((sum, item) => sum + item.takt, 0);
            let liveProductivity = 0;

            if (!isSingleDay && jobCount > 0) {
                takt = takt / jobCount; // Calculate average TAKT for multiple days
            }

            liveProductivity = (jobCount * takt) / 3600; // Calculate live productivity in hours

            reportData.push({
                loginID: auditor,
                jobCount,
                takt,
                totalAdhocs: totalAdhocs / 60, // Convert total adhocs to hours
                liveProductivity
            });
        }

        // Create CSV from the report data
        const csvParser = new Parser({ fields: ['loginID', 'jobCount', 'takt', 'totalAdhocs', 'liveProductivity'] });
        const csv = csvParser.parse(reportData);

                // Send the CSV as a downloadable file
                res.header('Content-Type', 'text/csv');
                res.attachment('productivity_report.csv');
                res.send(csv);
        
            } catch (error) {
                console.error('Error generating productivity report CSV:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });
        
        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
        