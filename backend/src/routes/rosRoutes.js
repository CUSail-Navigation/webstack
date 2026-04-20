const express = require('express');
const router = express.Router();
const { getStatus } = require('../services/rosService');

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

module.exports = router;
