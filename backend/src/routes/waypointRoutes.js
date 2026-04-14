const express = require("express");
const router = express.Router();
const Waypoint = require("../models/Waypoint");
const { sendWaypointToRobot } = require('../services/rosService');

// 1. GET ALL (The old 'sync' logic)
router.get('/', async (req, res) => {
    try {
        const waypoints = await Waypoint.find().sort('order');
        res.json(waypoints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. CREATE (The old 'addWaypoint' + 'addWaypointToQueue' logic)
router.post('/', async (req, res) => {
    try {
        const { latitude, longitude, order } = req.body;
        
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ error: "Invalid coordinates. Latitude must be ±90, Longitude ±180." });
        }
        // Save to Database
        const newWaypoint = new Waypoint({ latitude, longitude, order });
        const savedWaypoint = await newWaypoint.save();

        // ROS Logic: We call the service function we defined earlier
        // 'await' ensures we know if the robot actually received it
        try {
            await sendWaypointToRobot(savedWaypoint);
        } catch (rosErr) {
            console.warn("Robot was unreachable, but waypoint was saved to DB.");
        }

        res.status(201).json(newWaypoint);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 7. REORDER: Update the sequence of multiple waypoints
router.put('/reorder', async (req, res) => {
    try {
        const { orderedIds } = req.body; // Expecting ['id1', 'id2', 'id3']
        
        const updatePromises = orderedIds.map((id, index) => {
            return Waypoint.findByIdAndUpdate(id, { order: index });
        });

        await Promise.all(updatePromises);
        res.json({ message: "Queue reordered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE ALL: Clear the entire mission
router.delete('/clear', async (req, res) => {
    try {
        const result = await Waypoint.deleteMany({});
        console.log(`Mission Cleared: Removed ${result.deletedCount} waypoints.`);
        res.json({ message: "All waypoints cleared", count: result.deletedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE (The old 'deleteWaypoint' logic)
router.delete('/:id', async (req, res) => {
    try {
        await Waypoint.findByIdAndDelete(req.params.id);
        // After deleting, we usually want to tell the robot to refresh its queue
        // For now, we'll just log it.
        console.log(`Waypoint ${req.params.id} deleted. Robot should be updated.`);
        // Here you would also call ROS to 'pop' or 'set' the new queue
        res.json({ message: "Waypoint deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;