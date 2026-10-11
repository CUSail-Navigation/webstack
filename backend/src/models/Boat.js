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

    // --- JIB ---
    actualJibAngle: { type: Number, default: null }, // /received_jib_angle
    actualJibSideFlag: { type: Number, enum: [0, 1], default: null }, // 0=port, 1=starboard

    // --- ENVIRONMENTAL & STATUS ---
    windAngle: { type: Number, default: 0 },
    windSpeed: { type: Number, default: null },
    controlMode: { type: String, default: 'manual' },
    eventMode: { type: String, default: null },      // /sailbot/current_mode
    rudderAngle: { type: Number, default: 0 },        // /rudder_angle (distinct from actualRudderAngle)
    sailAngle: { type: Number, default: 0 },          // /mainsail_angle (distinct from actualSailAngle)
    tacking: { type: Boolean, default: false },
    distToDest: { type: Number, default: 0 },
    droppedPackets: { type: Number, default: 0 },
    buoyDistance: { type: Number, default: null },

    updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Boat', BoatSchema);
