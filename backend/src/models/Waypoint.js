const mongoose = require('mongoose');

const waypointSchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    order: { type: Number, default: 0 } // Drag and drop cuz mongo not ordered?
}, { versionKey: false });

module.exports = mongoose.model('Waypoint', waypointSchema);