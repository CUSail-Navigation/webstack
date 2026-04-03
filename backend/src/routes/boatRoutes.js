const express = require('express');
const router = express.Router();
const Boat = require('../models/Boat');

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