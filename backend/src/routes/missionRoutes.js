const express = require('express');
const router = express.Router();
const { activateStationKeeping, setManualMode, activateCV } = require('../services/rosService');

/**
 * @route   POST /api/mission/station-keeping
 * @desc    Activate station keeping over a 4-corner rectangle.
 *          Body: { corners: [{ latitude, longitude }, x4] }
 */
router.post('/station-keeping', async (req, res) => {
    const { corners } = req.body;
    try {
        const result = await activateStationKeeping(corners);
        res.status(200).json({ message: result.message });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

/**
 * @route   POST /api/mission/activate-cv
 * @desc    Switch to computer-vision search mode.
 */
router.post('/activate-cv', async (req, res) => {
    try {
        const result = await activateCV();
        res.status(200).json({ message: result.message });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

/**
 * @route   POST /api/mission/manual-mode
 * @desc    Cancel station keeping / CV search and return to manual mode.
 */
router.post('/manual-mode', async (req, res) => {
    try {
        const result = await setManualMode();
        res.status(200).json({ message: result.message });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

module.exports = router;
