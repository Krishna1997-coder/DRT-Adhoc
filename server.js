const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { Parser } = require('json2csv');

// Import models
const Adhoc = require('./models/adhoc');
const DodMetrics = require('./models/dodMetrics'); // Ensure correct path

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Endpoint to handle form submission (for Adhoc data)
app.post('/submit', [
    body('loginID').notEmpty().withMessage('Login ID is required'),
    body('activity').notEmpty().withMessage('Activity is required'),
    body('date').isISO8601().withMessage('Date must be in ISO format'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
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
        console.error('Error saving to MongoDB:', error);
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

        // Aggregate data by Login ID
        const aggregatedData = {};

        adhocs.forEach((adhoc) => {
            if (!aggregatedData[adhoc.loginId]) {
                aggregatedData[adhoc.loginId] = {
                    loginId: adhoc.loginId,
                    activities: [],
                    totalMinutes: 0
                };
            }

            // Add activities and minutes
            for (let i = 1; i <= 10; i++) { // Assuming a max of 10 activities for simplicity
                const activityField = `activity${i}`;
                const minutesField = `minutes${i}`;

                if (adhoc[activityField] && adhoc[minutesField]) {
                    aggregatedData[adhoc.loginId].activities.push({
                        activity: adhoc[activityField],
                        minutes: adhoc[minutesField]
                    });
                    aggregatedData[adhoc.loginId].totalMinutes += adhoc[minutesField];
                }
            }
        });

        // Prepare the response in the desired format
        const result = Object.values(aggregatedData).map((entry) => {
            const tableRow = {
                loginId: entry.loginId,
                totalMinutes: entry.totalMinutes,
            };

            // Add activity columns
            entry.activities.forEach((activity, index) => {
                tableRow[`activity${index + 1}`] = activity.activity;
                tableRow[`minutes${index + 1}`] = activity.minutes;
            });

            return tableRow;
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error retrieving data from MongoDB:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Endpoint to download CSV of Adhoc activities
app.get('/download-adhocs-csv', async (req, res) => {
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

        if (adhocs.length === 0) {
            return res.status(404).json({ message: 'No activities found to download.' });
        }

        const csvParser = new Parser({ fields: ['loginID', 'activity', 'date', 'duration'] });
        const csv = csvParser.parse(adhocs);

        res.header('Content-Type', 'text/csv');
        res.attachment('adhocs.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error generating adhocs CSV:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint to save DoD metrics data
app.post('/save-dod-metrics', async (req, res) => {
    const { metricsData } = req.body;

    try {
        for (const metric of metricsData) {
            const metricDate = new Date(metric.date);
            if (isNaN(metricDate)) {
                console.error('Invalid date:', metric.date);
                continue; // Skip this metric and continue with the next one
            }

            const existingMetric = await DodMetrics.findOne({
                loginID: metric.loginID,
                date: metricDate,
            });

            if (existingMetric) {
                // Check if jobCount and takt are zero for existing entry, only then allow editing
                if (existingMetric.jobCount !== 0 || existingMetric.takt !== 0) {
                    console.log(`Metrics for loginID ${metric.loginID} on ${metric.date} are locked and cannot be modified.`);
                    continue; // Skip this metric and continue with the next one
                }

                // Update existing metric with new values
                existingMetric.jobCount = metric.jobCount;
                existingMetric.takt = metric.takt;
                existingMetric.liveProductivity = metric.liveProductivity;
                existingMetric.date = metricDate; // Ensure date is in correct format

                await existingMetric.save();
            } else {
                // Create new metric if it does not exist
                const newDodMetric = new DodMetrics({
                    date: metricDate,
                    loginID: metric.loginID,
                    jobCount: metric.jobCount,
                    takt: metric.takt,
                    liveProductivity: metric.liveProductivity,
                });

                await newDodMetric.save();
            }
        }

        res.status(200).json({ message: 'Metrics saved successfully!' });
    } catch (error) {
        console.error('Error saving metrics:', error);
        res.status(500).json({ message: 'Error saving metrics', error: error.message });
    }
});

// Endpoint to retrieve DoD metrics for a specific date
app.get('/get-dod-metrics', async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ message: 'Date query parameter is required.' });
    }

    try {
        const metricsDate = new Date(date);
        const existingMetrics = await DodMetrics.find({ date: metricsDate });

        if (existingMetrics.length === 0) {
            // If no metrics, return default metrics with zeros for all loginIDs
            const fixedAuditors = ['carmonsh', 'chnilotp', 'cristopy', 'dahernab', 'djerrren', 'garcjull', 'gkoteddi', 'hlasrado', 'jreyesh', 'kevjimed', 'kumarqab', 'lmuralik', 'maltezel', 'mddeepk', 'mdniz', 'melaaray', 'msnandhu', 'mugdhakj', 'panugah', 'ptimp', 'shaikyas', 'shobhpap', 'shsudhak', 'singhhqo', 'srivaesu', 'tippirer', 'ukamsuma', 'vodelm','ycharanu','chitianu','najuverk'];

            const defaultMetrics = fixedAuditors.map(loginID => ({
                loginID,
                jobCount: 0,
                takt: 0,
                liveProductivity: 0,
                date: metricsDate
            }));

            return res.status(200).json(defaultMetrics);
        }

        res.status(200).json(existingMetrics);
    } catch (error) {
        console.error('Error fetching DoD metrics:', error);
        res.status(500).json({ message: 'Error fetching metrics' });
    }
});

// Endpoint to generate the productivity report
app.get('/get-productivity-report', async (req, res) => {
    const { startDate, endDate } = req.query;

    const fixedAuditors = ['carmonsh', 'chnilotp', 'cristopy', 'dahernab', 'djerrren', 'garcjull', 'gkoteddi', 'hlasrado', 'jreyesh', 'kevjimed', 'kumarqab', 'lmuralik', 'maltezel', 'mddeepk', 'mdniz', 'melaaray', 'msnandhu', 'mugdhakj', 'panugah', 'ptimp', 'shaikyas', 'shobhpap', 'shsudhak', 'singhhqo', 'srivaesu', 'tippirer', 'ukamsuma', 'vodelm'];

    try {
        const adhocs = await Adhoc.find({
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });

        const dodMetrics = await DodMetrics.find({
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });

        const reportData = [];
        const isSingleDay = new Date(startDate).toDateString() === new Date(endDate).toDateString();

        for (const auditor of fixedAuditors) {
            const adhocData = adhocs.filter(item => item.loginID === auditor);
            const dodMetricData = dodMetrics.filter(item => item.loginID === auditor);

            const totalAdhocs = adhocData.reduce((sum, item) => sum + item.duration, 0) / 60; // Convert minutes to hours
            const jobCount = dodMetricData.reduce((sum, item) => sum + item.jobCount, 0);

            let takt;
            if (isSingleDay) {
                takt = dodMetricData.reduce((sum, item) => sum + item.takt, 0);
            } else {
                const totalTakt = dodMetricData.reduce((sum, item) => sum + (item.takt * item.jobCount), 0);
                takt = jobCount > 0 ? totalTakt / jobCount : 0;
            }

            const liveProductivity = (jobCount * takt) / 3600;

            reportData.push({
                loginID: auditor,
                jobCount,
                takt,
                liveProductivity,
                totalAdhocs,
                totalProductivity: liveProductivity + totalAdhocs,
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

    try {
        // Fetch productivity report using the Heroku URL
        const response = await fetch(`https://secret-anchorage-71423-d74ac8cb3804.herokuapp.com/get-productivity-report?startDate=${startDate}&endDate=${endDate}`);
        const productivityData = await response.json();

        if (!productivityData.length) {
            return res.status(404).json({ message: 'No data found to download.' });
        }

        const csvParser = new Parser({
            fields: ['loginID', 'jobCount', 'takt', 'liveProductivity', 'totalAdhocs', 'totalProductivity'],
        });
        const csv = csvParser.parse(productivityData);

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
    console.log(`Server is running on port ${port}`);
});
