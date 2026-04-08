const express = require('express');
const router = express.Router();
const Buoy = require('../models/Buoy');

// Replacement for getBuoys()
router.get('/', async (req, res) => {
    try {
        const buoys = await Buoy.find();
        res.json(buoys);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Replacement for addBuoy(latitude, longitude)
router.post('/add', async (req, res) => {
    const { latitude, longitude } = req.body;
    try {
        const newBuoy = new Buoy({ latitude, longitude });
        await newBuoy.save();
        res.status(201).json(newBuoy);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete all buoys
router.delete('/reset', async (req, res) => {
    try {
        const result = await Buoy.deleteMany({});
        res.json({ 
            message: "Mission cleared", 
            count: result.deletedCount 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Replacement for the "marker.addListener('click')" removal logic
router.delete('/:id', async (req, res) => {
    try {
        await Buoy.findByIdAndDelete(req.params.id);
        res.json({ message: "Buoy removed from database" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;