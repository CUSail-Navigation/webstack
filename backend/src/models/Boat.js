const mongoose = require('mongoose');

const BoatSchema = new mongoose.Schema({
    // --- POSITION & HEADING ---
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    heading: { type: Number, default: 0 },

    // --- RUDDER (Three Sources of Truth) ---
    targetRudderAngle: { type: Number, default: 0 }, // From your Web UI
    actualRudderAngle: { type: Number, default: 0 }, // From the Servo feedback
    radioRudder: { type: Number, default: 0 },       // From the handheld Remote
    algoRudder: { type: Number, default: 0 },        // From the Autopilot code

    // --- SAIL (Three Sources of Truth) ---
    targetSailAngle: { type: Number, default: 0 },   // From your Web UI
    actualSailAngle: { type: Number, default: 0 },   // From the Servo feedback
    radioSail: { type: Number, default: 0 },         // From the handheld Remote
    algoSail: { type: Number, default: 0 },          // From the Autopilot code

    // --- ENVIRONMENTAL & STATUS ---
    windAngle: { type: Number, default: 0 },
    controlMode: { type: String, default: 'manual' },
    tacking: { type: Boolean, default: false },
    distToDest: { type: Number, default: 0 },
    droppedPackets: { type: Number, default: 0 },

    updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Boat', BoatSchema);