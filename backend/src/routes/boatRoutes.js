const express = require('express');
const router = express.Router();
const Boat = require('../models/Boat');
const { sendManualControl, setControlMode } = require('../services/rosService');

/**
 * @route   GET /api/boat
 * @desc    Get the current status of the boat (GPS, Heading, Angles)
 * @access  Public
 * * This replaces the "Live" data feed for your Frontend. 
 * Your Map and Dials will call this to get the latest state from the DB.
 */
router.get('/', async (req, res) => {
    try {
        const boat = await Boat.findOne().sort({ updatedAt: -1 });
        if (!boat) return res.status(404).json({ message: "No boat data found" });
        res.json(boat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /api/boat/update
 * @desc    Update the boat's telemetry (GPS, IMU, etc.)
 * @access  Private (Internal ROS Bridge)
 * * This is the "Inbox" for your ROS data. 
 * Your backend ROS service will POST here every time the boat sends a message.
 */
router.post('/update', async (req, res) => {
    try {
        // We use findOneAndUpdate with upsert: true so we only ever 
        // track the "Current State" in one document.
        const updatedBoat = await Boat.findOneAndUpdate(
            {}, 
            { ...req.body, updatedAt: Date.now() },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(200).json(updatedBoat);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @route   POST /api/boat/control
 * @desc    Manual rudder/sail override from the web UI. Publishes to
 *          /rudder_angle and /mainsail_angle, and
 *          records the commanded angles as the boat's "target" values.
 * @access  Public
 */
router.post('/control', async (req, res) => {
    const { rudder, sail } = req.body;
    const rudderNum = rudder === undefined ? undefined : Number(rudder);
    const sailNum = sail === undefined ? undefined : Number(sail);

    if (rudderNum === undefined && sailNum === undefined) {
        return res.status(400).json({ error: 'Request must include rudder and/or sail' });
    }
    if (rudderNum !== undefined && !Number.isFinite(rudderNum)) {
        return res.status(400).json({ error: 'rudder must be a number' });
    }
    if (sailNum !== undefined && !Number.isFinite(sailNum)) {
        return res.status(400).json({ error: 'sail must be a number' });
    }

    try {
        sendManualControl({ rudder: rudderNum, sail: sailNum });

        const update = { updatedAt: Date.now() };
        if (rudderNum !== undefined) update.targetRudderAngle = rudderNum;
        if (sailNum !== undefined) update.targetSailAngle = sailNum;

        const updatedBoat = await Boat.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true, runValidators: true });
        res.status(200).json(updatedBoat);
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

/**
 * @route   POST /api/boat/mode
 * @desc    Switch control mode (algo / radio / webserver / controller_app).
 *          Publishes to /sailbot/control_mode.
 * @access  Public
 */
router.post('/mode', async (req, res) => {
    const { mode } = req.body;
    if (!mode) {
        return res.status(400).json({ error: 'Request must include mode' });
    }

    try {
        const normalized = setControlMode(mode);
        const updatedBoat = await Boat.findOneAndUpdate(
            {},
            { $set: { controlMode: normalized, updatedAt: Date.now() } },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(200).json(updatedBoat);
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

// DELETE all boat records (Reset for a new run)
router.delete('/reset', async (req, res) => {
    try {
        const result = await Boat.deleteMany({});
        res.status(200).json({ 
            message: "Boat history cleared", 
            deletedCount: result.deletedCount 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;