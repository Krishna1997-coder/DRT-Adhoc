const mongoose = require('mongoose');

// Define the schema for the DoD metrics data
const dodMetricsSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    loginID: { type: String, required: true },
    jobCount: { type: Number, required: true },
    takt: { type: Number, required: true },
    liveProductivity: { type: Number, required: true }
}, { timestamps: true });

// Create the model from the schema
const DodMetrics = mongoose.model('DodMetrics', dodMetricsSchema);

// Export the model so it can be imported in server.js
module.exports = DodMetrics;
