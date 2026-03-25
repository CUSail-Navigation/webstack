const mongoose = require('mongoose');

const BuoySchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    name: { type: String }, // Titling buoy when mapped, like "Buoy (43, -79)"
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Buoy', BuoySchema);