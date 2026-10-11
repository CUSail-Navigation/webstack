const mongoose = require('mongoose');

// Last queue confirmed by the boat, retained for offline viewing.
const schema = new mongoose.Schema({
    _id: String,
    waypoints: [{
        _id: String,
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        order: Number
    }],
    confirmedAt: Date
}, { versionKey: false });
module.exports = mongoose.model('WaypointQueue', schema);
