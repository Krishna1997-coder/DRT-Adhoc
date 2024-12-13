const mongoose = require('mongoose');

// Define the schema for the activities
const activitySchema = new mongoose.Schema({
    loginID: { type: String, required: true },    // Ensure loginID is required
    activity: { type: String, required: true },   // Ensure activity is required
    date: { type: Date, required: true },         // Change date type to Date
    duration: { type: Number, required: true }    // Change duration type to Number
},{ timestamps: true });

// Create the model from the schema
const Activity = mongoose.model('Activity', activitySchema);

// Export the model so it can be imported in server.js
module.exports = Activity;

