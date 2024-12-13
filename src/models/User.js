const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    contact: String,
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
}, { collection: 'freeuserdetails' }); // Specify collection name

module.exports = mongoose.model('User', userSchema);
