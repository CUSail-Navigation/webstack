const express = require('express');
const router = express.Router();
const { getStatus, reconnectROS } = require('../services/rosService');

router.get('/status', (req, res) => {
    try {
        const status = getStatus();
        res.json({
            connected: status.connected,
            rosbridgeUrl: status.url
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /api/ros/connect
 * @desc    Point the backend at a different rosbridge URL at runtime,
 *          mirroring the old dashboard's "ros-url" connect field.
 */
router.post('/connect', (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'Request must include url' });
    }
    try {
        reconnectROS(url);
        res.status(200).json({ connecting: true, url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
